"""
FundingPool.py — VitalScore Commitment Pool Smart Contract

This PyTeal contract enforces funding pool (commitment pool) rules on Algorand.
Users deposit funds where 90% is safe and 10% is at risk. Early withdrawal
forfeits the 10% risk portion, which is redistributed to remaining participants.

Global State:
    - admin: System admin address
    - pool_id: UUID of the pool
    - total_deposited: Total ALGO deposited (microAlgos)
    - risk_pool: Accumulated forfeited risk portions (microAlgos)
    - member_count: Number of active members
    - start_time: Unix timestamp pool started
    - end_time: Unix timestamp pool ends
    - status: 0=ACTIVE, 1=DISTRIBUTING, 2=COMPLETED, 3=CANCELLED
    - min_deposit: Minimum deposit amount (microAlgos)

Local State (per member):
    - deposited: Total amount deposited
    - safe_portion: 90% of deposited (protected)
    - risk_portion: 10% of deposited (at risk)
    - withdrawn: 0/1 whether user has withdrawn
    - withdraw_time: Timestamp of withdrawal (0 if active)

Methods:
    - create: Deploy pool with params
    - opt_in: Member joins the pool
    - deposit: Member deposits funds
    - early_withdraw: Member withdraws early (loses risk portion)
    - distribute: Admin distributes at pool end
    - close_pool: Admin closes the pool
"""

from pyteal import (
    Approve,
    App,
    Assert,
    Bytes,
    Cond,
    Global,
    Gtxn,
    If,
    Int,
    InnerTxnBuilder,
    Mode,
    OnComplete,
    Reject,
    Seq,
    TxnField,
    TxnType,
    Txn,
    compileTeal,
)


def approval_program():
    """Main approval program for FundingPool contract."""

    # ─── Global State Keys ───
    admin_key = Bytes("admin")
    pool_id_key = Bytes("pool_id")
    total_deposited_key = Bytes("total_deposited")
    risk_pool_key = Bytes("risk_pool")
    member_count_key = Bytes("member_count")
    start_time_key = Bytes("start_time")
    end_time_key = Bytes("end_time")
    status_key = Bytes("status")
    min_deposit_key = Bytes("min_deposit")

    # Status constants
    STATUS_ACTIVE = Int(0)
    STATUS_DISTRIBUTING = Int(1)
    STATUS_COMPLETED = Int(2)
    STATUS_CANCELLED = Int(3)

    # Local state keys
    deposited_key = Bytes("deposited")
    safe_portion_key = Bytes("safe_portion")
    risk_portion_key = Bytes("risk_portion")
    withdrawn_key = Bytes("withdrawn")
    withdraw_time_key = Bytes("withdraw_time")

    # ─── Helpers ───
    is_admin = Txn.sender() == App.globalGet(admin_key)
    is_active = App.globalGet(status_key) == STATUS_ACTIVE

    # ─── On Creation ───
    # Args: [pool_id, end_time, min_deposit]
    on_create = Seq(
        App.globalPut(admin_key, Txn.sender()),
        App.globalPut(pool_id_key, Txn.application_args[0]),
        App.globalPut(total_deposited_key, Int(0)),
        App.globalPut(risk_pool_key, Int(0)),
        App.globalPut(member_count_key, Int(0)),
        App.globalPut(start_time_key, Global.latest_timestamp()),
        App.globalPut(end_time_key, Txn.application_args[1]),
        App.globalPut(status_key, STATUS_ACTIVE),
        App.globalPut(min_deposit_key, Txn.application_args[2]),
        Approve(),
    )

    # ─── Opt-In (Member joins) ───
    on_optin = Seq(
        Assert(is_active),
        App.localPut(Txn.sender(), deposited_key, Int(0)),
        App.localPut(Txn.sender(), safe_portion_key, Int(0)),
        App.localPut(Txn.sender(), risk_portion_key, Int(0)),
        App.localPut(Txn.sender(), withdrawn_key, Int(0)),
        App.localPut(Txn.sender(), withdraw_time_key, Int(0)),
        App.globalPut(member_count_key, App.globalGet(member_count_key) + Int(1)),
        Approve(),
    )

    # ─── Deposit (Member sends funds) ───
    # This is called in a group txn: [PaymentTxn to app, AppCallTxn("deposit")]
    # Args: ["deposit"]
    deposit_amount = Gtxn[0].amount()
    safe_amount = deposit_amount * Int(9) / Int(10)  # 90%
    risk_amount = deposit_amount - safe_amount         # 10%

    on_deposit = Seq(
        Assert(is_active),
        # Verify the payment transaction in the group
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[0].sender() == Txn.sender()),
        # Update local state
        App.localPut(
            Txn.sender(),
            deposited_key,
            App.localGet(Txn.sender(), deposited_key) + deposit_amount,
        ),
        App.localPut(
            Txn.sender(),
            safe_portion_key,
            App.localGet(Txn.sender(), safe_portion_key) + safe_amount,
        ),
        App.localPut(
            Txn.sender(),
            risk_portion_key,
            App.localGet(Txn.sender(), risk_portion_key) + risk_amount,
        ),
        # Update global totals
        App.globalPut(
            total_deposited_key,
            App.globalGet(total_deposited_key) + deposit_amount,
        ),
        Approve(),
    )

    # ─── Early Withdraw (Loses 10% risk portion) ───
    # Args: ["early_withdraw"]
    user_safe = App.localGet(Txn.sender(), safe_portion_key)
    user_risk = App.localGet(Txn.sender(), risk_portion_key)

    on_early_withdraw = Seq(
        Assert(is_active),
        Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
        Assert(user_safe > Int(0)),
        # Send back only the safe portion (90%)
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: Txn.sender(),
            TxnField.amount: user_safe,
            TxnField.fee: Int(0),
        }),
        InnerTxnBuilder.Submit(),
        # Add risk portion to the shared risk pool
        App.globalPut(
            risk_pool_key,
            App.globalGet(risk_pool_key) + user_risk,
        ),
        # Update global deposited
        App.globalPut(
            total_deposited_key,
            App.globalGet(total_deposited_key) - App.localGet(Txn.sender(), deposited_key),
        ),
        # Mark user as withdrawn
        App.localPut(Txn.sender(), withdrawn_key, Int(1)),
        App.localPut(Txn.sender(), withdraw_time_key, Global.latest_timestamp()),
        App.localPut(Txn.sender(), safe_portion_key, Int(0)),
        App.localPut(Txn.sender(), risk_portion_key, Int(0)),
        App.localPut(Txn.sender(), deposited_key, Int(0)),
        # Decrement member count
        App.globalPut(member_count_key, App.globalGet(member_count_key) - Int(1)),
        # If only 1 or 0 members remain, auto-move to distributing
        If(
            App.globalGet(member_count_key) <= Int(1),
            App.globalPut(status_key, STATUS_DISTRIBUTING),
        ),
        Approve(),
    )

    # ─── Distribute to Remaining Member (Admin Only) ───
    # Args: ["distribute", member_address]
    # Called for each remaining member at pool end
    on_distribute = Seq(
        Assert(is_admin),
        Assert(
            (App.globalGet(status_key) == STATUS_DISTRIBUTING)
            | (Global.latest_timestamp() >= App.globalGet(end_time_key))
        ),
        App.globalPut(status_key, STATUS_DISTRIBUTING),
        Assert(App.localGet(Txn.accounts[1], withdrawn_key) == Int(0)),
        # Calculate: safe_portion + risk_portion + share of risk_pool
        # share = risk_pool / remaining_members
        # For simplicity, admin calculates off-chain and passes the amount
        # The contract just validates and sends
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: Txn.accounts[1],
            # Send their full deposit + their share of the risk pool
            TxnField.amount: App.localGet(Txn.accounts[1], deposited_key)
                + (App.globalGet(risk_pool_key) / App.globalGet(member_count_key)),
            TxnField.fee: Int(0),
        }),
        InnerTxnBuilder.Submit(),
        # Mark as withdrawn
        App.localPut(Txn.accounts[1], withdrawn_key, Int(1)),
        App.localPut(Txn.accounts[1], withdraw_time_key, Global.latest_timestamp()),
        Approve(),
    )

    # ─── Close Pool (Admin Only) ───
    # Args: ["close_pool"]
    on_close = Seq(
        Assert(is_admin),
        App.globalPut(status_key, STATUS_COMPLETED),
        Approve(),
    )

    # ─── NoOp Routing ───
    on_noop = Cond(
        [Txn.application_args[0] == Bytes("deposit"), on_deposit],
        [Txn.application_args[0] == Bytes("early_withdraw"), on_early_withdraw],
        [Txn.application_args[0] == Bytes("distribute"), on_distribute],
        [Txn.application_args[0] == Bytes("close_pool"), on_close],
    )

    # ─── Delete (Admin Only, after completed) ───
    on_delete = Seq(
        Assert(is_admin),
        Assert(
            (App.globalGet(status_key) == STATUS_COMPLETED)
            | (App.globalGet(status_key) == STATUS_CANCELLED)
        ),
        Approve(),
    )

    # ─── Main Router ───
    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.NoOp, on_noop],
        [Txn.on_completion() == OnComplete.OptIn, on_optin],
        [Txn.on_completion() == OnComplete.DeleteApplication, on_delete],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Seq(Assert(is_admin), Approve())],
    )

    return program


def clear_state_program():
    """Clear state — allow members to leave (they lose their risk portion)."""
    return Approve()


def get_approval_teal():
    """Compile approval program to TEAL."""
    return compileTeal(approval_program(), mode=Mode.Application, version=10)


def get_clear_teal():
    """Compile clear state program to TEAL."""
    return compileTeal(clear_state_program(), mode=Mode.Application, version=10)


# Schema definitions
GLOBAL_SCHEMA = {
    "num_uints": 6,      # total_deposited, risk_pool, member_count, start_time, end_time, status, min_deposit
    "num_byte_slices": 2  # admin, pool_id
}

LOCAL_SCHEMA = {
    "num_uints": 5,      # deposited, safe_portion, risk_portion, withdrawn, withdraw_time
    "num_byte_slices": 0
}


if __name__ == "__main__":
    print("=== FundingPool Approval Program (TEAL) ===")
    print(get_approval_teal())
    print("\n=== FundingPool Clear State Program (TEAL) ===")
    print(get_clear_teal())
