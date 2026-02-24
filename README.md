# MoneyPlanner

Automation-first budgeting app with Income Increase Neutralization (IIN). Built with the philosophy that **less interaction with money management = better financial health**.

## Architecture

```
MoneyPlanner/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login, onboarding
│   ├── (tabs)/             # Main app: Home, Budget, IIN, Settings
│   └── (modals)/           # Connect bank, IIN setup/review
├── src/
│   ├── components/         # UI components (glassmorphism design system)
│   ├── services/           # Firebase, Auth, Plaid, API client
│   ├── stores/             # Zustand state (auth, budget, IIN)
│   ├── hooks/              # Custom React hooks
│   ├── theme/              # Design tokens (green-only palette, glass effects)
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Helpers
│   └── constants/          # App constants
├── backend/                # Railway-deployed Express API
│   └── src/
│       ├── routes/         # Plaid, IIN endpoints
│       ├── middleware/      # Firebase auth verification
│       ├── services/       # Plaid client, Firebase Admin
│       └── utils/          # Encryption
└── assets/                 # App icons, splash screen
```

## Tech Stack

- **Mobile**: Expo (React Native) → iOS, Android, Web
- **State**: Zustand
- **Auth**: Firebase Auth + Google Sign-In
- **Database**: Firestore
- **Banking**: Plaid (transactions, income detection)
- **Backend**: Express on Railway
- **Design**: Glassmorphism, green-only color scheme, dark theme

## Setup

### 1. Clone and install

```bash
git clone https://github.com/na5h13/MoneyPlanner.git
cd MoneyPlanner
npm install
cd backend && npm install && cd ..
```

### 2. Configure environment variables

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Fill in both `.env` files — see comments in each file for where to find each value.

### 3. Firebase setup

- Place `google-services.json` (Android) in project root
- Place `GoogleService-Info.plist` (iOS) in project root
- Place `serviceAccountKey.json` in `backend/`
- All three files are gitignored

### 4. Run

```bash
# Mobile app
npm run dev

# Backend (separate terminal)
cd backend && npm run dev
```

## Environment Variables Checklist

### App (.env)
- [ ] `FIREBASE_API_KEY`
- [ ] `FIREBASE_AUTH_DOMAIN`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_STORAGE_BUCKET`
- [ ] `FIREBASE_MESSAGING_SENDER_ID`
- [ ] `FIREBASE_APP_ID`
- [ ] `GOOGLE_WEB_CLIENT_ID`
- [ ] `GOOGLE_ANDROID_CLIENT_ID`
- [ ] `GOOGLE_IOS_CLIENT_ID`
- [ ] `PLAID_ENV`
- [ ] `API_BASE_URL`

### Backend (backend/.env)
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` or `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64`
- [ ] `PLAID_CLIENT_ID`
- [ ] `PLAID_SECRET`
- [ ] `PLAID_ENV`
- [ ] `PLAID_WEBHOOK_URL`
- [ ] `ENCRYPTION_KEY` (generate: `openssl rand -hex 32`)

### Firebase files
- [ ] `google-services.json` (root)
- [ ] `GoogleService-Info.plist` (root)
- [ ] `serviceAccountKey.json` (backend/)
