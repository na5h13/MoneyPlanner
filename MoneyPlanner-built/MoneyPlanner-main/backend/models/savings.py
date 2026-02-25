"""Savings model — manual savings transfer logging."""

from datetime import datetime
import uuid


class ManualSavingsLog:
    def __init__(
        self,
        amount: float,
        date: str,
        destination_description: str = "",
        savings_rate_at_time: float = 0.10,
        rate_adherence: float | None = None,
        id: str | None = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.amount = amount
        self.date = date
        self.destination_description = destination_description
        self.savings_rate_at_time = savings_rate_at_time
        self.rate_adherence = rate_adherence
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "amount": self.amount,
            "date": self.date,
            "destination_description": self.destination_description,
            "savings_rate_at_time": self.savings_rate_at_time,
            "rate_adherence": self.rate_adherence,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ManualSavingsLog":
        log = cls(
            id=d.get("id"),
            amount=d.get("amount", 0),
            date=d.get("date", ""),
            destination_description=d.get("destination_description", ""),
            savings_rate_at_time=d.get("savings_rate_at_time", 0.10),
            rate_adherence=d.get("rate_adherence"),
        )
        log.created_at = d.get("created_at", log.created_at)
        return log

    @staticmethod
    def compute_adherence(
        amount: float, income: float, target_rate: float
    ) -> float | None:
        if income <= 0 or target_rate <= 0:
            return None
        expected = income * target_rate
        return round(amount / expected, 4) if expected > 0 else None
