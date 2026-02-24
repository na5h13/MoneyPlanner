// backend/src/services/firebaseAdmin.ts
// Firebase Admin SDK — server-side auth verification and Firestore access

import * as admin from 'firebase-admin';

let initialized = false;

export function initFirebaseAdmin(): void {
  if (initialized) return;

  // Option A: Service account key file (local dev)
  // Option B: Base64-encoded key (Railway / production)
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

  if (base64Key) {
    const serviceAccount = JSON.parse(
      Buffer.from(base64Key, 'base64').toString('utf8'),
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else if (keyPath) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // Railway / GCP may auto-detect credentials
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  initialized = true;
}

export const db = () => admin.firestore();
export const adminAuth = () => admin.auth();
export default admin;
