"""
SplitSync.py — VitalScore Bill Splitting Smart Contract

This PyTeal contract manages bill split state and settlement on Algorand.
When a user pays a bill and splits it among participants, this contract
tracks who owes what and records settlement on-chain for transparency.

Global State:
    - admin: System admin address
    - payer: Address of the bill payer (initiator)
    - total_amount: Total bill amount (in microAlgos)
    - split_id: UUID of the split
    - participant_count: Number of participants
    - settled_count: Number who have paid
    - status: 0=PENDING, 1=PARTIAL, 2=SETTLED, 3=CANCELLED
    - created_at: Unix timestamp of creation
    - deadline: Unix timestamp of settlement deadline

Local State (per participant):
    - amount_owed: Amount participant owes (microAlgos)
    - paid: 0/1 whether participant has paid
    - paid_at: Timestamp of payment

Methods:
    - create: Deploy with split params
    - opt_in: Participant joins the split
    - record_payment: Admin records that a participant paid (off-chain UPI)
    - settle: Mark split as fully settled
    - cancel: Cancel the split (admin only)
"""

from pyteal import (
    Approve,
    App,
    Assert,
    Bytes,
    Cond,
    Global,
    If,
    Int,
    Mode,
    OnComplete,
    Reject,
    Seq,
    Txn,
    compileTeal,
)


def approval_program():
    """Main approval program for SplitSync contract."""

    # ─── Global State Keys ───
    admin_key = Bytes("admin")
    payer_key = Bytes("payer")
    total_amount_key = Bytes("total_amount")
    split_id_key = Bytes("split_id")
    participant_count_key = Bytes("participant_count")
    settled_count_key = Bytes("settled_count")
    status_key = Bytes("status")
    created_at_key = Bytes("created_at")
    deadline_key = Bytes("deadline")

    # Status constants
    STATUS_PENDING = Int(0)
    STATUS_PARTIAL = Int(1)
    STATUS_SETTLED = Int(2)
    STATUS_CANCELLED = Int(3)

    # Local state keys
    amount_owed_key = Bytes("amount_owed")
    paid_key = Bytes("paid")
    paid_at_key = Bytes("paid_at")

    # ─── Helpers ───
    is_admin = Txn.sender() == App.globalGet(admin_key)

    # ─── On Creation ───
    # Args: [payer_address, total_amount, split_id, participant_count, deadline]
    on_create = Seq(
        App.globalPut(admin_key, Txn.sender()),
        App.globalPut(payer_key, Txn.application_args[0]),
        App.globalPut(total_amount_key, Txn.application_args[1]),
        App.globalPut(split_id_key, Txn.application_args[2]),
        App.globalPut(participant_count_key, Txn.application_args[3]),
        App.globalPut(settled_count_key, Int(0)),
        App.globalPut(status_key, STATUS_PENDING),
        App.globalPut(created_at_key, Global.latest_timestamp()),
        App.globalPut(deadline_key, Txn.application_args[4]),
        Approve(),
    )

    # ─── Opt-In (Participant joins) ───
    # Args on opt-in: [amount_owed]
    on_optin = Seq(
        # Set participant's owed amount
        App.localPut(Txn.sender(), amount_owed_key, Txn.application_args[0]),
        App.localPut(Txn.sender(), paid_key, Int(0)),
        App.localPut(Txn.sender(), paid_at_key, Int(0)),
        Approve(),
    )

    # ─── Record Payment (Admin records off-chain UPI payment) ───
    # Args: ["record_payment", participant_address]
    on_record_payment = Seq(
        Assert(is_admin),
        Assert(
            App.globalGet(status_key) != STATUS_SETTLED
        ),
        Assert(
            App.globalGet(status_key) != STATUS_CANCELLED
        ),
        # Mark participant as paid
        App.localPut(Txn.accounts[1], paid_key, Int(1)),
        App.localPut(Txn.accounts[1], paid_at_key, Global.latest_timestamp()),
        # Increment settled count
        App.globalPut(
            settled_count_key,
            App.globalGet(settled_count_key) + Int(1),
        ),
        # Check if all settled
        If(
            App.globalGet(settled_count_key) == App.globalGet(participant_count_key),
            App.globalPut(status_key, STATUS_SETTLED),
            App.globalPut(status_key, STATUS_PARTIAL),
        ),
        Approve(),
    )

    # ─── Cancel Split (Admin only) ───
    # Args: ["cancel"]
    on_cancel = Seq(
        Assert(is_admin),
        Assert(
            App.globalGet(status_key) != STATUS_SETTLED
        ),
        App.globalPut(status_key, STATUS_CANCELLED),
        Approve(),
    )

    # ─── NoOp Routing ───
    on_noop = Cond(
        [Txn.application_args[0] == Bytes("record_payment"), on_record_payment],
        [Txn.application_args[0] == Bytes("cancel"), on_cancel],
    )

    # ─── Delete (Admin only, after settled or cancelled) ───
    on_delete = Seq(
        Assert(is_admin),
        Assert(
            (App.globalGet(status_key) == STATUS_SETTLED)
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
    """Clear state — allow participants to leave."""
    return Approve()


def get_approval_teal():
    """Compile approval program to TEAL."""
    return compileTeal(approval_program(), mode=Mode.Application, version=10)


def get_clear_teal():
    """Compile clear state program to TEAL."""
    return compileTeal(clear_state_program(), mode=Mode.Application, version=10)


# Schema definitions
GLOBAL_SCHEMA = {
    "num_uints": 5,      # total_amount, participant_count, settled_count, status, created_at, deadline
    "num_byte_slices": 3  # admin, payer, split_id
}

LOCAL_SCHEMA = {
    "num_uints": 3,      # amount_owed, paid, paid_at
    "num_byte_slices": 0
}


if __name__ == "__main__":
    print("=== SplitSync Approval Program (TEAL) ===")
    print(get_approval_teal())
    print("\n=== SplitSync Clear State Program (TEAL) ===")
    print(get_clear_teal())
