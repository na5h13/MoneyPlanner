"""Automation service — IIN (Income Increase Neutralization) automation.

Handles income change detection → savings rate adjustment proposals.
"""

from models.auto_transfer import AutoTransfer, EscalationProposal
from models.income import IncomeEvent
from services.persistence import load_all, save_all


def get_user_transfer(user_id: str = "user-1") -> AutoTransfer | None:
    """Get the user's current auto-transfer config."""
    transfers = load_all("auto_transfers", AutoTransfer.from_dict, user_id=user_id)
    return transfers[-1] if transfers else None


def create_default_transfer(user_id: str = "user-1") -> AutoTransfer:
    """Create a default auto-transfer config."""
    transfer = AutoTransfer(
        user_id=user_id,
        savings_rate_pct=10.0,
        destination="savings",
    )
    from services.persistence import append_one
    append_one("auto_transfers", transfer, user_id=user_id)
    return transfer


def handle_income_change(
    transfer: AutoTransfer,
    income_event: IncomeEvent,
    previous_avg: float,
    user_id: str = "user-1",
) -> AutoTransfer:
    """React to an income change event.

    On increase: propose escalation (raise savings rate proportionally).
    On decrease: auto-reduce savings rate to protect essentials.
    """
    if not income_event.income_change_flag:
        return transfer

    if income_event.income_change_flag == "increase" and previous_avg > 0:
        # Calculate how much of the increase to capture
        increase_pct = (income_event.amount - previous_avg) / previous_avg
        # Propose capturing 50% of the increase as additional savings
        proposed_bump = round(increase_pct * 50, 1)  # 50% of increase
        new_rate = min(transfer.savings_rate_pct + proposed_bump, 50.0)

        transfer.pending_escalation = EscalationProposal(
            old_rate=transfer.savings_rate_pct,
            new_rate=new_rate,
            reason=f"Income increased {increase_pct:.1%}. "
                   f"Proposing {proposed_bump:.1f}pp increase to capture surplus.",
        )

    elif income_event.income_change_flag == "decrease" and previous_avg > 0:
        # Auto-reduce: scale rate down proportionally
        decrease_pct = (previous_avg - income_event.amount) / previous_avg
        reduction = round(transfer.savings_rate_pct * decrease_pct, 1)
        transfer.savings_rate_pct = max(transfer.savings_rate_pct - reduction, 1.0)
        transfer.history.append({
            "action": "auto_reduce",
            "old_rate": transfer.savings_rate_pct + reduction,
            "new_rate": transfer.savings_rate_pct,
            "reason": f"Income decreased {decrease_pct:.1%}",
        })

    # Save updated transfer
    transfers = load_all("auto_transfers", AutoTransfer.from_dict, user_id=user_id)
    if transfers:
        transfers[-1] = transfer
    else:
        transfers = [transfer]
    save_all("auto_transfers", transfers, user_id=user_id)

    return transfer


def accept_escalation(user_id: str = "user-1") -> AutoTransfer | None:
    """Accept a pending escalation proposal."""
    transfer = get_user_transfer(user_id)
    if not transfer or not transfer.pending_escalation:
        return None

    esc = transfer.pending_escalation
    transfer.history.append({
        "action": "escalation_accepted",
        "old_rate": esc.old_rate,
        "new_rate": esc.new_rate,
    })
    transfer.savings_rate_pct = esc.new_rate
    esc.status = "accepted"
    transfer.pending_escalation = None

    transfers = load_all("auto_transfers", AutoTransfer.from_dict, user_id=user_id)
    if transfers:
        transfers[-1] = transfer
        save_all("auto_transfers", transfers, user_id=user_id)
    return transfer


def reject_escalation(user_id: str = "user-1") -> AutoTransfer | None:
    """Reject a pending escalation proposal."""
    transfer = get_user_transfer(user_id)
    if not transfer or not transfer.pending_escalation:
        return None

    esc = transfer.pending_escalation
    esc.status = "rejected"
    transfer.history.append({
        "action": "escalation_rejected",
        "old_rate": esc.old_rate,
        "proposed_rate": esc.new_rate,
    })
    transfer.pending_escalation = None

    transfers = load_all("auto_transfers", AutoTransfer.from_dict, user_id=user_id)
    if transfers:
        transfers[-1] = transfer
        save_all("auto_transfers", transfers, user_id=user_id)
    return transfer
