// Firebase Admin SDK initialization
// Supports: base64 env var, JSON string env var, file path, DEV_MODE fallback

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let initialized = false;

export function initFirebase(): void {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'money-planner-ca2c0';

  // Option 1: Base64-encoded service account (production — Railway)
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64Key) {
    const json = Buffer.from(base64Key, 'base64').toString('utf8');
    const credential = admin.credential.cert(JSON.parse(json));
    admin.initializeApp({ credential, projectId });
    initialized = true;
    console.log('Firebase initialized from base64 env var');
    return;
  }

  // Option 2: JSON string env var
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonStr) {
    const credential = admin.credential.cert(JSON.parse(jsonStr));
    admin.initializeApp({ credential, projectId });
    initialized = true;
    console.log('Firebase initialized from JSON env var');
    return;
  }

  // Option 3: File path (local dev)
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH
    || process.env.FIREBASE_SERVICE_ACCOUNT
    || 'config/firebase-service-account.json';
  const fullPath = path.resolve(__dirname, '../../', keyPath);

  if (fs.existsSync(fullPath)) {
    const credential = admin.credential.cert(fullPath);
    admin.initializeApp({ credential, projectId });
    initialized = true;
    console.log(`Firebase initialized from file: ${keyPath}`);
    return;
  }

  // Option 4: DEV_MODE without Firebase
  if (process.env.DEV_MODE === 'true') {
    console.warn('Firebase not configured — running in DEV_MODE with user-1 fallback');
    initialized = true;
    return;
  }

  throw new Error('Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_SERVICE_ACCOUNT_KEY_PATH.');
}

export function getFirestore(): admin.firestore.Firestore {
  if (!initialized) initFirebase();
  return admin.firestore();
}

export function getAuth(): admin.auth.Auth {
  if (!initialized) initFirebase();
  return admin.auth();
}
