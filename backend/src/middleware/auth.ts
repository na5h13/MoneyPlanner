// Firebase ID token verification middleware
// DEV_MODE: Falls back to 'user-1' if no valid token
// Production: Requires valid Firebase ID token

import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Extend Express Request to include uid
declare global {
  namespace Express {
    interface Request {
      uid: string;
      userEmail: string;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const devMode = process.env.DEV_MODE === 'true';
  const authHeader = req.headers.authorization || '';

  // Try to verify token if present
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.uid = decoded.uid;
      req.userEmail = decoded.email || '';
      next();
      return;
    } catch (err) {
      if (!devMode) {
        const message = err instanceof Error ? err.message : 'Invalid token';
        res.status(401).json({ error: message });
        return;
      }
      // In DEV_MODE, fall through to dev fallback
    }
  }

  // DEV_MODE fallback
  if (devMode) {
    req.uid = req.headers['x-dev-user-id'] as string || 'user-1';
    req.userEmail = 'dev@localhost';
    next();
    return;
  }

  // Production: no token = unauthorized
  res.status(401).json({ error: 'Missing authorization header' });
}
