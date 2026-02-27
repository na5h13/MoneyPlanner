// Shared sync service — extracts Plaid transaction sync logic
// Called by: POST /api/v1/transactions/sync (manual) and Plaid webhook handler

import { getFirestore } from './firebaseAdmin';
import { syncTransactions } from './plaidService';
import { decrypt } from '../utils/encryption';
import { categorizeTransaction, normalizeMerchant } from './categorization';
import { ensureCategories } from './ensureCategories';

export interface SyncResult {
  synced: number;
  errors: string[];
}

/**
 * Sync all Plaid items for a user. Fetches new/modified/removed transactions,
 * auto-categorizes additions, and updates the sync cursor.
 */
export async function syncUserTransactions(userId: string): Promise<SyncResult> {
  const db = getFirestore();
  const errors: string[] = [];
  let totalSynced = 0;

  const settingsDoc = await db.collection('users').doc(userId).get();
  const settings = settingsDoc.data();

  if (!settings?.plaid_items || Object.keys(settings.plaid_items).length === 0) {
    return { synced: 0, errors: ['No linked accounts'] };
  }

  // Ensure default categories exist before categorizing
  const categories = await ensureCategories(userId);

  // Fix orphaned transactions with literal 'uncategorized' string as category_id
  // This happens when sync runs before categories are seeded
  const orphanSnap = await db.collection('users').doc(userId).collection('transactions')
    .where('category_id', '==', 'uncategorized')
    .get();

  if (!orphanSnap.empty) {
    console.log(`Fixing ${orphanSnap.size} orphaned transactions with category_id='uncategorized'`);
    const batch = db.batch();
    let batchCount = 0;

    for (const txnDoc of orphanSnap.docs) {
      const txn = txnDoc.data();
      // Re-categorize each transaction
      const catResult = await categorizeTransaction(
        userId,
        txn.merchant_name || '',
        txn.name || '',
        txn.plaid_category || [],
        categories
      );
      batch.update(txnDoc.ref, {
        category_id: catResult.category_id,
        category_confidence: catResult.confidence,
        categorized_by: 'auto',
        categorized_at: new Date().toISOString(),
      });
      batchCount++;
      // Firestore batch limit is 500
      if (batchCount >= 499) break;
    }
    await batch.commit();
    console.log(`Fixed ${batchCount} orphaned transactions`);
  }

  // Repair is_income and amount for existing transactions
  // Old logic used amount sign (unreliable across institutions).
  // New logic uses personal_finance_category which Plaid provides reliably.
  const allTxnSnap = await db.collection('users').doc(userId).collection('transactions').get();
  if (!allTxnSnap.empty) {
    const repairBatch = db.batch();
    let repairCount = 0;

    for (const txnDoc of allTxnSnap.docs) {
      const txn = txnDoc.data();
      const plaidCat = txn.plaid_category;
      const primaryCat = (Array.isArray(plaidCat) ? (plaidCat[0] || '') : '').toUpperCase();
      const correctIsIncome = primaryCat === 'INCOME' || primaryCat === 'TRANSFER_IN';
      const correctAmount = Math.round(Math.abs(txn.amount));

      // Only update if something changed
      if (txn.is_income !== correctIsIncome || txn.amount !== correctAmount) {
        repairBatch.update(txnDoc.ref, {
          is_income: correctIsIncome,
          amount: correctAmount,
        });
        repairCount++;
        if (repairCount >= 499) break;
      }
    }

    if (repairCount > 0) {
      await repairBatch.commit();
      console.log(`Repaired is_income/amount on ${repairCount} transactions`);
    }
  }

  for (const [itemId, itemData] of Object.entries(settings.plaid_items as Record<string, any>)) {
    try {
      const accessToken = decrypt(itemData.access_token);
      const cursor = itemData.cursor || '';

      const result = await syncTransactions(accessToken, cursor);
      const txnCollection = db.collection('users').doc(userId).collection('transactions');

      // Process added transactions
      for (const txn of result.added) {
        const displayMerchant = normalizeMerchant(txn.merchant_name || txn.name);
        // Determine income from Plaid category (amount sign is unreliable across institutions)
        const primaryCategory = (txn.personal_finance_category?.[0] || '').toUpperCase();
        const isIncome = primaryCategory === 'INCOME'
          || primaryCategory === 'TRANSFER_IN';
        const amountCents = Math.round(Math.abs(txn.amount) * 100);

        const catResult = await categorizeTransaction(
          userId,
          txn.merchant_name || '',
          txn.name,
          txn.personal_finance_category,
          categories
        );

        await txnCollection.doc(txn.transaction_id).set({
          plaid_transaction_id: txn.transaction_id,
          user_id: userId,
          account_id: txn.account_id,
          amount: amountCents,
          date: txn.date,
          name: txn.name,
          merchant_name: txn.merchant_name,
          pending: txn.pending,
          payment_channel: txn.payment_channel,
          plaid_category: txn.personal_finance_category,
          category_id: catResult.category_id,
          category_confidence: catResult.confidence,
          is_recurring: false,
          is_income: isIncome,
          display_merchant: displayMerchant,
          synced_at: new Date().toISOString(),
          categorized_at: new Date().toISOString(),
          categorized_by: 'auto',
        }, { merge: true });

        totalSynced++;
      }

      // Process modified transactions
      for (const txn of result.modified) {
        const amountCents = Math.round(Math.abs(txn.amount) * 100);
        await txnCollection.doc(txn.transaction_id).update({
          amount: amountCents,
          date: txn.date,
          name: txn.name,
          merchant_name: txn.merchant_name,
          pending: txn.pending,
          synced_at: new Date().toISOString(),
        });
      }

      // Process removed transactions
      for (const txnId of result.removed) {
        await txnCollection.doc(txnId).delete();
      }

      // Update cursor + last sync timestamp
      await db.collection('users').doc(userId).update({
        [`plaid_items.${itemId}.cursor`]: result.next_cursor,
        [`plaid_items.${itemId}.last_sync`]: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Sync error for item ${itemId}:`, msg);
      errors.push(`item:${itemId} — ${msg}`);
    }
  }

  // Update user-level last_synced_at
  await db.collection('users').doc(userId).set(
    { last_synced_at: new Date().toISOString() },
    { merge: true }
  );

  return { synced: totalSynced, errors };
}
