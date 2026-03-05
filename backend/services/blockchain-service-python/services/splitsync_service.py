"""
splitsync_service.py — SplitSync bill splitting operations on Algorand.

Handles split creation, payment recording, and settlement tracking
using the SplitSync PyTeal smart contract.
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
from services.queue_service import blockchain_queue, PRIORITY_NFT_UPDATE

# Add contracts to path
CONTRACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "blockchain", "contracts")
)
sys.path.insert(0, CONTRACTS_DIR)


class SplitSyncService:
    """Manages bill split operations on Algorand for transparency."""

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
    def create_split(
        split_id: str,
        payer_address: str,
        total_amount: int,
        participant_count: int,
        deadline_timestamp: int,
    ) -> dict:
        """
        Deploy a SplitSync contract on Algorand to track bill split state.

        All transactions are signed by the system wallet (no manual signing needed).

        Args:
            split_id: UUID of the split
            payer_address: Algorand address of the bill payer
            total_amount: Total bill amount in microAlgos
            participant_count: Number of participants in the split
            deadline_timestamp: Unix timestamp for settlement deadline

        Returns:
            dict with app_id, tx_id on success
        """
        logger.info(
            f"Creating split contract: split_id={split_id}, "
            f"amount={total_amount}, participants={participant_count}"
        )

        try:
            client = get_algod_client()
            system_address, system_key = SplitSyncService._get_system_credentials()

            # Compile SplitSync contract
            from SplitSync import (
                get_approval_teal, get_clear_teal, GLOBAL_SCHEMA, LOCAL_SCHEMA
            )

            approval_teal = get_approval_teal()
            clear_teal = get_clear_teal()

            approval_program = SplitSyncService._compile_contract(client, approval_teal)
            clear_program = SplitSyncService._compile_contract(client, clear_teal)

            params = client.suggested_params()

            # Deploy application
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
                    payer_address.encode(),
                    total_amount.to_bytes(8, "big"),
                    split_id.encode(),
                    participant_count.to_bytes(8, "big"),
                    deadline_timestamp.to_bytes(8, "big"),
                ],
            )

            signed_app = app_txn.sign(system_key)
            app_tx_id = client.send_transaction(signed_app)
            app_result = transaction.wait_for_confirmation(client, app_tx_id, 4)
            app_id = app_result["application-index"]

            # Fund the app account with minimum balance
            app_address = transaction.logic.get_application_address(app_id)
            fund_txn = transaction.PaymentTxn(
                sender=system_address,
                sp=params,
                receiver=app_address,
                amt=200_000,  # 0.2 ALGO min balance
            )
            signed_fund = fund_txn.sign(system_key)
            fund_tx_id = client.send_transaction(signed_fund)
            transaction.wait_for_confirmation(client, fund_tx_id, 4)

            logger.info(f"Split contract deployed: app_id={app_id}")

            return {
                "success": True,
                "app_id": app_id,
                "app_address": app_address,
                "tx_id": app_tx_id,
                "split_id": split_id,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            }

        except Exception as e:
            logger.error(f"Split contract creation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create on-chain split record. Split still works off-chain.",
            }

    @staticmethod
    def record_payment(app_id: int, participant_address: str) -> dict:
        """
        Record a participant's payment on-chain.

        Called by the system after verifying off-chain UPI payment.
        System wallet signs the transaction — no manual signing needed.

        Args:
            app_id: The SplitSync application ID
            participant_address: Algorand address of the paying participant

        Returns:
            dict with tx_id on success
        """
        logger.info(f"Recording payment on split app {app_id} for {participant_address}")

        try:
            client = get_algod_client()
            system_address, system_key = SplitSyncService._get_system_credentials()
            params = client.suggested_params()

            record_txn = transaction.ApplicationCallTxn(
                sender=system_address,
                sp=params,
                index=app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[b"record_payment"],
                accounts=[participant_address],
            )

            signed_txn = record_txn.sign(system_key)
            tx_id = client.send_transaction(signed_txn)
            transaction.wait_for_confirmation(client, tx_id, 4)

            logger.info(f"Payment recorded on-chain: tx={tx_id}")
            return {"success": True, "tx_id": tx_id}

        except Exception as e:
            logger.error(f"On-chain payment recording failed: {e}")
            # Queue for retry
            blockchain_queue.enqueue(
                "record_split_payment",
                {"app_id": app_id, "participant_address": participant_address},
                PRIORITY_NFT_UPDATE,
            )
            return {
                "success": False,
                "error": str(e),
                "queued": True,
                "message": "Payment recorded off-chain. On-chain sync queued.",
            }

    @staticmethod
    def cancel_split(app_id: int) -> dict:
        """Cancel a split on-chain. System wallet signs."""
        logger.info(f"Cancelling split app {app_id}")

        try:
            client = get_algod_client()
            system_address, system_key = SplitSyncService._get_system_credentials()
            params = client.suggested_params()

            cancel_txn = transaction.ApplicationCallTxn(
                sender=system_address,
                sp=params,
                index=app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[b"cancel"],
            )

            signed_txn = cancel_txn.sign(system_key)
            tx_id = client.send_transaction(signed_txn)
            transaction.wait_for_confirmation(client, tx_id, 4)

            return {"success": True, "tx_id": tx_id}

        except Exception as e:
            logger.error(f"Split cancellation failed: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_split_state(app_id: int) -> dict:
        """Read on-chain split state."""
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

            return {
                "success": True,
                "app_id": app_id,
                "state": global_state,
            }

        except Exception as e:
            logger.error(f"Failed to read split state: {e}")
            return {"success": False, "error": str(e)}
