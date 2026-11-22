import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { pool } from '../db'
import { getJwtSecret, requireAuth } from '../middleware/auth'
import { sendMail } from '../services/mail'
import {
  buildPasswordResetEmail,
  buildPasswordChangedEmail,
} from '../services/mailTemplates'

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

// -----------------------------------------------------------------------------
// Rate Limiters for Password Reset
// -----------------------------------------------------------------------------
const forgotPasswordIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || '') || 'anonymous',
  message: {
    error: 'Too many password reset requests from this IP. Please try again after an hour.',
  },
})

const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    return rawEmail ? `email_${rawEmail}` : ipKeyGenerator(req.ip || '') || 'anonymous'
  },
  message: {
    error: 'Too many password reset requests for this email. Please check your inbox or try again later.',
  },
})

const resetPasswordIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || '') || 'anonymous',
  message: {
    error: 'Too many reset attempts from this IP. Please try again later.',
  },
})

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
})

const ResetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(72, 'Password must not exceed 72 characters'),
})

// -----------------------------------------------------------------------------
// POST /api/auth/forgot-password
// -----------------------------------------------------------------------------
authRouter.post(
  '/forgot-password',
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  async (req: Request, res: Response) => {
    const GENERIC_SUCCESS_MESSAGE =
      'If an account exists for this email, we have sent a reset link.'

    const parseResult = ForgotPasswordSchema.safeParse(req.body)
    if (!parseResult.success) {
      // Return 200 generic message even on malformed input to prevent enumeration
      res.status(200).json({ success: true, message: GENERIC_SUCCESS_MESSAGE })
      return
    }

    const { email } = parseResult.data

    try {
      // Find user by email
      const { rows } = await pool.query<{ id: string; name: string; email: string }>(
        'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
        [email]
      )

      if (rows.length > 0) {
        const user = rows[0]

        // 1. Invalidate any existing unused tokens for this user
        await pool.query(
          "UPDATE password_reset_tokens SET used_at = timezone('utc'::text, now()) WHERE user_id = $1 AND used_at IS NULL;",
          [user.id]
        )

        // 2. Generate cryptographically strong random token
        const rawToken = crypto.randomBytes(32).toString('base64url')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        // 3. Store SHA-256 hash in database with 1-hour expiration
        await pool.query(
          `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
           VALUES ($1, $2, timezone('utc'::text, now()) + interval '1 hour');`,
          [user.id, tokenHash]
        )

        // 4. Construct reset link and dispatch non-blocking email
        const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')
        const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`

        const emailData = buildPasswordResetEmail({
          name: user.name,
          resetUrl,
          brandName: 'YugOccult Learning Academy',
        })

        sendMail({
          to: user.email,
          subject: emailData.subject,
          text: emailData.text,
          html: emailData.html,
          template: 'passwordReset',
        }).catch((mailErr) => {
          console.error('[Auth:ForgotPasswordMail] Failed to send email:', mailErr)
        })
      } else {
        // Run dummy hash to balance timing against timing attacks
        crypto.createHash('sha256').update('dummy-token-to-equalize-timing').digest('hex')
      }

      res.status(200).json({
        success: true,
        message: GENERIC_SUCCESS_MESSAGE,
      })
    } catch (err) {
      console.error('[Auth:ForgotPassword] Error:', err)
      // Always return 200 generic response
      res.status(200).json({
        success: true,
        message: GENERIC_SUCCESS_MESSAGE,
      })
    }
  }
)

// -----------------------------------------------------------------------------
// POST /api/auth/reset-password
// -----------------------------------------------------------------------------
authRouter.post(
  '/reset-password',
  resetPasswordIpLimiter,
  async (req: Request, res: Response) => {
    const parseResult = ResetPasswordSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid password format. Password must be between 8 and 72 characters.',
      })
      return
    }

    const { token, password } = parseResult.data

    try {
      // 1. Hash the incoming token with SHA-256 to look up in DB
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex')

      // 2. Look for valid, unexpired, unused token
      const tokenQuery = `
        SELECT t.id, t.user_id, t.expires_at, t.used_at, u.name, u.email
        FROM password_reset_tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.token_hash = $1
          AND t.used_at IS NULL
          AND t.expires_at > timezone('utc'::text, now())
        LIMIT 1;
      `
      const { rows } = await pool.query(tokenQuery, [tokenHash])

      if (rows.length === 0) {
        res.status(400).json({
          error: 'This reset link is invalid or has expired.',
        })
        return
      }

      const resetRecord = rows[0]
      const userId = resetRecord.user_id

      // 3. Hash new password with bcrypt cost 12
      const newPasswordHash = await bcrypt.hash(password, 12)

      // 4. Update user password and mark all tokens for user as used in a transaction
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        await client.query(
          "UPDATE users SET password_hash = $1, updated_at = timezone('utc'::text, now()) WHERE id = $2;",
          [newPasswordHash, userId]
        )

        await client.query(
          "UPDATE password_reset_tokens SET used_at = timezone('utc'::text, now()) WHERE user_id = $1;",
          [userId]
        )

        await client.query('COMMIT')
      } catch (txErr) {
        await client.query('ROLLBACK')
        throw txErr
      } finally {
        client.release()
      }

      // 5. Send confirmation email (fire-and-forget)
      const emailData = buildPasswordChangedEmail({
        name: resetRecord.name,
        brandName: 'YugOccult Learning Academy',
      })

      sendMail({
        to: resetRecord.email,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        template: 'passwordChanged',
      }).catch((mailErr) => {
        console.error('[Auth:PasswordChangedMail] Failed to send email:', mailErr)
      })

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      })
    } catch (err) {
      console.error('[Auth:ResetPassword] Error:', err)
      res.status(500).json({ error: 'An unexpected error occurred while resetting your password.' })
    }
  }
)
