// Trending Classification Engine — OpenSpec Section 22
// Detects FIXED | RECURRING_VARIABLE | TRUE_VARIABLE | UNCLASSIFIED
// per merchant from 3-month transaction history.
//
// Classification logic:
//   FIXED             — same merchant, consistent amount (±10%), posts predictably (monthly/biweekly)
//   RECURRING_VARIABLE — same merchant, posts regularly, amount varies >10%
//   TRUE_VARIABLE      — irregular posting, high variance (groceries, entertainment)
//   UNCLASSIFIED       — fewer than 2 occurrences in 90 days

import { getFirestore } from './firebaseAdmin';

export type ClassificationType = 'FIXED' | 'RECURRING_VARIABLE' | 'TRUE_VARIABLE' | 'UNCLASSIFIED';

interface MerchantHistory {
  amounts: number[];    // cents
  dates: string[];      // YYYY-MM-DD
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  return stdDev(values) / mean;
}

/**
 * Classify a merchant based on their transaction history.
 * Returns classification type and confidence (0–1).
 */
function classifyMerchant(history: MerchantHistory): {
  type: ClassificationType;
  confidence: number;
  expected_amount: number | null;
  expected_day: number | null;
  amount_range_low: number | null;
  amount_range_high: number | null;
} {
  const { amounts, dates } = history;

  if (amounts.length < 2) {
    return { type: 'UNCLASSIFIED', confidence: 0, expected_amount: null, expected_day: null, amount_range_low: null, amount_range_high: null };
  }

  const cv = coefficientOfVariation(amounts);
  const meanAmount = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);

  // Parse days of month from dates
  const days = dates.map(d => parseInt(d.split('-')[2], 10));

  // Check if posting is periodic (consistent day-of-month within ±5 days)
  const dayStdDev = stdDev(days);
  const isPeriodic = dayStdDev <= 5;

  // FIXED: low amount variance (CV < 10%) + periodic posting
  if (cv < 0.10 && isPeriodic) {
    const expectedDay = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    return {
      type: 'FIXED',
      confidence: Math.min(0.95, 1 - cv),
      expected_amount: meanAmount,
      expected_day: expectedDay,
      amount_range_low: null,
      amount_range_high: null,
    };
  }

  // RECURRING_VARIABLE: posts periodically but amount varies
  if (isPeriodic && cv < 0.40) {
    const minAmt = Math.min(...amounts);
    const maxAmt = Math.max(...amounts);
    return {
      type: 'RECURRING_VARIABLE',
      confidence: Math.min(0.85, 0.9 - cv),
      expected_amount: meanAmount,
      expected_day: null,
      amount_range_low: minAmt,
      amount_range_high: maxAmt,
    };
  }

  // TRUE_VARIABLE: irregular or high-variance
  return {
    type: 'TRUE_VARIABLE',
    confidence: 0.70,
    expected_amount: null,
    expected_day: null,
    amount_range_low: null,
    amount_range_high: null,
  };
}

/**
 * Run auto-detection for all merchants for a user based on last 90 days.
 * Writes results to the spending_classifications subcollection.
 */
export async function detectClassifications(userId: string): Promise<number> {
  const db = getFirestore();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const startDate = ninetyDaysAgo.toISOString().split('T')[0];

  const txnSnap = await db
    .collection('users').doc(userId).collection('transactions')
    .where('date', '>=', startDate)
    .where('is_income', '==', false)
    .get();

  // Group transactions by normalized merchant
  const byMerchant = new Map<string, MerchantHistory>();
  for (const doc of txnSnap.docs) {
    const txn = doc.data();
    const merchant = txn.display_merchant || txn.name || 'unknown';
    if (!byMerchant.has(merchant)) {
      byMerchant.set(merchant, { amounts: [], dates: [] });
    }
    const h = byMerchant.get(merchant)!;
    h.amounts.push(Math.abs(txn.amount));
    h.dates.push(txn.date);
  }

  const batch = db.batch();
  let count = 0;

  for (const [merchant, history] of byMerchant.entries()) {
    // Skip merchants with fewer than 2 occurrences
    if (history.amounts.length < 2) continue;

    const result = classifyMerchant(history);

    // Check if user has already manually overridden this classification
    const existingSnap = await db
      .collection('users').doc(userId).collection('spending_classifications')
      .where('merchant_normalized', '==', merchant)
      .where('source', '==', 'USER_OVERRIDE')
      .limit(1)
      .get();

    if (!existingSnap.empty) continue; // Don't overwrite user overrides

    const ref = db
      .collection('users').doc(userId).collection('spending_classifications')
      .doc(`auto_${Buffer.from(merchant).toString('base64').slice(0, 20)}`);

    batch.set(ref, {
      user_id: userId,
      merchant_normalized: merchant,
      classification_type: result.type,
      source: 'AUTO_DETECTED',
      confidence: result.confidence,
      expected_amount: result.expected_amount,
      expected_day: result.expected_day,
      amount_range_low: result.amount_range_low,
      amount_range_high: result.amount_range_high,
      reclassification_flag: false,
      last_evaluated: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { merge: true });

    count++;
  }

  await batch.commit();
  return count;
}

/**
 * Get classification for a specific merchant (for display in line items).
 */
export async function getMerchantClassification(
  userId: string,
  merchantNormalized: string
): Promise<{ type: ClassificationType; source: string } | null> {
  const db = getFirestore();

  const snap = await db
    .collection('users').doc(userId).collection('spending_classifications')
    .where('merchant_normalized', '==', merchantNormalized)
    .orderBy('source', 'desc') // USER_OVERRIDE comes after AUTO_DETECTED alphabetically, but we want user first
    .limit(2)
    .get();

  if (snap.empty) return null;

  // Prefer user override
  const userOverride = snap.docs.find(d => d.data().source === 'USER_OVERRIDE');
  const doc = userOverride || snap.docs[0];
  const data = doc.data();

  return { type: data.classification_type, source: data.source };
}
