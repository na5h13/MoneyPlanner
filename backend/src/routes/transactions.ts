// Transaction Routes — OpenSpec Section 21, Function 2
// GET  /api/v1/transactions       — list (filters: month, category, search, type)
// GET  /api/v1/transactions/:id   — single transaction
// PUT  /api/v1/transactions/:id/category — reassign category
// POST /api/v1/transactions/sync  — trigger Plaid sync

import { Router, Request, Response } from 'express';
import { getFirestore } from '../services/firebaseAdmin';
import { normalizeMerchant } from '../services/categorization';
import { syncUserTransactions } from '../services/syncService';

const router = Router();

// GET /api/v1/transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.uid;
    const { month, category, search, type } = req.query;

    let query: FirebaseFirestore.Query = db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('date', 'desc');

    // Month filter: YYYY-MM
    if (month && typeof month === 'string') {
      const [year, m] = month.split('-').map(Number);
      const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
      const endMonth = m === 12 ? 1 : m + 1;
      const endYear = m === 12 ? year + 1 : year;
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      query = query.where('date', '>=', startDate).where('date', '<', endDate);
    }

    const snap = await query.get();
    let transactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Category filter
    if (category && typeof category === 'string') {
      transactions = transactions.filter((t: any) => t.category_id === category);
    }

    // Type filter: income | pending
    if (type === 'income') {
      transactions = transactions.filter((t: any) => t.is_income === true);
    } else if (type === 'pending') {
      transactions = transactions.filter((t: any) => t.pending === true);
    }

    // Search filter (merchant name, transaction name)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter((t: any) =>
        (t.display_merchant || '').toLowerCase().includes(searchLower) ||
        (t.name || '').toLowerCase().includes(searchLower)
      );
    }

    res.json({ data: transactions });
  } catch (err) {
    console.error('GET /transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/v1/transactions/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const doc = await db
      .collection('users')
      .doc(req.uid)
      .collection('transactions')
      .doc(req.params.id as string)
      .get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json({ data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('GET /transactions/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// PUT /api/v1/transactions/:id/category
router.put('/:id/category', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.uid;
    const { category_id, apply_to_all } = req.body;

    if (!category_id) {
      res.status(400).json({ error: 'category_id is required' });
      return;
    }

    const txnRef = db.collection('users').doc(userId).collection('transactions').doc(req.params.id as string);
    const txnDoc = await txnRef.get();

    if (!txnDoc.exists) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const txnData = txnDoc.data()!;

    // Update this transaction
    await txnRef.update({
      category_id,
      category_confidence: 1.0,
      categorized_at: new Date().toISOString(),
      categorized_by: 'user',
    });

    // "Apply to all" — create a CategoryRule and update matching transactions
    if (apply_to_all && txnData.display_merchant) {
      const normalizedMerchant = normalizeMerchant(txnData.display_merchant);

      // Create/update rule
      const rulesRef = db.collection('users').doc(userId).collection('category_rules');
      const existing = await rulesRef
        .where('normalized_merchant', '==', normalizedMerchant)
        .limit(1)
        .get();

      if (existing.empty) {
        await rulesRef.add({
          normalized_merchant: normalizedMerchant,
          category_id,
          created_from_txn: req.params.id as string,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        await existing.docs[0].ref.update({
          category_id,
          updated_at: new Date().toISOString(),
        });
      }

      // Update all transactions from this merchant
      const matchingSnap = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('display_merchant', '==', normalizedMerchant)
        .get();

      const batch = db.batch();
      for (const doc of matchingSnap.docs) {
        batch.update(doc.ref, {
          category_id,
          category_confidence: 1.0,
          categorized_at: new Date().toISOString(),
          categorized_by: 'user',
        });
      }
      await batch.commit();
    }

    res.json({ data: { id: req.params.id as string, category_id } });
  } catch (err) {
    console.error('PUT /transactions/:id/category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// POST /api/v1/transactions/sync
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncUserTransactions(req.uid);
    if (result.errors.length > 0 && result.synced === 0) {
      res.status(400).json({ error: result.errors[0] });
      return;
    }
    res.json({ data: { synced: result.synced } });
  } catch (err) {
    console.error('POST /transactions/sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
