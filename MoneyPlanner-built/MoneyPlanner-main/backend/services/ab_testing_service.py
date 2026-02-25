"""A/B testing service — experiment management and feature flags (Phase 5+)."""

import uuid
from datetime import datetime
from services.persistence import load_all, append_one


def list_experiments(status: str = "active") -> list:
    """List experiments by status."""
    return []  # No experiments in initial release


def get_experiment_results(experiment_id: str) -> dict:
    raise ValueError(f"Experiment {experiment_id} not found")


def record_outcome(
    user_id: str, experiment_id: str, metric: str, value: float
) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "experiment_id": experiment_id,
        "metric": metric,
        "value": value,
        "recorded_at": datetime.utcnow().isoformat(),
    }


def get_feature_flag(user_id: str, flag_name: str) -> bool:
    """Get feature flag value. Default: all flags off."""
    # Production: look up in experiment assignments
    defaults = {
        "iin_auto_apply": False,
        "peer_benchmark": False,
        "gamification": True,
    }
    return defaults.get(flag_name, False)
