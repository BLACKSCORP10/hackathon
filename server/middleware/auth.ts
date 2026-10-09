import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../../lib/auth';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function expressAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('nexus_auth_token='));
    if (authCookie) {
      token = authCookie.split('=')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = payload;
  next();
}
