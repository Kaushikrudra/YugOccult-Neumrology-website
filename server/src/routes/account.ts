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
    // 1. Verify that user has an active enrollment in this specific course
    const enrollmentRes = await pool.query(
      `SELECT id, status FROM enrollments 
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

      // 2. Verify active enrollment for this course
      const enrollmentRes = await pool.query(
        `SELECT id FROM enrollments 
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

      // Check active enrollment
      const enrollmentRes = await pool.query(
        `SELECT id FROM enrollments 
         WHERE user_id = $1 AND course_id = $2 AND status = 'active'
         LIMIT 1;`,
        [userId, mat.course_id]
      )

      if (enrollmentRes.rows.length === 0) {
        res.status(403).json({ error: 'Forbidden: Active enrollment required' })
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
