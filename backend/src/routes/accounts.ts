// Account Routes — OpenSpec Section 21, Function 4
// GET    /api/v1/accounts            — list linked accounts
// PUT    /api/v1/accounts/:id        — update account (hide/show)
// POST   /api/v1/accounts/link       — initiate Plaid Link (get link token)
// POST   /api/v1/accounts/exchange   — exchange public token
// DELETE /api/v1/accounts/disconnect — disconnect Plaid

import { Router, Request, Response } from 'express';
import { getFirestore } from '../services/firebaseAdmin';
import * as plaid from '../services/plaidService';
import { encrypt, decrypt } from '../utils/encryption';

const router = Router();

// GET /api/v1/accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.plaid_items || Object.keys(userData.plaid_items).length === 0) {
      res.json({ data: [] });
      return;
    }

    const allAccounts: any[] = [];

    for (const [itemId, itemData] of Object.entries(userData.plaid_items as Record<string, any>)) {
      try {
        const accessToken = decrypt(itemData.access_token);
        const accounts = await plaid.getAccounts(accessToken);

        for (const acct of accounts) {
          // Check if account is hidden
          const acctDoc = await db
            .collection('users').doc(userId).collection('accounts').doc(acct.account_id)
            .get();

          const hidden = acctDoc.exists ? acctDoc.data()?.hidden || false : false;

          allAccounts.push({
            id: acct.account_id,
            user_id: userId,
            plaid_account_id: acct.account_id,
            name: acct.name,
            official_name: acct.official_name,
            type: acct.type,
            subtype: acct.subtype,
            mask: acct.mask,
            balance_current: acct.balance_current ? Math.round(acct.balance_current * 100) : 0,
            balance_available: acct.balance_available ? Math.round(acct.balance_available * 100) : null,
            balance_limit: acct.balance_limit ? Math.round(acct.balance_limit * 100) : null,
            hidden,
            last_synced_at: itemData.last_sync || null,
            institution_name: itemData.institution_name || 'Unknown',
            item_id: itemId,
          });
        }
      } catch (err) {
        console.error(`Error fetching accounts for item ${itemId}:`, err);
        allAccounts.push({
          item_id: itemId,
          institution_name: itemData.institution_name || 'Unknown',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    res.json({ data: allAccounts });
  } catch (err) {
    console.error('GET /accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// PUT /api/v1/accounts/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { hidden } = req.body;

    await db
      .collection('users').doc(req.uid).collection('accounts').doc(req.params.id as string)
      .set({ hidden: !!hidden, updated_at: new Date().toISOString() }, { merge: true });

    res.json({ data: { id: req.params.id as string, hidden: !!hidden } });
  } catch (err) {
    console.error('PUT /accounts/:id error:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// POST /api/v1/accounts/link
router.post('/link', async (req: Request, res: Response) => {
  try {
    console.log('POST /accounts/link — userId:', req.uid);
    const linkToken = await plaid.createLinkToken(req.uid);
    res.json({ link_token: linkToken });
  } catch (err: any) {
    // Extract Plaid-specific error details if available
    const plaidError = err?.response?.data;
    const detail = plaidError?.error_message || err?.message || 'Unknown error';
    const errorCode = plaidError?.error_code || '';
    console.error('POST /accounts/link error:', {
      detail,
      errorCode,
      plaidError,
      stack: err?.stack,
    });
    res.status(500).json({
      error: `Link token failed: ${detail}`,
      error_code: errorCode,
    });
  }
});

// POST /api/v1/accounts/exchange
router.post('/exchange', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { public_token, metadata } = req.body;

    console.log('POST /accounts/exchange — userId:', req.uid);
    console.log('  public_token present:', !!public_token, 'length:', public_token?.length);
    console.log('  metadata:', JSON.stringify(metadata, null, 2));

    if (!public_token) {
      res.status(400).json({ error: 'public_token is required' });
      return;
    }

    // Step 1: Exchange public token with Plaid
    console.log('  Step 1: Exchanging public token with Plaid...');
    let result;
    try {
      result = await plaid.exchangePublicToken(public_token);
      console.log('  Step 1 OK: item_id =', result.item_id);
    } catch (plaidErr: any) {
      const plaidError = plaidErr?.response?.data;
      const detail = plaidError?.error_message || plaidErr?.message || 'Unknown Plaid error';
      const errorCode = plaidError?.error_code || '';
      console.error('  Step 1 FAILED (Plaid exchange):', { detail, errorCode, plaidError });
      res.status(502).json({ error: `Plaid exchange failed: ${detail}`, error_code: errorCode });
      return;
    }

    // Step 2: Encrypt access token
    console.log('  Step 2: Encrypting access token...');
    let encryptedToken;
    try {
      encryptedToken = encrypt(result.access_token);
      console.log('  Step 2 OK: encrypted token length =', encryptedToken.length);
    } catch (encErr: any) {
      console.error('  Step 2 FAILED (encryption):', encErr?.message);
      res.status(500).json({ error: `Encryption failed: ${encErr?.message}` });
      return;
    }

    // Step 3: Store in Firestore
    // institution.id from Plaid SDK (not institution_id)
    const institutionName = metadata?.institution?.name || 'Unknown';
    const institutionId = metadata?.institution?.id || metadata?.institution?.institution_id || '';

    console.log('  Step 3: Writing to Firestore...', { institutionName, institutionId });
    try {
      await db.collection('users').doc(req.uid).set({
        [`plaid_items.${result.item_id}`]: {
          access_token: encryptedToken,
          institution_name: institutionName,
          institution_id: institutionId,
          connected_at: new Date().toISOString(),
          cursor: '',
          last_sync: null,
        },
      }, { merge: true });
      console.log('  Step 3a OK: User doc updated');
    } catch (fsErr: any) {
      console.error('  Step 3a FAILED (Firestore user doc):', fsErr?.message);
      res.status(500).json({ error: `Firestore write failed: ${fsErr?.message}` });
      return;
    }

    // Step 4: Write item_id → user_id index for webhook handler lookup
    try {
      await db.collection('plaid_item_users').doc(result.item_id).set({
        user_id: req.uid,
        connected_at: new Date().toISOString(),
      });
      console.log('  Step 4 OK: plaid_item_users index written');
    } catch (fsErr: any) {
      // Non-fatal — webhook lookup index, log but continue
      console.error('  Step 4 WARN (plaid_item_users index):', fsErr?.message);
    }

    console.log('  Exchange complete — item_id:', result.item_id);
    res.json({ data: { item_id: result.item_id, success: true } });
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    console.error('POST /accounts/exchange unexpected error:', msg, err?.stack);
    res.status(500).json({ error: `Exchange failed: ${msg}` });
  }
});

// DELETE /api/v1/accounts/disconnect
router.delete('/disconnect', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.uid;

    // Remove Plaid items from user doc
    const userRef = db.collection('users').doc(userId);
    await userRef.update({ plaid_items: {} });

    // Delete all transactions
    const txnSnap = await db.collection('users').doc(userId).collection('transactions').get();
    if (!txnSnap.empty) {
      const batch = db.batch();
      for (const doc of txnSnap.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }

    // Delete all accounts
    const acctSnap = await db.collection('users').doc(userId).collection('accounts').get();
    if (!acctSnap.empty) {
      const batch = db.batch();
      for (const doc of acctSnap.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /accounts/disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
