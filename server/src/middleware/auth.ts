import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { pool } from '../db'

dotenv.config()

export interface AuthUserPayload {
  id: string
  email: string
  role: 'admin' | 'user'
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload
      admin?: {
        id: string
        email: string
      }
    }
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[Security] JWT_SECRET environment variable is missing or shorter than 32 characters.'
    )
  }
  return secret
}

/**
 * Validates authenticated user session from httpOnly cookie.
 * Attaches req.user to request.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.auth_token || req.cookies?.admin_token

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Please sign in to continue' })
      return
    }

    const secret = getJwtSecret()
    const decoded = jwt.verify(token, secret) as AuthUserPayload

    if (!decoded || !decoded.id || !decoded.email) {
      res.status(401).json({ error: 'Unauthorized: Invalid authentication session' })
      return
    }

    // Verify user in database to ensure role and account are still valid
    const userRes = await pool.query<{ id: string; email: string; role: 'admin' | 'user' }>(
      'SELECT id, email, role FROM users WHERE id = $1 LIMIT 1;',
      [decoded.id]
    )

    if (userRes.rows.length === 0) {
      // Fallback check in admin_users if migration 004 just applied
      const adminRes = await pool.query<{ id: string; email: string }>(
        'SELECT id, email FROM admin_users WHERE id = $1 LIMIT 1;',
        [decoded.id]
      )

      if (adminRes.rows.length === 0) {
        res.status(401).json({ error: 'Unauthorized: Account not found' })
        return
      }

      req.user = {
        id: adminRes.rows[0].id,
        email: adminRes.rows[0].email,
        role: 'admin',
      }
      req.admin = {
        id: adminRes.rows[0].id,
        email: adminRes.rows[0].email,
      }
      return next()
    }

    const user = userRes.rows[0]
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    if (user.role === 'admin') {
      req.admin = {
        id: user.id,
        email: user.email,
      }
    }

    next()
  } catch (_err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' })
  }
}

/**
 * Requires an authenticated user with 'admin' role.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'admin' && !req.admin) {
      res.status(403).json({ error: 'Forbidden: Administrative privilege required' })
      return
    }
    next()
  })
}
