import bcrypt from 'bcryptjs'
import { z } from 'zod'
import dotenv from 'dotenv'
import { pool } from './db'

dotenv.config()

const AdminEnvSchema = z.object({
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD must be at least 8 characters long'),
})

async function seedAdmin() {
  console.log('[Seed:Admin] Initializing admin user...')

  const parseResult = AdminEnvSchema.safeParse({
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  })

  if (!parseResult.success) {
    console.error('[Seed:Admin] Configuration error in environment variables:')
    for (const issue of parseResult.error.issues) {
      console.error(` - ${issue.path.join('.')}: ${issue.message}`)
    }
    console.error(
      '[Seed:Admin] Please set valid ADMIN_EMAIL and ADMIN_PASSWORD in server/.env'
    )
    process.exit(1)
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = parseResult.data

  try {
    // Hash password with bcrypt cost 12
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds)

    // Check if admin user already exists
    const existing = await pool.query(
      'SELECT id, email FROM admin_users WHERE email = $1;',
      [ADMIN_EMAIL]
    )

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE admin_users SET password_hash = $1 WHERE email = $2;',
        [passwordHash, ADMIN_EMAIL]
      )
      console.log(`[Seed:Admin] Password updated for existing admin: ${ADMIN_EMAIL}`)
    } else {
      await pool.query(
        'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2);',
        [ADMIN_EMAIL, passwordHash]
      )
      console.log(`[Seed:Admin] Created new admin user: ${ADMIN_EMAIL}`)
    }
  } catch (err) {
    console.error('[Seed:Admin] Error seeding admin user:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seedAdmin()
