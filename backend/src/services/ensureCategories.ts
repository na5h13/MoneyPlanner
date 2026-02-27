// Shared category seeding — ensures default categories exist for a user
// Called from: categories route, budget route, sync service

import { getFirestore } from './firebaseAdmin';

const DEFAULT_CATEGORIES = [
  // ── Income ──
  { name: 'Income', icon: 'income', group: 'Income', sort_order: 0, is_default: true, is_income: true,
    includes: ['payroll', 'osv-payroll', 'direct deposit', 'ccb', 'child benefit', 'td pay', 'deposit'] },

  // ── Essentials ──
  { name: 'Mortgage & Rent', icon: 'home', group: 'Essentials', sort_order: 1, is_default: true, is_income: false,
    includes: ['mortgage', 'td mortgage', 'rent', 'property tax'] },
  { name: 'Utilities', icon: 'utilities', group: 'Essentials', sort_order: 2, is_default: true, is_income: false,
    includes: ['bell mobility', 'rogers', 'virgin plus', 'hydro ottawa', 'hydro', 'enbridge', 'reliance', 'electricity', 'ottawa water', 'water and sewer', 'water + sewer'] },
  { name: 'Insurance', icon: 'insurance', group: 'Essentials', sort_order: 3, is_default: true, is_income: false,
    includes: ['insurance', 'cooperators', 'ind all life', 'home insurance', 'life insurance', 'car insurance'] },
  { name: 'Groceries', icon: 'groceries', group: 'Essentials', sort_order: 4, is_default: true, is_income: false,
    includes: ['costco wholesale', 'farm boy', 'loblaw', 'loblaws', 'rcss', 'rcss south', 'walmart', 'wmt suprctr', 'pc express', 'm&m food', 'dollarama', 'giant tiger', 'green fresh', 'brandon & megan', 'lufa', 'supermarket', 't t supermarket', 'grocery', 'south african stor'] },

  // ── Daily Living ──
  { name: 'Dining & Takeout', icon: 'dining', group: 'Daily Living', sort_order: 5, is_default: true, is_income: false,
    includes: ['mcdonald', 'starbucks', 'tim hortons', 'sushi', 'uber eats', 'ubereats', 'doordash', 'pizza', 'shawarma', 'noodle', 'heist', 'joey', 'chez lionel', 'bbq chicken', 'la provence', 'chick-fil-a', 'mary browns', 'mr puffs', 'le donut', 'coffee time', 'thai express', 'pur&simple', 'new york fries', 'elyo', 'british pride', 'lois n frima', 'senate tavern', 'banditos', 'andaz', 'sweets & treats', 'toppers pizza', 'alora', 'evergreen kitch', 'carp custom', 'takeout', 'restaurant'] },
  { name: 'Alcohol', icon: 'alcohol', group: 'Daily Living', sort_order: 6, is_default: true, is_income: false,
    includes: ['lcbo', 'saq', 'rao #', 'alcohol', 'trecarre microb'] },
  { name: 'Transportation', icon: 'transport', group: 'Daily Living', sort_order: 7, is_default: true, is_income: false,
    includes: ['esso', 'shell', 'petro-canada', 'ultramar', 'quickie', 'pioneer', 'macewen', 'rams esso', 'fuel', 'gas station', 'vw credit', 'car payment', 'parking', '407-etr', 'uber canada/ubertrip', 'uber *tr', 'lyft', 'circle k', 'advanced autowerks', 'car repair'] },
  { name: 'Health & Wellness', icon: 'health', group: 'Daily Living', sort_order: 8, is_default: true, is_income: false,
    includes: ['shoppers drug', 'naturopath', 'dawdy', 'huma spa', 'york downs', 'pharmacy', 'healthcare', 'massage', 'medical'] },
  { name: 'Personal Care', icon: 'personal', group: 'Daily Living', sort_order: 9, is_default: true, is_income: false,
    includes: ['hall of fades', 'yaa cole', 'sisterloc', 'hera beauty', 'hair', 'nails', 'salon', 'barber', 'cleaning', 'laundry'] },

  // ── Family & Home ──
  { name: 'Family & Kids', icon: 'family', group: 'Family & Home', sort_order: 10, is_default: true, is_income: false,
    includes: ['brightpath', 'daycare', 'childcare', 'ecole', 'savoir apprendre', 'swimming', 'our kids', 'school', 'tuition', 'toys', 'kids'] },
  { name: 'Shopping', icon: 'shopping', group: 'Family & Home', sort_order: 11, is_default: true, is_income: false,
    includes: ['amazon', 'amzn', 'winners', 'gap outlet', 'old navy', 'homesense', 'canadian tire', 'rona', 'home depot', 'value village', 'foot locker', 'childrens place', 'rocky mountain', 'moores', 'babyboo', 'stanley', 'sp carina', 'maison kids', 'rwco', 'kj select', 'fashion'] },

  // ── Leisure ──
  { name: 'Entertainment & Social', icon: 'entertainment', group: 'Leisure', sort_order: 12, is_default: true, is_income: false,
    includes: ['concert', 'theater', 'movie', 'club', 'mild afro', 'tour', 'flying squirrel', 'aquatarium', 'canada ticket', 'calypso', 'robertson amuse', 'mudgirl', 'dates', 'game'] },
  { name: 'Subscriptions', icon: 'subscriptions', group: 'Leisure', sort_order: 13, is_default: true, is_income: false,
    includes: ['netflix', 'apple.com/bill', 'spotify', 'audible', 'amazon channels', 'amazon prime', 'cursor', 'abacus.ai', 'subscription', 'streaming'] },
  { name: 'Travel', icon: 'travel', group: 'Leisure', sort_order: 14, is_default: true, is_income: false,
    includes: ['hotel', 'resort', 'hotwire', 'belairresort', 'tradition rainv', 'marche ste agathe', 'brunet', 'royal york', 'sugar daddy', 'travel', 'airbnb', 'airlines'] },

  // ── Financial ──
  { name: 'Loans & Debt', icon: 'loan', group: 'Financial', sort_order: 15, is_default: true, is_income: false,
    includes: ['loan', 'flexiti', 'klarna', 'afterpay', 'buy now pay later', 'cibc loc', 'rbc credit', 'credit card', 'debt'] },
  { name: 'Fees & Charges', icon: 'fees', group: 'Financial', sort_order: 16, is_default: true, is_income: false,
    includes: ['service charge', 'nsf', 'overdraft', 'annual fee', 'overlimit', 'bank fee', 'atm fee', 'withdrawal fee', 'over limit'] },
  { name: 'Savings & Investments', icon: 'savings', group: 'Financial', sort_order: 17, is_default: true, is_income: false,
    includes: ['tfsa', 'cibc-disatf', 'savings', 'investment', 'retirement', 'rrsp'] },

  // ── Uncategorized ──
  { name: 'Uncategorized', icon: 'uncategorized', group: 'Uncategorized', sort_order: 18, is_default: true, is_income: false,
    includes: [] },
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
