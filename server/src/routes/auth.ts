import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { pool } from '../db'
import { getJwtSecret, requireAuth } from '../middleware/auth'

export const authRouter = Router()

// Rate limit: 5 login attempts per 15 minutes per IP
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
  },
})

// Rate limit for signup: 10 per hour per IP
const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many account creation attempts. Please try again later.',
  },
})

const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const SignupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().min(7, 'Phone must be at least 7 characters').max(20).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
})

// POST /api/auth/login
authRouter.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  const parseResult = LoginSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid email or password format',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { email, password } = parseResult.data

  try {
    // 1. Check in unified users table
    const { rows: userRows } = await pool.query<{
      id: string
      name: string
      email: string
      phone: string | null
      password_hash: string
      role: 'admin' | 'user'
    }>(
      'SELECT id, name, email, phone, password_hash, role FROM users WHERE email = $1 LIMIT 1;',
      [email]
    )

    let authenticatedUser: {
      id: string
      name: string
      email: string
      phone: string | null
      role: 'admin' | 'user'
    } | null = null

    if (userRows.length > 0) {
      const dbUser = userRows[0]
      const isValid = await bcrypt.compare(password, dbUser.password_hash)
      if (isValid) {
        authenticatedUser = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          role: dbUser.role,
        }

        await pool.query(
          "UPDATE users SET last_login_at = timezone('utc'::text, now()) WHERE id = $1;",
          [dbUser.id]
        )
      }
    } else {
      // 2. Fallback check in admin_users if not yet migrated
      const { rows: adminRows } = await pool.query<{
        id: string
        email: string
        password_hash: string
      }>(
        'SELECT id, email, password_hash FROM admin_users WHERE email = $1 LIMIT 1;',
        [email]
      )

      if (adminRows.length > 0) {
        const adminUser = adminRows[0]
        const isValid = await bcrypt.compare(password, adminUser.password_hash)
        if (isValid) {
          authenticatedUser = {
            id: adminUser.id,
            name: 'Admin',
            email: adminUser.email,
            phone: null,
            role: 'admin',
          }

          await pool.query(
            "UPDATE admin_users SET last_login_at = timezone('utc'::text, now()) WHERE id = $1;",
            [adminUser.id]
          )
        }
      }
    }

    if (!authenticatedUser) {
      // Constant time comparison to prevent timing attacks
      await bcrypt.compare(password, '$2a$12$e80yq9gI/fS7Q6uEw0z2b.o3p9cO4Y2p1x9V2F/2e80yq9gI/fS7Q')
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const secret = getJwtSecret()
    const token = jwt.sign(
      {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
      },
      secret,
      { expiresIn: '8h' }
    )

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    }

    // Set standard auth_token and admin_token (for backward compatibility)
    res.cookie('auth_token', token, cookieOptions)
    if (authenticatedUser.role === 'admin') {
      res.cookie('admin_token', token, cookieOptions)
    }

    res.status(200).json({
      success: true,
      user: authenticatedUser,
    })
  } catch (err) {
    console.error('[Auth:Login] Unexpected error:', err)
    res.status(500).json({ error: 'An unexpected authentication error occurred.' })
  }
})

// POST /api/auth/signup
authRouter.post('/signup', signupRateLimiter, async (req: Request, res: Response) => {
  const parseResult = SignupSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid registration details',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { name, email, phone, password } = parseResult.data

  try {
    // Check if email already registered
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1;', [email])
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { rows } = await pool.query<{
      id: string
      name: string
      email: string
      phone: string | null
      role: 'admin' | 'user'
      created_at: string
    }>(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, phone, role, created_at;`,
      [name, email, phone || null, passwordHash]
    )

    const newUser = rows[0]
    const secret = getJwtSecret()
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      secret,
      { expiresIn: '8h' }
    )

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    }

    res.cookie('auth_token', token, cookieOptions)

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    })
  } catch (err) {
    console.error('[Auth:Signup] Error creating account:', err)
    res.status(500).json({ error: 'Failed to create account. Please try again later.' })
  }
})

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
  res.clearCookie('auth_token', cookieOptions)
  res.clearCookie('admin_token', cookieOptions)

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Session not found' })
    return
  }

  try {
    const { rows } = await pool.query<{
      id: string
      name: string
      email: string
      phone: string | null
      role: 'admin' | 'user'
    }>('SELECT id, name, email, phone, role FROM users WHERE id = $1 LIMIT 1;', [req.user.id])

    const user = rows[0] || req.user

    res.status(200).json({
      user,
    })
  } catch {
    res.status(200).json({
      user: req.user,
    })
  }
})
