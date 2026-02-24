"""Transaction model — individual financial transactions."""

from datetime import datetime
import uuid


class Transaction:
    def __init__(
        self,
        date: str,
        name: str,
        merchant: str = "",
        amount: float = 0.0,
        category: str = "",
        budget_category: str = "",
        pending: bool = False,
        account_id: str = "",
        transaction_id: str | None = None,
        pain_of_paying_flag: bool = False,
        id: str | None = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.transaction_id = transaction_id or self.id
        self.date = date
        self.name = name
        self.merchant = merchant
        self.amount = amount
        self.category = category
        self.budget_category = budget_category
        self.pending = pending
        self.account_id = account_id
        self.pain_of_paying_flag = pain_of_paying_flag
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "date": self.date,
            "name": self.name,
            "merchant": self.merchant,
            "amount": self.amount,
            "category": self.category,
            "budget_category": self.budget_category,
            "pending": self.pending,
            "account_id": self.account_id,
            "pain_of_paying_flag": self.pain_of_paying_flag,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Transaction":
        t = cls(
            id=d.get("id"),
            transaction_id=d.get("transaction_id"),
            date=d.get("date", ""),
            name=d.get("name", ""),
            merchant=d.get("merchant", ""),
            amount=d.get("amount", 0),
            category=d.get("category", ""),
            budget_category=d.get("budget_category", ""),
            pending=d.get("pending", False),
            account_id=d.get("account_id", ""),
            pain_of_paying_flag=d.get("pain_of_paying_flag", False),
        )
        t.created_at = d.get("created_at", t.created_at)
        return t
