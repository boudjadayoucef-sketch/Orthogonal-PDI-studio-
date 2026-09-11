import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized: Missing or invalid authorization header',
      code: 'auth/missing-token'
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized: Empty bearer token',
      code: 'auth/empty-token'
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Error verifying Firebase ID token in requireAuth:', error?.code || error?.message || error);
    if (error?.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Unauthorized: Firebase ID token has expired. Please refresh token.',
        code: 'auth/id-token-expired'
      });
    }
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid authentication token',
      code: 'auth/invalid-token'
    });
  }
};

/**
 * Ensures the authenticated user has one of the allowed roles
 * or is the authoritative Super Admin email.
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }

    const email = user.email?.toLowerCase();
    const isSuperAdminEmail = email === 'boudjada.youcef@gmail.com' || email === 'superadmin@pdi-vision.dz';
    const userRole = (user.role as string) || (isSuperAdminEmail ? 'super_admin' : 'client');

    if (isSuperAdminEmail || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Forbidden: Insufficient privileges for this operation',
      code: 'auth/forbidden-role'
    });
  };
};

export const requireSuperAdmin = requireRole(['super_admin']);

