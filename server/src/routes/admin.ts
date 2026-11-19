import { Router, Request, Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import { pool } from '../db'
import { requireAdmin } from '../middleware/auth'
import {
  isStorageConfigured,
  uploadMaterialFile,
  deleteMaterialFile,
  uploadSiteImage,
  uploadEbookFile,
  uploadReportPdf,
  createSignedDownloadUrl,
  getLocalFilePath,
} from '../services/storage'
import {
  grantEnrollment,
  revokeEnrollment,
  reactivateEnrollment,
} from '../services/enrollment'
import { sendAdminPurchaseNotification } from '../services/email'

export const adminRouter = Router()

// Protect all admin endpoints with requireAdmin
adminRouter.use(requireAdmin)

// Schema for pagination
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

// UUID Param Schema
const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid record identifier format'),
})

// Multer memory storage configuration for file materials (max 25MB)
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.mp3',
  '.mp4',
  '.zip',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.docx',
]

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'audio/mpeg',
  'audio/mp3',
  'video/mp4',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const mimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype)
    const extValid = ALLOWED_EXTENSIONS.includes(ext)

    if (mimeValid && extValid) {
      cb(null, true)
    } else {
      cb(
        new Error(
          'Invalid file type. Allowed formats: pdf, mp3, mp4, zip, jpg, png, webp, docx.'
        )
      )
    }
  },
})

// -----------------------------------------------------------------------------
// GET /api/admin/stats
// Returns high-level dashboard metrics
// -----------------------------------------------------------------------------
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*)::int FROM enquiries) AS total_enquiries,
        (SELECT COUNT(*)::int FROM enquiries WHERE is_read = false) AS unread_enquiries,
        (SELECT COUNT(*)::int FROM orders) AS total_orders,
        (SELECT COUNT(*)::int FROM orders WHERE UPPER(status) = 'PAID') AS paid_orders,
        (SELECT COALESCE(SUM(amount), 0)::float FROM orders WHERE UPPER(status) = 'PAID') AS total_revenue;
    `
    const { rows } = await pool.query(statsQuery)
    const result = rows[0] || {}

    res.status(200).json({
      totalEnquiries: result.total_enquiries || 0,
      unreadEnquiries: result.unread_enquiries || 0,
      totalOrders: result.total_orders || 0,
      paidOrders: result.paid_orders || 0,
      totalRevenue: Number(result.total_revenue || 0),
    })
  } catch (err) {
    console.error('[Admin:Stats] Error fetching stats:', err)
    res.status(500).json({ error: 'Failed to retrieve administrative statistics' })
  }
})

// -----------------------------------------------------------------------------
// GET /api/admin/enquiries
// -----------------------------------------------------------------------------
const EnquiriesQuerySchema = PaginationSchema.extend({
  unread: z.enum(['true', 'false']).optional(),
  type: z.enum(['contact', 'free_kundli', 'kundli', 'ask_question', 'all']).optional(),
  lead_status: z.enum(['new', 'contacted', 'done', 'all']).optional(),
})

adminRouter.get('/enquiries', async (req: Request, res: Response) => {
  const queryResult = EnquiriesQuerySchema.safeParse(req.query)
  if (!queryResult.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.flatten() })
    return
  }

  const { page, limit, unread, type, lead_status } = queryResult.data
  const offset = (page - 1) * limit

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (unread === 'true') {
      params.push(false)
      conditions.push(`is_read = $${params.length}`)
    }

    if (type && type !== 'all') {
      if (type === 'kundli') {
        conditions.push(`enquiry_type IN ('kundli', 'free_kundli')`)
      } else {
        params.push(type)
        conditions.push(`enquiry_type = $${params.length}`)
      }
    }

    if (lead_status && lead_status !== 'all') {
      params.push(lead_status)
      conditions.push(`lead_status = $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*)::int AS count FROM enquiries ${whereClause};`
    const countRes = await pool.query(countQuery, params)
    const total = countRes.rows[0]?.count || 0

    const queryParams = [...params, limit, offset]
    const dataQuery = `
      SELECT id, name, email, phone, subject, message, is_read, created_at,
             enquiry_type, whatsapp_number, gender, birth_date, birth_time,
             birth_time_unknown, birth_place, question, consent, consent_at, lead_status,
             amount, question_count
      FROM enquiries
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `
    const { rows } = await pool.query(dataQuery, queryParams)

    res.status(200).json({
      enquiries: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err) {
    console.error('[Admin:Enquiries] Error fetching enquiries:', err)
    res.status(500).json({ error: 'Failed to retrieve enquiries' })
  }
})

// PATCH /api/admin/enquiries/:id
adminRouter.patch('/enquiries/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid enquiry ID' })
    return
  }

  const bodyResult = z
    .object({
      is_read: z.boolean().optional(),
      lead_status: z.enum(['new', 'contacted', 'done']).optional(),
    })
    .refine((data) => data.is_read !== undefined || data.lead_status !== undefined, {
      message: 'Must provide either "is_read" or "lead_status" to update',
    })
    .safeParse(req.body)

  if (!bodyResult.success) {
    res.status(400).json({ error: 'Validation error', details: bodyResult.error.flatten() })
    return
  }

  const { id } = paramResult.data
  const { is_read, lead_status } = bodyResult.data

  const updateFields: string[] = []
  const updateParams: unknown[] = []

  if (is_read !== undefined) {
    updateParams.push(is_read)
    updateFields.push(`is_read = $${updateParams.length}`)
  }

  if (lead_status !== undefined) {
    updateParams.push(lead_status)
    updateFields.push(`lead_status = $${updateParams.length}`)
  }

  updateParams.push(id)

  try {
    const { rows } = await pool.query(
      `UPDATE enquiries
       SET ${updateFields.join(', ')}
       WHERE id = $${updateParams.length}
       RETURNING id, name, email, phone, subject, message, is_read, created_at,
                 enquiry_type, whatsapp_number, gender, birth_date, birth_time,
                 birth_time_unknown, birth_place, question, consent, consent_at, lead_status;`,
      updateParams
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Enquiry not found' })
      return
    }

    res.status(200).json({
      success: true,
      enquiry: rows[0],
    })
  } catch (err) {
    console.error('[Admin:Enquiries:Update] Error updating enquiry:', err)
    res.status(500).json({ error: 'Failed to update enquiry' })
  }
})

// DELETE /api/admin/enquiries/:id
adminRouter.delete('/enquiries/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid enquiry ID' })
    return
  }

  const { id } = paramResult.data

  try {
    const { rows } = await pool.query('DELETE FROM enquiries WHERE id = $1 RETURNING id;', [id])
    if (rows.length === 0) {
      res.status(404).json({ error: 'Enquiry not found' })
      return
    }
    res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully',
      id: rows[0].id,
    })
  } catch (err) {
    console.error('[Admin:Enquiries:Delete] Error deleting enquiry:', err)
    res.status(500).json({ error: 'Failed to delete enquiry' })
  }
})

// -----------------------------------------------------------------------------
// COURSE CMS MANAGEMENT
// -----------------------------------------------------------------------------

const AdminCourseSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(255),
    slug: z.string().trim().optional(),
    description: z.string().trim().min(2, 'Description must be at least 2 characters'),
    category: z.string().trim().min(1, 'Category is required').max(40, 'Category max 40 characters'),
    level: z.enum(['Basic', 'Advanced', 'Basic to Advanced']).nullable().optional(),
    price: z.coerce.number().int().min(0, 'Price must be 0 or greater'),
    original_price: z.coerce.number().int().min(0).nullable().optional(),
    duration: z.string().trim().nullable().optional(),
    image_url: z.string().trim().nullable().optional(),
    instructor: z.string().trim().min(1).default('Anushka Yadav'),
    is_featured: z.boolean().default(false),
    is_package: z.boolean().default(false),
    is_visible: z.boolean().default(true),
    position: z.coerce.number().int().optional(),
    bundle_course_ids: z.array(z.string().uuid()).max(20).optional(),
  })
  .refine(
    (data) => {
      if (data.original_price != null && data.original_price < data.price) {
        return false
      }
      return true
    },
    {
      message: 'Original price (MRP) must be greater than or equal to selling price',
      path: ['original_price'],
    }
  )

function slugifyCourseTitle(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// GET /api/admin/courses
adminRouter.get('/courses', async (_req: Request, res: Response) => {
  try {
    const { rows: courses } = await pool.query(`
      SELECT 
        c.id, c.slug, c.title, c.description, c.category, c.level, c.duration,
        c.price::float AS price,
        c.original_price,
        c.instructor, c.image_url, c.is_package, c.is_featured, c.position, c.is_visible, c.created_at,
        COUNT(m.id)::int AS materials_count
      FROM courses c
      LEFT JOIN course_materials m ON c.id = m.course_id
      GROUP BY c.id
      ORDER BY c.position ASC, c.created_at ASC;
    `)

    // Attach bundle items for packages
    const { rows: bundleItems } = await pool.query<{
      bundle_id: string
      course_id: string
      title: string
    }>(`
      SELECT bi.bundle_id, bi.course_id, c.title
      FROM course_bundle_items bi
      JOIN courses c ON bi.course_id = c.id
      ORDER BY bi.position ASC;
    `)

    const bundleMap = new Map<string, Array<{ id: string; title: string }>>()
    for (const item of bundleItems) {
      if (!bundleMap.has(item.bundle_id)) {
        bundleMap.set(item.bundle_id, [])
      }
      bundleMap.get(item.bundle_id)!.push({ id: item.course_id, title: item.title })
    }

    const formatted = courses.map((course) => ({
      ...course,
      price: Number(course.price),
      original_price: course.original_price != null ? Number(course.original_price) : null,
      bundle_items: course.is_package ? bundleMap.get(course.id) || [] : [],
    }))

    res.status(200).json({ courses: formatted })
  } catch (err) {
    console.error('[Admin:Courses] Error fetching courses:', err)
    res.status(500).json({ error: 'Failed to retrieve courses' })
  }
})

// POST /api/admin/courses
adminRouter.post('/courses', async (req: Request, res: Response) => {
  const parseResult = AdminCourseSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const data = parseResult.data
  let slug = data.slug ? slugifyCourseTitle(data.slug) : slugifyCourseTitle(data.title)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Ensure unique slug
    const existingSlug = await client.query('SELECT id FROM courses WHERE slug = $1 LIMIT 1;', [slug])
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    // Default position if not provided: max position + 1
    let position = data.position
    if (position === undefined) {
      const posRes = await client.query<{ max_pos: number | null }>(
        'SELECT MAX(position) AS max_pos FROM courses;'
      )
      position = (posRes.rows[0]?.max_pos || 0) + 1
    }

    const { rows: courseRows } = await client.query<{ id: string }>(
      `INSERT INTO courses (
        slug, title, description, category, level, price, original_price,
        duration, image_url, instructor, is_featured, is_package, is_visible, position
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      ) RETURNING id;`,
      [
        slug,
        data.title,
        data.description,
        data.category,
        data.level || null,
        data.price,
        data.original_price || null,
        data.duration || null,
        data.image_url || null,
        data.instructor || 'Anushka Yadav',
        data.is_featured,
        data.is_package,
        data.is_visible,
        position,
      ]
    )

    const newCourseId = courseRows[0].id

    // If package, insert bundle items
    if (data.is_package && data.bundle_course_ids && data.bundle_course_ids.length > 0) {
      const { rows: validItems } = await client.query<{ id: string }>(
        `SELECT id FROM courses WHERE id = ANY($1::uuid[]) AND is_package = false;`,
        [data.bundle_course_ids]
      )

      if (validItems.length !== data.bundle_course_ids.length) {
        await client.query('ROLLBACK')
        res.status(400).json({ error: 'One or more bundle course IDs are invalid or are packages themselves.' })
        return
      }

      for (let i = 0; i < data.bundle_course_ids.length; i++) {
        await client.query(
          `INSERT INTO course_bundle_items (bundle_id, course_id, position)
           VALUES ($1, $2, $3);`,
          [newCourseId, data.bundle_course_ids[i], i + 1]
        )
      }
    }

    await client.query('COMMIT')
    res.status(201).json({ success: true, message: 'Course created successfully', id: newCourseId })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Admin:Courses] Error creating course:', err)
    res.status(500).json({ error: 'Failed to create course' })
  } finally {
    client.release()
  }
})

// PUT /api/admin/courses/:id
adminRouter.put('/courses/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid course ID' })
    return
  }
  const courseId = paramResult.data.id

  const parseResult = AdminCourseSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const data = parseResult.data
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    let slug = data.slug ? slugifyCourseTitle(data.slug) : slugifyCourseTitle(data.title)
    const existingSlug = await client.query(
      'SELECT id FROM courses WHERE slug = $1 AND id <> $2 LIMIT 1;',
      [slug, courseId]
    )
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    await client.query(
      `UPDATE courses SET
        slug = $1,
        title = $2,
        description = $3,
        category = $4,
        level = $5,
        price = $6,
        original_price = $7,
        duration = $8,
        image_url = $9,
        instructor = $10,
        is_featured = $11,
        is_package = $12,
        is_visible = $13,
        position = COALESCE($14, position)
       WHERE id = $15;`,
      [
        slug,
        data.title,
        data.description,
        data.category,
        data.level || null,
        data.price,
        data.original_price || null,
        data.duration || null,
        data.image_url || null,
        data.instructor || 'Anushka Yadav',
        data.is_featured,
        data.is_package,
        data.is_visible,
        data.position,
        courseId,
      ]
    )

    // Sync bundle items
    await client.query('DELETE FROM course_bundle_items WHERE bundle_id = $1;', [courseId])

    if (data.is_package && data.bundle_course_ids && data.bundle_course_ids.length > 0) {
      const { rows: validItems } = await client.query<{ id: string }>(
        `SELECT id FROM courses WHERE id = ANY($1::uuid[]) AND is_package = false;`,
        [data.bundle_course_ids]
      )

      if (validItems.length !== data.bundle_course_ids.length) {
        await client.query('ROLLBACK')
        res.status(400).json({ error: 'One or more bundle course IDs are invalid or are packages themselves.' })
        return
      }

      for (let i = 0; i < data.bundle_course_ids.length; i++) {
        await client.query(
          `INSERT INTO course_bundle_items (bundle_id, course_id, position)
           VALUES ($1, $2, $3);`,
          [courseId, data.bundle_course_ids[i], i + 1]
        )
      }
    }

    await client.query('COMMIT')
    res.status(200).json({ success: true, message: 'Course updated successfully' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Admin:Courses] Error updating course:', err)
    res.status(500).json({ error: 'Failed to update course' })
  } finally {
    client.release()
  }
})

// DELETE /api/admin/courses/:id
adminRouter.delete('/courses/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid course ID' })
    return
  }
  const courseId = paramResult.data.id

  try {
    const [enrollRes, orderRes] = await Promise.all([
      pool.query('SELECT 1 FROM enrollments WHERE course_id = $1 LIMIT 1;', [courseId]),
      pool.query('SELECT 1 FROM orders WHERE reference_id = $1 LIMIT 1;', [courseId]),
    ])

    if (enrollRes.rows.length > 0 || orderRes.rows.length > 0) {
      res.status(400).json({
        error: 'Cannot delete course with active student enrollments or orders. Please toggle course visibility to hidden instead.',
      })
      return
    }

    await pool.query('DELETE FROM courses WHERE id = $1;', [courseId])
    res.status(200).json({ success: true, message: 'Course deleted successfully' })
  } catch (err) {
    console.error('[Admin:Courses] Error deleting course:', err)
    res.status(500).json({ error: 'Failed to delete course' })
  }
})

// -----------------------------------------------------------------------------
// COURSE MATERIALS MANAGEMENT
// -----------------------------------------------------------------------------

// GET /api/admin/courses/:id/materials
adminRouter.get('/courses/:id/materials', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid course ID' })
    return
  }

  const courseId = paramResult.data.id

  try {
    const { rows } = await pool.query(
      `SELECT id, course_id, title, kind, url, file_name, size_bytes, position, is_visible, created_at
       FROM course_materials
       WHERE course_id = $1
       ORDER BY position ASC, created_at ASC;`,
      [courseId]
    )

    res.status(200).json({ materials: rows })
  } catch (err) {
    console.error('[Admin:Materials] Error fetching materials:', err)
    res.status(500).json({ error: 'Failed to retrieve course materials' })
  }
})

// POST /api/admin/courses/:id/materials (Link / Video Link)
const CreateLinkMaterialSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  kind: z.enum(['link', 'video_link']),
  url: z.string().trim().url('Must be a valid URL (e.g. https://...)'),
})

adminRouter.post('/courses/:id/materials', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid course ID' })
    return
  }

  const bodyResult = CreateLinkMaterialSchema.safeParse(req.body)
  if (!bodyResult.success) {
    res.status(400).json({ error: 'Validation error', details: bodyResult.error.flatten() })
    return
  }

  const courseId = paramResult.data.id
  const { title, kind, url } = bodyResult.data

  try {
    // Get next position
    const posRes = await pool.query<{ next_pos: number }>(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM course_materials WHERE course_id = $1;',
      [courseId]
    )
    const nextPos = posRes.rows[0]?.next_pos || 1

    const { rows } = await pool.query(
      `INSERT INTO course_materials (course_id, title, kind, url, position, is_visible)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, course_id, title, kind, url, file_name, size_bytes, position, is_visible, created_at;`,
      [courseId, title, kind, url, nextPos]
    )

    res.status(201).json({
      success: true,
      material: rows[0],
    })
  } catch (err) {
    console.error('[Admin:Materials:CreateLink] Error:', err)
    res.status(500).json({ error: 'Failed to add link material' })
  }
})

// POST /api/admin/courses/:id/materials/upload (File Upload)
adminRouter.post(
  '/courses/:id/materials/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    const paramResult = UuidParamSchema.safeParse(req.params)
    if (!paramResult.success) {
      res.status(400).json({ error: 'Invalid course ID' })
      return
    }

    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Please select a file to upload' })
      return
    }

    const title = (req.body?.title || file.originalname || 'Course File').trim()
    const courseId = paramResult.data.id

    try {
      // 1. Upload to Supabase private bucket
      const { storagePath, fileName, sizeBytes } = await uploadMaterialFile({
        courseId,
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
      })

      // 2. Next position
      const posRes = await pool.query<{ next_pos: number }>(
        'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM course_materials WHERE course_id = $1;',
        [courseId]
      )
      const nextPos = posRes.rows[0]?.next_pos || 1

      // 3. Insert record
      const { rows } = await pool.query(
        `INSERT INTO course_materials (course_id, title, kind, storage_path, file_name, size_bytes, position, is_visible)
         VALUES ($1, $2, 'file', $3, $4, $5, $6, true)
         RETURNING id, course_id, title, kind, file_name, size_bytes, position, is_visible, created_at;`,
        [courseId, title, storagePath, fileName, sizeBytes, nextPos]
      )

      res.status(201).json({
        success: true,
        material: rows[0],
      })
    } catch (err: any) {
      console.error('[Admin:Materials:Upload] Error:', err)
      res.status(500).json({ error: err?.message || 'Failed to upload material file' })
    }
  }
)

// PUT /api/admin/materials/:id (Update title / visibility)
adminRouter.put('/materials/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid material ID' })
    return
  }

  const { id } = paramResult.data
  const { title, is_visible, url } = req.body || {}

  try {
    const { rows } = await pool.query(
      `UPDATE course_materials
       SET title = COALESCE($1, title),
           is_visible = COALESCE($2, is_visible),
           url = COALESCE($3, url)
       WHERE id = $4
       RETURNING id, course_id, title, kind, url, file_name, size_bytes, position, is_visible, created_at;`,
      [title?.trim() || null, typeof is_visible === 'boolean' ? is_visible : null, url?.trim() || null, id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Material not found' })
      return
    }

    res.status(200).json({ success: true, material: rows[0] })
  } catch (err) {
    console.error('[Admin:Materials:Update] Error:', err)
    res.status(500).json({ error: 'Failed to update course material' })
  }
})

// DELETE /api/admin/materials/:id
adminRouter.delete('/materials/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid material ID' })
    return
  }

  const { id } = paramResult.data

  try {
    const { rows } = await pool.query(
      'SELECT id, kind, storage_path FROM course_materials WHERE id = $1 LIMIT 1;',
      [id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Material not found' })
      return
    }

    const material = rows[0]

    // If file, delete from Supabase storage
    if (material.kind === 'file' && material.storage_path) {
      await deleteMaterialFile(material.storage_path)
    }

    await pool.query('DELETE FROM course_materials WHERE id = $1;', [id])

    res.status(200).json({ success: true, message: 'Material deleted successfully', id })
  } catch (err) {
    console.error('[Admin:Materials:Delete] Error:', err)
    res.status(500).json({ error: 'Failed to delete material' })
  }
})

// GET /api/admin/materials/:id/download (Admin download/preview of material file)
adminRouter.get('/materials/:id/download', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid material ID' })
    return
  }

  const { id } = paramResult.data

  try {
    const { rows } = await pool.query<{
      id: string
      kind: string
      storage_path: string | null
      url: string | null
      file_name: string | null
    }>('SELECT id, kind, storage_path, url, file_name FROM course_materials WHERE id = $1 LIMIT 1;', [id])

    if (rows.length === 0) {
      res.status(404).json({ error: 'Material not found' })
      return
    }

    const mat = rows[0]
    if (mat.kind !== 'file' || !mat.storage_path) {
      if (mat.url) {
        res.redirect(mat.url)
        return
      }
      res.status(400).json({ error: 'Material is not a file' })
      return
    }

    // Check if local file
    const localPath = getLocalFilePath(mat.storage_path)
    if (localPath) {
      res.download(localPath, mat.file_name || 'material.pdf')
      return
    }

    // Otherwise Supabase signed URL
    if (isStorageConfigured()) {
      const signedUrl = await createSignedDownloadUrl(mat.storage_path, 300, {
        download: mat.file_name || true,
      })
      res.redirect(signedUrl)
      return
    }

    res.status(404).json({ error: 'File not found on storage' })
  } catch (err: any) {
    console.error('[Admin:Materials:Download] Error:', err)
    res.status(500).json({ error: err?.message || 'Failed to download material file' })
  }
})

// PUT /api/admin/courses/:id/materials/reorder
adminRouter.put('/courses/:id/materials/reorder', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid course ID' })
    return
  }

  const { ids } = req.body || {}
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Field "ids" must be an array of material IDs' })
    return
  }

  const courseId = paramResult.data.id
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    for (let i = 0; i < ids.length; i++) {
      await client.query(
        'UPDATE course_materials SET position = $1 WHERE id = $2 AND course_id = $3;',
        [i + 1, ids[i], courseId]
      )
    }
    await client.query('COMMIT')
    res.status(200).json({ success: true, message: 'Materials order updated successfully' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Admin:Materials:Reorder] Error:', err)
    res.status(500).json({ error: 'Failed to reorder materials' })
  } finally {
    client.release()
  }
})

// -----------------------------------------------------------------------------
// ENROLLMENTS MANAGEMENT
// -----------------------------------------------------------------------------

const EnrollmentsQuerySchema = PaginationSchema.extend({
  course_id: z.string().uuid().optional(),
  status: z.enum(['active', 'revoked']).optional(),
  search: z.string().trim().optional(),
})

// GET /api/admin/enrollments
adminRouter.get('/enrollments', async (req: Request, res: Response) => {
  const queryResult = EnrollmentsQuerySchema.safeParse(req.query)
  if (!queryResult.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.flatten() })
    return
  }

  const { page, limit, course_id, status, search } = queryResult.data
  const offset = (page - 1) * limit

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (course_id) {
      params.push(course_id)
      conditions.push(`e.course_id = $${params.length}`)
    }

    if (status) {
      params.push(status)
      conditions.push(`e.status = $${params.length}`)
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      conditions.push(
        `(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(COALESCE(u.phone, '')) LIKE $${params.length})`
      )
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countQuery = `
      SELECT COUNT(*)::int AS count 
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      ${whereClause};
    `
    const countRes = await pool.query(countQuery, params)
    const total = countRes.rows[0]?.count || 0

    const queryParams = [...params, limit, offset]
    const dataQuery = `
      SELECT 
        e.id,
        e.user_id,
        e.course_id,
        e.order_id,
        e.status,
        e.source,
        e.granted_at,
        u.name AS buyer_name,
        u.email AS buyer_email,
        u.phone AS buyer_phone,
        c.title AS course_title,
        o.amount AS order_amount,
        o.status AS order_status,
        (SELECT MAX(created_at) FROM access_logs al WHERE al.user_id = e.user_id AND al.course_id = e.course_id) AS last_accessed_at,
        (SELECT COUNT(*)::int FROM access_logs al WHERE al.user_id = e.user_id AND al.course_id = e.course_id) AS total_access_count
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN orders o ON e.order_id = o.id
      ${whereClause}
      ORDER BY e.granted_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `
    const { rows } = await pool.query(dataQuery, queryParams)

    res.status(200).json({
      enrollments: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err) {
    console.error('[Admin:Enrollments] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve enrollments' })
  }
})

// POST /api/admin/enrollments (Grant manual enrollment)
const CreateEnrollmentSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  course_id: z.string().uuid('Valid course ID is required'),
})

adminRouter.post('/enrollments', async (req: Request, res: Response) => {
  const parseResult = CreateEnrollmentSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation error', details: parseResult.error.flatten() })
    return
  }

  const { email, course_id } = parseResult.data

  try {
    // 1. Look up user by email
    const userRes = await pool.query<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
      [email]
    )

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found, ask them to sign up first' })
      return
    }

    const targetUser = userRes.rows[0]

    // 2. Check if course exists
    const courseRes = await pool.query<{ id: string; title: string }>(
      'SELECT id, title FROM courses WHERE id = $1 LIMIT 1;',
      [course_id]
    )

    if (courseRes.rows.length === 0) {
      res.status(404).json({ error: 'Course not found' })
      return
    }

    // 3. Grant enrollment
    const result = await grantEnrollment({
      userId: targetUser.id,
      courseId: course_id,
      source: 'admin',
      grantedBy: req.user?.id || req.admin?.id || null,
    })

    res.status(201).json({
      success: true,
      message: result.wasAlreadyActive
        ? 'User already has active access to this course.'
        : `Successfully granted enrollment to ${targetUser.email}`,
      enrollment: result.enrollment,
    })
  } catch (err) {
    console.error('[Admin:Enrollments:Grant] Error:', err)
    res.status(500).json({ error: 'Failed to grant course enrollment' })
  }
})

// PATCH /api/admin/enrollments/:id (Revoke / Reactivate)
const UpdateEnrollmentSchema = z.object({
  status: z.enum(['active', 'revoked']),
})

adminRouter.patch('/enrollments/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid enrollment ID' })
    return
  }

  const bodyResult = UpdateEnrollmentSchema.safeParse(req.body)
  if (!bodyResult.success) {
    res.status(400).json({ error: 'Field "status" must be "active" or "revoked"' })
    return
  }

  const { id } = paramResult.data
  const { status } = bodyResult.data

  try {
    let updated = null
    if (status === 'revoked') {
      updated = await revokeEnrollment(id)
    } else {
      updated = await reactivateEnrollment(id, req.user?.id || req.admin?.id)
    }

    if (!updated) {
      res.status(404).json({ error: 'Enrollment record not found' })
      return
    }

    res.status(200).json({
      success: true,
      enrollment: updated,
    })
  } catch (err) {
    console.error('[Admin:Enrollments:Update] Error:', err)
    res.status(500).json({ error: 'Failed to update enrollment status' })
  }
})

// -----------------------------------------------------------------------------
// GET /api/admin/access-logs
// Audit logs of materials viewed or downloaded
// -----------------------------------------------------------------------------
const AccessLogsQuerySchema = PaginationSchema.extend({
  user_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  action: z.enum(['view', 'download']).optional(),
  search: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

adminRouter.get('/access-logs', async (req: Request, res: Response) => {
  const queryResult = AccessLogsQuerySchema.safeParse(req.query)
  if (!queryResult.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.flatten() })
    return
  }

  const { page, limit, user_id, course_id, action, search, startDate, endDate } = queryResult.data
  const offset = (page - 1) * limit

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (user_id) {
      params.push(user_id)
      conditions.push(`al.user_id = $${params.length}`)
    }

    if (course_id) {
      params.push(course_id)
      conditions.push(`al.course_id = $${params.length}`)
    }

    if (action) {
      params.push(action)
      conditions.push(`al.action = $${params.length}`)
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      conditions.push(
        `(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`
      )
    }

    if (startDate) {
      params.push(startDate)
      conditions.push(`al.created_at >= $${params.length}`)
    }

    if (endDate) {
      params.push(endDate)
      conditions.push(`al.created_at <= $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countQuery = `
      SELECT COUNT(*)::int AS count 
      FROM access_logs al
      JOIN users u ON al.user_id = u.id
      JOIN courses c ON al.course_id = c.id
      ${whereClause};
    `
    const countRes = await pool.query(countQuery, params)
    const total = countRes.rows[0]?.count || 0

    const queryParams = [...params, limit, offset]
    const dataQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.course_id,
        al.material_id,
        al.action,
        al.ip,
        al.user_agent,
        al.created_at,
        u.name AS user_name,
        u.email AS user_email,
        c.title AS course_title,
        m.title AS material_title,
        m.kind AS material_kind
      FROM access_logs al
      JOIN users u ON al.user_id = u.id
      JOIN courses c ON al.course_id = c.id
      LEFT JOIN course_materials m ON al.material_id = m.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `
    const { rows } = await pool.query(dataQuery, queryParams)

    res.status(200).json({
      logs: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err) {
    console.error('[Admin:AccessLogs] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve access logs' })
  }
})

// -----------------------------------------------------------------------------
// GET /api/admin/orders
// Returns orders with customer & linked user buyer info
// -----------------------------------------------------------------------------
const OrdersQuerySchema = PaginationSchema.extend({
  status: z.enum(['PAID', 'PENDING', 'FAILED', 'REFUNDED']).optional(),
})

adminRouter.get('/orders', async (req: Request, res: Response) => {
  const queryResult = OrdersQuerySchema.safeParse(req.query)
  if (!queryResult.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: queryResult.error.flatten() })
    return
  }

  const { page, limit, status } = queryResult.data
  const offset = (page - 1) * limit

  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (status) {
      params.push(status.toUpperCase())
      conditions.push(`UPPER(o.status) = $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*)::int AS count FROM orders o ${whereClause};`
    const countRes = await pool.query(countQuery, params)
    const total = countRes.rows[0]?.count || 0

    const queryParams = [...params, limit, offset]
    const dataQuery = `
      SELECT 
        o.id, 
        o.type, 
        o.reference_id, 
        o.amount, 
        o.status, 
        o.cashfree_order_id, 
        o.customer_name, 
        o.customer_email, 
        o.customer_phone, 
        o.created_at,
        o.user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `
    const { rows } = await pool.query(dataQuery, queryParams)

    res.status(200).json({
      orders: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err) {
    console.error('[Admin:Orders] Error fetching orders:', err)
    res.status(500).json({ error: 'Failed to retrieve orders' })
  }
})

// =============================================================================
// TESTIMONIALS CMS
// =============================================================================

const TestimonialInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name must not exceed 80 characters'),
  text: z
    .string()
    .trim()
    .min(1, 'Text is required')
    .max(600, 'Text must not exceed 600 characters'),
  location: z
    .string()
    .trim()
    .max(80, 'Location must not exceed 80 characters')
    .nullable()
    .optional()
    .transform((v) => v || null),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .nullable()
    .optional(),
  is_visible: z.boolean().optional().default(true),
})

const TestimonialsReorderSchema = z.object({
  ids: z.array(z.string().uuid('Invalid UUID in ids')).min(1, 'At least one ID required'),
})

// GET /api/admin/testimonials - list all testimonials (including hidden)
adminRouter.get('/testimonials', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, text, location, rating, position, is_visible, created_at
       FROM testimonials
       ORDER BY position ASC, created_at ASC;`
    )
    res.status(200).json({ testimonials: rows })
  } catch (err) {
    console.error('[Admin:Testimonials:List] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve testimonials' })
  }
})

// POST /api/admin/testimonials - create new testimonial (position at the bottom)
adminRouter.post('/testimonials', async (req: Request, res: Response) => {
  const parseResult = TestimonialInputSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { name, text, location, rating, is_visible } = parseResult.data

  try {
    const posRes = await pool.query<{ next_pos: number }>(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM testimonials;'
    )
    const position = posRes.rows[0]?.next_pos || 1

    const { rows } = await pool.query(
      `INSERT INTO testimonials (name, text, location, rating, position, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, text, location, rating, position, is_visible, created_at;`,
      [name, text, location, rating ?? null, position, is_visible]
    )

    console.log(`[Admin:Action] admin=${req.user?.id} action=create_testimonial entity=${rows[0].id}`)
    res.status(201).json({ success: true, testimonial: rows[0] })
  } catch (err) {
    console.error('[Admin:Testimonials:Create] Error:', err)
    res.status(500).json({ error: 'Failed to create testimonial' })
  }
})

// PUT /api/admin/testimonials/reorder - reorder testimonials in transaction
adminRouter.put('/testimonials/reorder', async (req: Request, res: Response) => {
  const parseResult = TestimonialsReorderSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { ids } = parseResult.data

  // Check for duplicates in input
  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== ids.length) {
    res.status(400).json({ error: 'Duplicate IDs found in reorder list' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Verify all IDs exist in testimonials table
    const { rows: existingRows } = await client.query<{ id: string }>(
      'SELECT id FROM testimonials WHERE id = ANY($1::uuid[]);',
      [ids]
    )

    if (existingRows.length !== ids.length) {
      await client.query('ROLLBACK')
      res.status(400).json({
        error: 'All testimonial IDs in reorder list must exist in the database',
      })
      return
    }

    for (let i = 0; i < ids.length; i++) {
      await client.query(
        'UPDATE testimonials SET position = $1 WHERE id = $2;',
        [i + 1, ids[i]]
      )
    }

    await client.query('COMMIT')
    console.log(`[Admin:Action] admin=${req.user?.id} action=reorder_testimonials count=${ids.length}`)
    res.status(200).json({ success: true, message: 'Testimonials reordered successfully' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Admin:Testimonials:Reorder] Error:', err)
    res.status(500).json({ error: 'Failed to reorder testimonials' })
  } finally {
    client.release()
  }
})

// PUT /api/admin/testimonials/:id - update testimonial
adminRouter.put('/testimonials/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid testimonial ID' })
    return
  }

  const parseResult = TestimonialInputSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { id } = paramResult.data
  const { name, text, location, rating, is_visible } = parseResult.data

  try {
    const { rows } = await pool.query(
      `UPDATE testimonials
       SET name = $1, text = $2, location = $3, rating = $4, is_visible = $5
       WHERE id = $6
       RETURNING id, name, text, location, rating, position, is_visible, created_at;`,
      [name, text, location, rating ?? null, is_visible, id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Testimonial not found' })
      return
    }

    console.log(`[Admin:Action] admin=${req.user?.id} action=update_testimonial entity=${id}`)
    res.status(200).json({ success: true, testimonial: rows[0] })
  } catch (err) {
    console.error('[Admin:Testimonials:Update] Error:', err)
    res.status(500).json({ error: 'Failed to update testimonial' })
  }
})

// DELETE /api/admin/testimonials/:id - delete testimonial
adminRouter.delete('/testimonials/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid testimonial ID' })
    return
  }

  const { id } = paramResult.data

  try {
    const { rows } = await pool.query(
      'DELETE FROM testimonials WHERE id = $1 RETURNING id;',
      [id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Testimonial not found' })
      return
    }

    console.log(`[Admin:Action] admin=${req.user?.id} action=delete_testimonial entity=${id}`)
    res.status(200).json({ success: true, message: 'Testimonial deleted successfully' })
  } catch (err) {
    console.error('[Admin:Testimonials:Delete] Error:', err)
    res.status(500).json({ error: 'Failed to delete testimonial' })
  }
})

// PATCH /api/admin/testimonials/:id/visibility - toggle visibility
adminRouter.patch('/testimonials/:id/visibility', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid testimonial ID' })
    return
  }

  const bodySchema = z.object({
    is_visible: z.boolean(),
  })
  const bodyResult = bodySchema.safeParse(req.body)
  if (!bodyResult.success) {
    res.status(400).json({ error: 'Field "is_visible" (boolean) is required' })
    return
  }

  const { id } = paramResult.data
  const { is_visible } = bodyResult.data

  try {
    const { rows } = await pool.query(
      'UPDATE testimonials SET is_visible = $1 WHERE id = $2 RETURNING id, is_visible;',
      [is_visible, id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Testimonial not found' })
      return
    }

    console.log(`[Admin:Action] admin=${req.user?.id} action=patch_testimonial_visibility entity=${id}`)
    res.status(200).json({ success: true, is_visible: rows[0].is_visible })
  } catch (err) {
    console.error('[Admin:Testimonials:Visibility] Error:', err)
    res.status(500).json({ error: 'Failed to update testimonial visibility' })
  }
})

// =============================================================================
// CONSULTATION SETTINGS CMS
// =============================================================================

const ConsultationAdminSchema = z.object({
  fee: z
    .number()
    .int('Fee must be an integer')
    .min(0, 'Fee cannot be negative')
    .max(100000, 'Fee cannot exceed ₹100,000'),
  duration_minutes: z
    .number()
    .int('Duration must be an integer')
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 480 minutes'),
  services: z
    .array(
      z
        .object({
          id: z.string().optional(),
          title: z
            .string()
            .trim()
            .min(1, 'Service title is required')
            .max(80, 'Service title must not exceed 80 characters'),
          subtitle: z.string().trim().max(150).optional(),
          description: z
            .string()
            .trim()
            .max(400, 'Service description must not exceed 400 characters'),
          inclusions_title: z.string().trim().max(80).optional(),
          deliverables: z
            .array(z.string().trim().max(200, 'Deliverable text max 200 characters'))
            .optional()
            .default([]),
          note: z.string().trim().max(300).optional(),
          badge: z
            .string()
            .trim()
            .max(40, 'Badge max 40 characters')
            .optional()
            .transform((v) => v || undefined),
        })
        .passthrough()
    )
    .max(12, 'Maximum 12 services allowed'),
  process_steps: z
    .array(
      z.object({
        step: z.number().int().optional(),
        title: z
          .string()
          .trim()
          .min(1, 'Step title is required')
          .max(100, 'Step title must not exceed 100 characters'),
        subtitle: z
          .string()
          .trim()
          .max(100, 'Step subtitle must not exceed 100 characters')
          .optional()
          .default(''),
        description: z
          .string()
          .trim()
          .max(500, 'Step description must not exceed 500 characters'),
      })
    )
    .max(10, 'Maximum 10 process steps allowed'),
  faqs: z
    .array(
      z.object({
        id: z.string().optional(),
        question: z
          .string()
          .trim()
          .min(1, 'Question is required')
          .max(200, 'Question must not exceed 200 characters'),
        answer: z
          .string()
          .trim()
          .min(1, 'Answer is required')
          .max(1000, 'Answer must not exceed 1000 characters'),
      })
    )
    .max(20, 'Maximum 20 FAQs allowed'),
})

// GET /api/admin/consultation
adminRouter.get('/consultation', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, fee, duration_minutes, services, process_steps, faqs, updated_at
       FROM consultation_settings
       LIMIT 1;`
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Consultation settings not configured' })
      return
    }

    const row = rows[0]
    res.status(200).json({
      settings: {
        id: row.id,
        fee: Number(row.fee),
        duration_minutes: Number(row.duration_minutes),
        services: row.services || [],
        process_steps: row.process_steps || [],
        faqs: row.faqs || [],
        updated_at: row.updated_at,
      },
    })
  } catch (err) {
    console.error('[Admin:Consultation:Get] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve consultation settings' })
  }
})

// PUT /api/admin/consultation
adminRouter.put('/consultation', async (req: Request, res: Response) => {
  const parseResult = ConsultationAdminSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { fee, duration_minutes, services, process_steps, faqs } = parseResult.data

  try {
    const { rows } = await pool.query(
      `INSERT INTO consultation_settings (
         fee, duration_minutes, services, process_steps, faqs, is_singleton, updated_at
       ) VALUES ($1, $2, $3, $4, $5, true, timezone('utc'::text, now()))
       ON CONFLICT (is_singleton) DO UPDATE SET
         fee = EXCLUDED.fee,
         duration_minutes = EXCLUDED.duration_minutes,
         services = EXCLUDED.services,
         process_steps = EXCLUDED.process_steps,
         faqs = EXCLUDED.faqs,
         updated_at = timezone('utc'::text, now())
       RETURNING id, fee, duration_minutes, services, process_steps, faqs, updated_at;`,
      [
        fee,
        duration_minutes,
        JSON.stringify(services),
        JSON.stringify(process_steps),
        JSON.stringify(faqs),
      ]
    )

    console.log(`[Admin:Action] admin=${req.user?.id} action=update_consultation entity=${rows[0].id}`)
    res.status(200).json({
      success: true,
      settings: {
        id: rows[0].id,
        fee: Number(rows[0].fee),
        duration_minutes: Number(rows[0].duration_minutes),
        services: rows[0].services || [],
        process_steps: rows[0].process_steps || [],
        faqs: rows[0].faqs || [],
        updated_at: rows[0].updated_at,
      },
    })
  } catch (err) {
    console.error('[Admin:Consultation:Update] Error:', err)
    res.status(500).json({ error: 'Failed to update consultation settings' })
  }
})

// -----------------------------------------------------------------------------
// SITE SETTINGS CMS ENDPOINTS & ASSET UPLOADS
// -----------------------------------------------------------------------------

// Dedicated multer for site images (max 2MB, JPEG/PNG/WEBP)
const siteImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid image format. Allowed formats: JPEG, PNG, WEBP'))
    }
  },
})

// POST /api/admin/uploads/site-image
adminRouter.post(
  '/uploads/site-image',
  (req: Request, res: Response, next) => {
    siteImageUpload.single('file')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'Image exceeds maximum allowed size of 2MB' })
          return
        }
        res.status(400).json({ error: err.message })
        return
      } else if (err) {
        res.status(400).json({ error: err.message || 'Image upload error' })
        return
      }
      next()
    })
  },
  async (req: Request, res: Response) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Please select an image file to upload' })
      return
    }

    try {
      const url = await uploadSiteImage({
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
      })

      res.status(200).json({ url })
    } catch (err: any) {
      console.error('[Admin:SiteImage:Upload] Error:', err)
      res.status(500).json({ error: err?.message || 'Failed to upload image' })
    }
  }
)

const SiteSettingsAdminSchema = z.object({
  phone: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v))
    .refine(
      (val) => {
        if (!val) return true
        const digits = val.replace(/\D/g, '')
        return digits.length >= 8 && digits.length <= 15
      },
      { message: 'Phone number must contain between 8 and 15 digits' }
    ),
  whatsapp_number: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v))
    .refine(
      (val) => {
        if (!val) return true
        const digits = val.replace(/\D/g, '')
        return digits.length >= 8 && digits.length <= 15
      },
      { message: 'WhatsApp number must contain between 8 and 15 digits' }
    ),
  email: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v))
    .refine(
      (val) => {
        if (!val) return true
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      },
      { message: 'Must be a valid email address' }
    ),
  address: z
    .string()
    .trim()
    .max(500, 'Address must not exceed 500 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  timings: z
    .string()
    .trim()
    .max(200, 'Timings must not exceed 200 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  social_links: z
    .object({
      instagram: z.string().trim().optional(),
      youtube: z.string().trim().optional(),
      facebook: z.string().trim().optional(),
      linkedin: z.string().trim().optional(),
    })
    .passthrough()
    .optional()
    .default({})
    .refine(
      (obj) => {
        if (!obj) return true
        for (const val of Object.values(obj)) {
          if (val && typeof val === 'string' && val.trim() !== '') {
            try {
              const url = new URL(val)
              if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
            } catch {
              return false
            }
          }
        }
        return true
      },
      { message: 'Social links must be valid URLs (e.g. https://...)' }
    ),
  show_stats: z.boolean().default(false),
  stats: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Stat label is required').max(40, 'Stat label max 40 characters'),
        value: z.string().trim().min(1, 'Stat value is required').max(20, 'Stat value max 20 characters'),
      })
    )
    .max(6, 'Maximum 6 stats allowed')
    .default([]),
  about_name: z
    .string()
    .trim()
    .max(100, 'Name max 100 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  about_title: z
    .string()
    .trim()
    .max(100, 'Title max 100 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  about_bio: z
    .string()
    .trim()
    .max(3000, 'Bio max 3000 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  about_expertise: z
    .array(z.string().trim().min(1).max(50, 'Expertise tag max 50 characters'))
    .max(12, 'Maximum 12 expertise items allowed')
    .default([]),
  about_credentials: z
    .array(z.string().trim().min(1).max(100, 'Credential max 100 characters'))
    .max(10, 'Maximum 10 credentials allowed')
    .default([]),
  about_photo_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  hero_badge: z
    .string()
    .trim()
    .max(100, 'Hero badge max 100 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  hero_headline: z
    .string()
    .trim()
    .max(200, 'Hero headline max 200 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  hero_subtitle: z
    .string()
    .trim()
    .max(500, 'Hero subtitle max 500 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  meta_title: z
    .string()
    .trim()
    .max(80, 'Meta title max 80 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  meta_description: z
    .string()
    .trim()
    .max(200, 'Meta description max 200 characters')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  why_choose_points: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Title is required').max(80, 'Title max 80 characters'),
        description: z.string().trim().min(1, 'Description is required').max(300, 'Description max 300 characters'),
      })
    )
    .max(8, 'Maximum 8 why choose points allowed')
    .default([]),
})

// GET /api/admin/site-settings
adminRouter.get('/site-settings', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, phone, whatsapp_number, email, address, timings, social_links,
              show_stats, stats, about_name, about_title, about_bio,
              about_expertise, about_credentials, about_photo_url,
              hero_badge, hero_headline, hero_subtitle, meta_title, meta_description,
              why_choose_points, updated_at
       FROM site_settings
       LIMIT 1;`
    )

    if (rows.length === 0) {
      res.status(200).json({
        settings: {
          phone: null,
          whatsapp_number: null,
          email: null,
          address: null,
          timings: null,
          social_links: {},
          show_stats: false,
          stats: [],
          about_name: null,
          about_title: null,
          about_bio: null,
          about_expertise: [],
          about_credentials: [],
          about_photo_url: null,
          hero_badge: null,
          hero_headline: null,
          hero_subtitle: null,
          meta_title: null,
          meta_description: null,
          why_choose_points: [],
        },
      })
      return
    }

    const item = rows[0]
    res.status(200).json({
      settings: {
        id: item.id,
        phone: item.phone,
        whatsapp_number: item.whatsapp_number,
        email: item.email,
        address: item.address,
        timings: item.timings,
        social_links: item.social_links || {},
        show_stats: Boolean(item.show_stats),
        stats: item.stats || [],
        about_name: item.about_name,
        about_title: item.about_title,
        about_bio: item.about_bio,
        about_expertise: item.about_expertise || [],
        about_credentials: item.about_credentials || [],
        about_photo_url: item.about_photo_url,
        hero_badge: item.hero_badge,
        hero_headline: item.hero_headline,
        hero_subtitle: item.hero_subtitle,
        meta_title: item.meta_title,
        meta_description: item.meta_description,
        why_choose_points: item.why_choose_points || [],
        updated_at: item.updated_at,
      },
    })
  } catch (err) {
    console.error('[Admin:SiteSettings:Get] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve site settings' })
  }
})

// PUT /api/admin/site-settings
adminRouter.put('/site-settings', async (req: Request, res: Response) => {
  const parseResult = SiteSettingsAdminSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const data = parseResult.data

  try {
    const { rows } = await pool.query(
      `INSERT INTO site_settings (
         phone, whatsapp_number, email, address, timings, social_links,
         show_stats, stats, about_name, about_title, about_bio, about_expertise,
         about_credentials, about_photo_url, hero_badge, hero_headline,
         hero_subtitle, meta_title, meta_description, why_choose_points, is_singleton, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16,
         $17, $18, $19, $20, true, timezone('utc'::text, now())
       )
       ON CONFLICT (is_singleton) DO UPDATE SET
         phone = EXCLUDED.phone,
         whatsapp_number = EXCLUDED.whatsapp_number,
         email = EXCLUDED.email,
         address = EXCLUDED.address,
         timings = EXCLUDED.timings,
         social_links = EXCLUDED.social_links,
         show_stats = EXCLUDED.show_stats,
         stats = EXCLUDED.stats,
         about_name = EXCLUDED.about_name,
         about_title = EXCLUDED.about_title,
         about_bio = EXCLUDED.about_bio,
         about_expertise = EXCLUDED.about_expertise,
         about_credentials = EXCLUDED.about_credentials,
         about_photo_url = EXCLUDED.about_photo_url,
         hero_badge = EXCLUDED.hero_badge,
         hero_headline = EXCLUDED.hero_headline,
         hero_subtitle = EXCLUDED.hero_subtitle,
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         why_choose_points = EXCLUDED.why_choose_points,
         updated_at = timezone('utc'::text, now())
       RETURNING *;`,
      [
        data.phone ?? null,
        data.whatsapp_number ?? null,
        data.email ?? null,
        data.address ?? null,
        data.timings ?? null,
        JSON.stringify(data.social_links || {}),
        data.show_stats,
        JSON.stringify(data.stats || []),
        data.about_name ?? null,
        data.about_title ?? null,
        data.about_bio ?? null,
        JSON.stringify(data.about_expertise || []),
        JSON.stringify(data.about_credentials || []),
        data.about_photo_url ?? null,
        data.hero_badge ?? null,
        data.hero_headline ?? null,
        data.hero_subtitle ?? null,
        data.meta_title ?? null,
        data.meta_description ?? null,
        JSON.stringify(data.why_choose_points || []),
      ]
    )

    // Write audit log safely
    try {
      await pool.query(
        `INSERT INTO admin_action_logs (admin_id, action, entity, details)
         VALUES ($1, $2, $3, $4)`,
        [
          req.user?.id,
          'update_site_settings',
          'site_settings',
          JSON.stringify({ updated_at: rows[0].updated_at }),
        ]
      )
    } catch (logErr) {
      console.warn('[Admin:ActionLog] Warning: failed to record audit log:', logErr)
    }

    console.log(`[Admin:Action] admin=${req.user?.id} action=update_site_settings entity=site_settings`)

    const item = rows[0]
    res.status(200).json({
      success: true,
      settings: {
        id: item.id,
        phone: item.phone,
        whatsapp_number: item.whatsapp_number,
        email: item.email,
        address: item.address,
        timings: item.timings,
        social_links: item.social_links || {},
        show_stats: Boolean(item.show_stats),
        stats: item.stats || [],
        about_name: item.about_name,
        about_title: item.about_title,
        about_bio: item.about_bio,
        about_expertise: item.about_expertise || [],
        about_credentials: item.about_credentials || [],
        about_photo_url: item.about_photo_url,
        hero_badge: item.hero_badge,
        hero_headline: item.hero_headline,
        hero_subtitle: item.hero_subtitle,
        meta_title: item.meta_title,
        meta_description: item.meta_description,
        updated_at: item.updated_at,
      },
    })
  } catch (err) {
    console.error('[Admin:SiteSettings:Update] Error:', err)
    res.status(500).json({ error: 'Failed to update site settings' })
  }
})

// -----------------------------------------------------------------------------
// EBOOKS CMS & DOWNLOADS MANAGEMENT
// -----------------------------------------------------------------------------

// Dedicated multer for PDF ebooks (max 25MB, application/pdf only)
const ebookPdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (file.mimetype === 'application/pdf' && ext === '.pdf') {
      cb(null, true)
    } else {
      cb(new Error('Invalid file format. Only PDF (.pdf) files are allowed.'))
    }
  },
})

const CreateEbookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(150, 'Title must not exceed 150 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .nullable(),
  cover_image_url: z
    .string()
    .trim()
    .url('Cover image must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  is_visible: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .default(true),
  price: z.coerce.number().optional().default(0),
})

const UpdateEbookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(150, 'Title must not exceed 150 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .nullable(),
  cover_image_url: z
    .string()
    .trim()
    .url('Cover image must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  is_visible: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .optional(),
  price: z.coerce.number().optional().default(0),
})

const EbooksReorderSchema = z.object({
  ids: z.array(z.string().uuid('Invalid ebook ID format')).min(1, 'At least one ID required'),
})

const EbookDownloadsQuerySchema = PaginationSchema.extend({
  ebook_id: z.string().uuid('Invalid ebook ID format').optional(),
  search: z.string().trim().optional(),
})

// 1. GET /api/admin/ebooks - list all ebooks (including hidden) with download count
adminRouter.get('/ebooks', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.cover_image_url,
        e.storage_path,
        e.file_name,
        e.size_bytes,
        e.price,
        e.position,
        e.is_visible,
        e.created_at,
        e.updated_at,
        COALESCE(COUNT(ed.id), 0)::int AS download_count
      FROM ebooks e
      LEFT JOIN ebook_downloads ed ON ed.ebook_id = e.id
      GROUP BY e.id
      ORDER BY e.position ASC, e.created_at ASC;
    `)

    res.status(200).json({ success: true, ebooks: rows })
  } catch (err) {
    console.error('[Admin:Ebooks:List] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve ebooks' })
  }
})

// 2. POST /api/admin/ebooks - create new ebook with PDF file upload
adminRouter.post(
  '/ebooks',
  (req: Request, res: Response, next) => {
    ebookPdfUpload.single('file')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'PDF file exceeds maximum allowed size of 25MB' })
          return
        }
        res.status(400).json({ error: err.message })
        return
      } else if (err) {
        res.status(400).json({ error: err.message || 'File upload error' })
        return
      }
      next()
    })
  },
  async (req: Request, res: Response) => {
    if (!isStorageConfigured()) {
      res.status(501).json({
        error: 'Storage not configured. File uploads are disabled. Please configure Supabase storage.',
      })
      return
    }

    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Please select a PDF file to upload' })
      return
    }

    // Strict PDF magic bytes validation (%PDF-)
    if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      res.status(400).json({ error: 'Invalid file format. The uploaded file is not a valid PDF document.' })
      return
    }

    const parseResult = CreateEbookSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parseResult.error.flatten().fieldErrors,
      })
      return
    }

    const { title, description, cover_image_url, is_visible } = parseResult.data

    try {
      // 1. Upload to Supabase private bucket
      const { storagePath, fileName, sizeBytes } = await uploadEbookFile({
        buffer: file.buffer,
        originalName: file.originalname,
      })

      // 2. Compute next position (appended to the bottom)
      const posRes = await pool.query<{ next_pos: number }>(
        'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM ebooks;'
      )
      const nextPos = posRes.rows[0]?.next_pos || 1

      // 3. Insert record with price = 0
      const { rows } = await pool.query(
        `INSERT INTO ebooks (title, description, cover_image_url, storage_path, file_name, size_bytes, price, position, is_visible)
         VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
         RETURNING id, title, description, cover_image_url, file_name, size_bytes, price, position, is_visible, created_at, updated_at;`,
        [
          title,
          description || null,
          cover_image_url || null,
          storagePath,
          fileName,
          sizeBytes,
          nextPos,
          is_visible !== false,
        ]
      )

      console.log(`[Admin:Action] admin=${req.user?.id} action=create_ebook ebook_id=${rows[0].id}`)
      res.status(201).json({
        success: true,
        ebook: { ...rows[0], download_count: 0 },
      })
    } catch (err: any) {
      console.error('[Admin:Ebooks:Create] Error:', err)
      res.status(500).json({ error: err?.message || 'Failed to create ebook' })
    }
  }
)

// 3. PUT /api/admin/ebooks/:id - update ebook metadata and optionally replace PDF file
adminRouter.put(
  '/ebooks/:id',
  (req: Request, res: Response, next) => {
    ebookPdfUpload.single('file')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'PDF file exceeds maximum allowed size of 25MB' })
          return
        }
        res.status(400).json({ error: err.message })
        return
      } else if (err) {
        res.status(400).json({ error: err.message || 'File upload error' })
        return
      }
      next()
    })
  },
  async (req: Request, res: Response) => {
    const paramResult = UuidParamSchema.safeParse(req.params)
    if (!paramResult.success) {
      res.status(400).json({ error: 'Invalid ebook ID format' })
      return
    }

    const { id } = paramResult.data

    const parseResult = UpdateEbookSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parseResult.error.flatten().fieldErrors,
      })
      return
    }

    try {
      const { rows: existingRows } = await pool.query<{
        id: string
        storage_path: string
        file_name: string
        size_bytes: number
      }>('SELECT id, storage_path, file_name, size_bytes FROM ebooks WHERE id = $1;', [id])

      if (existingRows.length === 0) {
        res.status(404).json({ error: 'Ebook not found' })
        return
      }

      const existing = existingRows[0]
      let newStoragePath = existing.storage_path
      let newFileName = existing.file_name
      let newSizeBytes = existing.size_bytes
      let oldStoragePathToDelete: string | null = null

      const file = req.file
      if (file) {
        if (!isStorageConfigured()) {
          res.status(501).json({ error: 'Storage not configured. Cannot replace file.' })
          return
        }

        if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
          res.status(400).json({ error: 'Invalid file format. The replacement file is not a valid PDF document.' })
          return
        }

        const uploaded = await uploadEbookFile({
          buffer: file.buffer,
          originalName: file.originalname,
        })

        newStoragePath = uploaded.storagePath
        newFileName = uploaded.fileName
        newSizeBytes = uploaded.sizeBytes
        oldStoragePathToDelete = existing.storage_path
      }

      const { title, description, cover_image_url, is_visible } = parseResult.data

      const { rows } = await pool.query(
        `UPDATE ebooks
         SET title = COALESCE($1, title),
             description = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE description END,
             cover_image_url = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE cover_image_url END,
             is_visible = COALESCE($4, is_visible),
             storage_path = $5,
             file_name = $6,
             size_bytes = $7,
             price = 0,
             updated_at = timezone('utc'::text, now())
         WHERE id = $8
         RETURNING id, title, description, cover_image_url, file_name, size_bytes, price, position, is_visible, created_at, updated_at;`,
        [
          title || null,
          description !== undefined ? (description || null) : null,
          cover_image_url !== undefined ? (cover_image_url || null) : null,
          is_visible !== undefined ? is_visible : null,
          newStoragePath,
          newFileName,
          newSizeBytes,
          id,
        ]
      )

      // Clean up old storage file after successful DB update
      if (oldStoragePathToDelete) {
        deleteMaterialFile(oldStoragePathToDelete).catch((err) => {
          console.warn('[Admin:Ebooks:Update] Non-fatal error cleaning up old storage file:', err)
        })
      }

      console.log(`[Admin:Action] admin=${req.user?.id} action=update_ebook ebook_id=${id}`)
      res.status(200).json({ success: true, ebook: rows[0] })
    } catch (err: any) {
      console.error('[Admin:Ebooks:Update] Error:', err)
      res.status(500).json({ error: err?.message || 'Failed to update ebook' })
    }
  }
)

// 4. DELETE /api/admin/ebooks/:id - delete ebook and its file from storage
adminRouter.delete('/ebooks/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid ebook ID format' })
    return
  }

  const { id } = paramResult.data

  try {
    const { rows } = await pool.query<{ storage_path: string }>(
      'DELETE FROM ebooks WHERE id = $1 RETURNING storage_path;',
      [id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Ebook not found' })
      return
    }

    if (rows[0].storage_path) {
      await deleteMaterialFile(rows[0].storage_path)
    }

    console.log(`[Admin:Action] admin=${req.user?.id} action=delete_ebook ebook_id=${id}`)
    res.status(200).json({ success: true, message: 'Ebook deleted successfully', id })
  } catch (err) {
    console.error('[Admin:Ebooks:Delete] Error:', err)
    res.status(500).json({ error: 'Failed to delete ebook' })
  }
})

// 5. PATCH /api/admin/ebooks/:id/visibility - toggle ebook visibility
adminRouter.patch('/ebooks/:id/visibility', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid ebook ID format' })
    return
  }

  const { id } = paramResult.data
  const explicitVisible = typeof req.body?.is_visible === 'boolean' ? req.body.is_visible : null

  try {
    const { rows } = await pool.query(
      `UPDATE ebooks
       SET is_visible = COALESCE($1, NOT is_visible),
           updated_at = timezone('utc'::text, now())
       WHERE id = $2
       RETURNING id, is_visible, updated_at;`,
      [explicitVisible, id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Ebook not found' })
      return
    }

    console.log(`[Admin:Action] admin=${req.user?.id} action=toggle_ebook_visibility ebook_id=${id}`)
    res.status(200).json({ success: true, ebook: rows[0] })
  } catch (err) {
    console.error('[Admin:Ebooks:Visibility] Error:', err)
    res.status(500).json({ error: 'Failed to update ebook visibility' })
  }
})

// 6. PUT /api/admin/ebooks/reorder - reorder ebooks in a single transaction
adminRouter.put('/ebooks/reorder', async (req: Request, res: Response) => {
  const parseResult = EbooksReorderSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { ids } = parseResult.data

  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== ids.length) {
    res.status(400).json({ error: 'Duplicate IDs found in reorder list' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: existingRows } = await client.query<{ id: string }>(
      'SELECT id FROM ebooks WHERE id = ANY($1::uuid[]);',
      [ids]
    )

    if (existingRows.length !== ids.length) {
      await client.query('ROLLBACK')
      res.status(400).json({
        error: 'All ebook IDs in reorder list must exist in the database',
      })
      return
    }

    for (let i = 0; i < ids.length; i++) {
      await client.query(
        'UPDATE ebooks SET position = $1 WHERE id = $2;',
        [i + 1, ids[i]]
      )
    }

    await client.query('COMMIT')
    console.log(`[Admin:Action] admin=${req.user?.id} action=reorder_ebooks count=${ids.length}`)
    res.status(200).json({ success: true, message: 'Ebooks reordered successfully' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Admin:Ebooks:Reorder] Error:', err)
    res.status(500).json({ error: 'Failed to reorder ebooks' })
  } finally {
    client.release()
  }
})

// 7. GET /api/admin/ebook-downloads - paginated audit log of ebook downloads
adminRouter.get('/ebook-downloads', async (req: Request, res: Response) => {
  const parseResult = EbookDownloadsQuerySchema.safeParse(req.query)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { page, limit, ebook_id, search } = parseResult.data
  const offset = (page - 1) * limit

  try {
    const conditions: string[] = ['1=1']
    const params: any[] = []

    if (ebook_id) {
      params.push(ebook_id)
      conditions.push(`ed.ebook_id = $${params.length}`)
    }

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR e.title ILIKE $${params.length})`)
    }

    const whereClause = conditions.join(' AND ')

    // 1. Total count
    const countRes = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM ebook_downloads ed
       JOIN users u ON u.id = ed.user_id
       JOIN ebooks e ON e.id = ed.ebook_id
       WHERE ${whereClause};`,
      params
    )
    const total = parseInt(countRes.rows[0]?.total || '0', 10)

    // 2. Paginated rows
    const queryParams = [...params, limit, offset]
    const limitIdx = queryParams.length - 1
    const offsetIdx = queryParams.length

    const { rows } = await pool.query(
      `SELECT 
         ed.id,
         ed.ebook_id,
         ed.user_id,
         ed.ip,
         ed.user_agent,
         ed.created_at,
         u.name AS user_name,
         u.email AS user_email,
         e.title AS ebook_title
       FROM ebook_downloads ed
       JOIN users u ON u.id = ed.user_id
       JOIN ebooks e ON e.id = ed.ebook_id
       WHERE ${whereClause}
       ORDER BY ed.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx};`,
      queryParams
    )

    res.status(200).json({
      success: true,
      downloads: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (err) {
    console.error('[Admin:Ebooks:Downloads] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve ebook download logs' })
  }
})

// =============================================================================
// REPORTS CMS & ORDERS ENDPOINTS
// =============================================================================

// Helper to generate unique slug for reports
async function generateUniqueReportSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug =
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'report'

  let candidate = baseSlug
  let counter = 2
  while (true) {
    const query = excludeId
      ? 'SELECT id FROM reports WHERE slug = $1 AND id != $2 LIMIT 1;'
      : 'SELECT id FROM reports WHERE slug = $1 LIMIT 1;'
    const params = excludeId ? [candidate, excludeId] : [candidate]
    const { rows } = await pool.query(query, params)
    if (rows.length === 0) {
      return candidate
    }
    candidate = `${baseSlug}-${counter}`
    counter++
  }
}

const CreateReportSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
  tagline: z.string().trim().max(140, 'Tagline cannot exceed 140 characters').optional().nullable(),
  description: z.string().trim().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  included: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return Array.isArray(val) ? val : []
    })
    .default([]),
  price: z.coerce.number().int().min(0, 'Price must be non-negative').default(0),
  original_price: z.coerce.number().int().min(0).optional().nullable(),
  cover_image_url: z.string().trim().url().optional().nullable().or(z.literal('')),
  badge: z.enum(['new', 'popular', 'trending', 'best_seller']).optional().nullable().or(z.literal('')),
  section: z.enum(['personalized', 'additional']).default('personalized'),
  is_visible: z.coerce.boolean().default(true),
})

const UpdateReportSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  tagline: z.string().trim().max(140).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  included: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return Array.isArray(val) ? val : []
    })
    .optional(),
  price: z.coerce.number().int().min(0).optional(),
  original_price: z.coerce.number().int().min(0).optional().nullable(),
  cover_image_url: z.string().trim().url().optional().nullable().or(z.literal('')),
  badge: z.enum(['new', 'popular', 'trending', 'best_seller']).optional().nullable().or(z.literal('')),
  section: z.enum(['personalized', 'additional']).optional(),
  is_visible: z.coerce.boolean().optional(),
})

const ReportsReorderSchema = z.object({
  section: z.enum(['personalized', 'additional']).optional(),
  ids: z.array(z.string().uuid()).min(1, 'IDs array cannot be empty'),
})

// 1. GET /api/admin/reports - list all reports (including hidden) with order counts
adminRouter.get('/reports', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        r.id,
        r.slug,
        r.title,
        r.tagline,
        r.description,
        r.included,
        r.price,
        r.original_price,
        CASE 
          WHEN r.original_price IS NOT NULL AND r.original_price > r.price 
          THEN ROUND(((r.original_price - r.price)::numeric / r.original_price) * 100) 
          ELSE NULL 
        END AS discount_percent,
        r.cover_image_url,
        r.badge,
        r.section,
        r.is_visible,
        r.position,
        r.created_at,
        r.updated_at,
        COUNT(ro.id)::int AS orders_count
      FROM reports r
      LEFT JOIN report_orders ro ON ro.report_id = r.id
      GROUP BY r.id
      ORDER BY 
        CASE WHEN r.section = 'personalized' THEN 1 WHEN r.section = 'additional' THEN 2 ELSE 3 END ASC,
        r.position ASC, 
        r.created_at ASC;
    `)

    res.status(200).json({ reports: rows })
  } catch (err) {
    console.error('[Admin:Reports:List] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve reports' })
  }
})

// 2. POST /api/admin/reports - create new report
adminRouter.post('/reports', async (req: Request, res: Response) => {
  const parseResult = CreateReportSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const {
    title,
    tagline,
    description,
    included,
    price,
    original_price,
    cover_image_url,
    badge,
    section,
    is_visible,
  } = parseResult.data

  if (original_price !== null && original_price !== undefined && original_price < price) {
    res.status(400).json({ error: 'Original price cannot be less than selling price' })
    return
  }

  try {
    const slug = await generateUniqueReportSlug(title)

    // Position at the bottom of its section
    const posRes = await pool.query<{ next_pos: string }>(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM reports WHERE section = $1;',
      [section]
    )
    const position = parseInt(posRes.rows[0]?.next_pos || '1', 10)

    const cleanCoverUrl = cover_image_url && cover_image_url.trim() !== '' ? cover_image_url.trim() : null
    const cleanBadge = badge && badge.trim() !== '' ? badge.trim() : null

    const { rows } = await pool.query(
      `INSERT INTO reports (
        slug, title, tagline, description, included, price, original_price,
        cover_image_url, badge, is_visible, position, section
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;`,
      [
        slug,
        title,
        tagline || null,
        description || null,
        JSON.stringify(included || []),
        price,
        original_price !== undefined ? original_price : null,
        cleanCoverUrl,
        cleanBadge,
        is_visible,
        position,
        section,
      ]
    )

    console.log(`[Admin:Action] admin=${req.user?.id} action=create_report report_id=${rows[0].id} section=${section}`)
    res.status(201).json({ success: true, report: rows[0] })
  } catch (err: any) {
    console.error('[Admin:Reports:Create] Error:', err)
    res.status(500).json({ error: err?.message || 'Failed to create report' })
  }
})

// 3. PUT /api/admin/reports/:id - update report
adminRouter.put('/reports/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid report ID format' })
    return
  }

  const { id } = paramResult.data
  const parseResult = UpdateReportSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM reports WHERE id = $1;', [id])
    if (existingRows.length === 0) {
      res.status(404).json({ error: 'Report not found' })
      return
    }

    const current = existingRows[0]
    const data = parseResult.data

    const effectivePrice = data.price !== undefined ? data.price : current.price
    const effectiveOriginalPrice =
      data.original_price !== undefined ? data.original_price : current.original_price

    if (
      effectiveOriginalPrice !== null &&
      effectiveOriginalPrice !== undefined &&
      effectiveOriginalPrice < effectivePrice
    ) {
      res.status(400).json({ error: 'Original price cannot be less than selling price' })
      return
    }

    let finalSlug = current.slug
    if (data.slug && data.slug.trim() !== '' && data.slug !== current.slug) {
      finalSlug = await generateUniqueReportSlug(data.slug, id)
    }

    const cleanCoverUrl =
      data.cover_image_url !== undefined
        ? data.cover_image_url && data.cover_image_url.trim() !== ''
          ? data.cover_image_url.trim()
          : null
        : current.cover_image_url

    const cleanBadge =
      data.badge !== undefined
        ? data.badge && data.badge.trim() !== ''
          ? data.badge.trim()
          : null
        : current.badge

    const finalIncluded =
      data.included !== undefined ? JSON.stringify(data.included) : JSON.stringify(current.included || [])

    // If section changed, put at bottom of new section
    let newPosition = current.position
    const newSection = data.section || current.section
    if (data.section && data.section !== current.section) {
      const posRes = await pool.query<{ next_pos: string }>(
        'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM reports WHERE section = $1;',
        [data.section]
      )
      newPosition = parseInt(posRes.rows[0]?.next_pos || '1', 10)
    }

    const { rows } = await pool.query(
      `UPDATE reports
       SET slug = $1,
           title = COALESCE($2, title),
           tagline = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE tagline END,
           description = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE description END,
           included = $5,
           price = $6,
           original_price = $7,
           cover_image_url = $8,
           badge = $9,
           is_visible = COALESCE($10, is_visible),
           section = $11,
           position = $12,
           updated_at = timezone('utc'::text, now())
       WHERE id = $13
       RETURNING *;`,
      [
        finalSlug,
        data.title || null,
        data.tagline !== undefined ? (data.tagline || null) : null,
        data.description !== undefined ? (data.description || null) : null,
        finalIncluded,
        effectivePrice,
        effectiveOriginalPrice,
        cleanCoverUrl,
        cleanBadge,
        data.is_visible !== undefined ? data.is_visible : null,
        newSection,
        newPosition,
        id,
      ]
    )

    console.log(`[Admin:Action] admin=${req.user?.id} action=update_report report_id=${id}`)
    res.status(200).json({ success: true, report: rows[0] })
  } catch (err: any) {
    console.error('[Admin:Reports:Update] Error:', err)
    res.status(500).json({ error: err?.message || 'Failed to update report' })
  }
})

// 4. DELETE /api/admin/reports/:id - delete report if no orders exist
adminRouter.delete('/reports/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid report ID format' })
    return
  }

  const { id } = paramResult.data

  try {
    const { rows: orderCountRes } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM report_orders WHERE report_id = $1;',
      [id]
    )

    const orderCount = parseInt(orderCountRes[0]?.count || '0', 10)
    if (orderCount > 0) {
      res.status(409).json({ error: 'Hide this report instead; it has orders' })
      return
    }

    const { rows } = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING id;', [id])
    if (rows.length === 0) {
      res.status(404).json({ error: 'Report not found' })
      return
    }

    console.log(`[Admin:Action] admin=${req.user?.id} action=delete_report report_id=${id}`)
    res.status(200).json({ success: true, message: 'Report deleted successfully', id })
  } catch (err) {
    console.error('[Admin:Reports:Delete] Error:', err)
    res.status(500).json({ error: 'Failed to delete report' })
  }
})

// 5. PATCH /api/admin/reports/:id/visibility - toggle report visibility
adminRouter.patch('/reports/:id/visibility', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid report ID format' })
    return
  }

  const { id } = paramResult.data
  const explicitVisible = typeof req.body?.is_visible === 'boolean' ? req.body.is_visible : null

  try {
    const { rows } = await pool.query(
      `UPDATE reports
       SET is_visible = COALESCE($1, NOT is_visible),
           updated_at = timezone('utc'::text, now())
       WHERE id = $2
       RETURNING id, is_visible, updated_at;`,
      [explicitVisible, id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Report not found' })
      return
    }

    console.log(`[Admin:Action] admin=${req.user?.id} action=toggle_report_visibility report_id=${id}`)
    res.status(200).json({ success: true, report: rows[0] })
  } catch (err) {
    console.error('[Admin:Reports:Visibility] Error:', err)
    res.status(500).json({ error: 'Failed to update report visibility' })
  }
})

// 6. PUT /api/admin/reports/reorder - reorder reports within a section in a single transaction
adminRouter.put('/reports/reorder', async (req: Request, res: Response) => {
  const parseResult = ReportsReorderSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { section, ids } = parseResult.data
  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== ids.length) {
    res.status(400).json({ error: 'Duplicate IDs found in reorder list' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (section) {
      const { rows: existingRows } = await client.query<{ id: string; section: string }>(
        'SELECT id, section FROM reports WHERE id = ANY($1::uuid[]);',
        [ids]
      )

      if (existingRows.length !== ids.length) {
        await client.query('ROLLBACK')
        res.status(400).json({
          error: 'All report IDs in reorder list must exist in the database',
        })
        return
      }

      const invalidSection = existingRows.some((r) => r.section !== section)
      if (invalidSection) {
        await client.query('ROLLBACK')
        res.status(400).json({
          error: `All report IDs in reorder list must belong to section: ${section}`,
        })
        return
      }

      for (let i = 0; i < ids.length; i++) {
        await client.query('UPDATE reports SET position = $1 WHERE id = $2 AND section = $3;', [
          i + 1,
          ids[i],
          section,
        ])
      }
    } else {
      const { rows: existingRows } = await client.query<{ id: string }>(
        'SELECT id FROM reports WHERE id = ANY($1::uuid[]);',
        [ids]
      )

      if (existingRows.length !== ids.length) {
        await client.query('ROLLBACK')
        res.status(400).json({
          error: 'All report IDs in reorder list must exist in the database',
        })
        return
      }

      for (let i = 0; i < ids.length; i++) {
        await client.query('UPDATE reports SET position = $1 WHERE id = $2;', [i + 1, ids[i]])
      }
    }

    await client.query('COMMIT')
    console.log(
      `[Admin:Action] admin=${req.user?.id} action=reorder_reports count=${ids.length} section=${section || 'all'}`
    )
    res.status(200).json({ success: true, message: 'Reports reordered successfully' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Admin:Reports:Reorder] Error:', err)
    res.status(500).json({ error: 'Failed to reorder reports' })
  } finally {
    client.release()
  }
})

// -----------------------------------------------------------------------------
// REPORT ORDERS ENDPOINTS
// -----------------------------------------------------------------------------

const ReportOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['new', 'paid', 'in_progress', 'delivered', 'cancelled', 'all']).optional(),
  report_id: z.string().uuid().optional(),
  search: z.string().trim().optional(),
})

const CreateReportOrderSchema = z.object({
  report_id: z.string().uuid().optional().nullable().or(z.literal('')),
  report_title: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  name: z.string().trim().min(1, 'Customer name is required').max(100),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  whatsapp_number: z.string().trim().min(8, 'WhatsApp number is required').max(20),
  gender: z.enum(['male', 'female', 'other']).optional().nullable().or(z.literal('')),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date format must be YYYY-MM-DD').optional().nullable().or(z.literal('')),
  birth_time: z.string().max(10).optional().nullable().or(z.literal('')),
  birth_time_unknown: z.coerce.boolean().default(false),
  birth_place: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  amount: z.coerce.number().int().min(0).default(0),
  status: z.enum(['new', 'paid', 'in_progress', 'delivered', 'cancelled']).default('paid'),
  admin_notes: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
})

const UpdateReportOrderSchema = z.object({
  status: z.enum(['new', 'paid', 'in_progress', 'delivered', 'cancelled']).optional(),
  admin_notes: z.string().trim().max(2000).optional().nullable(),
})

// Multer for report deliver PDF (max 25MB)
const reportPdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== '.pdf' || file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF documents (.pdf) are allowed for reports.'))
      return
    }
    cb(null, true)
  },
})

// 7. GET /api/admin/report-orders - paginated list of report orders
adminRouter.get('/report-orders', async (req: Request, res: Response) => {
  const parseResult = ReportOrdersQuerySchema.safeParse(req.query)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { page, limit, status, report_id, search } = parseResult.data
  const offset = (page - 1) * limit

  try {
    const conditions: string[] = ['1=1']
    const params: any[] = []

    if (status && status !== 'all') {
      params.push(status)
      conditions.push(`ro.status = $${params.length}`)
    }

    if (report_id) {
      params.push(report_id)
      conditions.push(`ro.report_id = $${params.length}`)
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`)
      conditions.push(
        `(ro.name ILIKE $${params.length} OR ro.email ILIKE $${params.length} OR ro.whatsapp_number ILIKE $${params.length} OR ro.report_title ILIKE $${params.length})`
      )
    }

    const whereClause = conditions.join(' AND ')

    // 1. Total count
    const countRes = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM report_orders ro WHERE ${whereClause};`,
      params
    )
    const total = parseInt(countRes.rows[0]?.total || '0', 10)

    // 2. Paginated rows
    const queryParams = [...params, limit, offset]
    const limitIdx = queryParams.length - 1
    const offsetIdx = queryParams.length

    const { rows } = await pool.query(
      `SELECT 
         ro.id,
         ro.report_id,
         ro.report_title,
         ro.order_id,
         ro.user_id,
         ro.source,
         ro.name,
         ro.email,
         ro.whatsapp_number,
         ro.gender,
         ro.birth_date,
         ro.birth_time,
         ro.birth_time_unknown,
         ro.birth_place,
         ro.notes,
         ro.amount,
         ro.status,
         ro.delivered_pdf_path,
         ro.delivered_file_name,
         ro.delivered_at,
         ro.admin_notes,
         ro.created_at,
         ro.updated_at,
         u.name AS user_account_name,
         u.email AS user_account_email
       FROM report_orders ro
       LEFT JOIN users u ON u.id = ro.user_id
       WHERE ${whereClause}
       ORDER BY ro.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx};`,
      queryParams
    )

    res.status(200).json({
      success: true,
      orders: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (err) {
    console.error('[Admin:ReportOrders:List] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve report orders' })
  }
})

// 8. GET /api/admin/report-orders/:id - single order details
adminRouter.get('/report-orders/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid order ID format' })
    return
  }

  const { id } = paramResult.data

  try {
    const { rows } = await pool.query(
      `SELECT 
         ro.*,
         u.name AS user_account_name,
         u.email AS user_account_email
       FROM report_orders ro
       LEFT JOIN users u ON u.id = ro.user_id
       WHERE ro.id = $1;`,
      [id]
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Report order not found' })
      return
    }

    res.status(200).json({ success: true, order: rows[0] })
  } catch (err) {
    console.error('[Admin:ReportOrders:Get] Error:', err)
    res.status(500).json({ error: 'Failed to retrieve report order details' })
  }
})

// 9. POST /api/admin/report-orders - manual order creation
adminRouter.post('/report-orders', async (req: Request, res: Response) => {
  const parseResult = CreateReportOrderSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const {
    report_id,
    report_title,
    name,
    email,
    whatsapp_number,
    gender,
    birth_date,
    birth_time,
    birth_time_unknown,
    birth_place,
    notes,
    amount,
    status,
    admin_notes,
  } = parseResult.data

  try {
    let finalReportTitle = report_title?.trim() || ''
    let finalReportId = report_id && report_id.trim() !== '' ? report_id : null
    let finalAmount = amount

    if (finalReportId) {
      const { rows: repRows } = await pool.query<{ title: string; price: number }>(
        'SELECT title, price FROM reports WHERE id = $1;',
        [finalReportId]
      )
      if (repRows.length > 0) {
        if (!finalReportTitle) {
          finalReportTitle = repRows[0].title
        }
        if (finalAmount === 0 && repRows[0].price > 0) {
          finalAmount = repRows[0].price
        }
      } else {
        res.status(400).json({ error: 'Selected report does not exist' })
        return
      }
    }

    if (!finalReportTitle) {
      res.status(400).json({ error: 'Report title is required' })
      return
    }

    // Check if user exists with provided email
    let matchedUserId: string | null = null
    const cleanEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : null
    if (cleanEmail) {
      const { rows: userRows } = await pool.query<{ id: string }>(
        'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1;',
        [cleanEmail]
      )
      if (userRows.length > 0) {
        matchedUserId = userRows[0].id
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO report_orders (
         report_id, report_title, user_id, source, name, email,
         whatsapp_number, gender, birth_date, birth_time, birth_time_unknown,
         birth_place, notes, amount, status, admin_notes
       ) VALUES ($1, $2, $3, 'manual', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *;`,
      [
        finalReportId,
        finalReportTitle,
        matchedUserId,
        name,
        cleanEmail,
        whatsapp_number,
        gender || null,
        birth_date || null,
        birth_time || null,
        birth_time_unknown,
        birth_place || null,
        notes || null,
        finalAmount,
        status,
        admin_notes || null,
      ]
    )

    console.log(`[Admin:Action] admin=${req.user?.id} action=create_report_order order_id=${rows[0].id}`)

    // Dispatch email notification to yanushka655@gmail.com
    sendAdminPurchaseNotification({
      type: 'report',
      name,
      whatsappNumber: whatsapp_number,
      email: cleanEmail,
      amount: finalAmount,
      reportTitle: finalReportTitle,
      gender: gender || null,
      birthDate: birth_date || null,
      birthTime: birth_time_unknown ? 'Unknown' : birth_time || null,
      birthPlace: birth_place || null,
      notes: notes || null,
    }).catch((err) => console.error('[Admin:ReportOrders:Email] Failed to dispatch admin alert email:', err))

    res.status(201).json({ success: true, order: rows[0] })
  } catch (err: any) {
    console.error('[Admin:ReportOrders:Create] Error:', err)
    res.status(500).json({ error: err?.message || 'Failed to create report order' })
  }
})

// 10. PATCH /api/admin/report-orders/:id - update status and admin_notes
adminRouter.patch('/report-orders/:id', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid order ID format' })
    return
  }

  const { id } = paramResult.data
  const parseResult = UpdateReportOrderSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { status, admin_notes } = parseResult.data

  try {
    const { rows: existingRows } = await pool.query<{ id: string; delivered_at: string | null }>(
      'SELECT id, delivered_at FROM report_orders WHERE id = $1;',
      [id]
    )

    if (existingRows.length === 0) {
      res.status(404).json({ error: 'Report order not found' })
      return
    }

    const existing = existingRows[0]
    const shouldSetDeliveredAt = status === 'delivered' && !existing.delivered_at

    const { rows } = await pool.query(
      `UPDATE report_orders
       SET status = COALESCE($1, status),
           admin_notes = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE admin_notes END,
           delivered_at = CASE WHEN $3 = true THEN timezone('utc'::text, now()) ELSE delivered_at END,
           updated_at = timezone('utc'::text, now())
       WHERE id = $4
       RETURNING *;`,
      [
        status || null,
        admin_notes !== undefined ? (admin_notes || null) : null,
        shouldSetDeliveredAt,
        id,
      ]
    )

    console.log(`[Admin:Action] admin=${req.user?.id} action=update_report_order order_id=${id}`)
    res.status(200).json({ success: true, order: rows[0] })
  } catch (err: any) {
    console.error('[Admin:ReportOrders:Update] Error:', err)
    res.status(500).json({ error: err?.message || 'Failed to update report order' })
  }
})

// 11. POST /api/admin/report-orders/:id/deliver - upload delivered PDF report
adminRouter.post(
  '/report-orders/:id/deliver',
  (req: Request, res: Response, next) => {
    reportPdfUpload.single('file')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'PDF file exceeds maximum allowed size of 25MB' })
          return
        }
        res.status(400).json({ error: err.message })
        return
      } else if (err) {
        res.status(400).json({ error: err.message || 'File upload error' })
        return
      }
      next()
    })
  },
  async (req: Request, res: Response) => {
    const paramResult = UuidParamSchema.safeParse(req.params)
    if (!paramResult.success) {
      res.status(400).json({ error: 'Invalid order ID format' })
      return
    }

    const { id } = paramResult.data
    const file = req.file

    if (!file) {
      res.status(400).json({ error: 'Please select a PDF file to deliver' })
      return
    }

    if (!isStorageConfigured()) {
      res.status(501).json({ error: 'Storage not configured. Cannot upload delivered report.' })
      return
    }

    // PDF Magic bytes check (%PDF-)
    if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      res.status(400).json({ error: 'Invalid file format. The uploaded file is not a valid PDF document.' })
      return
    }

    try {
      const { rows: existingRows } = await pool.query<{ id: string; delivered_pdf_path: string | null }>(
        'SELECT id, delivered_pdf_path FROM report_orders WHERE id = $1;',
        [id]
      )

      if (existingRows.length === 0) {
        res.status(404).json({ error: 'Report order not found' })
        return
      }

      const existing = existingRows[0]
      const oldStoragePathToDelete = existing.delivered_pdf_path

      const uploaded = await uploadReportPdf({
        buffer: file.buffer,
        originalName: file.originalname,
      })

      const { rows } = await pool.query(
        `UPDATE report_orders
         SET delivered_pdf_path = $1,
             delivered_file_name = $2,
             delivered_at = timezone('utc'::text, now()),
             status = 'delivered',
             updated_at = timezone('utc'::text, now())
         WHERE id = $3
         RETURNING *;`,
        [uploaded.storagePath, uploaded.fileName, id]
      )

      if (oldStoragePathToDelete) {
        deleteMaterialFile(oldStoragePathToDelete).catch((err) => {
          console.warn('[Admin:ReportOrders:Deliver] Non-fatal error cleaning up old report PDF:', err)
        })
      }

      console.log(`[Admin:Action] admin=${req.user?.id} action=deliver_report_order order_id=${id}`)
      res.status(200).json({ success: true, order: rows[0] })
    } catch (err: any) {
      console.error('[Admin:ReportOrders:Deliver] Error:', err)
      res.status(500).json({ error: err?.message || 'Failed to deliver report file' })
    }
  }
)

// 12. GET /api/admin/report-orders/:id/file - generate 60s temporary signed download URL for admin
adminRouter.get('/report-orders/:id/file', async (req: Request, res: Response) => {
  const paramResult = UuidParamSchema.safeParse(req.params)
  if (!paramResult.success) {
    res.status(400).json({ error: 'Invalid order ID format' })
    return
  }

  const { id } = paramResult.data

  try {
    const { rows } = await pool.query<{
      delivered_pdf_path: string | null
      delivered_file_name: string | null
    }>('SELECT delivered_pdf_path, delivered_file_name FROM report_orders WHERE id = $1;', [id])

    if (rows.length === 0) {
      res.status(404).json({ error: 'Report order not found' })
      return
    }

    const { delivered_pdf_path, delivered_file_name } = rows[0]
    if (!delivered_pdf_path) {
      res.status(404).json({ error: 'No delivered report file found for this order' })
      return
    }

    if (!isStorageConfigured()) {
      res.status(501).json({ error: 'Storage not configured' })
      return
    }

    const signedUrl = await createSignedDownloadUrl(delivered_pdf_path, 60, {
      download: delivered_file_name || 'report.pdf',
    })

    // Strict security: Never log signedUrl or storage_path
    res.status(200).json({ url: signedUrl })
  } catch (err) {
    console.error('[Admin:ReportOrders:File] Error generating download URL')
    res.status(500).json({ error: 'Failed to generate download URL' })
  }
})



