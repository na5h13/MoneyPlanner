// Category Routes — OpenSpec Section 21, Function 3
// GET    /api/v1/categories         — list all categories
// POST   /api/v1/categories         — create category
// PUT    /api/v1/categories/:id     — update category
// DELETE /api/v1/categories/:id     — delete category
// PUT    /api/v1/categories/reorder — batch reorder
// GET    /api/v1/category-rules     — list merchant rules
// DELETE /api/v1/category-rules/:id — delete rule

import { Router, Request, Response } from 'express';
import { getFirestore } from '../services/firebaseAdmin';

const router = Router();

const DEFAULT_CATEGORIES = [
  { name: 'Home & Personal', icon: 'home', sort_order: 0, is_default: true, is_income: false, includes: ['rent', 'mortgage', 'utilities', 'electric', 'gas', 'water', 'internet', 'phone', 'insurance', 'gym', 'haircut', 'laundry', 'cleaning'] },
  { name: 'Food & Transportation', icon: 'food', sort_order: 1, is_default: true, is_income: false, includes: ['grocery', 'restaurant', 'food', 'coffee', 'uber', 'lyft', 'gas station', 'parking', 'transit', 'subway', 'doordash', 'grubhub'] },
  { name: 'Family', icon: 'family', sort_order: 2, is_default: true, is_income: false, includes: ['school', 'daycare', 'childcare', 'tuition', 'pediatric', 'toys', 'baby', 'kids'] },
  { name: 'Loans & Debt', icon: 'loan', sort_order: 3, is_default: true, is_income: false, includes: ['loan', 'student', 'credit card', 'payment', 'interest', 'finance', 'debt'] },
  { name: 'Entertainment & Other', icon: 'entertainment', sort_order: 4, is_default: true, is_income: false, includes: ['netflix', 'spotify', 'hulu', 'amazon', 'subscription', 'movie', 'game', 'music', 'streaming', 'shopping', 'clothing'] },
  { name: 'Uncategorized', icon: 'uncategorized', sort_order: 5, is_default: true, is_income: false, includes: [] },
];

// Seed default categories if none exist
async function ensureCategories(userId: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection('users').doc(userId).collection('categories').limit(1).get();
  if (!snap.empty) return;

  const batch = db.batch();
  for (const cat of DEFAULT_CATEGORIES) {
    const ref = db.collection('users').doc(userId).collection('categories').doc();
    batch.set(ref, {
      ...cat,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  await batch.commit();
}

// GET /api/v1/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    await ensureCategories(req.uid);

    const snap = await db
      .collection('users')
      .doc(req.uid)
      .collection('categories')
      .orderBy('sort_order')
      .get();

    const categories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ data: categories });
  } catch (err) {
    console.error('GET /categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/v1/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { name, icon, includes } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    // Get current max sort_order
    const snap = await db
      .collection('users')
      .doc(req.uid)
      .collection('categories')
      .orderBy('sort_order', 'desc')
      .limit(1)
      .get();

    const maxOrder = snap.empty ? -1 : (snap.docs[0].data().sort_order || 0);

    const ref = db.collection('users').doc(req.uid).collection('categories').doc();
    const data = {
      user_id: req.uid,
      name,
      icon: icon || 'custom',
      sort_order: maxOrder + 1,
      is_default: false,
      is_income: false,
      includes: includes || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await ref.set(data);
    res.status(201).json({ data: { id: ref.id, ...data } });
  } catch (err) {
    console.error('POST /categories error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/v1/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('users').doc(req.uid).collection('categories').doc(req.params.id as string);
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.icon !== undefined) updates.icon = req.body.icon;
    if (req.body.includes !== undefined) updates.includes = req.body.includes;

    await ref.update(updates);
    res.json({ data: { id: doc.id, ...doc.data(), ...updates } });
  } catch (err) {
    console.error('PUT /categories/:id error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/v1/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('users').doc(req.uid).collection('categories').doc(req.params.id as string);
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Move transactions to Uncategorized
    const uncatSnap = await db
      .collection('users')
      .doc(req.uid)
      .collection('categories')
      .where('name', '==', 'Uncategorized')
      .limit(1)
      .get();

    if (!uncatSnap.empty) {
      const uncatId = uncatSnap.docs[0].id;
      const txnSnap = await db
        .collection('users')
        .doc(req.uid)
        .collection('transactions')
        .where('category_id', '==', req.params.id as string)
        .get();

      if (!txnSnap.empty) {
        const batch = db.batch();
        for (const txnDoc of txnSnap.docs) {
          batch.update(txnDoc.ref, { category_id: uncatId });
        }
        await batch.commit();
      }
    }

    await ref.delete();
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /categories/:id error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// PUT /api/v1/categories/reorder
router.put('/reorder', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }

    const batch = db.batch();
    ids.forEach((id: string, index: number) => {
      const ref = db.collection('users').doc(req.uid).collection('categories').doc(id);
      batch.update(ref, { sort_order: index, updated_at: new Date().toISOString() });
    });

    await batch.commit();
    res.json({ data: { reordered: ids.length } });
  } catch (err) {
    console.error('PUT /categories/reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// GET /api/v1/category-rules
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db
      .collection('users')
      .doc(req.uid)
      .collection('category_rules')
      .get();

    const rules = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ data: rules });
  } catch (err) {
    console.error('GET /category-rules error:', err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// DELETE /api/v1/category-rules/:id
router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    await db
      .collection('users')
      .doc(req.uid)
      .collection('category_rules')
      .doc(req.params.id as string)
      .delete();

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /category-rules/:id error:', err);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

export default router;
