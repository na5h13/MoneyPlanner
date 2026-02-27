// Keel Backend — Express/TypeScript server
// OpenSpec v1.0 API endpoints for Budget Tracker (Section 21)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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
app.use(helmet({
  contentSecurityPolicy: false, // Vite SPA uses inline scripts/styles
}));
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

// Serve web SPA static files (built by Vite into web/dist)
const webDistPath = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDistPath));

// SPA fallback — serve index.html for all non-API GET requests
// This enables client-side routing (React Router)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(webDistPath, 'index.html'), (err) => {
    if (err) next(); // If index.html doesn't exist, fall through to 404
  });
});

// 404 handler (API routes that don't match)
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
