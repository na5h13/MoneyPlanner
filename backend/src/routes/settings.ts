// Settings Routes — OpenSpec Section 21, Function 4
// GET  /api/v1/settings — get user preferences
// PUT  /api/v1/settings — update preferences
// POST /api/v1/export   — generate CSV export

import { Router, Request, Response } from 'express';
import { getFirestore } from '../services/firebaseAdmin';

const router = Router();

const DEFAULT_SETTINGS = {
  budget_period: 'monthly',
  currency: 'USD',
  notifications_enabled: true,
};

// GET /api/v1/settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('users').doc(req.uid).collection('settings').doc('preferences').get();

    if (!doc.exists) {
      // Return defaults
      res.json({ data: { user_id: req.uid, ...DEFAULT_SETTINGS } });
      return;
    }

    res.json({ data: { user_id: req.uid, ...doc.data() } });
  } catch (err) {
    console.error('GET /settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/v1/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (req.body.budget_period !== undefined) updates.budget_period = req.body.budget_period;
    if (req.body.currency !== undefined) updates.currency = req.body.currency;
    if (req.body.notifications_enabled !== undefined) updates.notifications_enabled = req.body.notifications_enabled;

    await db.collection('users').doc(req.uid).collection('settings').doc('preferences').set(
      updates,
      { merge: true }
    );

    res.json({ data: { user_id: req.uid, ...updates } });
  } catch (err) {
    console.error('PUT /settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/v1/export
router.post('/export', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.uid;

    // Get all transactions
    const txnSnap = await db
      .collection('users').doc(userId).collection('transactions')
      .orderBy('date', 'desc')
      .get();

    // Get categories for name lookup
    const catSnap = await db
      .collection('users').doc(userId).collection('categories')
      .get();
    const catMap = new Map(catSnap.docs.map(d => [d.id, d.data().name]));

    // Build CSV
    const header = 'Date,Merchant,Amount,Category,Pending,Account ID\n';
    const rows = txnSnap.docs.map(doc => {
      const t = doc.data();
      const amountDollars = (t.amount / 100).toFixed(2);
      const categoryName = catMap.get(t.category_id) || 'Uncategorized';
      return `${t.date},"${(t.display_merchant || t.name || '').replace(/"/g, '""')}",${amountDollars},"${categoryName}",${t.pending},${t.account_id}`;
    }).join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=keel-export-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('POST /export error:', err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

export default router;
