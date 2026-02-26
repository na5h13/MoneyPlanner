// Plaid Webhook Handler — OpenSpec Section 21, Function 8
// POST /api/v1/webhooks/plaid — no auth (Plaid sends this, not users)
//
// Handles TRANSACTIONS.SYNC_UPDATES_AVAILABLE to trigger background sync
// when Plaid detects new transactions for a linked item.

import { Router, Request, Response } from 'express';
import { getFirestore } from '../services/firebaseAdmin';
import { syncUserTransactions } from '../services/syncService';

const router = Router();

// POST /api/v1/webhooks/plaid
router.post('/plaid', async (req: Request, res: Response) => {
  // Acknowledge immediately — Plaid requires 200 within 10 seconds
  res.status(200).json({ received: true });

  const { webhook_type, webhook_code, item_id, error } = req.body;

  // Log for debugging
  console.log(`Plaid webhook: ${webhook_type}.${webhook_code} for item ${item_id}`);

  // Only process transaction sync webhooks
  if (webhook_type !== 'TRANSACTIONS') return;
  if (webhook_code !== 'SYNC_UPDATES_AVAILABLE') return;
  if (!item_id) return;

  // Plaid error on the item — log and skip (user needs to re-auth)
  if (error) {
    console.error(`Plaid item ${item_id} error:`, error);
    return;
  }

  try {
    const db = getFirestore();

    // Look up user_id from the item index written during bank connect
    const indexDoc = await db.collection('plaid_item_users').doc(item_id).get();
    if (!indexDoc.exists) {
      console.warn(`Webhook: no user found for item_id ${item_id}`);
      return;
    }

    const userId = indexDoc.data()?.user_id;
    if (!userId) return;

    console.log(`Webhook: triggering sync for user ${userId}, item ${item_id}`);
    const result = await syncUserTransactions(userId);
    console.log(`Webhook sync complete: ${result.synced} transactions, ${result.errors.length} errors`);
  } catch (err) {
    console.error('Webhook sync error:', err);
  }
});

export default router;
