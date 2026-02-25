#!/bin/bash
# ============================================
# MoneyPlanner Pre-Build Verification Script
# Run from your project root: bash verify-setup.sh
# ============================================

PASS=0
FAIL=0
WARN=0

pass() { echo "  ✅ $1"; ((PASS++)); }
fail() { echo "  ❌ $1"; ((FAIL++)); }
warn() { echo "  ⚠️  $1"; ((WARN++)); }

echo ""
echo "=========================================="
echo "  MoneyPlanner Setup Verification"
echo "=========================================="

# -------------------------------------------
echo ""
echo "1️⃣  ROOT .env (Frontend)"
echo "------------------------------------------"
if [ -f ".env" ]; then
  pass ".env file exists"
  
  # Check each required variable
  while IFS= read -r var; do
    val=$(grep "^${var}=" .env | cut -d'=' -f2-)
    if [ -z "$val" ]; then
      fail "$var is empty"
    else
      pass "$var is set"
    fi
  done <<VARS
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
EXPO_PUBLIC_PLAID_ENV
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_PROJECT_ID
VARS

  # Optional vars (warn if missing)
  for var in EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; do
    val=$(grep "^${var}=" .env | cut -d'=' -f2-)
    if [ -z "$val" ]; then
      warn "$var is empty (optional — iOS/analytics)"
    else
      pass "$var is set"
    fi
  done
else
  fail ".env file not found in project root"
fi

# -------------------------------------------
echo ""
echo "2️⃣  BACKEND .env"
echo "------------------------------------------"
if [ -f "backend/.env" ]; then
  pass "backend/.env file exists"
  
  while IFS= read -r var; do
    val=$(grep "^${var}=" backend/.env | cut -d'=' -f2-)
    if [ -z "$val" ]; then
      fail "$var is empty"
    else
      pass "$var is set"
    fi
  done <<VARS
PLAID_CLIENT_ID
PLAID_SECRET
PLAID_ENV
FIREBASE_SERVICE_ACCOUNT
FIREBASE_PROJECT_ID
ENCRYPTION_KEY
PORT
ALLOWED_ORIGINS
VARS
else
  fail "backend/.env file not found"
fi

# -------------------------------------------
echo ""
echo "3️⃣  Native Config Files"
echo "------------------------------------------"

# Firebase service account
if [ -f "backend/config/firebase-service-account.json" ]; then
  pass "firebase-service-account.json exists"
  # Validate it's proper JSON with expected fields
  if command -v python3 &> /dev/null; then
    result=$(python3 -c "
import json, sys
try:
    with open('backend/config/firebase-service-account.json') as f:
        data = json.load(f)
    required = ['type','project_id','private_key','client_email']
    missing = [k for k in required if k not in data]
    if missing:
        print(f'MISSING_FIELDS:{','.join(missing)}')
    elif data.get('type') != 'service_account':
        print('WRONG_TYPE')
    else:
        print('OK')
except json.JSONDecodeError:
    print('INVALID_JSON')
" 2>&1)
    if [ "$result" = "OK" ]; then
      pass "firebase-service-account.json is valid"
    elif [[ "$result" == MISSING_FIELDS* ]]; then
      fail "firebase-service-account.json missing fields: ${result#MISSING_FIELDS:}"
    elif [ "$result" = "INVALID_JSON" ]; then
      fail "firebase-service-account.json is not valid JSON"
    elif [ "$result" = "WRONG_TYPE" ]; then
      fail "firebase-service-account.json 'type' should be 'service_account'"
    fi
  fi
else
  fail "backend/config/firebase-service-account.json not found"
fi

# Google Services (Android)
if [ -f "google-services.json" ]; then
  pass "google-services.json exists (Android)"
else
  fail "google-services.json not found in project root"
fi

# Google Services (iOS)
if [ -f "GoogleService-Info.plist" ]; then
  pass "GoogleService-Info.plist exists (iOS)"
else
  warn "GoogleService-Info.plist not found (needed for iOS only)"
fi

# -------------------------------------------
echo ""
echo "4️⃣  .gitignore Safety Check"
echo "------------------------------------------"
if [ -f ".gitignore" ]; then
  for pattern in ".env" "firebase-service-account" "google-services.json" "GoogleService-Info.plist"; do
    if grep -q "$pattern" .gitignore 2>/dev/null; then
      pass "$pattern is in .gitignore"
    else
      fail "$pattern is NOT in .gitignore — secrets could leak!"
    fi
  done
else
  fail ".gitignore not found"
fi

# -------------------------------------------
echo ""
echo "5️⃣  Connectivity Checks"
echo "------------------------------------------"

# Check Railway backend
API_URL=$(grep "^EXPO_PUBLIC_API_BASE_URL=" .env 2>/dev/null | cut -d'=' -f2-)
if [ -n "$API_URL" ]; then
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL" 2>/dev/null)
  if [ "$status" -ge 200 ] && [ "$status" -lt 500 ]; then
    pass "Railway backend reachable (HTTP $status)"
  else
    warn "Railway backend returned HTTP $status (may not be deployed yet)"
  fi
else
  fail "EXPO_PUBLIC_API_BASE_URL not set, can't check backend"
fi

# Check Firebase project
PROJECT_ID=$(grep "^EXPO_PUBLIC_FIREBASE_PROJECT_ID=" .env 2>/dev/null | cut -d'=' -f2-)
if [ -n "$PROJECT_ID" ]; then
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${PROJECT_ID}.firebaseio.com" 2>/dev/null)
  if [ "$status" -ge 200 ] && [ "$status" -lt 500 ]; then
    pass "Firebase project reachable"
  else
    warn "Firebase returned HTTP $status"
  fi
fi

# -------------------------------------------
echo ""
echo "6️⃣  Dependencies & Tools"
echo "------------------------------------------"
for cmd in node npm npx python3; do
  if command -v $cmd &> /dev/null; then
    ver=$($cmd --version 2>&1 | head -1)
    pass "$cmd installed ($ver)"
  else
    fail "$cmd not found"
  fi
done

# Check Expo CLI
if npx expo --version &> /dev/null 2>&1; then
  pass "Expo CLI available"
else
  warn "Expo CLI not found (will install on first npx expo start)"
fi

# Check if node_modules exist
if [ -d "node_modules" ]; then
  pass "node_modules exists (dependencies installed)"
else
  warn "node_modules not found — run 'npm install' before building"
fi

if [ -d "backend/node_modules" ] || [ -f "backend/requirements.txt" ]; then
  pass "Backend dependencies present"
else
  warn "Backend dependencies may need installing"
fi

# -------------------------------------------
echo ""
echo "=========================================="
echo "  RESULTS"
echo "=========================================="
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  ⚠️  Warnings: $WARN"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🚀 All critical checks passed! Ready to build."
else
  echo "  🔧 Fix the $FAIL failed items above before building."
fi
echo ""
