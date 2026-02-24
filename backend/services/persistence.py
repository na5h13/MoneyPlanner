"""Persistence service — JSON file storage scoped by user_id.

Each collection is stored as data/{user_id}/{collection}.json.
Railway deployments use ephemeral storage; for production, migrate to PostgreSQL.
"""

import json
import os
from pathlib import Path
from typing import Callable, TypeVar

T = TypeVar("T")

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)


def _user_dir(user_id: str) -> Path:
    """Get or create user-specific data directory."""
    d = DATA_DIR / user_id
    d.mkdir(exist_ok=True)
    return d


def _collection_path(user_id: str, collection: str) -> Path:
    return _user_dir(user_id) / f"{collection}.json"


def load_all(collection: str, from_dict: Callable[[dict], T], user_id: str = "user-1") -> list[T]:
    """Load all items from a collection."""
    path = _collection_path(user_id, collection)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
        return [from_dict(d) for d in data]
    except (json.JSONDecodeError, KeyError):
        return []


def save_all(collection: str, items: list, user_id: str = "user-1"):
    """Save all items to a collection (overwrites)."""
    path = _collection_path(user_id, collection)
    data = [i.to_dict() if hasattr(i, "to_dict") else i for i in items]
    path.write_text(json.dumps(data, indent=2))
    os.chmod(path, 0o600)


def append_one(collection: str, item, user_id: str = "user-1"):
    """Append a single item to a collection."""
    path = _collection_path(user_id, collection)
    data = []
    if path.exists():
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            data = []
    data.append(item.to_dict() if hasattr(item, "to_dict") else item)
    path.write_text(json.dumps(data, indent=2))
    os.chmod(path, 0o600)


def load_one(collection: str, from_dict: Callable[[dict], T], user_id: str = "user-1") -> T | None:
    """Load a single-document collection (e.g., user phase state)."""
    path = _collection_path(user_id, collection)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text())
        if isinstance(data, list):
            return from_dict(data[-1]) if data else None
        return from_dict(data)
    except (json.JSONDecodeError, KeyError):
        return None


def save_one(collection: str, item, user_id: str = "user-1"):
    """Save a single document to a collection."""
    path = _collection_path(user_id, collection)
    data = item.to_dict() if hasattr(item, "to_dict") else item
    path.write_text(json.dumps(data, indent=2))
    os.chmod(path, 0o600)
