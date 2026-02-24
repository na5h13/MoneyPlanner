"""Phase service — manages user progression through app phases.

Phases: Onboarding → Observation → First Budget → Automation → Optimization
"""

import os
from models.user_phase import Phase, UserPhaseState, PHASE_ORDER
from services.persistence import load_one, save_one, load_all

DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"
DEV_OBSERVATION_DAYS = int(os.getenv("DEV_OBSERVATION_DAYS", "0"))
DEV_BUDGET_CYCLE_DAYS = int(os.getenv("DEV_BUDGET_CYCLE_DAYS", "1"))
DEV_PHASE5_GATE = os.getenv("DEV_PHASE5_GATE", "false").lower() == "true"

PHASE_FEATURES = {
    Phase.ONBOARDING: ["connect_bank", "log_income", "log_savings"],
    Phase.OBSERVATION: ["view_transactions", "auto_categorize", "spending_summary"],
    Phase.FIRST_BUDGET: ["budget_envelopes", "budget_alerts", "safe_to_spend"],
    Phase.AUTOMATION: ["auto_transfer", "iin_rules", "income_detection"],
    Phase.OPTIMIZATION: [
        "peer_benchmark", "escalation", "weekly_review",
        "group_goals", "experiments",
    ],
}


def get_user_phase(user_id: str = "user-1") -> UserPhaseState:
    """Get current phase state, creating default if needed."""
    state = load_one("user_phase", UserPhaseState.from_dict, user_id=user_id)
    if not state:
        state = UserPhaseState(user_id=user_id)
        save_one("user_phase", state, user_id=user_id)
    return state


def get_unlocked_features(phase: Phase) -> list[str]:
    """Get all features unlocked up to and including the given phase."""
    features = []
    for p in PHASE_ORDER:
        features.extend(PHASE_FEATURES.get(p, []))
        if p == phase:
            break
    return features


def get_next_transition_info(user_id: str = "user-1") -> dict:
    """Get info about what's needed for the next phase transition."""
    state = get_user_phase(user_id)
    idx = PHASE_ORDER.index(state.current_phase)

    if idx >= len(PHASE_ORDER) - 1:
        return {"next_phase": None, "message": "All phases unlocked"}

    next_phase = PHASE_ORDER[idx + 1]
    days = state.days_in_phase()

    if state.current_phase == Phase.ONBOARDING:
        from models.income import IncomeEvent
        events = load_all("income_events", IncomeEvent.from_dict, user_id=user_id)
        return {
            "next_phase": next_phase.value,
            "requirement": "Log at least one income event",
            "income_events_logged": len(events),
            "ready": len(events) > 0,
        }

    elif state.current_phase == Phase.OBSERVATION:
        obs_days = DEV_OBSERVATION_DAYS if DEV_MODE else 14
        return {
            "next_phase": next_phase.value,
            "requirement": f"Wait {obs_days} days of observation",
            "days_elapsed": round(days, 1),
            "days_required": obs_days,
            "ready": days >= obs_days,
        }

    elif state.current_phase == Phase.FIRST_BUDGET:
        cycle_days = DEV_BUDGET_CYCLE_DAYS if DEV_MODE else 30
        return {
            "next_phase": next_phase.value,
            "requirement": f"Complete {cycle_days} days of budgeting",
            "days_elapsed": round(days, 1),
            "days_required": cycle_days,
            "ready": days >= cycle_days,
        }

    elif state.current_phase == Phase.AUTOMATION:
        gate = DEV_PHASE5_GATE if DEV_MODE else True
        return {
            "next_phase": next_phase.value,
            "requirement": "Automation running successfully",
            "gate_passed": not gate or days >= 7,
            "ready": not gate or days >= 7,
        }

    return {"next_phase": next_phase.value, "ready": False}


def advance_phase(user_id: str = "user-1") -> tuple[bool, str, UserPhaseState | None]:
    """Attempt to advance to the next phase."""
    state = get_user_phase(user_id)
    info = get_next_transition_info(user_id)

    if not info.get("ready"):
        return False, f"Not ready: {info.get('requirement', 'Unknown')}", state

    idx = PHASE_ORDER.index(state.current_phase)
    if idx >= len(PHASE_ORDER) - 1:
        return False, "Already at final phase", state

    old_phase = state.current_phase
    new_phase = PHASE_ORDER[idx + 1]

    state.history.append({
        "from": old_phase.value,
        "to": new_phase.value,
        "at": state.phase_entered_at,
    })
    state.current_phase = new_phase
    from datetime import datetime
    state.phase_entered_at = datetime.utcnow().isoformat()

    save_one("user_phase", state, user_id=user_id)
    return True, f"Advanced to {new_phase.value}", state
