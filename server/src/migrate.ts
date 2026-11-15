import fs from 'fs'
import path from 'path'
import { pool } from './db'

async function runMigrations() {
  console.log('[Migrate] Starting database migrations...')
  const client = await pool.connect()

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `)

    // 2. Fetch already applied migrations
    const { rows: appliedRows } = await client.query<{ name: string }>(
      'SELECT name FROM schema_migrations ORDER BY id ASC;'
    )
    const appliedSet = new Set(appliedRows.map((r) => r.name))

    // 3. Read migration files from directory
    const migrationsDir = path.resolve(__dirname, '../migrations')
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`)
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b))

    let newlyAppliedCount = 0

    for (const file of files) {
      if (appliedSet.has(file)) {
        continue
      }

      console.log(`[Migrate] Applying migration: ${file}...`)
      const filePath = path.join(migrationsDir, file)
      const sqlContent = fs.readFileSync(filePath, 'utf-8')

      // Run each migration inside a dedicated transaction
      await client.query('BEGIN')
      try {
        await client.query(sqlContent)
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1);',
          [file]
        )
        await client.query('COMMIT')
        console.log(`[Migrate] Successfully applied: ${file}`)
        newlyAppliedCount++
      } catch (migrationErr) {
        await client.query('ROLLBACK')
        console.error(`[Migrate] Failed to apply ${file}. Rolled back.`, migrationErr)
        throw migrationErr
      }
    }

    if (newlyAppliedCount === 0) {
      console.log('[Migrate] Database is up to date. No new migrations to apply.')
    } else {
      console.log(`[Migrate] Completed! ${newlyAppliedCount} migration(s) applied successfully.`)
    }
  } catch (err) {
    console.error('[Migrate] Fatal error during migration execution:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
