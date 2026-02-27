// 4-Priority Auto-Categorization Pipeline — OpenSpec Section 21, Function 3
// Priority 1: Exact merchant rule (user-created) → confidence 1.0
// Priority 2: Historical pattern (same merchant categorized before) → confidence 0.95
// Priority 3: Plaid category mapping → confidence varies
// Priority 4: Keyword matching against category includes → confidence 0.70
// Fallback: Uncategorized → confidence 0.0

import { getFirestore } from './firebaseAdmin';

interface CategorizeResult {
  category_id: string;
  confidence: number;
  source: 'merchant_rule' | 'historical' | 'plaid_map' | 'keyword' | 'fallback';
}

// Plaid personal_finance_category → OpenSpec category name mapping
const PLAID_CATEGORY_MAP: Record<string, string> = {
  // Home & Personal
  'RENT_AND_UTILITIES': 'Home & Personal',
  'HOME_IMPROVEMENT': 'Home & Personal',
  'PERSONAL_CARE': 'Home & Personal',
  'MEDICAL': 'Home & Personal',
  'INSURANCE': 'Home & Personal',
  'TELECOMMUNICATION_SERVICES': 'Home & Personal',
  'RENT': 'Home & Personal',

  // Food & Transportation
  'FOOD_AND_DRINK': 'Food & Transportation',
  'GROCERIES': 'Food & Transportation',
  'RESTAURANTS': 'Food & Transportation',
  'COFFEE': 'Food & Transportation',
  'TRANSPORTATION': 'Food & Transportation',
  'GAS_STATIONS': 'Food & Transportation',
  'TAXI': 'Food & Transportation',
  'PUBLIC_TRANSIT': 'Food & Transportation',
  'PARKING': 'Food & Transportation',

  // Family
  'CHILDCARE': 'Family',
  'EDUCATION': 'Family',
  'PET_CARE': 'Family',

  // Loans & Debt
  'LOAN_PAYMENTS': 'Loans & Debt',
  'CREDIT_CARD_PAYMENT': 'Loans & Debt',
  'INTEREST': 'Loans & Debt',
  'BANK_FEES': 'Loans & Debt',

  // Entertainment & Other
  'ENTERTAINMENT': 'Entertainment & Other',
  'RECREATION': 'Entertainment & Other',
  'SHOPPING': 'Entertainment & Other',
  'GENERAL_MERCHANDISE': 'Entertainment & Other',
  'ELECTRONICS': 'Entertainment & Other',
  'CLOTHING': 'Entertainment & Other',
  'SUBSCRIPTIONS': 'Entertainment & Other',
  'TRAVEL': 'Entertainment & Other',
  'AIRLINES_AND_AVIATION_SERVICES': 'Entertainment & Other',
  'LODGING': 'Entertainment & Other',
};

function normalizeMerchant(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function categorizeTransaction(
  userId: string,
  merchantName: string,
  transactionName: string,
  plaidCategories: string[],
  categories: Array<{ id: string; name: string; includes: string[] }>
): Promise<CategorizeResult> {
  const db = getFirestore();
  const normalizedMerchant = normalizeMerchant(merchantName || transactionName);
  const uncategorized = categories.find(c => c.name === 'Uncategorized');
  const fallbackId = uncategorized?.id || categories[categories.length - 1]?.id || 'uncategorized';

  // Priority 1: Exact merchant rule (user-created)
  const rulesSnap = await db
    .collection('users')
    .doc(userId)
    .collection('category_rules')
    .where('normalized_merchant', '==', normalizedMerchant)
    .limit(1)
    .get();

  if (!rulesSnap.empty) {
    const rule = rulesSnap.docs[0].data();
    return { category_id: rule.category_id, confidence: 1.0, source: 'merchant_rule' };
  }

  // Priority 2: Historical pattern (same merchant categorized by user before)
  // This query needs a composite index (categorized_by + display_merchant + categorized_at).
  // If index doesn't exist yet, skip gracefully and fall through to lower priorities.
  try {
    const histSnap = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .where('display_merchant', '==', normalizedMerchant)
      .where('categorized_by', '==', 'user')
      .orderBy('categorized_at', 'desc')
      .limit(1)
      .get();

    if (!histSnap.empty) {
      const prevTxn = histSnap.docs[0].data();
      if (prevTxn.category_id) {
        return { category_id: prevTxn.category_id, confidence: 0.95, source: 'historical' };
      }
    }
  } catch (err: any) {
    // FAILED_PRECONDITION = missing composite index — skip historical matching
    if (err?.code === 9 || err?.message?.includes('index')) {
      console.warn('Historical categorization skipped — composite index not yet created');
    } else {
      throw err;
    }
  }

  // Priority 3: Plaid category mapping
  for (const plaidCat of plaidCategories) {
    const normalizedCat = plaidCat.toUpperCase().replace(/\s+/g, '_');
    for (const [key, catName] of Object.entries(PLAID_CATEGORY_MAP)) {
      if (normalizedCat.includes(key)) {
        const cat = categories.find(c => c.name === catName);
        if (cat) {
          return { category_id: cat.id, confidence: 0.80, source: 'plaid_map' };
        }
      }
    }
  }

  // Priority 4: Keyword matching against category includes
  const searchText = `${merchantName || ''} ${transactionName || ''}`.toLowerCase();
  for (const cat of categories) {
    if (cat.name === 'Uncategorized') continue;
    for (const keyword of cat.includes) {
      if (searchText.includes(keyword.toLowerCase())) {
        return { category_id: cat.id, confidence: 0.70, source: 'keyword' };
      }
    }
  }

  // Fallback: Uncategorized
  return { category_id: fallbackId, confidence: 0.0, source: 'fallback' };
}

export { normalizeMerchant };
