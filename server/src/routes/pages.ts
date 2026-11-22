import { Router, Request, Response } from 'express'
import { pool } from '../db'

export const pagesRouter = Router()

const ALLOWED_SLUGS = ['terms', 'privacy-policy', 'refund-policy'] as const

// -----------------------------------------------------------------------------
// GET /api/pages/:slug
// Public retrieval of legal pages (terms, privacy-policy, refund-policy)
// -----------------------------------------------------------------------------
pagesRouter.get('/pages/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug || !ALLOWED_SLUGS.includes(slug as any)) {
    res.status(404).json({ error: 'Page not found' })
    return
  }

  try {
    const { rows } = await pool.query<{
      slug: string
      title: string
      body: string
      updated_at: string
    }>(
      `SELECT slug, title, body, updated_at
       FROM site_pages
       WHERE slug = $1
       LIMIT 1;`,
      [slug]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Page not found' })
      return
    }

    // Set 60-second public caching
    res.set('Cache-Control', 'public, max-age=60')
    res.status(200).json({
      page: rows[0],
    })
  } catch (err) {
    console.error('[Public:Pages] Error fetching page:', err)
    res.status(500).json({ error: 'Failed to retrieve page' })
  }
})
