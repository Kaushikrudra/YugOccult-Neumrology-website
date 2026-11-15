import dotenv from 'dotenv'
import { pool } from './db'

dotenv.config()

interface ReportSeedItem {
  title: string
  price: number
  section: 'personalized' | 'additional'
  defaultPosition?: number
}

const EXISTING_REPORTS_CATALOG: ReportSeedItem[] = [
  // ===========================================================================
  // SECTION: "personalized" (Initial 10 reports)
  // ===========================================================================
  { title: 'Varshphal Report', price: 999, section: 'personalized', defaultPosition: 1 },
  { title: 'Premium Personalized Kundli', price: 599, section: 'personalized', defaultPosition: 2 },
  { title: 'Name Analysis Report', price: 499, section: 'personalized', defaultPosition: 3 },
  { title: 'Couple Kundli Matching Report', price: 499, section: 'personalized', defaultPosition: 4 },
  { title: 'Saturn in Your Birth Chart Report', price: 599, section: 'personalized', defaultPosition: 5 },
  { title: 'Lal Kitab Report', price: 999, section: 'personalized', defaultPosition: 6 },
  { title: 'Rahu Ketu Transit Impact Report', price: 999, section: 'personalized', defaultPosition: 7 },
  { title: 'Jupiter Transit Report', price: 999, section: 'personalized', defaultPosition: 8 },
  { title: 'Sade Sati Report', price: 399, section: 'personalized', defaultPosition: 9 },
  { title: 'Personalized Fortune Report Plus', price: 1100, section: 'personalized', defaultPosition: 10 },

  // ===========================================================================
  // SECTION: "additional" (5 reports)
  // ===========================================================================
  { title: 'Sade Sati & Shani Report', price: 599, section: 'additional', defaultPosition: 1 },
  { title: 'Kaal Sarp Dosh Report', price: 499, section: 'additional', defaultPosition: 2 },
  { title: 'Pitra Dosh & Remedies Report', price: 499, section: 'additional', defaultPosition: 3 },
  { title: '12-Month Future Prediction Report', price: 599, section: 'additional', defaultPosition: 4 },
  { title: 'Gemstone & Rudraksha Recommendation Report', price: 499, section: 'additional', defaultPosition: 5 },
]

const NEW_PERSONALIZED_REPORTS: Omit<ReportSeedItem, 'section'>[] = [
  // ===========================================================================
  // SECTION: "personalized" (9 New Client Reports)
  // ===========================================================================
  { title: 'Personalised Numerology Report', price: 499 },
  { title: 'Career Report', price: 599 },
  { title: 'Business Partner Compatibility Report', price: 999 },
  { title: 'Name Correction Report (Individual Name)', price: 2400 },
  { title: 'Baby Name Report', price: 999 },
  { title: 'Life Partner Compatibility Report', price: 499 },
  { title: 'Brand Name Correction Report', price: 2400 },
  { title: 'Company Name Correction Report', price: 2400 },
  { title: 'Product Name Correction Report', price: 2400 },
]

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, '') // remove &
    .replace(/[()]/g, '') // remove brackets
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function seedReports() {
  console.log('[Seed:Reports] Connecting to database...')
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    let totalInserted = 0
    let totalAlreadyExisted = 0
    const stats = {
      personalized: { inserted: 0, existed: 0 },
      additional: { inserted: 0, existed: 0 },
    }

    // 1. Seed Initial Catalog (if not already present)
    for (const item of EXISTING_REPORTS_CATALOG) {
      const slug = slugifyTitle(item.title)
      const position = item.defaultPosition || 1

      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO reports (
          slug, title, tagline, description, included, price, original_price,
          cover_image_url, badge, is_visible, position, section
        ) VALUES (
          $1, $2, NULL, NULL, '[]'::jsonb, $3, NULL,
          NULL, NULL, true, $4, $5
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id;`,
        [slug, item.title, item.price, position, item.section]
      )

      if (rows.length > 0) {
        totalInserted++
        stats[item.section].inserted++
      } else {
        totalAlreadyExisted++
        stats[item.section].existed++
      }
    }

    // 2. Fetch the current maximum position in the 'personalized' section
    const maxPosRes = await client.query<{ max_pos: number | null }>(
      `SELECT MAX(position) as max_pos FROM reports WHERE section = 'personalized';`
    )
    let currentMaxPos = maxPosRes.rows[0]?.max_pos != null ? Number(maxPosRes.rows[0].max_pos) : 0

    // 3. Seed New Personalized Reports with auto-incremented positions
    for (const item of NEW_PERSONALIZED_REPORTS) {
      const slug = slugifyTitle(item.title)

      // Check if report already exists before assigning next position
      const checkRes = await client.query<{ id: string }>(
        `SELECT id FROM reports WHERE slug = $1;`,
        [slug]
      )

      if (checkRes.rows.length > 0) {
        totalAlreadyExisted++
        stats.personalized.existed++
        continue
      }

      currentMaxPos += 1
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO reports (
          slug, title, tagline, description, included, price, original_price,
          cover_image_url, badge, is_visible, position, section
        ) VALUES (
          $1, $2, NULL, NULL, '[]'::jsonb, $3, NULL,
          NULL, NULL, true, $4, 'personalized'
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id;`,
        [slug, item.title, item.price, currentMaxPos]
      )

      if (rows.length > 0) {
        totalInserted++
        stats.personalized.inserted++
      } else {
        totalAlreadyExisted++
        stats.personalized.existed++
      }
    }

    await client.query('COMMIT')

    // 4. Query total count in 'personalized' section
    const countRes = await client.query<{ count: string }>(
      `SELECT count(*) as count FROM reports WHERE section = 'personalized';`
    )
    const totalPersonalized = Number(countRes.rows[0]?.count || 0)

    console.log('----------------------------------------------------')
    console.log('[Seed:Reports] Seeding completed successfully!')
    console.log(`[Seed:Reports] Total newly inserted: ${totalInserted}`)
    console.log(`[Seed:Reports] Total already existed (skipped): ${totalAlreadyExisted}`)
    console.log(
      `[Seed:Reports] Breakdown - Personalized: ${stats.personalized.inserted} inserted, ${stats.personalized.existed} already existed`
    )
    console.log(
      `[Seed:Reports] Breakdown - Additional: ${stats.additional.inserted} inserted, ${stats.additional.existed} already existed`
    )
    console.log(
      `[Seed:Reports] Total reports in "personalized" section now: ${totalPersonalized}`
    )
    console.log('----------------------------------------------------')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Seed:Reports] Fatal error during seeding:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seedReports().catch((err) => {
  console.error('[Seed:Reports] Unhandled error:', err)
  process.exit(1)
})
