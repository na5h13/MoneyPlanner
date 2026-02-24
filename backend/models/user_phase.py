"""User phase model — tracks progression through app phases."""

from datetime import datetime, timedelta
from enum import Enum
import uuid


class Phase(str, Enum):
    ONBOARDING = "onboarding"
    OBSERVATION = "observation"
    FIRST_BUDGET = "first_budget"
    AUTOMATION = "automation"
    OPTIMIZATION = "optimization"


PHASE_ORDER = [
    Phase.ONBOARDING,
    Phase.OBSERVATION,
    Phase.FIRST_BUDGET,
    Phase.AUTOMATION,
    Phase.OPTIMIZATION,
]


class UserPhaseState:
    def __init__(
        self,
        user_id: str = "user-1",
        current_phase: Phase = Phase.ONBOARDING,
        phase_entered_at: str | None = None,
        history: list | None = None,
        id: str | None = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.user_id = user_id
        self.current_phase = (
            Phase(current_phase) if isinstance(current_phase, str) else current_phase
        )
        self.phase_entered_at = phase_entered_at or datetime.utcnow().isoformat()
        self.history = history or []

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "current_phase": self.current_phase.value,
            "phase_entered_at": self.phase_entered_at,
            "history": self.history,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "UserPhaseState":
        return cls(
            id=d.get("id"),
            user_id=d.get("user_id", "user-1"),
            current_phase=d.get("current_phase", "onboarding"),
            phase_entered_at=d.get("phase_entered_at"),
            history=d.get("history", []),
        )

    def days_in_phase(self) -> float:
        entered = datetime.fromisoformat(self.phase_entered_at)
        return (datetime.utcnow() - entered).total_seconds() / 86400
