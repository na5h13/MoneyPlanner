"""Income models — income events and manual income logging."""

from datetime import datetime
import uuid


class IncomeEvent:
    def __init__(
        self,
        amount: float,
        date: str,
        source: str = "manual",
        source_description: str = "",
        is_recurring: bool = False,
        rolling_3mo_average: float | None = None,
        income_change_flag: str | None = None,
        id: str | None = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.amount = amount
        self.date = date
        self.source = source
        self.source_description = source_description
        self.is_recurring = is_recurring
        self.rolling_3mo_average = rolling_3mo_average
        self.income_change_flag = income_change_flag
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "amount": self.amount,
            "date": self.date,
            "source": self.source,
            "source_description": self.source_description,
            "is_recurring": self.is_recurring,
            "rolling_3mo_average": self.rolling_3mo_average,
            "income_change_flag": self.income_change_flag,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "IncomeEvent":
        e = cls(
            id=d.get("id"),
            amount=d.get("amount", 0),
            date=d.get("date", ""),
            source=d.get("source", "manual"),
            source_description=d.get("source_description", ""),
            is_recurring=d.get("is_recurring", False),
            rolling_3mo_average=d.get("rolling_3mo_average"),
            income_change_flag=d.get("income_change_flag"),
        )
        e.created_at = d.get("created_at", e.created_at)
        return e

    @staticmethod
    def compute_rolling_average(events: list, window: int = 3) -> float:
        if not events:
            return 0.0
        recent = sorted(events, key=lambda e: e.date, reverse=True)[:window]
        return sum(e.amount for e in recent) / len(recent)

    @staticmethod
    def detect_income_change(
        current_amount: float, rolling_avg: float, threshold: float = 0.05
    ) -> str | None:
        if rolling_avg <= 0:
            return None
        change_pct = (current_amount - rolling_avg) / rolling_avg
        if change_pct > threshold:
            return "increase"
        elif change_pct < -threshold:
            return "decrease"
        return None


class ManualIncomeLog:
    def __init__(
        self,
        amount: float,
        date: str,
        source_description: str = "",
        is_recurring: bool = False,
        id: str | None = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.amount = amount
        self.date = date
        self.source_description = source_description
        self.is_recurring = is_recurring
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "amount": self.amount,
            "date": self.date,
            "source_description": self.source_description,
            "is_recurring": self.is_recurring,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ManualIncomeLog":
        log = cls(
            id=d.get("id"),
            amount=d.get("amount", 0),
            date=d.get("date", ""),
            source_description=d.get("source_description", ""),
            is_recurring=d.get("is_recurring", False),
        )
        log.created_at = d.get("created_at", log.created_at)
        return log

    def to_income_event(self) -> IncomeEvent:
        return IncomeEvent(
            amount=self.amount,
            date=self.date,
            source="manual",
            source_description=self.source_description,
            is_recurring=self.is_recurring,
        )
