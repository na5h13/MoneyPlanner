// Classification Routes — OpenSpec Section 22
// GET  /api/v1/classifications          — list all classifications for user
// POST /api/v1/classifications/detect   — run auto-detection (90-day history)
// PUT  /api/v1/classifications/:id      — user override

import { Router, Request, Response } from 'express';
import { getFirestore } from '../services/firebaseAdmin';
import { detectClassifications } from '../services/classification';

const router = Router();

// GET /api/v1/classifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db
      .collection('users').doc(req.uid).collection('spending_classifications')
      .orderBy('merchant_normalized')
      .get();

    const classifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ data: classifications });
  } catch (err) {
    console.error('GET /classifications error:', err);
    res.status(500).json({ error: 'Failed to fetch classifications' });
  }
});

// POST /api/v1/classifications/detect
// Runs auto-detection on 90-day transaction history
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const count = await detectClassifications(req.uid);
    res.json({ data: { classified: count } });
  } catch (err) {
    console.error('POST /classifications/detect error:', err);
    res.status(500).json({ error: 'Classification detection failed' });
  }
});

// PUT /api/v1/classifications/:id — user override
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const { classification_type } = req.body;

    const validTypes = ['FIXED', 'RECURRING_VARIABLE', 'TRUE_VARIABLE', 'UNCLASSIFIED'];
    if (!validTypes.includes(classification_type)) {
      res.status(400).json({ error: `classification_type must be one of: ${validTypes.join(', ')}` });
      return;
    }

    const ref = db
      .collection('users').doc(req.uid).collection('spending_classifications')
      .doc(req.params.id as string);

    await ref.set({
      classification_type,
      source: 'USER_OVERRIDE',
      reclassification_flag: false,
      updated_at: new Date().toISOString(),
    }, { merge: true });

    const updated = await ref.get();
    res.json({ data: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error('PUT /classifications/:id error:', err);
    res.status(500).json({ error: 'Failed to update classification' });
  }
});

export default router;
