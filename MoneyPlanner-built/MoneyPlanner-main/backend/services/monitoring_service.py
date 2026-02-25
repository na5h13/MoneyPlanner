"""Monitoring service — weekly reviews, safe-to-spend, budget hard stops."""

from datetime import datetime, timedelta
import uuid

from models.income import IncomeEvent
from models.transaction import Transaction
from services.persistence import load_all, save_all, append_one
from services.categories import BUDGET_ENVELOPES


def compute_safe_to_spend(user_id: str = "user-1") -> dict:
    """Compute safe-to-spend = income - fixed expenses - savings target."""
    income_events = load_all("income_events", IncomeEvent.from_dict, user_id=user_id)
    monthly_income = IncomeEvent.compute_rolling_average(income_events)

    # Get budget allocations if they exist
    budgets = load_all("budget_config", lambda d: d, user_id=user_id)
    budget = budgets[-1] if budgets else {}

    fixed_expenses = budget.get("fixed_expenses", monthly_income * 0.50)
    savings_target = budget.get("savings_target", monthly_income * 0.10)

    # Get current month spending
    transactions = load_all("transactions", Transaction.from_dict, user_id=user_id)
    now = datetime.utcnow()
    month_start = now.replace(day=1).strftime("%Y-%m-%d")
    month_spending = sum(
        t.amount for t in transactions
        if t.date >= month_start and t.amount > 0
    )

    discretionary_budget = monthly_income - fixed_expenses - savings_target
    safe_to_spend = max(discretionary_budget - month_spending, 0)

    return {
        "monthly_income": round(monthly_income, 2),
        "fixed_expenses": round(fixed_expenses, 2),
        "savings_target": round(savings_target, 2),
        "discretionary_budget": round(discretionary_budget, 2),
        "month_spending": round(month_spending, 2),
        "safe_to_spend": round(safe_to_spend, 2),
        "days_remaining": (now.replace(month=now.month % 12 + 1, day=1) - now).days
        if now.month < 12
        else (now.replace(year=now.year + 1, month=1, day=1) - now).days,
    }


def generate_weekly_review(user_id: str = "user-1") -> dict:
    """Generate a weekly spending review."""
    transactions = load_all("transactions", Transaction.from_dict, user_id=user_id)
    now = datetime.utcnow()
    week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")

    week_txns = [t for t in transactions if t.date >= week_ago and t.amount > 0]
    total_spending = sum(t.amount for t in week_txns)

    # Category breakdown
    by_category = {}
    for t in week_txns:
        cat = t.budget_category or "Other"
        by_category[cat] = by_category.get(cat, 0) + t.amount

    review = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "week_ending": now.strftime("%Y-%m-%d"),
        "total_spending": round(total_spending, 2),
        "transaction_count": len(week_txns),
        "by_category": {k: round(v, 2) for k, v in sorted(
            by_category.items(), key=lambda x: x[1], reverse=True
        )},
        "acknowledged": False,
        "created_at": now.isoformat(),
    }

    append_one("weekly_reviews", review, user_id=user_id)
    return review


def acknowledge_review(review_id: str, user_id: str = "user-1") -> dict:
    """Mark a weekly review as acknowledged."""
    reviews = load_all("weekly_reviews", lambda d: d, user_id=user_id)
    for r in reviews:
        if r.get("id") == review_id:
            r["acknowledged"] = True
            r["acknowledged_at"] = datetime.utcnow().isoformat()
            save_all("weekly_reviews", reviews, user_id=user_id)
            return r
    raise ValueError(f"Review {review_id} not found")


def set_hard_stop(cat_id: str, user_id: str = "user-1") -> dict:
    """Enable hard stop on a budget category."""
    budgets = load_all("budget_categories", lambda d: d, user_id=user_id)
    for b in budgets:
        if b.get("id") == cat_id:
            b["hard_stop"] = True
            save_all("budget_categories", budgets, user_id=user_id)
            return b
    raise ValueError(f"Category {cat_id} not found")
