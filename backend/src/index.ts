// Keel Backend — Express/TypeScript server
// OpenSpec v1.0 API endpoints for Budget Tracker (Section 21)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initFirebase, getFirestore } from './services/firebaseAdmin';
import { authMiddleware } from './middleware/auth';

import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import budgetRoutes from './routes/budget';
import accountRoutes from './routes/accounts';
import settingsRoutes from './routes/settings';
import webhookRoutes from './routes/webhooks';
import classificationRoutes from './routes/classifications';

const app = express();
const PORT = parseInt(process.env.PORT || '5050', 10);

// Initialize Firebase Admin
initFirebase();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS === '*'
    ? '*'
    : (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()),
  credentials: true,
}));
app.use(express.json());

// Health check (no auth) — includes Firestore connectivity test
app.get('/health', async (_req, res) => {
  let firestoreStatus = 'unknown';
  try {
    const db = getFirestore();
    await db.collection('_health').doc('ping').set({ ts: new Date().toISOString() });
    firestoreStatus = 'ok';
  } catch (err: any) {
    firestoreStatus = `error: ${err?.message || 'unknown'}`;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    firestore: firestoreStatus,
    firestore_db: process.env.FIRESTORE_DATABASE_ID || '(default)',
    has_firebase_key: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
    plaid_env: process.env.PLAID_ENV || 'not set',
    has_plaid_client_id: !!process.env.PLAID_CLIENT_ID,
    has_plaid_secret: !!process.env.PLAID_SECRET,
    has_encryption_key: !!process.env.ENCRYPTION_KEY,
  });
});

// TEMPORARY: Migrate bad flat "plaid_items.XXX" keys to nested plaid_items object
app.post('/debug/migrate', async (_req, res) => {
  try {
    const db = getFirestore();
    const admin = require('firebase-admin');
    const FieldPath = admin.firestore.FieldPath;
    const FieldValue = admin.firestore.FieldValue;
    const usersSnap = await db.collection('users').get();
    const results: any[] = [];

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const flatKeys = Object.keys(data).filter(k => k.startsWith('plaid_items.'));

      if (flatKeys.length === 0) {
        results.push({ userId: userDoc.id, status: 'no flat keys found' });
        continue;
      }

      // Build proper nested plaid_items from flat keys
      const nestedItems: Record<string, any> = data.plaid_items || {};
      for (const flatKey of flatKeys) {
        const itemId = flatKey.replace('plaid_items.', '');
        nestedItems[itemId] = data[flatKey];
      }

      // Step 1: Write the correct nested structure
      await userDoc.ref.set({ plaid_items: nestedItems }, { merge: true });

      // Step 2: Delete each flat key using FieldPath (literal dot-containing field name)
      for (const flatKey of flatKeys) {
        await userDoc.ref.update(new FieldPath(flatKey), FieldValue.delete());
      }

      results.push({
        userId: userDoc.id,
        status: 'migrated',
        migratedKeys: flatKeys,
        itemCount: Object.keys(nestedItems).length,
      });
    }

    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err?.message, stack: err?.stack?.split('\n').slice(0, 3) });
  }
});

// TEMPORARY: Trigger sync for a user and return detailed results
app.post('/debug/sync/:userId', async (req, res) => {
  try {
    const { syncUserTransactions } = require('./services/syncService');
    const userId = (req.params as any).userId;
    console.log('DEBUG sync for user:', userId);
    const result = await syncUserTransactions(userId);
    res.json({ userId, result });
  } catch (err: any) {
    res.status(500).json({
      error: err?.message,
      code: err?.response?.data?.error_code,
      plaidError: err?.response?.data,
      stack: err?.stack?.split('\n').slice(0, 5),
    });
  }
});

// TEMPORARY DEBUG — traces accounts pipeline step by step (remove after fixing)
app.get('/debug/accounts', async (_req, res) => {
  const steps: any[] = [];
  try {
    const db = getFirestore();

    // Step 1: List all user docs
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map(d => d.id);
    steps.push({ step: 1, desc: 'List users', users, count: users.length });

    if (users.length === 0) {
      res.json({ steps, error: 'No users in Firestore' });
      return;
    }

    // Step 2: For each user, check plaid_items
    for (const userId of users) {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const plaidItems = userData?.plaid_items || {};
      const itemIds = Object.keys(plaidItems);

      steps.push({
        step: 2,
        desc: 'User plaid_items',
        userId,
        hasPlaidItems: itemIds.length > 0,
        itemIds,
        userDataKeys: Object.keys(userData || {}),
      });

      // Step 3: For each item, try decrypt + Plaid call
      for (const itemId of itemIds) {
        const itemData = plaidItems[itemId];
        const tokenPreview = itemData.access_token
          ? `${itemData.access_token.substring(0, 20)}...`
          : '(missing)';

        steps.push({
          step: '3a',
          desc: 'Item data',
          itemId,
          institution_name: itemData.institution_name,
          has_access_token: !!itemData.access_token,
          token_preview: tokenPreview,
          cursor: itemData.cursor,
          last_sync: itemData.last_sync,
        });

        // Step 3b: Try decrypt
        try {
          const { decrypt } = require('./utils/encryption');
          const decrypted = decrypt(itemData.access_token);
          steps.push({
            step: '3b',
            desc: 'Decrypt OK',
            itemId,
            decrypted_starts_with: decrypted.substring(0, 15) + '...',
          });

          // Step 3c: Try Plaid getAccounts
          try {
            const plaid = require('./services/plaidService');
            const accounts = await plaid.getAccounts(decrypted);
            steps.push({
              step: '3c',
              desc: 'Plaid getAccounts OK',
              itemId,
              accountCount: accounts.length,
              accounts: accounts.map((a: any) => ({
                id: a.account_id,
                name: a.name,
                type: a.type,
                mask: a.mask,
              })),
            });
          } catch (plaidErr: any) {
            steps.push({
              step: '3c',
              desc: 'Plaid getAccounts FAILED',
              itemId,
              error: plaidErr?.message,
              plaidError: plaidErr?.response?.data,
            });
          }
        } catch (decryptErr: any) {
          steps.push({
            step: '3b',
            desc: 'Decrypt FAILED',
            itemId,
            error: decryptErr?.message,
          });
        }
      }

      // Step 4: Check transactions collection
      const txnSnap = await db.collection('users').doc(userId).collection('transactions').get();
      steps.push({
        step: 4,
        desc: 'Transaction count',
        userId,
        transactionCount: txnSnap.size,
      });
    }

    res.json({ steps });
  } catch (err: any) {
    steps.push({ step: 'fatal', error: err?.message, stack: err?.stack?.split('\n').slice(0, 3) });
    res.json({ steps });
  }
});

// Plaid webhooks — no auth (Plaid sends these)
app.use('/api/v1/webhooks', webhookRoutes);

// All API routes require auth
app.use('/api/v1/transactions', authMiddleware, transactionRoutes);
app.use('/api/v1/categories', authMiddleware, categoryRoutes);
app.use('/api/v1/budget', authMiddleware, budgetRoutes);
app.use('/api/v1/accounts', authMiddleware, accountRoutes);
app.use('/api/v1/settings', authMiddleware, settingsRoutes);
app.use('/api/v1/classifications', authMiddleware, classificationRoutes);

// CSV export is under settings
app.post('/api/v1/export', authMiddleware, async (req, res) => {
  // Forward to settings export handler
  const settingsRouter = require('./routes/settings').default;
  settingsRouter.handle(req, res, () => {});
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Keel backend running on port ${PORT}`);
  console.log(`DEV_MODE: ${process.env.DEV_MODE === 'true'}`);
});

export default app;
