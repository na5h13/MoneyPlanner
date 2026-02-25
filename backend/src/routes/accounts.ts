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
    const linkToken = await plaid.createLinkToken(req.uid);
    res.json({ link_token: linkToken });
  } catch (err) {
    console.error('POST /accounts/link error:', err);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// POST /api/v1/accounts/exchange
router.post('/exchange', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { public_token, metadata } = req.body;

    if (!public_token) {
      res.status(400).json({ error: 'public_token is required' });
      return;
    }

    const result = await plaid.exchangePublicToken(public_token);

    // Encrypt access token before storing
    const encryptedToken = encrypt(result.access_token);

    // Store in user document
    await db.collection('users').doc(req.uid).set({
      [`plaid_items.${result.item_id}`]: {
        access_token: encryptedToken,
        institution_name: metadata?.institution?.name || 'Unknown',
        institution_id: metadata?.institution?.institution_id || '',
        connected_at: new Date().toISOString(),
        cursor: '',
        last_sync: null,
      },
    }, { merge: true });

    res.json({ data: { item_id: result.item_id, success: true } });
  } catch (err) {
    console.error('POST /accounts/exchange error:', err);
    res.status(500).json({ error: 'Failed to exchange token' });
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
