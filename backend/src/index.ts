// backend/src/index.ts
// MoneyPlanner API Server — deployed on Railway
// Handles: Plaid token exchange, webhooks, income detection, IIN logic

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initFirebaseAdmin } from './services/firebaseAdmin';
import { plaidRouter } from './routes/plaid';
import { iinRouter } from './routes/iin';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
initFirebaseAdmin();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true,
}));
app.use(express.json());

// Health check (no auth needed)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Plaid webhook (uses Plaid's own verification, not our auth)
app.post('/api/plaid/webhook', plaidRouter);

// Protected routes (require Firebase auth token)
app.use('/api', authMiddleware);
app.use('/api/plaid', plaidRouter);
app.use('/api/iin', iinRouter);

app.listen(PORT, () => {
  console.log(`MoneyPlanner API running on port ${PORT}`);
});

export default app;
