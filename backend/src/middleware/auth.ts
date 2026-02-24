// backend/src/middleware/auth.ts
// Verifies Firebase ID token from the Authorization header

import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../services/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  uid?: string;
  userEmail?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
