"""
funding_pool_service.py — Funding Pool (Commitment Pool) operations on Algorand.

Handles pool creation, deposits, early withdrawals, and end-of-pool distribution
using the FundingPool PyTeal smart contract.

Rules:
  - 90% safe portion, 10% risk portion
  - Early withdrawal forfeits the 10% risk
  - Forfeited risk is redistributed to remaining members
  - Pool ends when time expires or only 1 member remains
"""

import os
import sys
import base64
import time
from algosdk import transaction, account, mnemonic
from algosdk.v2client import algod

from config import (
    get_algod_client,
    SYSTEM_MNEMONIC,
    logger,
)
from services.queue_service import blockchain_queue, PRIORITY_ESCROW_RELEASE

# Add contracts to path
CONTRACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "blockchain", "contracts")
)
sys.path.insert(0, CONTRACTS_DIR)


class FundingPoolService:
    """Manages commitment pool operations on Algorand."""

    @staticmethod
    def _get_system_credentials():
        """Get system wallet address and private key."""
        if not SYSTEM_MNEMONIC:
            raise ValueError("SYSTEM_MNEMONIC not configured")
        private_key = mnemonic.to_private_key(SYSTEM_MNEMONIC)
        address = account.address_from_private_key(private_key)
        return address, private_key

    @staticmethod
    def _compile_contract(client: algod.AlgodClient, teal_source: str) -> bytes:
        """Compile TEAL source to bytecode."""
        result = client.compile(teal_source)
        return base64.b64decode(result["result"])

    @staticmethod
    def create_pool(
        pool_id: str,
        end_timestamp: int,
        min_deposit_microalgos: int = 100_000,
    ) -> dict:
        """
        Deploy a FundingPool contract on Algorand.

        System wallet deploys and manages — no manual signing required.

        Args:
            pool_id: UUID of the pool
            end_timestamp: Unix timestamp when pool ends
            min_deposit_microalgos: Minimum deposit amount

        Returns:
            dict with app_id, app_address, tx_id
        """
        logger.info(f"Creating funding pool: pool_id={pool_id}, ends={end_timestamp}")

        try:
            client = get_algod_client()
            system_address, system_key = FundingPoolService._get_system_credentials()

            from FundingPool import (
                get_approval_teal, get_clear_teal, GLOBAL_SCHEMA, LOCAL_SCHEMA
            )

            approval_teal = get_approval_teal()
            clear_teal = get_clear_teal()

            approval_program = FundingPoolService._compile_contract(client, approval_teal)
            clear_program = FundingPoolService._compile_contract(client, clear_teal)

            params = client.suggested_params()

            app_txn = transaction.ApplicationCreateTxn(
                sender=system_address,
                sp=params,
                on_complete=transaction.OnComplete.NoOpOC,
                approval_program=approval_program,
                clear_program=clear_program,
                global_schema=transaction.StateSchema(
                    GLOBAL_SCHEMA["num_uints"],
                    GLOBAL_SCHEMA["num_byte_slices"],
                ),
                local_schema=transaction.StateSchema(
                    LOCAL_SCHEMA["num_uints"],
                    LOCAL_SCHEMA["num_byte_slices"],
                ),
                app_args=[
                    pool_id.encode(),
                    end_timestamp.to_bytes(8, "big"),
                    min_deposit_microalgos.to_bytes(8, "big"),
                ],
            )

            signed_app = app_txn.sign(system_key)
            app_tx_id = client.send_transaction(signed_app)
            app_result = transaction.wait_for_confirmation(client, app_tx_id, 4)
            app_id = app_result["application-index"]

            # Fund the app with enough balance for inner txns
            app_address = transaction.logic.get_application_address(app_id)
            fund_txn = transaction.PaymentTxn(
                sender=system_address,
                sp=params,
                receiver=app_address,
                amt=500_000,  # 0.5 ALGO for min balance + inner txn fees
            )
            signed_fund = fund_txn.sign(system_key)
            fund_tx_id = client.send_transaction(signed_fund)
            transaction.wait_for_confirmation(client, fund_tx_id, 4)

            logger.info(f"Funding pool deployed: app_id={app_id}, address={app_address}")

            return {
                "success": True,
                "app_id": app_id,
                "app_address": app_address,
                "tx_id": app_tx_id,
                "pool_id": pool_id,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            }

        except Exception as e:
            logger.error(f"Funding pool creation failed: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def join_pool(app_id: int, member_address: str) -> dict:
        """
        Opt-in a member to the pool. System wallet handles the transaction.

        Args:
            app_id: The FundingPool application ID
            member_address: Member's Algorand address
        """
        logger.info(f"Member {member_address} joining pool {app_id}")

        try:
            client = get_algod_client()
            system_address, system_key = FundingPoolService._get_system_credentials()
            params = client.suggested_params()

            # System opts in on behalf of member
            optin_txn = transaction.ApplicationOptInTxn(
                sender=system_address,
                sp=params,
                index=app_id,
            )

            signed_txn = optin_txn.sign(system_key)
            tx_id = client.send_transaction(signed_txn)
            transaction.wait_for_confirmation(client, tx_id, 4)

            return {"success": True, "tx_id": tx_id}

        except Exception as e:
            logger.error(f"Pool join failed: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def deposit(app_id: int, member_address: str, amount_microalgos: int) -> dict:
        """
        Record a deposit into the pool. System wallet handles both the
        payment and the app call in an atomic group transaction.

        Args:
            app_id: The FundingPool application ID
            member_address: Member's Algorand address (for tracking)
            amount_microalgos: Deposit amount in microAlgos
        """
        logger.info(
            f"Deposit {amount_microalgos} uALGO to pool {app_id} from {member_address}"
        )

        try:
            client = get_algod_client()
            system_address, system_key = FundingPoolService._get_system_credentials()
            params = client.suggested_params()

            app_address = transaction.logic.get_application_address(app_id)

            # Group transaction: [Payment, AppCall("deposit")]
            pay_txn = transaction.PaymentTxn(
                sender=system_address,
                sp=params,
                receiver=app_address,
                amt=amount_microalgos,
            )

            app_txn = transaction.ApplicationCallTxn(
                sender=system_address,
                sp=params,
                index=app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[b"deposit"],
            )

            # Atomic group
            gid = transaction.calculate_group_id([pay_txn, app_txn])
            pay_txn.group = gid
            app_txn.group = gid

            signed_pay = pay_txn.sign(system_key)
            signed_app = app_txn.sign(system_key)

            tx_id = client.send_transactions([signed_pay, signed_app])
            transaction.wait_for_confirmation(client, tx_id, 4)

            safe_amount = (amount_microalgos * 9) // 10
            risk_amount = amount_microalgos - safe_amount

            logger.info(
                f"Deposit recorded: safe={safe_amount}, risk={risk_amount}"
            )

            return {
                "success": True,
                "tx_id": tx_id,
                "amount": amount_microalgos,
                "safe_portion": safe_amount,
                "risk_portion": risk_amount,
            }

        except Exception as e:
            logger.error(f"Pool deposit failed: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def early_withdraw(app_id: int, member_address: str) -> dict:
        """
        Process early withdrawal — member gets 90% back, loses 10%.
        System wallet signs the transaction.

        Args:
            app_id: The FundingPool application ID
            member_address: Member's Algorand address
        """
        logger.info(f"Early withdrawal from pool {app_id} by {member_address}")

        try:
            client = get_algod_client()
            system_address, system_key = FundingPoolService._get_system_credentials()
            params = client.suggested_params()

            withdraw_txn = transaction.ApplicationCallTxn(
                sender=system_address,
                sp=params,
                index=app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[b"early_withdraw"],
            )

            signed_txn = withdraw_txn.sign(system_key)
            tx_id = client.send_transaction(signed_txn)
            transaction.wait_for_confirmation(client, tx_id, 4)

            logger.info(f"Early withdrawal processed: tx={tx_id}")

            return {
                "success": True,
                "tx_id": tx_id,
                "status": "WITHDRAWN_EARLY",
                "message": "90% safe portion returned. 10% risk portion forfeited to pool.",
            }

        except Exception as e:
            logger.error(f"Early withdrawal failed: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def distribute(app_id: int, member_address: str) -> dict:
        """
        Distribute funds to a remaining member at pool end.
        Member receives their deposit + share of the risk pool.

        Args:
            app_id: The FundingPool application ID
            member_address: Member's Algorand address to receive distribution
        """
        logger.info(f"Distributing pool {app_id} to member {member_address}")

        try:
            client = get_algod_client()
            system_address, system_key = FundingPoolService._get_system_credentials()
            params = client.suggested_params()

            dist_txn = transaction.ApplicationCallTxn(
                sender=system_address,
                sp=params,
                index=app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[b"distribute"],
                accounts=[member_address],
            )

            signed_txn = dist_txn.sign(system_key)
            tx_id = client.send_transaction(signed_txn)
            transaction.wait_for_confirmation(client, tx_id, 4)

            logger.info(f"Distribution complete for {member_address}: tx={tx_id}")

            return {
                "success": True,
                "tx_id": tx_id,
                "status": "DISTRIBUTED",
            }

        except Exception as e:
            logger.error(f"Distribution failed: {e}")
            # Queue for retry — high priority
            blockchain_queue.enqueue(
                "distribute_pool",
                {"app_id": app_id, "member_address": member_address},
                PRIORITY_ESCROW_RELEASE,
            )
            return {
                "success": False,
                "error": str(e),
                "queued": True,
                "message": "Distribution queued for retry.",
            }

    @staticmethod
    def close_pool(app_id: int) -> dict:
        """Close the pool after all distributions. System wallet signs."""
        logger.info(f"Closing pool {app_id}")

        try:
            client = get_algod_client()
            system_address, system_key = FundingPoolService._get_system_credentials()
            params = client.suggested_params()

            close_txn = transaction.ApplicationCallTxn(
                sender=system_address,
                sp=params,
                index=app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[b"close_pool"],
            )

            signed_txn = close_txn.sign(system_key)
            tx_id = client.send_transaction(signed_txn)
            transaction.wait_for_confirmation(client, tx_id, 4)

            return {"success": True, "tx_id": tx_id, "status": "COMPLETED"}

        except Exception as e:
            logger.error(f"Pool close failed: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_pool_state(app_id: int) -> dict:
        """Read on-chain pool state."""
        try:
            client = get_algod_client()
            app_info = client.application_info(app_id)
            global_state = {}
            for item in app_info.get("params", {}).get("global-state", []):
                key = base64.b64decode(item["key"]).decode()
                value = item["value"]
                if value["type"] == 1:  # bytes
                    global_state[key] = base64.b64decode(value.get("bytes", "")).decode(errors="ignore")
                else:  # uint
                    global_state[key] = value.get("uint", 0)

            return {"success": True, "app_id": app_id, "state": global_state}

        except Exception as e:
            logger.error(f"Failed to read pool state: {e}")
            return {"success": False, "error": str(e)}
