// backend/src/routes/iin.ts
// IIN (Income Increase Neutralization) routes
// Core automation logic: detect income changes → apply rules → redirect surplus

import { Router } from 'express';
import { db } from '../services/firebaseAdmin';
import { AuthenticatedRequest } from '../middleware/auth';

export const iinRouter = Router();

// Get IIN config for the user
iinRouter.get('/config', async (req: AuthenticatedRequest, res) => {
  try {
    const doc = await db().collection('users').doc(req.uid!).collection('iin').doc('config').get();
    if (!doc.exists) {
      res.json({ config: null });
      return;
    }
    res.json({ config: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error fetching IIN config:', error);
    res.status(500).json({ error: 'Failed to fetch IIN config' });
  }
});

// Create or update IIN config
iinRouter.put('/config', async (req: AuthenticatedRequest, res) => {
  try {
    const { baselineIncome, rules, enabled } = req.body;
    const configRef = db().collection('users').doc(req.uid!).collection('iin').doc('config');

    await configRef.set(
      {
        userId: req.uid,
        enabled: enabled ?? true,
        baselineIncome,
        currentIncome: baselineIncome,
        rules: rules || [],
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating IIN config:', error);
    res.status(500).json({ error: 'Failed to update IIN config' });
  }
});

// Get IIN events (income change history)
iinRouter.get('/events', async (req: AuthenticatedRequest, res) => {
  try {
    const snapshot = await db()
      .collection('users')
      .doc(req.uid!)
      .collection('iin')
      .doc('config')
      .collection('events')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ events });
  } catch (error) {
    console.error('Error fetching IIN events:', error);
    res.status(500).json({ error: 'Failed to fetch IIN events' });
  }
});

// Apply or dismiss an IIN event
iinRouter.patch('/events/:eventId', async (req: AuthenticatedRequest, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // 'applied' | 'dismissed'

    const eventRef = db()
      .collection('users')
      .doc(req.uid!)
      .collection('iin')
      .doc('config')
      .collection('events')
      .doc(eventId);

    await eventRef.update({ status, resolvedAt: new Date().toISOString() });

    // If applied, update the budget allocations accordingly
    if (status === 'applied') {
      // TODO: Apply the IIN allocations to the user's budget categories
      // This is where the automation magic happens
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating IIN event:', error);
    res.status(500).json({ error: 'Failed to update IIN event' });
  }
});

// Manually trigger income check (for testing / on-demand)
iinRouter.post('/check-income', async (req: AuthenticatedRequest, res) => {
  try {
    // TODO: Implement income comparison logic
    // 1. Fetch current income from Plaid recurring transactions
    // 2. Compare against stored baseline
    // 3. If increase detected, create an IIN event with proposed allocations
    // 4. Notify user (or auto-apply if automationLevel === 'full')
    res.json({ message: 'Income check triggered', checked: true });
  } catch (error) {
    console.error('Error checking income:', error);
    res.status(500).json({ error: 'Failed to check income' });
  }
});
