#!/usr/bin/env python3
"""
MoneyPlanner API — Flask backend for the React Native Expo app.

Architecture:
  - Firebase Auth (ID token verification) — no Firestore
  - Plaid integration (transaction sync, income detection)
  - JSON file persistence (Railway: ephemeral → PostgreSQL migration path)
  - IIN (Income Increase Neutralization) automation engine

Deploy: Railway with gunicorn
  gunicorn "app:create_app()" --bind 0.0.0.0:$PORT --workers 2
"""

import json
import os
from collections import defaultdict
from datetime import datetime
from functools import wraps
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# --- Config ---
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"
AUTOMATION_MODE = os.getenv("AUTOMATION_MODE", "manual")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "money-planner-ca2c0")

APP_DIR = Path(__file__).parent
DATA_DIR = APP_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# --- Plaid Client ---
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.products import Products

env_map = {
    "sandbox": plaid.Environment.Sandbox,
    "production": plaid.Environment.Production,
}

configuration = plaid.Configuration(
    host=env_map.get(PLAID_ENV, plaid.Environment.Sandbox),
    api_key={"clientId": PLAID_CLIENT_ID, "secret": PLAID_SECRET},
)
api_client = plaid.ApiClient(configuration)
plaid_client = plaid_api.PlaidApi(api_client)

# --- Category mapping ---
from services.categories import (
    PLAID_TO_BUDGET,
    MERCHANT_OVERRIDES,
    BUDGET_ENVELOPES,
    map_category,
)

# --- Firebase Admin SDK ---
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

_firebase_initialized = False


def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return

    # Option 1: JSON string (Railway env var)
    json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if json_str:
        cred_dict = json.loads(json_str)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {"projectId": FIREBASE_PROJECT_ID})
        _firebase_initialized = True
        return

    # Option 2: File path (local dev)
    key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT", "config/firebase-service-account.json")
    full_path = APP_DIR / key_path
    if full_path.exists():
        cred = credentials.Certificate(str(full_path))
        firebase_admin.initialize_app(cred, {"projectId": FIREBASE_PROJECT_ID})
        _firebase_initialized = True
        return

    # Option 3: Dev mode without Firebase (uses user-1)
    if DEV_MODE:
        print("⚠️  Firebase not configured — running in DEV_MODE with user-1 fallback")
        _firebase_initialized = True
        return

    raise RuntimeError("Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT.")


# --- Encryption (for Plaid access tokens at rest) ---
from cryptography.fernet import Fernet
import base64
import hashlib


def _get_fernet() -> Fernet:
    if not ENCRYPTION_KEY:
        # Dev fallback — NOT SECURE for production
        key = base64.urlsafe_b64encode(b"dev-key-not-secure-0000000000000000"[:32])
    else:
        # Derive a valid Fernet key from the hex encryption key
        derived = hashlib.sha256(ENCRYPTION_KEY.encode()).digest()
        key = base64.urlsafe_b64encode(derived)
    return Fernet(key)


def encrypt(text: str) -> str:
    return _get_fernet().encrypt(text.encode()).decode()


def decrypt(ciphertext: str) -> str:
    return _get_fernet().decrypt(ciphertext.encode()).decode()


# --- Plaid Token/Transaction Storage (per-user) ---

def _tokens_file(user_id: str) -> Path:
    d = DATA_DIR / user_id
    d.mkdir(exist_ok=True)
    return d / "tokens.json"


def _txn_file(user_id: str) -> Path:
    d = DATA_DIR / user_id
    d.mkdir(exist_ok=True)
    return d / "transactions.json"


def load_tokens(user_id: str) -> dict:
    f = _tokens_file(user_id)
    if f.exists():
        return json.loads(f.read_text())
    return {}


def save_tokens(tokens: dict, user_id: str):
    f = _tokens_file(user_id)
    f.write_text(json.dumps(tokens, indent=2))
    os.chmod(f, 0o600)


def load_transactions(user_id: str) -> dict:
    f = _txn_file(user_id)
    if f.exists():
        return json.loads(f.read_text())
    return {}


def save_transactions(txns: dict, user_id: str):
    f = _txn_file(user_id)
    f.write_text(json.dumps(txns, indent=2))
    os.chmod(f, 0o600)


def txn_to_dict(t) -> dict:
    """Convert a Plaid transaction object to a serializable dict."""
    category = ""
    try:
        pfc = t.personal_finance_category
        if pfc:
            category = pfc.detailed.replace("_", " ").title()
    except Exception:
        pass

    return {
        "transaction_id": t.transaction_id,
        "date": str(t.date),
        "name": t.name,
        "merchant": t.merchant_name or "",
        "amount": float(t.amount),
        "category": category,
        "pending": t.pending,
        "account_id": t.account_id,
    }


# --- Sync ---

def sync_transactions(item_id: str, user_id: str) -> dict:
    tokens = load_tokens(user_id)
    if item_id not in tokens:
        raise ValueError(f"Account {item_id} not found")

    access_token = decrypt(tokens[item_id]["access_token"])
    cursor = tokens[item_id].get("cursor", "")

    all_txns = load_transactions(user_id)
    item_txns = all_txns.get(item_id, [])
    txn_index = {t["transaction_id"]: i for i, t in enumerate(item_txns)}

    added_count = modified_count = removed_count = 0
    has_more = True

    while has_more:
        req = TransactionsSyncRequest(access_token=access_token, cursor=cursor)
        response = plaid_client.transactions_sync(req)

        for t in response.added:
            td = txn_to_dict(t)
            if td["transaction_id"] not in txn_index:
                item_txns.append(td)
                txn_index[td["transaction_id"]] = len(item_txns) - 1
                added_count += 1

        for t in response.modified:
            td = txn_to_dict(t)
            if td["transaction_id"] in txn_index:
                item_txns[txn_index[td["transaction_id"]]] = td
                modified_count += 1

        for t in response.removed:
            tid = t.transaction_id
            if tid in txn_index:
                item_txns[txn_index[tid]] = None
                removed_count += 1

        cursor = response.next_cursor
        has_more = response.has_more

    item_txns = [t for t in item_txns if t is not None]
    all_txns[item_id] = item_txns
    save_transactions(all_txns, user_id)

    tokens[item_id]["cursor"] = cursor
    tokens[item_id]["last_sync"] = datetime.now().isoformat()
    save_tokens(tokens, user_id)

    return {"added": added_count, "modified": modified_count, "removed": removed_count}


def sync_all(user_id: str) -> dict:
    tokens = load_tokens(user_id)
    results = {}
    for item_id, info in tokens.items():
        institution = info.get("institution_name", item_id)
        try:
            result = sync_transactions(item_id, user_id)
            results[item_id] = {"institution": institution, **result}
        except Exception as e:
            results[item_id] = {"institution": institution, "error": str(e)}
    return results


# --- Flask App ---

def create_app():
    from flask import Flask, jsonify, request
    from flask_cors import CORS

    app = Flask(__name__)
    CORS(
        app,
        origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
        supports_credentials=True,
    )

    # Initialize Firebase on startup
    init_firebase()

    # --- Auth Middleware ---

    def verify_firebase_token_or_dev(f):
        """Verify Firebase ID token. In DEV_MODE, fall back to 'user-1'."""

        @wraps(f)
        def decorated(*args, **kwargs):
            if DEV_MODE:
                # Check for token first, fall back to user-1
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    token = auth_header.split("Bearer ")[1]
                    try:
                        decoded = firebase_auth.verify_id_token(token)
                        request.uid = decoded["uid"]
                        request.user_email = decoded.get("email", "")
                        return f(*args, **kwargs)
                    except Exception:
                        pass  # Fall through to dev mode

                # Dev mode fallback
                request.uid = request.headers.get("X-Dev-User-Id", "user-1")
                request.user_email = "dev@localhost"
                return f(*args, **kwargs)

            # Production: require valid token
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing authorization header"}), 401

            token = auth_header.split("Bearer ")[1]
            try:
                decoded = firebase_auth.verify_id_token(token)
                request.uid = decoded["uid"]
                request.user_email = decoded.get("email", "")
            except firebase_auth.ExpiredIdTokenError:
                return jsonify({"error": "Token expired"}), 401
            except firebase_auth.RevokedIdTokenError:
                return jsonify({"error": "Token revoked"}), 401
            except Exception as e:
                return jsonify({"error": f"Invalid token: {str(e)}"}), 401

            return f(*args, **kwargs)

        return decorated

    # --- Health ---

    @app.route("/health")
    def health():
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "dev_mode": DEV_MODE,
            "plaid_env": PLAID_ENV,
        })

    @app.route("/api/auth/verify")
    @verify_firebase_token_or_dev
    def auth_verify():
        return jsonify({
            "uid": request.uid,
            "email": request.user_email,
            "authenticated": True,
        })

    # --- Plaid Routes ---

    @app.route("/api/plaid/create-link-token", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_create_link_token():
        try:
            req = LinkTokenCreateRequest(
                products=[Products("transactions")],
                client_name="MoneyPlanner",
                country_codes=[CountryCode("CA"), CountryCode("US")],
                language="en",
                user=LinkTokenCreateRequestUser(client_user_id=request.uid),
                webhook=os.getenv("PLAID_WEBHOOK_URL"),
            )
            response = plaid_client.link_token_create(req)
            return jsonify({"link_token": response.link_token})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/plaid/exchange-token", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_exchange_token():
        try:
            data = request.get_json()
            public_token = data.get("public_token")
            metadata = data.get("metadata", {})

            req = ItemPublicTokenExchangeRequest(public_token=public_token)
            response = plaid_client.item_public_token_exchange(req)

            # Encrypt access token before storing
            encrypted_token = encrypt(response.access_token)

            tokens = load_tokens(request.uid)
            tokens[response.item_id] = {
                "access_token": encrypted_token,
                "institution_name": metadata.get("institution", {}).get("name", "Unknown"),
                "institution_id": metadata.get("institution", {}).get("institution_id", ""),
                "connected_at": datetime.now().isoformat(),
                "cursor": "",
                "last_sync": None,
            }
            save_tokens(tokens, request.uid)

            return jsonify({
                "status": "connected",
                "institution": tokens[response.item_id]["institution_name"],
                "item_id": response.item_id,
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/plaid/accounts")
    @verify_firebase_token_or_dev
    def api_plaid_accounts():
        try:
            tokens = load_tokens(request.uid)
            all_accounts = []
            for item_id, info in tokens.items():
                try:
                    access_token = decrypt(info["access_token"])
                    resp = plaid_client.accounts_get(
                        AccountsGetRequest(access_token=access_token)
                    )
                    for a in resp.accounts:
                        all_accounts.append({
                            "id": a.account_id,
                            "item_id": item_id,
                            "name": a.name,
                            "type": a.type.value,
                            "subtype": str(a.subtype) if a.subtype else None,
                            "mask": a.mask,
                            "institution_name": info["institution_name"],
                            "current_balance": a.balances.current,
                            "available_balance": a.balances.available,
                        })
                except Exception as e:
                    all_accounts.append({
                        "item_id": item_id,
                        "institution_name": info.get("institution_name", "Unknown"),
                        "error": str(e),
                    })

            return jsonify({"accounts": all_accounts})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/plaid/sync", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_sync_all():
        try:
            results = sync_all(request.uid)
            return jsonify({"status": "ok", "results": results})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/plaid/sync/<item_id>", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_sync_item(item_id):
        try:
            result = sync_transactions(item_id, request.uid)
            return jsonify({"status": "ok", **result})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/plaid/transactions", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_transactions():
        all_txns = load_transactions(request.uid)
        # Flatten all items' transactions
        flat = []
        for item_id, txns in all_txns.items():
            for t in txns:
                t["budget_category"] = map_category(t)
                t["item_id"] = item_id
                flat.append(t)

        # Sort newest first
        flat.sort(key=lambda x: x["date"], reverse=True)

        # Optional date filtering
        data = request.get_json(silent=True) or {}
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        if start_date:
            flat = [t for t in flat if t["date"] >= start_date]
        if end_date:
            flat = [t for t in flat if t["date"] <= end_date]

        return jsonify({"transactions": flat, "count": len(flat)})

    @app.route("/api/plaid/income")
    @verify_firebase_token_or_dev
    def api_plaid_income():
        """Detect income streams from transaction patterns."""
        all_txns = load_transactions(request.uid)
        income_txns = []
        for item_id, txns in all_txns.items():
            for t in txns:
                if t["amount"] < 0 and abs(t["amount"]) > 200:
                    t["budget_category"] = map_category(t)
                    if t["budget_category"] in ("Income", "E-Transfers In"):
                        income_txns.append(t)

        # Group by merchant/name to find recurring patterns
        patterns = defaultdict(list)
        for t in income_txns:
            key = t.get("merchant") or t.get("name", "Unknown")
            patterns[key].append(abs(t["amount"]))

        income_streams = []
        for name, amounts in patterns.items():
            income_streams.append({
                "name": name,
                "amount": round(sum(amounts) / len(amounts), 2),
                "frequency": "monthly" if len(amounts) >= 2 else "one-time",
                "occurrences": len(amounts),
                "is_active": True,
            })

        return jsonify({"income_streams": income_streams})

    @app.route("/api/plaid/disconnect/<item_id>", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_disconnect(item_id):
        tokens = load_tokens(request.uid)
        if item_id not in tokens:
            return jsonify({"error": "Account not found"}), 404

        try:
            from plaid.model.item_remove_request import ItemRemoveRequest
            access_token = decrypt(tokens[item_id]["access_token"])
            plaid_client.item_remove(ItemRemoveRequest(access_token=access_token))
        except Exception as e:
            print(f"Plaid revoke warning: {e}")

        del tokens[item_id]
        save_tokens(tokens, request.uid)

        all_txns = load_transactions(request.uid)
        all_txns.pop(item_id, None)
        save_transactions(all_txns, request.uid)

        return jsonify({"status": "disconnected"})

    # --- Plaid Webhook (no auth — called by Plaid) ---

    @app.route("/api/plaid/webhook", methods=["POST"])
    def api_plaid_webhook():
        # TODO: Verify Plaid webhook signature
        body = request.get_json(silent=True) or {}
        print(f"Plaid webhook: {body.get('webhook_type')} / {body.get('webhook_code')}")
        return jsonify({"received": True})

    # --- Phase Endpoints ---

    @app.route("/api/phase")
    @verify_firebase_token_or_dev
    def api_phase():
        from services.phase_service import (
            get_user_phase, get_unlocked_features, get_next_transition_info,
        )
        state = get_user_phase(request.uid)
        info = get_next_transition_info(request.uid)
        return jsonify({
            "phase": state.to_dict(),
            "unlocked_features": get_unlocked_features(state.current_phase),
            "transition": info,
        })

    @app.route("/api/phase/advance", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_phase_advance():
        from services.phase_service import advance_phase, get_unlocked_features
        success, message, state = advance_phase(request.uid)
        return jsonify({
            "success": success,
            "message": message,
            "phase": state.to_dict() if state else None,
            "unlocked_features": (
                get_unlocked_features(state.current_phase) if state else []
            ),
        }), 200 if success else 400

    # --- Income & Savings (Manual Mode) ---

    @app.route("/api/income", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_income():
        from models.income import IncomeEvent, ManualIncomeLog
        from services.persistence import load_all, append_one
        from services.phase_service import get_user_phase, advance_phase
        from models.user_phase import Phase

        data = request.get_json(force=True)
        log = ManualIncomeLog(
            amount=float(data.get("amount", 0)),
            date=data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
            source_description=data.get("source_description", ""),
            is_recurring=data.get("is_recurring", False),
        )
        append_one("manual_income_logs", log, user_id=request.uid)

        event = log.to_income_event()
        existing = load_all("income_events", IncomeEvent.from_dict, user_id=request.uid)
        rolling_avg = IncomeEvent.compute_rolling_average(existing)
        all_events = existing + [event]
        event.rolling_3mo_average = IncomeEvent.compute_rolling_average(all_events)
        event.income_change_flag = (
            IncomeEvent.detect_income_change(event.amount, rolling_avg)
            if rolling_avg > 0
            else None
        )
        append_one("income_events", event, user_id=request.uid)

        # Check phase advance
        state = get_user_phase(request.uid)
        phase_advanced = False
        if state.current_phase == Phase.ONBOARDING:
            success, _, _ = advance_phase(request.uid)
            phase_advanced = success

        # IIN automation reactions
        escalation_proposed = False
        rate_reduced = False
        if event.income_change_flag and state.current_phase != Phase.ONBOARDING:
            from services.automation_service import get_user_transfer, handle_income_change
            transfer = get_user_transfer(request.uid)
            if transfer:
                updated = handle_income_change(transfer, event, rolling_avg, request.uid)
                if updated.pending_escalation and updated.pending_escalation.status == "pending":
                    escalation_proposed = True
                if event.income_change_flag == "decrease":
                    rate_reduced = True

        return jsonify({
            "status": "ok",
            "income_event": event.to_dict(),
            "rolling_3mo_average": event.rolling_3mo_average,
            "income_change_flag": event.income_change_flag,
            "phase_advanced": phase_advanced,
            "escalation_proposed": escalation_proposed,
            "rate_reduced": rate_reduced,
        }), 201

    @app.route("/api/income/history")
    @verify_firebase_token_or_dev
    def api_income_history():
        from models.income import IncomeEvent
        from services.persistence import load_all
        events = load_all("income_events", IncomeEvent.from_dict, user_id=request.uid)
        return jsonify({
            "events": [e.to_dict() for e in events],
            "rolling_average": IncomeEvent.compute_rolling_average(events),
        })

    @app.route("/api/savings", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_savings():
        from models.savings import ManualSavingsLog
        from models.income import IncomeEvent
        from models.auto_transfer import AutoTransfer
        from services.persistence import load_all, append_one

        data = request.get_json(force=True)
        income_events = load_all("income_events", IncomeEvent.from_dict, user_id=request.uid)
        latest_income = income_events[-1].amount if income_events else 0

        transfers = load_all("auto_transfers", AutoTransfer.from_dict, user_id=request.uid)
        target_rate = transfers[-1].savings_rate_pct / 100.0 if transfers else 0.10

        amount = float(data.get("amount", 0))
        adherence = ManualSavingsLog.compute_adherence(amount, latest_income, target_rate)

        log = ManualSavingsLog(
            amount=amount,
            date=data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
            destination_description=data.get("destination_description", ""),
            savings_rate_at_time=target_rate,
            rate_adherence=adherence,
        )
        append_one("savings_logs", log, user_id=request.uid)

        return jsonify({"status": "ok", "savings_log": log.to_dict()}), 201

    # --- IIN (Automation) ---

    @app.route("/api/iin/config")
    @verify_firebase_token_or_dev
    def api_iin_config():
        from services.automation_service import get_user_transfer
        transfer = get_user_transfer(request.uid)
        return jsonify({"config": transfer.to_dict() if transfer else None})

    @app.route("/api/iin/config", methods=["PUT"])
    @verify_firebase_token_or_dev
    def api_iin_config_update():
        from models.auto_transfer import AutoTransfer
        from services.persistence import append_one

        data = request.get_json(force=True)
        transfer = AutoTransfer(
            user_id=request.uid,
            savings_rate_pct=float(data.get("savings_rate_pct", 10.0)),
            destination=data.get("destination", "savings"),
            is_active=data.get("is_active", True),
        )
        append_one("auto_transfers", transfer, user_id=request.uid)
        return jsonify({"success": True, "config": transfer.to_dict()})

    @app.route("/api/iin/escalation/accept", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_accept_escalation():
        from services.automation_service import accept_escalation
        transfer = accept_escalation(request.uid)
        if not transfer:
            return jsonify({"error": "No pending escalation"}), 400
        return jsonify({"success": True, "config": transfer.to_dict()})

    @app.route("/api/iin/escalation/reject", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_reject_escalation():
        from services.automation_service import reject_escalation
        transfer = reject_escalation(request.uid)
        if not transfer:
            return jsonify({"error": "No pending escalation"}), 400
        return jsonify({"success": True, "config": transfer.to_dict()})

    # --- Budget ---

    @app.route("/api/budget/summary")
    @verify_firebase_token_or_dev
    def api_budget_summary():
        all_txns = load_transactions(request.uid)
        flat = []
        for item_id, txns in all_txns.items():
            for t in txns:
                t["budget_category"] = map_category(t)
                flat.append(t)

        # Group by month
        months = defaultdict(list)
        for t in flat:
            months[t["date"][:7]].append(t)

        num_months = max(len(months), 1)

        # Category aggregation
        by_category = defaultdict(lambda: {"total": 0.0, "count": 0})
        total_income = 0
        total_expense = 0

        for t in flat:
            cat = t["budget_category"]
            if cat in ("Income", "E-Transfers In"):
                total_income += abs(t["amount"])
            elif t["amount"] > 0:
                by_category[cat]["total"] += t["amount"]
                by_category[cat]["count"] += 1
                total_expense += t["amount"]

        # Build envelope summaries
        envelopes = []
        for env in BUDGET_ENVELOPES:
            cats = []
            env_total = 0
            for cat_name in env["categories"]:
                data = by_category.get(cat_name, {"total": 0, "count": 0})
                if data["total"] > 0:
                    avg = data["total"] / num_months
                    cats.append({
                        "name": cat_name,
                        "monthly_avg": round(avg, 2),
                        "total": round(data["total"], 2),
                        "count": data["count"],
                    })
                    env_total += avg

            envelopes.append({
                "name": env["name"],
                "categories": cats,
                "subtotal": round(env_total, 2),
            })

        return jsonify({
            "monthly_income": round(total_income / num_months, 2),
            "monthly_expense": round(total_expense / num_months, 2),
            "monthly_balance": round(
                (total_income - total_expense) / num_months, 2
            ),
            "months_analyzed": num_months,
            "envelopes": envelopes,
        })

    # --- Monitoring ---

    @app.route("/api/safe-to-spend")
    @verify_firebase_token_or_dev
    def api_safe_to_spend():
        from services.monitoring_service import compute_safe_to_spend
        return jsonify(compute_safe_to_spend(request.uid))

    @app.route("/api/reviews/weekly")
    @verify_firebase_token_or_dev
    def api_weekly_review():
        from services.monitoring_service import generate_weekly_review
        return jsonify(generate_weekly_review(request.uid))

    @app.route("/api/reviews/weekly/acknowledge", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_acknowledge_review():
        from services.monitoring_service import acknowledge_review
        data = request.get_json(force=True)
        try:
            review = acknowledge_review(data.get("review_id", ""), request.uid)
            return jsonify(review)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    # --- Accountability (Phase 5+) ---

    @app.route("/api/benchmark")
    @verify_firebase_token_or_dev
    def api_benchmark():
        from services.accountability_service import get_peer_benchmark
        return jsonify(get_peer_benchmark(request.uid))

    @app.route("/api/benchmark/toggle", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_toggle_benchmark():
        from services.accountability_service import toggle_benchmark
        data = request.get_json(force=True)
        return jsonify(toggle_benchmark(request.uid, data.get("opt_in", False)))

    @app.route("/api/escalation/forecast")
    @verify_firebase_token_or_dev
    def api_escalation_forecast():
        from services.accountability_service import compute_escalation_forecast
        return jsonify(compute_escalation_forecast(
            current_rate=float(request.args.get("current_rate", 0.10)),
            proposed_rate=float(request.args.get("proposed_rate", 0.11)),
            years=int(request.args.get("years", 10)),
            monthly_income=float(request.args.get("monthly_income", 5000)),
        ))

    # --- Safeguards (Phase 5+) ---

    @app.route("/api/safeguards")
    @verify_firebase_token_or_dev
    def api_safeguards():
        from services.safeguards_service import get_user_safeguard_status
        return jsonify(get_user_safeguard_status(request.uid))

    @app.route("/api/safeguards/gamification/holiday", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_gamification_holiday():
        from services.safeguards_service import start_gamification_holiday
        return jsonify(start_gamification_holiday(request.uid))


    # --- Transaction Category Override (Function 3) ---

    @app.route("/api/transactions/<transaction_id>/category", methods=["PUT"])
    @verify_firebase_token_or_dev
    def api_override_transaction_category(transaction_id):
        """User reassigns a transaction to a different budget category."""
        body = request.get_json() or {}
        category = body.get("category")
        if not category:
            return jsonify({"error": "category required"}), 400
        overrides_file = DATA_DIR / f"category_overrides_{request.uid}.json"
        overrides = {}
        if overrides_file.exists():
            try:
                overrides = json.loads(overrides_file.read_text())
            except Exception:
                overrides = {}
        overrides[transaction_id] = {"category": category, "overridden_at": datetime.utcnow().isoformat()}
        overrides_file.write_text(json.dumps(overrides, indent=2))
        return jsonify({"transaction_id": transaction_id, "category": category, "status": "updated"})

    @app.route("/api/budget/items", methods=["POST"])
    @verify_firebase_token_or_dev
    def api_create_budget_item():
        body = request.get_json() or {}
        item = {"id": body.get("id", f"item_{datetime.utcnow().timestamp()}"), "category_id": body.get("category_id"), "name": body.get("name", "New item"), "budget_amount": float(body.get("budget_amount", 0)), "classification": body.get("classification", "TRUE_VARIABLE"), "created_at": datetime.utcnow().isoformat()}
        items_file = DATA_DIR / f"budget_items_{request.uid}.json"
        items = json.loads(items_file.read_text()) if items_file.exists() else []
        items.append(item)
        items_file.write_text(json.dumps(items, indent=2))
        return jsonify({"item": item, "status": "created"}), 201

    @app.route("/api/budget/items/<item_id>", methods=["PUT"])
    @verify_firebase_token_or_dev
    def api_update_budget_item(item_id):
        body = request.get_json() or {}
        items_file = DATA_DIR / f"budget_items_{request.uid}.json"
        items = json.loads(items_file.read_text()) if items_file.exists() else []
        for item in items:
            if item["id"] == item_id:
                if body.get("name"): item["name"] = body["name"]
                if body.get("budget_amount") is not None: item["budget_amount"] = float(body["budget_amount"])
                if body.get("classification"): item["classification"] = body["classification"]
                item["updated_at"] = datetime.utcnow().isoformat()
                break
        items_file.write_text(json.dumps(items, indent=2))
        return jsonify({"status": "updated"})

    @app.route("/api/budget/items/<item_id>", methods=["DELETE"])
    @verify_firebase_token_or_dev
    def api_delete_budget_item(item_id):
        items_file = DATA_DIR / f"budget_items_{request.uid}.json"
        items = json.loads(items_file.read_text()) if items_file.exists() else []
        items = [i for i in items if i["id"] != item_id]
        items_file.write_text(json.dumps(items, indent=2))
        return jsonify({"status": "deleted"})

    @app.route("/api/budget/items", methods=["GET"])
    @verify_firebase_token_or_dev
    def api_get_budget_items():
        items_file = DATA_DIR / f"budget_items_{request.uid}.json"
        items = json.loads(items_file.read_text()) if items_file.exists() else []
        return jsonify({"items": items, "count": len(items)})


    # --- A/B Testing (Phase 5+) ---

    @app.route("/api/experiments")
    @verify_firebase_token_or_dev
    def api_experiments():
        from services.ab_testing_service import list_experiments
        return jsonify({"experiments": list_experiments(request.args.get("status", "active"))})

    @app.route("/api/feature-flags/<flag_name>")
    @verify_firebase_token_or_dev
    def api_feature_flag(flag_name):
        from services.ab_testing_service import get_feature_flag
        return jsonify({"flag": flag_name, "value": get_feature_flag(request.uid, flag_name)})

    return app


# --- CLI ---
if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5050))
    print(f"MoneyPlanner API — http://localhost:{port}")
    print(f"Plaid: {PLAID_ENV} | Dev mode: {DEV_MODE}")
    app.run(host="0.0.0.0", port=port, debug=True)
# Tue Feb 24 11:25:59 PM EST 2026
