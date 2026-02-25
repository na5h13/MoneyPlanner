// Budget Routes — OpenSpec Section 21, Function 5
// GET    /api/v1/budget               — budget display for current period
// GET    /api/v1/budget?period=YYYY-MM — budget for specific period
// POST   /api/v1/budget/targets       — set budget target
// PUT    /api/v1/budget/targets/:id   — update target
// GET    /api/v1/budget/suggestions   — system-suggested targets (3-month avg, rounded $25)
// POST   /api/v1/budget/items         — create line item
// PUT    /api/v1/budget/items/:id     — update line item
// DELETE /api/v1/budget/items/:id     — delete line item
// PUT    /api/v1/budget/items/reorder — batch reorder

import { Router, Request, Response } from 'express';
import { getFirestore } from '../services/firebaseAdmin';

const router = Router();

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/v1/budget
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.uid;
    const period = (req.query.period as string) || currentPeriod();
    const [year, month] = period.split('-').map(Number);

    // Get categories
    const catSnap = await db
      .collection('users').doc(userId).collection('categories')
      .orderBy('sort_order')
      .get();
    const categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get budget targets for this period
    const targetSnap = await db
      .collection('users').doc(userId).collection('budget_targets')
      .where('period_start', '==', period)
      .get();
    const targets = new Map(targetSnap.docs.map(d => [d.data().category_id, { id: d.id, ...d.data() }]));

    // Get line items for active categories
    const itemSnap = await db
      .collection('users').doc(userId).collection('budget_items')
      .where('is_active', '==', true)
      .orderBy('sort_order')
      .get();
    const allItems = itemSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get transactions for this month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const txnSnap = await db
      .collection('users').doc(userId).collection('transactions')
      .where('date', '>=', startDate)
      .where('date', '<', endDate)
      .get();
    const transactions = txnSnap.docs.map(d => d.data());

    // Compute spending per category (cents)
    const spentByCategory = new Map<string, number>();
    for (const txn of transactions) {
      if (txn.is_income) continue; // Don't count income in budget spending
      const catId = txn.category_id || 'uncategorized';
      spentByCategory.set(catId, (spentByCategory.get(catId) || 0) + Math.abs(txn.amount));
    }

    // Compute trending per category
    const now = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = now.getFullYear() === year && now.getMonth() + 1 === month
      ? now.getDate()
      : daysInMonth; // Past month: use full days
    const daysElapsed = Math.max(today, 1);

    // Build display data
    const budgetDisplay = categories.map((cat: any) => {
      const target = targets.get(cat.id) as any;
      const items = allItems.filter((item: any) => item.category_id === cat.id);
      const spent = spentByCategory.get(cat.id) || 0;
      const targetAmount = target?.target_amount || 0;

      // Trending: daily run-rate projection
      const projected = daysElapsed >= 3
        ? Math.round((spent / daysElapsed) * daysInMonth)
        : 0;

      let status: string;
      if (!targetAmount) {
        status = 'NO_TARGET';
      } else if (daysElapsed < 3) {
        status = 'INSUFFICIENT_DATA';
      } else if (projected <= targetAmount) {
        status = 'ON_TRACK';
      } else if (projected <= targetAmount * 1.10) {
        status = 'WATCH';
      } else {
        status = 'OVER';
      }

      return {
        category: cat,
        target: target || null,
        line_items: items,
        spent,
        trending: {
          category_id: cat.id,
          spent_so_far: spent,
          projected,
          target: targetAmount,
          status,
          days_elapsed: daysElapsed,
          days_in_period: daysInMonth,
        },
        is_collapsed: false,
      };
    });

    res.json({ data: budgetDisplay });
  } catch (err) {
    console.error('GET /budget error:', err);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// POST /api/v1/budget/targets
router.post('/targets', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { category_id, target_amount, period_start } = req.body;

    if (!category_id || target_amount === undefined) {
      res.status(400).json({ error: 'category_id and target_amount are required' });
      return;
    }

    const period = period_start || currentPeriod();

    // Check if target exists for this category+period
    const existing = await db
      .collection('users').doc(req.uid).collection('budget_targets')
      .where('category_id', '==', category_id)
      .where('period_start', '==', period)
      .limit(1)
      .get();

    if (!existing.empty) {
      // Update existing
      await existing.docs[0].ref.update({
        target_amount,
        is_suggested: false,
        updated_at: new Date().toISOString(),
      });
      res.json({ data: { id: existing.docs[0].id, category_id, target_amount, period_start: period } });
      return;
    }

    // Create new
    const ref = db.collection('users').doc(req.uid).collection('budget_targets').doc();
    const data = {
      user_id: req.uid,
      category_id,
      period_type: 'monthly',
      period_start: period,
      target_amount,
      is_suggested: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await ref.set(data);
    res.status(201).json({ data: { id: ref.id, ...data } });
  } catch (err) {
    console.error('POST /budget/targets error:', err);
    res.status(500).json({ error: 'Failed to set target' });
  }
});

// PUT /api/v1/budget/targets/:id
router.put('/targets/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('users').doc(req.uid).collection('budget_targets').doc(req.params.id as string);
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Target not found' });
      return;
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (req.body.target_amount !== undefined) {
      updates.target_amount = req.body.target_amount;
      updates.is_suggested = false;
    }

    await ref.update(updates);
    res.json({ data: { id: doc.id, ...doc.data(), ...updates } });
  } catch (err) {
    console.error('PUT /budget/targets/:id error:', err);
    res.status(500).json({ error: 'Failed to update target' });
  }
});

// GET /api/v1/budget/suggestions
// 3-month average, rounded up to nearest $25
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.uid;

    // Get last 3 months of transactions
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const startDate = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

    const txnSnap = await db
      .collection('users').doc(userId).collection('transactions')
      .where('date', '>=', startDate)
      .where('is_income', '==', false)
      .get();

    const spentByCategory = new Map<string, number>();
    for (const doc of txnSnap.docs) {
      const txn = doc.data();
      const catId = txn.category_id || 'uncategorized';
      spentByCategory.set(catId, (spentByCategory.get(catId) || 0) + Math.abs(txn.amount));
    }

    // Calculate 3-month average, rounded up to nearest $25
    const suggestions = Array.from(spentByCategory.entries()).map(([category_id, total]) => {
      const monthlyAvg = total / 3;
      // Round up to nearest $25 (amounts are in cents)
      const roundedCents = Math.ceil(monthlyAvg / 2500) * 2500;
      return { category_id, suggested_amount: roundedCents };
    });

    res.json({ data: suggestions });
  } catch (err) {
    console.error('GET /budget/suggestions error:', err);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// POST /api/v1/budget/items
router.post('/items', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { category_id, display_name, budget_amount } = req.body;

    if (!category_id || !display_name) {
      res.status(400).json({ error: 'category_id and display_name are required' });
      return;
    }

    // Get max sort_order in this category
    const existingSnap = await db
      .collection('users').doc(req.uid).collection('budget_items')
      .where('category_id', '==', category_id)
      .orderBy('sort_order', 'desc')
      .limit(1)
      .get();

    const maxOrder = existingSnap.empty ? -1 : (existingSnap.docs[0].data().sort_order || 0);

    const ref = db.collection('users').doc(req.uid).collection('budget_items').doc();
    const data = {
      user_id: req.uid,
      category_id,
      display_name,
      linked_merchant: null,
      budget_amount: budget_amount || 0,
      source: 'user',
      is_active: true,
      renamed_by_user: false,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    await ref.set(data);
    res.status(201).json({ data: { id: ref.id, ...data } });
  } catch (err) {
    console.error('POST /budget/items error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /api/v1/budget/items/:id
router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('users').doc(req.uid).collection('budget_items').doc(req.params.id as string);
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (req.body.display_name !== undefined) {
      updates.display_name = req.body.display_name;
      updates.renamed_by_user = true;
    }
    if (req.body.budget_amount !== undefined) updates.budget_amount = req.body.budget_amount;
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

    await ref.update(updates);
    res.json({ data: { id: doc.id, ...doc.data(), ...updates } });
  } catch (err) {
    console.error('PUT /budget/items/:id error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/v1/budget/items/:id
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('users').doc(req.uid).collection('budget_items').doc(req.params.id as string);

    // Soft delete
    await ref.update({
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /budget/items/:id error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// PUT /api/v1/budget/items/reorder
router.put('/items/reorder', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }

    const batch = db.batch();
    ids.forEach((id: string, index: number) => {
      const ref = db.collection('users').doc(req.uid).collection('budget_items').doc(id);
      batch.update(ref, { sort_order: index, updated_at: new Date().toISOString() });
    });

    await batch.commit();
    res.json({ data: { reordered: ids.length } });
  } catch (err) {
    console.error('PUT /budget/items/reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder items' });
  }
});

export default router;
