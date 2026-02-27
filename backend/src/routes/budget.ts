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
import { ensureCategories } from '../services/ensureCategories';

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

    // Get categories (seeds defaults if none exist)
    await ensureCategories(userId);
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
    // This query needs a composite index (is_active + sort_order).
    // If index doesn't exist, return empty items — budget still works without them.
    let allItems: any[] = [];
    try {
      const itemSnap = await db
        .collection('users').doc(userId).collection('budget_items')
        .where('is_active', '==', true)
        .orderBy('sort_order')
        .get();
      allItems = itemSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err: any) {
      if (err?.code === 9 || err?.message?.includes('index')) {
        console.warn('Budget items query skipped — composite index not yet created');
      } else {
        throw err;
      }
    }

    // Get spending classifications for merchant badge display (M8)
    const classSnap = await db
      .collection('users').doc(userId).collection('spending_classifications')
      .get();
    const classificationByMerchant = new Map<string, string>();
    for (const doc of classSnap.docs) {
      const data = doc.data();
      if (data.merchant_normalized && data.classification_type) {
        // User overrides take precedence
        const existing = classificationByMerchant.get(data.merchant_normalized);
        if (!existing || data.source === 'USER_OVERRIDE') {
          classificationByMerchant.set(data.merchant_normalized, data.classification_type);
        }
      }
    }

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
    const ONE_TIME_THRESHOLD = 20000; // $200 in cents
    const spentByCategory = new Map<string, number>();
    let totalIncome = 0;
    let totalCommitted = 0;
    let totalOneTime = 0;

    for (const txn of transactions) {
      const amt = Math.abs(txn.amount);
      if (txn.is_income) {
        totalIncome += amt;
        continue;
      }
      const catId = txn.category_id || 'uncategorized';
      spentByCategory.set(catId, (spentByCategory.get(catId) || 0) + amt);
      totalCommitted += amt;
      if (!txn.is_recurring && amt > ONE_TIME_THRESHOLD) {
        totalOneTime += amt;
      }
    }

    // Compute trending per category
    const now = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = now.getFullYear() === year && now.getMonth() + 1 === month
      ? now.getDate()
      : daysInMonth; // Past month: use full days
    const daysElapsed = Math.max(today, 1);

    // Build spending-by-merchant map for per-item trending
    // Also group by category+merchant for auto-generating line items
    const spentByMerchant = new Map<string, number>();
    const merchantPosted = new Map<string, boolean>();
    // category_id → Map<merchant_display_name, { amount, merchant_key, posted }>
    const merchantsByCategory = new Map<string, Map<string, { amount: number; merchantKey: string; posted: boolean; displayName: string }>>();
    for (const txn of transactions) {
      if (txn.is_income) continue;
      const merchantKey = (txn.merchant_name || txn.name || '').toLowerCase().trim();
      if (!merchantKey) continue;
      const amt = Math.abs(txn.amount);
      const catId = txn.category_id || 'uncategorized';
      const displayName = txn.display_merchant || txn.merchant_name || txn.name || 'Unknown';

      spentByMerchant.set(merchantKey, (spentByMerchant.get(merchantKey) || 0) + amt);
      if (!txn.pending) {
        merchantPosted.set(merchantKey, true);
      }

      // Group by category for auto-generated line items
      if (!merchantsByCategory.has(catId)) {
        merchantsByCategory.set(catId, new Map());
      }
      const catMerchants = merchantsByCategory.get(catId)!;
      const existing = catMerchants.get(merchantKey);
      if (existing) {
        existing.amount += amt;
        if (!txn.pending) existing.posted = true;
      } else {
        catMerchants.set(merchantKey, {
          amount: amt,
          merchantKey,
          posted: !txn.pending,
          displayName,
        });
      }
    }

    // Build classification details map (for expected amounts, ranges)
    const classificationDetails = new Map<string, any>();
    for (const doc of classSnap.docs) {
      const data = doc.data();
      if (data.merchant_normalized) {
        classificationDetails.set(data.merchant_normalized, data);
      }
    }

    // Helper: compute per-item trending for a given merchant
    function computeItemTrending(merchantKey: string, classType: string | null, budgetAmount: number) {
      const merchantSpent = spentByMerchant.get(merchantKey) || 0;
      const posted = merchantPosted.get(merchantKey) || false;
      const classDetail = classificationDetails.get(merchantKey);

      let trendingAmount = 0;
      let itemStatus: 'ok' | 'watch' | 'over' = 'ok';

      if (classType === 'FIXED') {
        trendingAmount = posted ? merchantSpent : (classDetail?.expected_amount || budgetAmount || 0);
      } else if (classType === 'RECURRING_VARIABLE') {
        if (posted) {
          trendingAmount = merchantSpent;
        } else if (classDetail?.amount_range_low != null && classDetail?.amount_range_high != null) {
          trendingAmount = Math.round((classDetail.amount_range_low + classDetail.amount_range_high) / 2);
        } else {
          trendingAmount = budgetAmount || 0;
        }
      } else {
        if (merchantSpent > 0 && daysElapsed >= 3) {
          trendingAmount = Math.round((merchantSpent / daysElapsed) * daysInMonth);
        } else {
          trendingAmount = merchantSpent || 0;
        }
      }

      if (budgetAmount > 0 && trendingAmount > 0) {
        if (trendingAmount > budgetAmount * 1.10) {
          itemStatus = 'over';
        } else if (trendingAmount > budgetAmount) {
          itemStatus = 'watch';
        }
      }

      return { posted, amount: trendingAmount, status: itemStatus };
    }

    // Build display data
    const budgetDisplay = categories.map((cat: any) => {
      const target = targets.get(cat.id) as any;
      const manualItems = allItems.filter((item: any) => item.category_id === cat.id);

      let items: any[];
      if (manualItems.length > 0) {
        // Use manually-created budget items
        items = manualItems.map((item: any) => {
          const classType = item.linked_merchant
            ? (classificationByMerchant.get(item.linked_merchant) || null)
            : null;
          const merchantKey = item.linked_merchant ? item.linked_merchant.toLowerCase().trim() : '';
          const item_trending = item.linked_merchant
            ? computeItemTrending(merchantKey, classType, item.budget_amount)
            : null;
          return { ...item, classification_type: classType, item_trending };
        });
      } else {
        // Auto-generate line items from transactions grouped by merchant
        const catMerchants = merchantsByCategory.get(cat.id);
        if (catMerchants && catMerchants.size > 0) {
          let sortIdx = 0;
          items = Array.from(catMerchants.values())
            .sort((a, b) => b.amount - a.amount) // highest spend first
            .map((m) => {
              const classType = classificationByMerchant.get(m.merchantKey) || null;
              const item_trending = computeItemTrending(m.merchantKey, classType, m.amount);
              return {
                id: `auto_${cat.id}_${sortIdx}`,
                user_id: userId,
                category_id: cat.id,
                display_name: m.displayName,
                linked_merchant: m.merchantKey,
                budget_amount: m.amount, // actual spend as budget reference
                source: 'auto',
                is_active: true,
                renamed_by_user: false,
                sort_order: sortIdx++,
                classification_type: classType,
                item_trending,
              };
            });
        } else {
          items = [];
        }
      }

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

    const summary = {
      income: totalIncome,
      committed: totalCommitted,
      one_time: totalOneTime,
      safe_to_spend: totalIncome - totalCommitted,
    };

    res.json({ data: budgetDisplay, summary });
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
