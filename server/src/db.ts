import { Pool, PoolConfig } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString && process.env.NODE_ENV !== 'test') {
  console.warn('[DB] Warning: DATABASE_URL environment variable is not defined.')
}

const poolConfig: PoolConfig = {
  connectionString: connectionString || undefined,
}

// Configurable SSL for local Postgres vs Supabase / Production
if (
  process.env.DB_SSL === 'true' ||
  (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false')
) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  }
}

export const pool = new Pool(poolConfig)

export const query = (text: string, params?: unknown[]) => {
  return pool.query(text, params)
}

export default pool
