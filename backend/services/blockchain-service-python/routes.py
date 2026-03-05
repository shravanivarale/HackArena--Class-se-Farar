"""
routes.py — Flask route definitions for the Blockchain Integration Service.

Implements all blockchain endpoints matching the existing API contract:
    - NFT: mint, update, get metadata
    - Escrow: lock, release
    - Squad Treasury: create, deposit, distribute
    - Token: balance, issue
    - SplitSync: create, record_payment, cancel, state
    - FundingPool: create, join, deposit, early_withdraw, distribute, close, state
"""

from flask import Blueprint, request, jsonify
from config import logger
from services.nft_service import NFTService
from services.escrow_service import EscrowService
from services.treasury_service import TreasuryService
from services.token_service import TokenService
from services.splitsync_service import SplitSyncService
from services.funding_pool_service import FundingPoolService
from services.queue_service import blockchain_queue

blockchain_bp = Blueprint("blockchain", __name__, url_prefix="/blockchain")


def success_response(data, status=200):
    """Standard success response format."""
    return jsonify({"success": True, "data": data, "error": None}), status


def error_response(message, code="INTERNAL_ERROR", status=500):
    """Standard error response format."""
    return jsonify({
        "success": False,
        "data": None,
        "error": {"code": code, "message": message},
    }), status


# ─────────────────────────────────────────────
# NFT Endpoints
# ─────────────────────────────────────────────

@blockchain_bp.route("/nft/mint/<user_id>", methods=["POST"])
def mint_sbt(user_id):
    """POST /blockchain/nft/mint/:userId — Mint Soul-Bound Token."""
    try:
        data = request.get_json()
        if not data or "userAddress" not in data:
            return error_response("Missing userAddress", "VALIDATION_ERROR", 400)

        result = NFTService.mint_sbt(user_id, data["userAddress"])

        if result.get("success"):
            return success_response(result, 201)
        else:
            return error_response(
                result.get("message", "SBT minting failed"),
                "MINT_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"Mint endpoint error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/nft/update/<user_id>", methods=["POST"])
def update_snapshot(user_id):
    """POST /blockchain/nft/update/:userId — Update monthly snapshot."""
    try:
        data = request.get_json()
        if not data:
            return error_response("Missing snapshot data", "VALIDATION_ERROR", 400)

        result = NFTService.update_monthly_snapshot(user_id, data)

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(
                result.get("error", "Snapshot update failed"),
                "UPDATE_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"Update snapshot error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/nft/<user_id>", methods=["GET"])
def get_nft_metadata(user_id):
    """GET /blockchain/nft/:userId — Get NFT metadata and IPFS hash."""
    try:
        result = NFTService.get_nft_metadata(user_id)
        return success_response(result)
    except Exception as e:
        logger.error(f"Get NFT metadata error: {e}")
        return error_response(str(e))


# ─────────────────────────────────────────────
# Escrow Endpoints
# ─────────────────────────────────────────────

@blockchain_bp.route("/escrow/lock", methods=["POST"])
def lock_stake():
    """POST /blockchain/escrow/lock — Lock challenge stake in contract."""
    try:
        data = request.get_json()
        required = ["userId", "userAddress", "challengeId", "amount", "deadline"]
        missing = [f for f in required if f not in data]
        if missing:
            return error_response(
                f"Missing required fields: {', '.join(missing)}",
                "VALIDATION_ERROR",
                400,
            )

        result = EscrowService.lock_stake(
            user_id=data["userId"],
            user_address=data["userAddress"],
            challenge_id=data["challengeId"],
            amount_microalgos=int(data["amount"]),
            deadline_timestamp=int(data["deadline"]),
        )

        if result.get("success"):
            return success_response(result, 201)
        else:
            # Per design: return clear error, do NOT proceed
            return error_response(
                result.get("message", "Escrow lock failed"),
                "ESCROW_LOCK_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"Escrow lock error: {e}")
        return error_response(
            "Couldn't lock your stake. Your money was not moved.",
            "ESCROW_LOCK_FAILED",
        )


@blockchain_bp.route("/escrow/release/<escrow_id>", methods=["POST"])
def release_stake(escrow_id):
    """POST /blockchain/escrow/release/:escrowId — Release stake."""
    try:
        data = request.get_json()
        if "success" not in data:
            return error_response("Missing success flag", "VALIDATION_ERROR", 400)

        result = EscrowService.release_stake(
            app_id=int(escrow_id),
            success=bool(data["success"]),
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(
                result.get("error", "Release failed"),
                "ESCROW_RELEASE_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"Escrow release error: {e}")
        return error_response(str(e))


# ─────────────────────────────────────────────
# Squad Treasury Endpoints
# ─────────────────────────────────────────────

@blockchain_bp.route("/squad/create", methods=["POST"])
def create_treasury():
    """POST /blockchain/squad/create — Deploy Squad treasury contract."""
    try:
        data = request.get_json()
        required = ["squadId", "creatorAddress", "seasonEnd"]
        missing = [f for f in required if f not in data]
        if missing:
            return error_response(
                f"Missing required fields: {', '.join(missing)}",
                "VALIDATION_ERROR",
                400,
            )

        result = TreasuryService.deploy_treasury(
            squad_id=data["squadId"],
            creator_address=data["creatorAddress"],
            season_end_timestamp=int(data["seasonEnd"]),
            max_members=int(data.get("maxMembers", 8)),
        )

        if result.get("success"):
            return success_response(result, 201)
        else:
            return error_response(
                result.get("error", "Treasury deployment failed"),
                "TREASURY_DEPLOY_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"Treasury creation error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/squad/<squad_id>/deposit", methods=["POST"])
def deposit_to_treasury(squad_id):
    """POST /blockchain/squad/:squadId/deposit — Record contribution."""
    try:
        data = request.get_json()
        required = ["appId", "memberAddress", "amount"]
        missing = [f for f in required if f not in data]
        if missing:
            return error_response(
                f"Missing required fields: {', '.join(missing)}",
                "VALIDATION_ERROR",
                400,
            )

        result = TreasuryService.deposit(
            app_id=int(data["appId"]),
            member_address=data["memberAddress"],
            amount_microalgos=int(data["amount"]),
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(
                result.get("error", "Deposit failed"),
                "DEPOSIT_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"Deposit error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/squad/<squad_id>/distribute", methods=["POST"])
def distribute_treasury(squad_id):
    """POST /blockchain/squad/:squadId/distribute — Season-end distribution."""
    try:
        data = request.get_json()
        required = ["appId", "distributions"]
        missing = [f for f in required if f not in data]
        if missing:
            return error_response(
                f"Missing required fields: {', '.join(missing)}",
                "VALIDATION_ERROR",
                400,
            )

        result = TreasuryService.distribute(
            app_id=int(data["appId"]),
            distributions=data["distributions"],
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(
                result.get("error", "Distribution failed"),
                "DISTRIBUTION_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"Distribution error: {e}")
        return error_response(str(e))


# ─────────────────────────────────────────────
# Token Endpoints
# ─────────────────────────────────────────────

@blockchain_bp.route("/token/balance/<user_id>", methods=["GET"])
def get_token_balance(user_id):
    """GET /blockchain/token/balance/:userId — Get VitalToken balance."""
    try:
        user_address = request.args.get("address", "")
        if not user_address:
            return error_response("Missing address query param", "VALIDATION_ERROR", 400)

        result = TokenService.get_balance(user_address)
        return success_response(result)
    except Exception as e:
        logger.error(f"Balance check error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/token/issue/<user_id>", methods=["POST"])
def issue_tokens(user_id):
    """POST /blockchain/token/issue/:userId — Issue reward tokens."""
    try:
        data = request.get_json()
        required = ["userAddress", "amount", "reason"]
        missing = [f for f in required if f not in data]
        if missing:
            return error_response(
                f"Missing required fields: {', '.join(missing)}",
                "VALIDATION_ERROR",
                400,
            )

        result = TokenService.issue_tokens(
            user_address=data["userAddress"],
            amount=int(data["amount"]),
            reason=data["reason"],
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(
                result.get("error", "Token issuance failed"),
                "TOKEN_ISSUE_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"Token issuance error: {e}")
        return error_response(str(e))


# ─────────────────────────────────────────────
# Queue Status Endpoint
# ─────────────────────────────────────────────

@blockchain_bp.route("/queue/status", methods=["GET"])
def queue_status():
    """GET /blockchain/queue/status — Get blockchain queue stats."""
    try:
        stats = blockchain_queue.get_queue_stats()
        return success_response(stats)
    except Exception as e:
        logger.error(f"Queue status error: {e}")
        return error_response(str(e))


# ─────────────────────────────────────────────
# SplitSync Endpoints
# ─────────────────────────────────────────────

@blockchain_bp.route("/splitsync/create", methods=["POST"])
def create_split_contract():
    """POST /blockchain/splitsync/create — Deploy SplitSync contract."""
    try:
        data = request.get_json()
        required = ["splitId", "payerAddress", "totalAmount", "participantCount", "deadline"]
        missing = [f for f in required if f not in data]
        if missing:
            return error_response(
                f"Missing required fields: {', '.join(missing)}",
                "VALIDATION_ERROR",
                400,
            )

        result = SplitSyncService.create_split(
            split_id=data["splitId"],
            payer_address=data["payerAddress"],
            total_amount=int(data["totalAmount"]),
            participant_count=int(data["participantCount"]),
            deadline_timestamp=int(data["deadline"]),
        )

        if result.get("success"):
            return success_response(result, 201)
        else:
            return error_response(
                result.get("error", "Split contract creation failed"),
                "SPLIT_CREATE_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"SplitSync create error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/splitsync/<int:app_id>/record_payment", methods=["POST"])
def record_split_payment(app_id):
    """POST /blockchain/splitsync/:appId/record_payment — Record participant payment."""
    try:
        data = request.get_json()
        if not data or "participantAddress" not in data:
            return error_response("Missing participantAddress", "VALIDATION_ERROR", 400)

        result = SplitSyncService.record_payment(
            app_id=app_id,
            participant_address=data["participantAddress"],
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(
                result.get("error", "Payment recording failed"),
                "PAYMENT_RECORD_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"SplitSync record_payment error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/splitsync/<int:app_id>/cancel", methods=["POST"])
def cancel_split(app_id):
    """POST /blockchain/splitsync/:appId/cancel — Cancel split."""
    try:
        result = SplitSyncService.cancel_split(app_id=app_id)
        if result.get("success"):
            return success_response(result)
        else:
            return error_response(result.get("error", "Cancel failed"), "CANCEL_FAILED", 500)
    except Exception as e:
        logger.error(f"SplitSync cancel error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/splitsync/<int:app_id>/state", methods=["GET"])
def get_split_state(app_id):
    """GET /blockchain/splitsync/:appId/state — Get on-chain split state."""
    try:
        result = SplitSyncService.get_split_state(app_id=app_id)
        return success_response(result)
    except Exception as e:
        logger.error(f"SplitSync state error: {e}")
        return error_response(str(e))


# ─────────────────────────────────────────────
# Funding Pool Endpoints
# ─────────────────────────────────────────────

@blockchain_bp.route("/pool/create", methods=["POST"])
def create_funding_pool():
    """POST /blockchain/pool/create — Deploy FundingPool contract."""
    try:
        data = request.get_json()
        required = ["poolId", "endTime"]
        missing = [f for f in required if f not in data]
        if missing:
            return error_response(
                f"Missing required fields: {', '.join(missing)}",
                "VALIDATION_ERROR",
                400,
            )

        result = FundingPoolService.create_pool(
            pool_id=data["poolId"],
            end_timestamp=int(data["endTime"]),
            min_deposit_microalgos=int(data.get("minDeposit", 100_000)),
        )

        if result.get("success"):
            return success_response(result, 201)
        else:
            return error_response(
                result.get("error", "Pool creation failed"),
                "POOL_CREATE_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"FundingPool create error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/pool/<int:app_id>/join", methods=["POST"])
def join_funding_pool(app_id):
    """POST /blockchain/pool/:appId/join — Member joins the pool."""
    try:
        data = request.get_json()
        if not data or "memberAddress" not in data:
            return error_response("Missing memberAddress", "VALIDATION_ERROR", 400)

        result = FundingPoolService.join_pool(
            app_id=app_id,
            member_address=data["memberAddress"],
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(result.get("error", "Join failed"), "JOIN_FAILED", 500)
    except Exception as e:
        logger.error(f"FundingPool join error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/pool/<int:app_id>/deposit", methods=["POST"])
def deposit_to_pool(app_id):
    """POST /blockchain/pool/:appId/deposit — Deposit funds into pool."""
    try:
        data = request.get_json()
        required = ["memberAddress", "amount"]
        missing = [f for f in required if f not in data]
        if missing:
            return error_response(
                f"Missing required fields: {', '.join(missing)}",
                "VALIDATION_ERROR",
                400,
            )

        result = FundingPoolService.deposit(
            app_id=app_id,
            member_address=data["memberAddress"],
            amount_microalgos=int(data["amount"]),
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(result.get("error", "Deposit failed"), "DEPOSIT_FAILED", 500)
    except Exception as e:
        logger.error(f"FundingPool deposit error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/pool/<int:app_id>/withdraw", methods=["POST"])
def early_withdraw_from_pool(app_id):
    """POST /blockchain/pool/:appId/withdraw — Early withdrawal (loses 10%)."""
    try:
        data = request.get_json()
        if not data or "memberAddress" not in data:
            return error_response("Missing memberAddress", "VALIDATION_ERROR", 400)

        result = FundingPoolService.early_withdraw(
            app_id=app_id,
            member_address=data["memberAddress"],
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(result.get("error", "Withdrawal failed"), "WITHDRAW_FAILED", 500)
    except Exception as e:
        logger.error(f"FundingPool withdraw error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/pool/<int:app_id>/distribute", methods=["POST"])
def distribute_pool(app_id):
    """POST /blockchain/pool/:appId/distribute — Distribute to remaining member."""
    try:
        data = request.get_json()
        if not data or "memberAddress" not in data:
            return error_response("Missing memberAddress", "VALIDATION_ERROR", 400)

        result = FundingPoolService.distribute(
            app_id=app_id,
            member_address=data["memberAddress"],
        )

        if result.get("success"):
            return success_response(result)
        else:
            return error_response(
                result.get("error", "Distribution failed"),
                "DISTRIBUTION_FAILED",
                500,
            )
    except Exception as e:
        logger.error(f"FundingPool distribute error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/pool/<int:app_id>/close", methods=["POST"])
def close_funding_pool(app_id):
    """POST /blockchain/pool/:appId/close — Close the pool."""
    try:
        result = FundingPoolService.close_pool(app_id=app_id)
        if result.get("success"):
            return success_response(result)
        else:
            return error_response(result.get("error", "Close failed"), "CLOSE_FAILED", 500)
    except Exception as e:
        logger.error(f"FundingPool close error: {e}")
        return error_response(str(e))


@blockchain_bp.route("/pool/<int:app_id>/state", methods=["GET"])
def get_pool_state(app_id):
    """GET /blockchain/pool/:appId/state — Get on-chain pool state."""
    try:
        result = FundingPoolService.get_pool_state(app_id=app_id)
        return success_response(result)
    except Exception as e:
        logger.error(f"FundingPool state error: {e}")
        return error_response(str(e))
