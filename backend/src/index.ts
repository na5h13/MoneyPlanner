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

// TEMPORARY DEBUG — simulate exact budget API response (remove after fixing)
app.get('/debug/budget/:userId', async (req, res) => {
  try {
    const db = getFirestore();
    const { ensureCategories: ec } = require('./services/ensureCategories');
    const userId = (req.params as any).userId;
    const period = (req.query.period as string) || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();
    const [year, month] = period.split('-').map(Number);

    // Step 1: Categories
    await ec(userId);
    const catSnap = await db.collection('users').doc(userId).collection('categories').orderBy('sort_order').get();
    const categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Step 2: Budget targets
    let targets: any[] = [];
    try {
      const targetSnap = await db.collection('users').doc(userId).collection('budget_targets')
        .where('period_start', '==', period).get();
      targets = targetSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e: any) { targets = [{ error: e.message }]; }

    // Step 3: Budget items
    let items: any[] = [];
    try {
      const itemSnap = await db.collection('users').doc(userId).collection('budget_items')
        .where('is_active', '==', true).orderBy('sort_order').get();
      items = itemSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e: any) { items = [{ error: e.message }]; }

    // Step 4: Transactions for this month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    const txnSnap = await db.collection('users').doc(userId).collection('transactions')
      .where('date', '>=', startDate).where('date', '<', endDate).get();
    const transactions = txnSnap.docs.map(d => d.data());

    // Step 5: Compute like the budget endpoint does
    const spentByCategory = new Map<string, number>();
    let totalIncome = 0;
    let totalCommitted = 0;
    for (const txn of transactions) {
      const amt = Math.abs(txn.amount);
      if (txn.is_income) {
        totalIncome += amt;
        continue;
      }
      const catId = txn.category_id || 'uncategorized';
      spentByCategory.set(catId, (spentByCategory.get(catId) || 0) + amt);
      totalCommitted += amt;
    }

    // Show what's actually happening
    const spentMap = Object.fromEntries(spentByCategory);
    const summary = {
      income: totalIncome,
      committed: totalCommitted,
      safe_to_spend: totalIncome - totalCommitted,
    };

    // Also show raw amounts for inspection
    const amountAnalysis = transactions.slice(0, 15).map(t => ({
      merchant: t.display_merchant,
      amount: t.amount,
      is_income: t.is_income,
      abs_amount: Math.abs(t.amount),
      plaid_sign: t.amount < 0 ? 'negative (money IN per Plaid)' : 'positive (money OUT per Plaid)',
    }));

    res.json({
      period,
      categoryCount: categories.length,
      targetCount: targets.length,
      itemCount: items.length,
      itemsData: items,
      transactionCount: transactions.length,
      summary,
      spentByCategory: spentMap,
      amountAnalysis,
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
