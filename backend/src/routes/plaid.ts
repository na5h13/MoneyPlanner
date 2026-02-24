// backend/src/routes/plaid.ts
// Plaid API routes — all sensitive token operations happen here

import { Router } from 'express';
import { plaidServerService } from '../services/plaidService';
import { db } from '../services/firebaseAdmin';
import { encrypt, decrypt } from '../utils/encryption';
import { AuthenticatedRequest } from '../middleware/auth';

export const plaidRouter = Router();

// Create a link token for the client to open Plaid Link
plaidRouter.post('/create-link-token', async (req: AuthenticatedRequest, res) => {
  try {
    const linkToken = await plaidServerService.createLinkToken(req.uid!);
    res.json({ link_token: linkToken });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange public token → access token and store encrypted in Firestore
plaidRouter.post('/exchange-token', async (req: AuthenticatedRequest, res) => {
  try {
    const { public_token, metadata } = req.body;
    const accessToken = await plaidServerService.exchangePublicToken(public_token);

    // Encrypt the access token before storing
    const encryptedToken = encrypt(accessToken);

    // Store in Firestore under the user's document
    const accountRef = db().collection('users').doc(req.uid!).collection('plaid_items').doc();
    await accountRef.set({
      accessToken: encryptedToken,
      institutionId: metadata?.institution?.institution_id || null,
      institutionName: metadata?.institution?.name || null,
      accounts: metadata?.accounts || [],
      createdAt: new Date().toISOString(),
      lastSynced: new Date().toISOString(),
      isActive: true,
    });

    res.json({ success: true, itemId: accountRef.id });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Get connected accounts
plaidRouter.get('/accounts', async (req: AuthenticatedRequest, res) => {
  try {
    const itemsSnapshot = await db()
      .collection('users')
      .doc(req.uid!)
      .collection('plaid_items')
      .where('isActive', '==', true)
      .get();

    const allAccounts = [];
    for (const doc of itemsSnapshot.docs) {
      const item = doc.data();
      const accessToken = decrypt(item.accessToken);
      const accounts = await plaidServerService.getAccounts(accessToken);
      allAccounts.push(
        ...accounts.map((a) => ({
          id: a.account_id,
          name: a.name,
          type: a.type,
          subtype: a.subtype,
          mask: a.mask,
          institutionName: item.institutionName,
          currentBalance: a.balances.current,
          availableBalance: a.balances.available,
        })),
      );
    }

    res.json({ accounts: allAccounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get transactions
plaidRouter.post('/transactions', async (req: AuthenticatedRequest, res) => {
  try {
    const { start_date, end_date } = req.body;
    const itemsSnapshot = await db()
      .collection('users')
      .doc(req.uid!)
      .collection('plaid_items')
      .where('isActive', '==', true)
      .get();

    const allTransactions = [];
    for (const doc of itemsSnapshot.docs) {
      const item = doc.data();
      const accessToken = decrypt(item.accessToken);
      const data = await plaidServerService.getTransactions(accessToken, start_date, end_date);
      allTransactions.push(...data.transactions);
    }

    res.json({ transactions: allTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get income data (recurring transactions that look like income)
plaidRouter.get('/income', async (req: AuthenticatedRequest, res) => {
  try {
    const itemsSnapshot = await db()
      .collection('users')
      .doc(req.uid!)
      .collection('plaid_items')
      .where('isActive', '==', true)
      .get();

    const incomeStreams = [];
    for (const doc of itemsSnapshot.docs) {
      const item = doc.data();
      const accessToken = decrypt(item.accessToken);
      const data = await plaidServerService.getRecurringTransactions(accessToken);
      // Inflow streams = income
      incomeStreams.push(
        ...data.inflow_streams.map((stream) => ({
          name: stream.description,
          amount: Math.abs(stream.average_amount.amount ?? 0),
          frequency: stream.frequency,
          lastDetected: stream.last_date,
          isActive: stream.is_active,
        })),
      );
    }

    res.json({ incomeStreams });
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income data' });
  }
});

// Webhook handler (called by Plaid, not by our app)
plaidRouter.post('/webhook', async (req, res) => {
  // TODO: Verify Plaid webhook signature
  // TODO: Handle webhook types:
  //   - TRANSACTIONS: DEFAULT_UPDATE, INITIAL_UPDATE, HISTORICAL_UPDATE
  //   - INCOME: INCOME_VERIFICATION
  //   - ITEM: ERROR, PENDING_EXPIRATION
  console.log('Plaid webhook received:', req.body.webhook_type, req.body.webhook_code);
  res.json({ received: true });
});
