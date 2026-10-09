import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../lib/db';
import { hashPassword, comparePassword, generateToken } from '../../lib/auth';
import { expressAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or handle is required'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        issues: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { name, username, email, password, phone, avatarUrl } = parseResult.data;

    if (db.findUserByEmail(email)) {
      return res.status(409).json({ success: false, error: 'A user with this email already exists.' });
    }
    if (db.findUserByUsername(username)) {
      return res.status(409).json({ success: false, error: 'This handle / alias is already taken.' });
    }

    const passwordHash = await hashPassword(password);
    const user = db.createUser({
      name,
      username,
      email,
      phone: phone || '+1 (555) 942-8820',
      passwordHash,
      avatarUrl: avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA',
      isOnline: true,
      statusText: 'Quantum nodes syncing · Standby',
      statusEmoji: '⚡',
      role: 'Nexus Operative',
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    });

    res.cookie('nexus_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Node initialized.',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isOnline: user.isOnline,
        statusText: user.statusText,
        statusEmoji: user.statusEmoji,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        issues: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { identifier, password } = parseResult.data;
    let user = db.findUserByEmail(identifier) || db.findUserByUsername(identifier);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email/alias or passphrase.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email/alias or passphrase.' });
    }

    db.updateUser(user.id, { isOnline: true });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    });

    res.cookie('nexus_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Node authenticated and decrypted.',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isOnline: true,
        statusText: user.statusText,
        statusEmoji: user.statusEmoji,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// GET /api/auth/me (Protected)
router.get('/me', expressAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const user = db.findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User node not found' });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isOnline: user.isOnline,
      statusText: user.statusText,
      statusEmoji: user.statusEmoji,
      role: user.role,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('nexus_auth_token');
  return res.json({ success: true, message: 'Node disconnected.' });
});

export default router;
