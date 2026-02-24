"""Safeguards service — failure mode detection, gamification sunset (Phase 5+)."""

from datetime import datetime, timedelta
from services.persistence import load_one, save_one


def get_user_safeguard_status(user_id: str = "user-1") -> dict:
    """Get complete safeguard status."""
    config = load_one("safeguards", lambda d: d, user_id=user_id) or {}
    return {
        "user_id": user_id,
        "gamification_active": config.get("gamification_active", True),
        "gamification_holiday_until": config.get("gamification_holiday_until"),
        "failure_modes_detected": [],
        "last_checked": datetime.utcnow().isoformat(),
    }


def detect_failure_modes(user_id: str = "user-1") -> list:
    """Detect potential failure modes in user's financial behavior."""
    # Phase 5+ implementation — checks for patterns like:
    # - Overspending streaks
    # - Savings rate declining
    # - Ignored reviews
    return []


def apply_countermeasure(user_id: str, mode_type: str) -> dict:
    """Apply a countermeasure for a detected failure mode."""
    return {"type": mode_type, "action": "none", "message": "No action needed"}


def start_gamification_holiday(user_id: str = "user-1") -> dict:
    """Start a 2-week gamification holiday (disable points/streaks)."""
    config = load_one("safeguards", lambda d: d, user_id=user_id) or {}
    holiday_end = (datetime.utcnow() + timedelta(days=14)).isoformat()
    config["gamification_active"] = False
    config["gamification_holiday_until"] = holiday_end
    config["user_id"] = user_id
    save_one("safeguards", config, user_id=user_id)
    return config


def check_gamification_sunset(user_id: str = "user-1") -> dict:
    """Check if gamification should be sunsetting for this user."""
    config = load_one("safeguards", lambda d: d, user_id=user_id) or {}
    holiday_until = config.get("gamification_holiday_until")
    if holiday_until and datetime.fromisoformat(holiday_until) > datetime.utcnow():
        return {"active": False, "holiday_until": holiday_until}
    return {"active": config.get("gamification_active", True)}
