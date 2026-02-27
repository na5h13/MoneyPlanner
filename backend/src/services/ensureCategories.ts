// Shared category seeding — ensures default categories exist for a user
// Called from: categories route, budget route, sync service

import { getFirestore } from './firebaseAdmin';

const DEFAULT_CATEGORIES = [
  { name: 'Home & Personal', icon: 'home', sort_order: 0, is_default: true, is_income: false, includes: ['rent', 'mortgage', 'utilities', 'electric', 'gas', 'water', 'internet', 'phone', 'insurance', 'gym', 'haircut', 'laundry', 'cleaning'] },
  { name: 'Food & Transportation', icon: 'food', sort_order: 1, is_default: true, is_income: false, includes: ['grocery', 'restaurant', 'food', 'coffee', 'uber', 'lyft', 'gas station', 'parking', 'transit', 'subway', 'doordash', 'grubhub'] },
  { name: 'Family', icon: 'family', sort_order: 2, is_default: true, is_income: false, includes: ['school', 'daycare', 'childcare', 'tuition', 'pediatric', 'toys', 'baby', 'kids'] },
  { name: 'Loans & Debt', icon: 'loan', sort_order: 3, is_default: true, is_income: false, includes: ['loan', 'student', 'credit card', 'payment', 'interest', 'finance', 'debt'] },
  { name: 'Entertainment & Other', icon: 'entertainment', sort_order: 4, is_default: true, is_income: false, includes: ['netflix', 'spotify', 'hulu', 'amazon', 'subscription', 'movie', 'game', 'music', 'streaming', 'shopping', 'clothing'] },
  { name: 'Uncategorized', icon: 'uncategorized', sort_order: 5, is_default: true, is_income: false, includes: [] },
];

/**
 * Seeds default categories if the user has none.
 * Returns the categories array (seeded or existing).
 */
export async function ensureCategories(userId: string): Promise<Array<{
  id: string;
  name: string;
  includes: string[];
}>> {
  const db = getFirestore();
  const catCollection = db.collection('users').doc(userId).collection('categories');

  const snap = await catCollection.limit(1).get();
  if (!snap.empty) {
    // Already has categories — return them
    const allSnap = await catCollection.orderBy('sort_order').get();
    return allSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  }

  // Seed defaults
  const batch = db.batch();
  const seeded: Array<{ id: string; name: string; includes: string[] }> = [];

  for (const cat of DEFAULT_CATEGORIES) {
    const ref = catCollection.doc();
    const data = {
      ...cat,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    batch.set(ref, data);
    seeded.push({ id: ref.id, name: cat.name, includes: cat.includes });
  }

  await batch.commit();
  return seeded;
}
