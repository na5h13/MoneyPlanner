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

// TEMPORARY DEBUG — trace budget pipeline (remove after fixing)
app.get('/debug/budget/:userId', async (req, res) => {
  try {
    const db = getFirestore();
    const userId = (req.params as any).userId;
    const period = (req.query.period as string) || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();

    // 1. Categories
    const catSnap = await db.collection('users').doc(userId).collection('categories').get();
    const categories = catSnap.docs.map(d => ({ id: d.id, name: (d.data() as any).name }));

    // 2. Transactions — check a few months
    const months = ['2026-02', '2026-01', '2025-12', '2025-11'];
    const txnByMonth: Record<string, any> = {};
    for (const m of months) {
      const [y, mo] = m.split('-').map(Number);
      const startDate = `${y}-${String(mo).padStart(2, '0')}-01`;
      const endMonth = mo === 12 ? 1 : mo + 1;
      const endYear = mo === 12 ? y + 1 : y;
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      const snap = await db.collection('users').doc(userId).collection('transactions')
        .where('date', '>=', startDate).where('date', '<', endDate).get();
      const txns = snap.docs.map(d => d.data());
      txnByMonth[m] = {
        count: txns.length,
        totalAmount: txns.reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0),
        sampleCategoryIds: txns.slice(0, 5).map((t: any) => t.category_id),
        sampleDates: txns.slice(0, 3).map((t: any) => t.date),
        incomeCount: txns.filter((t: any) => t.is_income).length,
        expenseCount: txns.filter((t: any) => !t.is_income).length,
      };
    }

    // 3. Check all transactions regardless of date
    const allSnap = await db.collection('users').doc(userId).collection('transactions').limit(10).get();
    const sampleTxns = allSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        date: data.date,
        amount: data.amount,
        category_id: data.category_id,
        is_income: data.is_income,
        display_merchant: data.display_merchant,
      };
    });

    res.json({
      userId,
      requestedPeriod: period,
      categoryCount: categories.length,
      categories: categories.slice(0, 8),
      transactionsByMonth: txnByMonth,
      sampleTransactions: sampleTxns,
      totalTransactions: (await db.collection('users').doc(userId).collection('transactions').get()).size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message, stack: err?.stack?.split('\n').slice(0, 5) });
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
