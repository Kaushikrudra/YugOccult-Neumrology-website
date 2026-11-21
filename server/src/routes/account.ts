import { Router, Request, Response } from 'express'
import { z } from 'zod'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { createSignedDownloadUrl, isStorageConfigured, getLocalFilePath } from '../services/storage'

export const accountRouter = Router()

// All account routes require authenticated user
accountRouter.use(requireAuth)

// Rate limit for material access: 60 requests per 10 minutes per user/IP
const materialAccessLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || '') || 'anonymous',
  message: {
    error: 'Access limit reached. Please wait a moment before downloading or viewing more materials.',
  },
})

// -----------------------------------------------------------------------------
// GET /api/account/courses
// Returns all courses where the current user has an 'active' enrollment
// -----------------------------------------------------------------------------
accountRouter.get('/courses', async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.description,
        c.level,
        c.duration,
        c.image_url,
        e.id AS enrollment_id,
        e.status,
        e.source,
        e.granted_at,
        e.expires_at,
        (e.expires_at IS NOT NULL AND e.expires_at <= timezone('utc'::text, now())) AS is_expired,
        (SELECT COUNT(*)::int FROM course_materials cm WHERE cm.course_id = c.id AND cm.is_visible = true) AS materials_count
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1 AND e.status = 'active'
       ORDER BY e.granted_at DESC;`,
      [userId]
    )

    res.status(200).json({
      courses: rows,
    })
  } catch (err) {
    console.error('[Account:Courses] Error retrieving enrolled courses:', err)
    res.status(500).json({ error: 'Failed to retrieve your courses' })
  }
})

// -----------------------------------------------------------------------------
// GET /api/account/courses/:courseId/materials
// Returns materials for an enrolled course (checks active enrollment; never leaks storage_path)
// -----------------------------------------------------------------------------
accountRouter.get('/courses/:courseId/materials', async (req: Request, res: Response) => {
  const userId = req.user?.id
  const { courseId } = req.params

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    // 1. Verify that user has an active, unexpired enrollment in this specific course
    const enrollmentRes = await pool.query<{
      id: string
      status: string
      expires_at: string | null
      is_expired: boolean
    }>(
      `SELECT id, status, expires_at,
              (expires_at IS NOT NULL AND expires_at <= timezone('utc'::text, now())) AS is_expired
       FROM enrollments 
       WHERE user_id = $1 AND course_id = $2 AND status = 'active' 
       LIMIT 1;`,
      [userId, courseId]
    )

    if (enrollmentRes.rows.length === 0) {
      res.status(403).json({
        error: 'Forbidden: You do not have active enrollment in this course.',
      })
      return
    }

    if (enrollmentRes.rows[0].is_expired) {
      res.status(403).json({
        error: 'Your 1-year course access has expired. Please renew your enrollment to access materials.',
        isExpired: true,
      })
      return
    }

    // 2. Fetch visible materials in assigned position order (omitting storage_path)
    const { rows } = await pool.query(
      `SELECT id, course_id, title, kind, url, file_name, size_bytes, position, created_at
       FROM course_materials
       WHERE course_id = $1 AND is_visible = true
       ORDER BY position ASC, created_at ASC;`,
      [courseId]
    )

    res.status(200).json({
      materials: rows,
    })
  } catch (err) {
    console.error('[Account:Materials] Error retrieving materials:', err)
    res.status(500).json({ error: 'Failed to retrieve course materials' })
  }
})

// -----------------------------------------------------------------------------
// POST /api/account/materials/:id/access
// Verifies active enrollment, logs audit access, and generates 60-second signed URL for files
// -----------------------------------------------------------------------------
const AccessBodySchema = z.object({
  action: z.enum(['view', 'download']).default('view'),
})

accountRouter.post(
  '/materials/:id/access',
  materialAccessLimiter,
  async (req: Request, res: Response) => {
    const userId = req.user?.id
    const { id: materialId } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const bodyResult = AccessBodySchema.safeParse(req.body || {})
    const action = bodyResult.success ? bodyResult.data.action : 'view'

    try {
      // 1. Fetch material info
      const materialRes = await pool.query<{
        id: string
        course_id: string
        title: string
        kind: 'file' | 'video_link' | 'link'
        storage_path: string | null
        url: string | null
        file_name: string | null
      }>(
        `SELECT id, course_id, title, kind, storage_path, url, file_name
         FROM course_materials
         WHERE id = $1 AND is_visible = true
         LIMIT 1;`,
        [materialId]
      )

      if (materialRes.rows.length === 0) {
        res.status(404).json({ error: 'Course material not found or unavailable' })
        return
      }

      const material = materialRes.rows[0]

      // 2. Verify active unexpired enrollment for this course
      const enrollmentRes = await pool.query<{
        id: string
        is_expired: boolean
      }>(
        `SELECT id,
                (expires_at IS NOT NULL AND expires_at <= timezone('utc'::text, now())) AS is_expired
         FROM enrollments 
         WHERE user_id = $1 AND course_id = $2 AND status = 'active'
         LIMIT 1;`,
        [userId, material.course_id]
      )

      if (enrollmentRes.rows.length === 0) {
        res.status(403).json({
          error: 'Forbidden: Active course enrollment is required to access this material.',
        })
        return
      }

      if (enrollmentRes.rows[0].is_expired) {
        res.status(403).json({
          error: 'Your 1-year course access has expired. Please renew your enrollment.',
          isExpired: true,
        })
        return
      }

      // 3. Log into access_logs
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || ''
      const userAgent = req.headers['user-agent'] || ''

      await pool.query(
        `INSERT INTO access_logs (user_id, course_id, material_id, action, ip, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [userId, material.course_id, material.id, action, clientIp, userAgent]
      )

      // 4. Return appropriate access link
      if (material.kind === 'file') {
        if (!material.storage_path) {
          res.status(404).json({ error: 'File resource path not configured.' })
          return
        }

        // Check if local file
        const localPath = getLocalFilePath(material.storage_path)
        if (localPath) {
          res.status(200).json({
            success: true,
            accessType: 'signed_url',
            url: `/api/account/materials/${material.id}/stream`,
            fileName: material.file_name,
            expiresIn: 3600,
          })
          return
        }

        if (!isStorageConfigured()) {
          res.status(503).json({
            error: 'Secure storage service is temporarily unavailable. Please contact support.',
          })
          return
        }

        // Generate 60-second temporary signed URL
        const signedUrl = await createSignedDownloadUrl(material.storage_path, 60)

        res.status(200).json({
          success: true,
          accessType: 'signed_url',
          url: signedUrl,
          fileName: material.file_name,
          expiresIn: 60,
        })
      } else {
        // Link or Video Link
        res.status(200).json({
          success: true,
          accessType: 'link',
          url: material.url,
          title: material.title,
        })
      }
    } catch (err: any) {
      console.error('[Account:Access] Error generating material access:', err)
      res.status(500).json({ error: 'Failed to open course material. Please try again.' })
    }
  }
)

// GET /api/account/materials/:id/stream - stream local file for enrolled students
accountRouter.get(
  '/materials/:id/stream',
  async (req: Request, res: Response) => {
    const userId = req.user?.id
    const { id: materialId } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      const materialRes = await pool.query<{
        id: string
        course_id: string
        kind: string
        storage_path: string | null
        file_name: string | null
      }>(
        `SELECT id, course_id, kind, storage_path, file_name
         FROM course_materials
         WHERE id = $1 AND is_visible = true
         LIMIT 1;`,
        [materialId]
      )

      if (materialRes.rows.length === 0) {
        res.status(404).json({ error: 'Course material not found' })
        return
      }

      const mat = materialRes.rows[0]

      // Check active unexpired enrollment
      const enrollmentRes = await pool.query<{
        id: string
        is_expired: boolean
      }>(
        `SELECT id,
                (expires_at IS NOT NULL AND expires_at <= timezone('utc'::text, now())) AS is_expired
         FROM enrollments 
         WHERE user_id = $1 AND course_id = $2 AND status = 'active'
         LIMIT 1;`,
        [userId, mat.course_id]
      )

      if (enrollmentRes.rows.length === 0 || enrollmentRes.rows[0].is_expired) {
        res.status(403).json({ error: 'Forbidden: Active valid enrollment required' })
        return
      }

      if (mat.kind !== 'file' || !mat.storage_path) {
        res.status(400).json({ error: 'Material is not a file' })
        return
      }

      const localPath = getLocalFilePath(mat.storage_path)
      if (localPath) {
        res.download(localPath, mat.file_name || 'material.pdf')
        return
      }

      res.status(404).json({ error: 'File not found on storage' })
    } catch (err: any) {
      console.error('[Account:Materials:Stream] Error:', err)
      res.status(500).json({ error: 'Failed to stream course material' })
    }
  }
)

// -----------------------------------------------------------------------------
// GET /api/account/orders
// Returns all orders associated with the authenticated user
// -----------------------------------------------------------------------------
accountRouter.get('/orders', async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
        id, type, reference_title, amount::float AS amount,
        LOWER(status) AS status, payment_method, paid_at,
        created_at, cashfree_order_id, failure_reason
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [userId]
    )

    res.status(200).json({ orders: rows })
  } catch (err: any) {
    console.error('[Account:Orders] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve your orders' })
  }
})

// -----------------------------------------------------------------------------
// GET /api/account/ebooks
// Returns all purchased ebooks for the authenticated user
// -----------------------------------------------------------------------------
accountRouter.get('/ebooks', async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
        e.id, e.title, e.description, e.cover_image_url, e.file_name,
        e.size_bytes, e.price, ep.created_at AS purchased_at
       FROM ebook_purchases ep
       JOIN ebooks e ON e.id = ep.ebook_id
       WHERE ep.user_id = $1
       ORDER BY ep.created_at DESC;`,
      [userId]
    )

    res.status(200).json({ ebooks: rows })
  } catch (err: any) {
    console.error('[Account:Ebooks] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve your ebooks' })
  }
})

// -----------------------------------------------------------------------------
// GET /api/account/report-orders
// Returns all report orders placed by the authenticated user
// -----------------------------------------------------------------------------
accountRouter.get('/report-orders', async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
        ro.id, ro.report_id, ro.report_title, ro.amount, ro.status,
        ro.details, ro.delivered_at, ro.delivered_file_name,
        (ro.delivered_pdf_path IS NOT NULL) AS has_file,
        ro.created_at,
        COALESCE(LOWER(o.status), 'pending') AS payment_status
       FROM report_orders ro
       LEFT JOIN orders o ON o.id = ro.order_id
       WHERE ro.user_id = $1
       ORDER BY ro.created_at DESC;`,
      [userId]
    )

    res.status(200).json({ reports: rows })
  } catch (err: any) {
    console.error('[Account:ReportOrders] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve your report orders' })
  }
})

// -----------------------------------------------------------------------------
// POST /api/account/report-orders/:id/download
// Generates 60-second temporary signed URL for customer's delivered report PDF
// -----------------------------------------------------------------------------
accountRouter.post(
  '/report-orders/:id/download',
  materialAccessLimiter,
  async (req: Request, res: Response) => {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      const { rows } = await pool.query<{
        id: string
        user_id: string
        status: string
        delivered_pdf_path: string | null
        delivered_file_name: string | null
      }>(
        `SELECT id, user_id, status, delivered_pdf_path, delivered_file_name
         FROM report_orders
         WHERE id = $1;`,
        [id]
      )

      if (rows.length === 0) {
        res.status(404).json({ error: 'Report order not found' })
        return
      }

      const reportOrder = rows[0]

      if (reportOrder.user_id !== userId) {
        res.status(403).json({ error: 'Forbidden: Access denied' })
        return
      }

      if (reportOrder.status !== 'delivered' || !reportOrder.delivered_pdf_path) {
        res.status(400).json({ error: 'Report PDF is not available yet' })
        return
      }

      if (!isStorageConfigured()) {
        res.status(501).json({ error: 'Secure storage service is temporarily unavailable' })
        return
      }

      const fileName = reportOrder.delivered_file_name || 'Personalised-Report.pdf'
      const signedUrl = await createSignedDownloadUrl(
        reportOrder.delivered_pdf_path,
        60,
        { download: fileName }
      )

      res.status(200).json({ url: signedUrl, fileName })
    } catch (err: any) {
      console.error('[Account:ReportDownload] Error:', err)
      res.status(500).json({ error: 'Failed to generate report download link' })
    }
  }
)
