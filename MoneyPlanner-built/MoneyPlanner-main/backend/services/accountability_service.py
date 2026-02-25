"""Accountability service — peer benchmarks, escalation, group goals (Phase 5+)."""

import uuid
import math
from services.persistence import load_all, append_one, load_one, save_one


def get_peer_benchmark(user_id: str = "user-1") -> dict:
    """Get anonymized peer benchmark data."""
    config = load_one("benchmark_config", lambda d: d, user_id=user_id)
    if not config or not config.get("opt_in"):
        return {"opted_in": False, "message": "Opt in to see peer benchmarks"}

    # Simulated benchmark (production: aggregate from anonymized user data)
    return {
        "opted_in": True,
        "savings_rate_percentile": 65,
        "peer_avg_savings_rate": 12.5,
        "your_savings_rate": config.get("current_rate", 10.0),
        "suppressed": config.get("suppressed", False),
    }


def should_show_benchmark(user_id: str = "user-1") -> bool:
    config = load_one("benchmark_config", lambda d: d, user_id=user_id)
    return bool(config and config.get("opt_in") and not config.get("suppressed"))


def toggle_benchmark(user_id: str = "user-1", opt_in: bool = False) -> dict:
    config = load_one("benchmark_config", lambda d: d, user_id=user_id) or {}
    config["opt_in"] = opt_in
    config["user_id"] = user_id
    save_one("benchmark_config", config, user_id=user_id)
    return config


def check_escalation_triggers(user_id: str = "user-1") -> list:
    """Check for conditions that should trigger savings rate escalation."""
    return []  # Phase 5+ implementation


def compute_escalation_forecast(
    current_rate: float,
    proposed_rate: float,
    years: int = 10,
    monthly_income: float = 5000,
) -> dict:
    """Project savings trajectory at current vs proposed rate."""
    months = years * 12
    current_total = monthly_income * current_rate * months
    proposed_total = monthly_income * proposed_rate * months
    # Simple compound interest at 5% annual
    r = 0.05 / 12
    current_compound = monthly_income * current_rate * ((math.pow(1 + r, months) - 1) / r)
    proposed_compound = monthly_income * proposed_rate * ((math.pow(1 + r, months) - 1) / r)

    return {
        "current_rate": current_rate,
        "proposed_rate": proposed_rate,
        "years": years,
        "monthly_income": monthly_income,
        "current_simple": round(current_total, 2),
        "proposed_simple": round(proposed_total, 2),
        "current_compound": round(current_compound, 2),
        "proposed_compound": round(proposed_compound, 2),
        "difference": round(proposed_compound - current_compound, 2),
    }


def create_group_goal(
    creator_id: str, name: str, target: float, member_ids: list
) -> dict:
    if not name:
        raise ValueError("Group name required")
    if target <= 0:
        raise ValueError("Target must be positive")

    group = {
        "id": str(uuid.uuid4()),
        "creator_id": creator_id,
        "name": name,
        "target": target,
        "member_ids": [creator_id] + member_ids,
        "progress": 0,
    }
    append_one("group_goals", group, user_id=creator_id)
    return group


def get_group_progress(group_id: str, user_id: str = "user-1") -> dict | None:
    groups = load_all("group_goals", lambda d: d, user_id=user_id)
    for g in groups:
        if g.get("id") == group_id:
            return g
    return None
