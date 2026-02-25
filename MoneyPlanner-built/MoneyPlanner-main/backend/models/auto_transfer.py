"""AutoTransfer model — IIN savings rate automation."""

from datetime import datetime
import uuid


class EscalationProposal:
    def __init__(
        self,
        old_rate: float,
        new_rate: float,
        reason: str = "",
        status: str = "pending",
        id: str | None = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.old_rate = old_rate
        self.new_rate = new_rate
        self.reason = reason
        self.status = status  # "pending", "accepted", "rejected"
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "old_rate": self.old_rate,
            "new_rate": self.new_rate,
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "EscalationProposal":
        p = cls(
            id=d.get("id"),
            old_rate=d.get("old_rate", 0),
            new_rate=d.get("new_rate", 0),
            reason=d.get("reason", ""),
            status=d.get("status", "pending"),
        )
        p.created_at = d.get("created_at", p.created_at)
        return p


class AutoTransfer:
    def __init__(
        self,
        user_id: str = "user-1",
        savings_rate_pct: float = 10.0,
        destination: str = "savings",
        is_active: bool = True,
        pending_escalation: EscalationProposal | None = None,
        history: list | None = None,
        id: str | None = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.user_id = user_id
        self.savings_rate_pct = savings_rate_pct
        self.destination = destination
        self.is_active = is_active
        self.pending_escalation = pending_escalation
        self.history = history or []
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "savings_rate_pct": self.savings_rate_pct,
            "destination": self.destination,
            "is_active": self.is_active,
            "pending_escalation": (
                self.pending_escalation.to_dict()
                if self.pending_escalation
                else None
            ),
            "history": self.history,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "AutoTransfer":
        esc = d.get("pending_escalation")
        t = cls(
            id=d.get("id"),
            user_id=d.get("user_id", "user-1"),
            savings_rate_pct=d.get("savings_rate_pct", 10.0),
            destination=d.get("destination", "savings"),
            is_active=d.get("is_active", True),
            pending_escalation=(
                EscalationProposal.from_dict(esc) if esc else None
            ),
            history=d.get("history", []),
        )
        t.created_at = d.get("created_at", t.created_at)
        return t
