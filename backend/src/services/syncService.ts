// Shared sync service — extracts Plaid transaction sync logic
// Called by: POST /api/v1/transactions/sync (manual) and Plaid webhook handler

import { getFirestore } from './firebaseAdmin';
import { syncTransactions } from './plaidService';
import { decrypt } from '../utils/encryption';
import { categorizeTransaction, normalizeMerchant } from './categorization';

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

  // Get categories for auto-categorization
  const catSnap = await db.collection('users').doc(userId).collection('categories').get();
  const categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    name: string;
    includes: string[];
  }>;

  for (const [itemId, itemData] of Object.entries(settings.plaid_items as Record<string, any>)) {
    try {
      const accessToken = decrypt(itemData.access_token);
      const cursor = itemData.cursor || '';

      const result = await syncTransactions(accessToken, cursor);
      const txnCollection = db.collection('users').doc(userId).collection('transactions');

      // Process added transactions
      for (const txn of result.added) {
        const displayMerchant = normalizeMerchant(txn.merchant_name || txn.name);
        const isIncome = txn.amount < 0; // Plaid: negative = money in
        const amountCents = Math.round(txn.amount * 100);

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
        const amountCents = Math.round(txn.amount * 100);
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
