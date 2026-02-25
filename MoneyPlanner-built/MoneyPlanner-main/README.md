# MoneyPlanner

Automation-first budgeting app with Income Increase Neutralization (IIN).

**Core principle:** Less interaction with your money = healthier finances. MoneyPlanner automates budgeting through bank connections and intelligently redirects income increases before lifestyle inflation takes hold.

## Architecture

```
┌─────────────────────┐      ┌────────────────────┐
│   React Native Expo │      │   Flask Backend     │
│   (Mobile App)      │─────▶│   (Railway)         │
│                     │      │                     │
│ • Firebase Auth     │      │ • Firebase Admin    │
│ • Plaid Link SDK    │      │ • Plaid API         │
│ • Zustand stores    │      │ • IIN Engine        │
│ • Glassmorphism UI  │      │ • Budget automation │
└─────────────────────┘      └────────────────────┘
         │                           │
         ▼                           ▼
  Firebase Auth               JSON persistence
  (auth only,                 (→ PostgreSQL)
   no Firestore)
```

## Tech Stack

**Frontend:** React Native + Expo SDK 52, TypeScript, Zustand, expo-router
**Backend:** Flask + Python 3.12, gunicorn, plaid-python, firebase-admin
**Auth:** Firebase Authentication (Google, Email/Password, Apple)
**Banking:** Plaid (sandbox → production)
**Deploy:** Railway (backend), EAS Build (mobile)

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/na5h13/MoneyPlanner.git
cd MoneyPlanner
npm install
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in PLAID_CLIENT_ID, PLAID_SECRET, ENCRYPTION_KEY
# Place firebase-service-account.json in backend/config/
python app.py
```

### 3. Frontend Setup
```bash
# In project root
cp .env.example .env
# Fill in EXPO_PUBLIC_* values
npx expo start
```

### 4. Railway Deploy
```bash
# Push to GitHub → Railway auto-deploys
# Set environment variables in Railway dashboard:
# PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV,
# FIREBASE_SERVICE_ACCOUNT_JSON (paste entire JSON),
# FIREBASE_PROJECT_ID, ENCRYPTION_KEY, PORT
```

## Project Structure

```
MoneyPlanner/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login, onboarding
│   ├── (tabs)/            # Dashboard, budget, IIN, settings
│   └── (modals)/          # Connect bank, IIN setup/review
├── src/
│   ├── services/          # API clients (auth, plaid, iin, budget)
│   ├── stores/            # Zustand state management
│   ├── components/        # UI components
│   ├── theme/             # Glassmorphism design system
│   └── types/             # TypeScript interfaces
├── backend/               # Flask API (deployed to Railway)
│   ├── app.py             # Main app with all routes
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   └── config/            # Firebase service account (gitignored)
├── railway.json           # Railway deployment config
└── nixpacks.toml          # Railway build config
```

## Key Features

- **IIN (Income Increase Neutralization):** Automatically detects income changes and proposes savings rate adjustments to prevent lifestyle inflation
- **Automation-first:** Bank connections via Plaid auto-categorize spending — minimal manual input
- **Green-only UI:** Glassmorphism dark theme with green accents — less red/yellow anxiety
- **Phase-based onboarding:** Onboarding → Observation → Budget → Automation → Optimization
- **Dev mode:** `DEV_MODE=true` bypasses Firebase auth and accelerates phase timing for rapid development
