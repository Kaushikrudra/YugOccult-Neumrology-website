import { Router, Request, Response } from 'express'
import { z } from 'zod'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'
import { grantEnrollment } from '../services/enrollment'
import { sendAdminPurchaseNotification } from '../services/email'
import { isStorageConfigured, createSignedDownloadUrl, getLocalFilePath } from '../services/storage'
import { sendMail } from '../services/mail'
import {
  buildContactNotificationEmail,
  buildLeadNotificationEmail,
  buildAccessGrantedEmail,
} from '../services/mailTemplates'

export const publicRouter = Router()

// Rate limit: 5 enquiry submissions per 10 minutes per IP
const enquiryRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many enquiry submissions from this IP. Please try again after 10 minutes.',
  },
})

// Rate limit: 5 lead capture submissions per 10 minutes per IP
const leadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || '') || 'anonymous',
  message: {
    error: 'Too many requests from this IP. Please try again after 10 minutes.',
  },
})

// Rate limit: 10 free enrollments per 10 minutes per user / IP
const freeEnrollRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || '') || 'anonymous',
  message: {
    error: 'Too many enrollment attempts. Please try again after 10 minutes.',
  },
})

const PublicEnquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .max(100, 'Email must not exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number must not exceed 20 characters'),
  subject: z
    .string()
    .trim()
    .min(2, 'Subject must be at least 2 characters')
    .max(150, 'Subject must not exceed 150 characters'),
  message: z
    .string()
    .trim()
    .min(5, 'Message must be at least 5 characters')
    .max(2000, 'Message must not exceed 2000 characters'),
  website: z.string().optional().nullable(),
})

// POST /api/enquiries
publicRouter.post(
  '/enquiries',
  enquiryRateLimiter,
  async (req: Request, res: Response) => {
    // 1. Silent Honeypot Detection (Bot trap: return generic success without saving)
    if (req.body?.website && typeof req.body.website === 'string' && req.body.website.trim() !== '') {
      res.status(200).json({
        success: true,
        message: 'Thank you. We have received your message and will get back to you.',
      })
      return
    }

    const parseResult = PublicEnquirySchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parseResult.error.flatten().fieldErrors,
      })
      return
    }

    const { name, email, phone, subject, message } = parseResult.data

    try {
      const { rows } = await pool.query(
        `INSERT INTO enquiries (name, email, phone, subject, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at;`,
        [name, email, phone, subject, message]
      )

      // 2. Dispatch Non-Blocking Admin Notification
      const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'yanushka655@gmail.com'
      const emailData = buildContactNotificationEmail({
        name,
        email,
        phone,
        subject,
        message,
        brandName: 'YugOccult Learning Academy',
      })

      sendMail({
        to: adminEmail,
        replyTo: email,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        template: 'contactNotification',
      }).catch((mailErr) => {
        console.error('[Public:ContactMail] Failed to notify admin:', mailErr)
      })

      res.status(201).json({
        success: true,
        message: 'Thank you. We have received your message and will get back to you.',
        enquiryId: rows[0]?.id,
      })
    } catch (err) {
      console.error('[Public:Enquiry] Database error:', err)
      res.status(500).json({ error: 'Failed to record enquiry. Please try again later.' })
    }
  }
)

// -----------------------------------------------------------------------------
// POST /api/leads
// Public lead capture: Free Kundli Request and Ask the Astrologer
// -----------------------------------------------------------------------------
const LeadBaseSchema = z.object({
  type: z.enum(['free_kundli', 'ask_question']),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must not exceed 80 characters'),
  whatsapp_number: z
    .string()
    .trim()
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '')
        return digits.length >= 10 && digits.length <= 15
      },
      { message: 'WhatsApp number must contain between 10 and 15 digits' }
    ),
  consent: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must agree to be contacted on WhatsApp regarding your request.',
    }),
  website: z.string().optional().nullable(), // Honeypot field
})

const KundliLeadSchema = LeadBaseSchema.extend({
  type: z.enum(['kundli', 'free_kundli']),
  amount: z.number().int().optional().default(499),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Please select a gender (Male, Female, or Other)',
  }),
  birth_date: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false
        const d = new Date(val + 'T00:00:00Z')
        if (isNaN(d.getTime())) return false
        const minDate = new Date('1900-01-01T00:00:00Z')
        const now = new Date()
        return d >= minDate && d <= now
      },
      { message: 'Birth date must be between 1900 and today' }
    ),
  birth_time: z.string().trim().optional().nullable(),
  birth_time_unknown: z.boolean().default(false),
  birth_place: z
    .string()
    .trim()
    .min(2, 'Birth place must be at least 2 characters')
    .max(120, 'Birth place must not exceed 120 characters'),
}).refine(
  (data) => {
    if (data.birth_time_unknown) return true
    if (!data.birth_time || data.birth_time.trim() === '') return false
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(data.birth_time.trim())
  },
  {
    message: 'Please provide a valid birth time (HH:MM in 24-hour format) or check "Not sure"',
    path: ['birth_time'],
  }
)

const AskQuestionLeadSchema = LeadBaseSchema.extend({
  type: z.literal('ask_question'),
  question_count: z.number().int().min(1).max(3).optional().default(1),
  amount: z.number().int().optional().default(499),
  question: z
    .string()
    .trim()
    .min(5, 'Question must be at least 5 characters')
    .max(3000, 'Question must not exceed 3000 characters'),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  birth_date: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false
        const d = new Date(val + 'T00:00:00Z')
        if (isNaN(d.getTime())) return false
        const minDate = new Date('1900-01-01T00:00:00Z')
        const now = new Date()
        return d >= minDate && d <= now
      },
      { message: 'Birth date must be between 1900 and today' }
    ),
  birth_time: z.string().trim().optional().nullable(),
  birth_time_unknown: z.boolean().optional().default(false),
  birth_place: z
    .string()
    .trim()
    .max(120, 'Birth place must not exceed 120 characters')
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (!data.birth_time || data.birth_time.trim() === '' || data.birth_time_unknown) return true
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(data.birth_time.trim())
  },
  {
    message: 'Please provide a valid birth time (HH:MM in 24-hour format)',
    path: ['birth_time'],
  }
)

const PublicLeadSubmissionSchema = z.discriminatedUnion('type', [
  KundliLeadSchema,
  AskQuestionLeadSchema,
])

publicRouter.post(
  '/leads',
  leadRateLimiter,
  async (req: Request, res: Response) => {
    // 1. Silent Honeypot Detection (Bot trap: return generic success without saving)
    if (req.body?.website && typeof req.body.website === 'string' && req.body.website.trim() !== '') {
      res.status(200).json({ ok: true })
      return
    }

    // 2. Strict Zod Validation
    const parseResult = PublicLeadSubmissionSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parseResult.error.flatten().fieldErrors,
      })
      return
    }

    const data = parseResult.data

    // Normalize values
    const cleanedWhatsApp = data.whatsapp_number.replace(/\D/g, '')
    const birthDate = data.birth_date && data.birth_date.trim() !== '' ? data.birth_date : null
    const birthTime =
      data.birth_time_unknown || !data.birth_time || data.birth_time.trim() === ''
        ? null
        : data.birth_time.trim()
    const birthTimeUnknown = Boolean(data.birth_time_unknown)
    const birthPlace = data.birth_place && data.birth_place.trim() !== '' ? data.birth_place.trim() : null
    const gender = data.gender || null
    const question = data.type === 'ask_question' ? data.question.trim() : null
    const questionCount = data.type === 'ask_question' ? data.question_count || 1 : 1
    const amount =
      data.amount ||
      (data.type === 'ask_question'
        ? questionCount === 1
          ? 699
          : questionCount === 2
          ? 999
          : 1599
        : 499)

    const subject =
      data.type === 'ask_question'
        ? `Astrology Question (${questionCount} Qs - ₹${amount})`
        : `Kundli Request (₹${amount})`
    const message = data.type === 'ask_question' ? data.question.trim() : `Kundli Request (₹${amount})`

    try {
      await pool.query(
        `INSERT INTO enquiries (
           name, phone, whatsapp_number, email, subject, message,
           enquiry_type, gender, birth_date, birth_time, birth_time_unknown,
           birth_place, question, consent, consent_at, lead_status,
           amount, question_count
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11,
           $12, $13, $14, timezone('utc'::text, now()), 'new',
           $15, $16
         );`,
        [
          data.name,
          cleanedWhatsApp,
          data.whatsapp_number.trim(),
          null, // email is optional for leads
          subject,
          message,
          data.type,
          gender,
          birthDate,
          birthTime,
          birthTimeUnknown,
          birthPlace,
          question,
          true,
          amount,
          questionCount,
        ]
      )

      // 3. Trigger Email Notification to Admin (ADMIN_NOTIFY_EMAIL / yanushka655@gmail.com)
      const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || 'yanushka655@gmail.com'
      const leadEmail = buildLeadNotificationEmail({
        type: data.type === 'ask_question' ? 'ask_question' : 'kundli',
        name: data.name,
        whatsappNumber: data.whatsapp_number,
        amount,
        birthDate: birthDate || undefined,
        birthTime: birthTime || undefined,
        birthPlace: birthPlace || undefined,
        question: question || undefined,
        brandName: 'YugOccult Learning Academy',
      })

      sendMail({
        to: adminNotifyEmail,
        subject: leadEmail.subject,
        text: leadEmail.text,
        html: leadEmail.html,
        template: 'leadNotification',
      }).catch((mailErr) => {
        console.error('[Public:LeadsMail] Failed to notify admin:', mailErr)
      })

      sendAdminPurchaseNotification({
        type: data.type === 'ask_question' ? 'ask_question' : 'kundli',
        name: data.name,
        whatsappNumber: data.whatsapp_number,
        amount,
        questionCount,
        questions: question,
        gender,
        birthDate,
        birthTime,
        birthPlace,
      }).catch((e) => console.error('[Public:Leads] Failed to dispatch admin alert email:', e))

      res.status(200).json({ ok: true, amount, questionCount })
    } catch (err) {
      console.error('[Public:Leads] Database insertion error:', err)
      res.status(500).json({ error: 'Failed to submit request. Please try again later.' })
    }
  }
)

// -----------------------------------------------------------------------------
// GET /api/courses
// Public catalog listing visible courses with discount percentages and bundle items
// -----------------------------------------------------------------------------
publicRouter.get('/courses', async (_req: Request, res: Response) => {
  try {
    const { rows: courses } = await pool.query(`
      SELECT 
        c.id, c.slug, c.title, c.description, c.category, c.level, c.duration,
        c.price::float AS price,
        c.original_price,
        c.instructor, c.image_url, c.is_package, c.is_featured, c.position
      FROM courses c
      WHERE c.is_visible = true
      ORDER BY c.position ASC, c.created_at ASC;
    `)

    // Fetch bundle items for packages
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

    const formattedCourses = courses.map((course) => {
      const price = Number(course.price)
      const origPrice = course.original_price != null ? Number(course.original_price) : null
      let discountPercent: number | null = null
      if (origPrice != null && origPrice > price) {
        discountPercent = Math.round(((origPrice - price) / origPrice) * 100)
      }

      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        price,
        original_price: origPrice,
        discount_percent: discountPercent,
        instructor: course.instructor || 'Anushka Yadav',
        image_url: course.image_url,
        is_package: Boolean(course.is_package),
        is_featured: Boolean(course.is_featured),
        bundle_items: course.is_package ? bundleMap.get(course.id) || [] : null,
      }
    })

    res.status(200).json({ courses: formattedCourses })
  } catch (err) {
    console.error('[Public:Courses] Error fetching public courses:', err)
    res.status(500).json({ error: 'Failed to retrieve courses' })
  }
})

// -----------------------------------------------------------------------------
// POST /api/courses/:id/enroll-free
// Direct enrollment for free (price = 0) courses
// -----------------------------------------------------------------------------
publicRouter.post(
  '/courses/:id/enroll-free',
  requireAuth,
  freeEnrollRateLimiter,
  async (req: Request, res: Response) => {
    const courseId = req.params.id
    if (!courseId) {
      res.status(400).json({ error: 'Course ID is required' })
      return
    }

    try {
      const { rows } = await pool.query<{
        id: string
        price: number
        is_visible: boolean
        title: string
      }>(
        'SELECT id, price::float AS price, is_visible, title FROM courses WHERE id = $1 LIMIT 1;',
        [courseId]
      )

      if (rows.length === 0 || !rows[0].is_visible) {
        res.status(404).json({ error: 'Course not found' })
        return
      }

      const course = rows[0]
      if (Number(course.price) !== 0) {
        res.status(400).json({ error: 'This course is not free' })
        return
      }

      const { enrollment, wasAlreadyActive } = await grantEnrollment({
        userId: req.user!.id,
        courseId: course.id,
        source: 'free',
      })

      if (!wasAlreadyActive && req.user?.email) {
        const emailContent = buildAccessGrantedEmail({
          courseTitle: course.title,
          accountUrl: `${process.env.CLIENT_URL || 'https://yugoccult.in'}/account`,
          brandName: 'YugOccult Learning Academy',
        })
        sendMail({
          to: req.user.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
          template: 'accessGranted',
        }).catch((mailErr) => {
          console.error('[Public:EnrollFreeMail] Failed to notify user:', mailErr)
        })
      }

      res.status(200).json({
        success: true,
        message: wasAlreadyActive
          ? 'You are already enrolled in this course.'
          : `Successfully enrolled in ${course.title}!`,
        enrollment,
      })
    } catch (err) {
      console.error('[Public:EnrollFree] Error enrolling in free course:', err)
      res.status(500).json({ error: 'Failed to process enrollment. Please try again.' })
    }
  }
)

// -----------------------------------------------------------------------------
// GET /api/testimonials
// Returns only visible testimonials in position order with 60s cache control
// -----------------------------------------------------------------------------
publicRouter.get('/testimonials', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<{
      id: string
      name: string
      text: string
      location: string | null
      rating: number | null
      position: number
      created_at: string
    }>(
      `SELECT id, name, text, location, rating, position, created_at
       FROM testimonials
       WHERE is_visible = true
       ORDER BY position ASC, created_at ASC;`
    )

    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(200).json({ testimonials: rows })
  } catch (err) {
    console.error('[Public:Testimonials] Error retrieving testimonials:', err)
    res.status(500).json({ error: 'Failed to retrieve testimonials' })
  }
})

// -----------------------------------------------------------------------------
// GET /api/consultation
// Returns master consultation settings (fee, duration, services, steps, faqs)
// -----------------------------------------------------------------------------
publicRouter.get('/consultation', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<{
      fee: number
      duration_minutes: number
      services: any
      process_steps: any
      faqs: any
      updated_at: string
    }>(
      `SELECT fee, duration_minutes, services, process_steps, faqs, updated_at
       FROM consultation_settings
       LIMIT 1;`
    )

    if (rows.length === 0) {
      res.status(404).json({ error: 'Consultation settings not found' })
      return
    }

    const item = rows[0]
    res.status(200).json({
      fee: Number(item.fee),
      duration_minutes: Number(item.duration_minutes),
      services: item.services || [],
      process_steps: item.process_steps || [],
      faqs: item.faqs || [],
      updated_at: item.updated_at,
    })
  } catch (err) {
    console.error('[Public:Consultation] Error retrieving consultation settings:', err)
    res.status(500).json({ error: 'Failed to retrieve consultation settings' })
  }
})

// -----------------------------------------------------------------------------
// GET /api/consultation/booked-slots?date=YYYY-MM-DD
// Returns list of already-booked and confirmed slots for a given date
// -----------------------------------------------------------------------------
publicRouter.get('/consultation/booked-slots', async (req: Request, res: Response) => {
  const { date } = req.query
  if (!date || typeof date !== 'string') {
    res.status(200).json({ bookedSlots: [] })
    return
  }

  try {
    const { rows } = await pool.query<{ preferred_slot: string }>(
      `SELECT cb.preferred_slot
       FROM consultation_bookings cb
       JOIN orders o ON cb.order_id = o.id
       WHERE cb.preferred_date = $1
         AND o.status = 'paid'
         AND cb.status NOT IN ('cancelled');`,
      [date]
    )

    res.status(200).json({
      bookedSlots: rows.map((r) => r.preferred_slot),
    })
  } catch (err) {
    console.error('[Public:BookedSlots] Error fetching booked slots:', err)
    res.status(200).json({ bookedSlots: [] })
  }
})

// -----------------------------------------------------------------------------
// GET /api/site-settings
// Returns public site settings (contact details, social links, stats, about, hero, meta)
// -----------------------------------------------------------------------------
publicRouter.get('/site-settings', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<{
      phone: string | null
      whatsapp_number: string | null
      email: string | null
      address: string | null
      timings: string | null
      social_links: any
      show_stats: boolean
      stats: any
      about_name: string | null
      about_title: string | null
      about_bio: string | null
      about_expertise: any
      about_credentials: any
      about_photo_url: string | null
      hero_badge: string | null
      hero_headline: string | null
      hero_subtitle: string | null
      meta_title: string | null
      meta_description: string | null
      why_choose_points: any
      updated_at: string
    }>(
      `SELECT phone, whatsapp_number, email, address, timings, social_links,
              show_stats, stats, about_name, about_title, about_bio,
              about_expertise, about_credentials, about_photo_url,
              hero_badge, hero_headline, hero_subtitle, meta_title, meta_description,
              why_choose_points, updated_at
       FROM site_settings
       LIMIT 1;`
    )

    res.setHeader('Cache-Control', 'public, max-age=60')

    if (rows.length === 0) {
      // Safe empty defaults
      res.status(200).json({
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
      })
      return
    }

    const item = rows[0]
    res.status(200).json({
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
    })
  } catch (err) {
    console.error('[Public:SiteSettings] Error retrieving site settings:', err)
    res.status(500).json({ error: 'Failed to retrieve site settings' })
  }
})

// -----------------------------------------------------------------------------
// PUBLIC EBOOKS ENDPOINTS
// -----------------------------------------------------------------------------

// Rate limit: 20 ebook downloads per 10 minutes per user / IP
const ebookDownloadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || '') || 'anonymous',
  message: {
    error: 'Too many download requests. Please wait a few minutes before trying again.',
  },
})

// GET /api/ebooks - list all visible ebooks (cached for 60 seconds)
publicRouter.get('/ebooks', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, title, description, cover_image_url, size_bytes, price, created_at
      FROM ebooks
      WHERE is_visible = true
      ORDER BY position ASC, created_at ASC;
    `)

    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(200).json({ ebooks: rows })
  } catch (err) {
    console.error('[Public:Ebooks] Error retrieving ebooks:', err)
    res.status(500).json({ error: 'Failed to retrieve ebooks' })
  }
})

// POST /api/ebooks/:id/download - generate temporary secure download URL for authenticated user
publicRouter.post(
  '/ebooks/:id/download',
  requireAuth,
  ebookDownloadLimiter,
  async (req: Request, res: Response) => {
    const { id } = req.params
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid ebook ID format' })
      return
    }

    try {
      const { rows } = await pool.query<{
        id: string
        title: string
        storage_path: string
        file_name: string
        price: number
        is_visible: boolean
      }>(
        `SELECT id, title, storage_path, file_name, price, is_visible
         FROM ebooks
         WHERE id = $1;`,
        [id]
      )

      if (rows.length === 0 || !rows[0].is_visible) {
        res.status(404).json({ error: 'Ebook not found' })
        return
      }

      const ebook = rows[0]

      if (ebook.price > 0) {
        const purchaseRes = await pool.query(
          `SELECT id FROM ebook_purchases WHERE ebook_id = $1 AND user_id = $2 LIMIT 1;`,
          [ebook.id, req.user!.id]
        )
        if (purchaseRes.rows.length === 0) {
          res.status(402).json({ error: 'Purchase required' })
          return
        }
      }

      const localPath = getLocalFilePath(ebook.storage_path)

      if (!localPath && !isStorageConfigured()) {
        res.status(404).json({ error: 'Ebook file not found on storage' })
        return
      }

      // Record download audit log
      const clientIp = req.ip || null
      const userAgent = req.get('user-agent') || null
      await pool.query(
        `INSERT INTO ebook_downloads (ebook_id, user_id, ip, user_agent)
         VALUES ($1, $2, $3, $4);`,
        [ebook.id, req.user!.id, clientIp, userAgent]
      )

      if (localPath) {
        res.status(200).json({ url: `/api/ebooks/${ebook.id}/stream` })
        return
      }

      // Generate 60-second signed download URL with original filename
      const signedUrl = await createSignedDownloadUrl(ebook.storage_path, 60, {
        download: ebook.file_name,
      })

      // Strict security: Never log signedUrl or storage_path
      res.status(200).json({ url: signedUrl })
    } catch (err: any) {
      console.error('[Public:Ebooks:Download] Error processing download request')
      res.status(500).json({ error: 'Failed to generate download link' })
    }
  }
)

// GET /api/ebooks/:id/stream - stream locally stored ebook PDF for authenticated user
publicRouter.get(
  '/ebooks/:id/stream',
  requireAuth,
  ebookDownloadLimiter,
  async (req: Request, res: Response) => {
    const { id } = req.params
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid ebook ID format' })
      return
    }

    try {
      const { rows } = await pool.query<{
        id: string
        storage_path: string
        file_name: string
        price: number
        is_visible: boolean
      }>(
        `SELECT id, storage_path, file_name, price, is_visible
         FROM ebooks
         WHERE id = $1;`,
        [id]
      )

      if (rows.length === 0 || !rows[0].is_visible) {
        res.status(404).json({ error: 'Ebook not found' })
        return
      }

      const ebook = rows[0]

      if (ebook.price > 0) {
        const purchaseRes = await pool.query(
          `SELECT id FROM ebook_purchases WHERE ebook_id = $1 AND user_id = $2 LIMIT 1;`,
          [ebook.id, req.user!.id]
        )
        if (purchaseRes.rows.length === 0) {
          res.status(402).json({ error: 'Purchase required' })
          return
        }
      }

      const localPath = getLocalFilePath(ebook.storage_path)
      if (localPath) {
        res.download(localPath, ebook.file_name || 'ebook.pdf')
        return
      }

      res.status(404).json({ error: 'File not found on local storage' })
    } catch (err: any) {
      console.error('[Public:Ebooks:Stream] Error streaming ebook:', err)
      res.status(500).json({ error: 'Failed to stream ebook file' })
    }
  }
)

// -----------------------------------------------------------------------------
// GET /api/reports
// List all visible personalised reports (cached for 60 seconds)
// -----------------------------------------------------------------------------
publicRouter.get('/reports', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, 
        slug, 
        title, 
        tagline, 
        description, 
        included, 
        price, 
        original_price, 
        CASE 
          WHEN original_price IS NOT NULL AND original_price > price 
          THEN ROUND(((original_price - price)::numeric / original_price) * 100) 
          ELSE NULL 
        END AS discount_percent,
        cover_image_url, 
        badge,
        section
      FROM reports
      WHERE is_visible = true
      ORDER BY 
        CASE 
          WHEN section = 'personalized' THEN 1 
          WHEN section = 'additional' THEN 2 
          ELSE 3 
        END ASC, 
        position ASC, 
        created_at ASC;
    `)

    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(200).json({ reports: rows })
  } catch (err) {
    console.error('[Public:Reports] Error retrieving reports:', err)
    res.status(500).json({ error: 'Failed to retrieve reports' })
  }
})

// -----------------------------------------------------------------------------
// POST /api/reports/:id/order
// Record online report order & dispatch email notification to yanushka655@gmail.com
// -----------------------------------------------------------------------------
const PublicReportOrderSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  whatsapp_number: z.string().trim().min(8, 'WhatsApp number is required').max(20),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().nullable().or(z.literal('')),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be YYYY-MM-DD').optional().nullable().or(z.literal('')),
  birth_time: z.string().max(10).optional().nullable().or(z.literal('')),
  birth_time_unknown: z.coerce.boolean().default(false),
  birth_place: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
})

publicRouter.post(
  '/reports/:id/order',
  enquiryRateLimiter,
  async (req: Request, res: Response) => {
    const { id } = req.params
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      res.status(400).json({ error: 'Invalid report ID format' })
      return
    }

    const parseResult = PublicReportOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parseResult.error.flatten().fieldErrors,
      })
      return
    }

    const {
      name,
      whatsapp_number,
      email,
      gender,
      birth_date,
      birth_time,
      birth_time_unknown,
      birth_place,
      notes,
    } = parseResult.data

    try {
      const { rows: repRows } = await pool.query<{
        id: string
        title: string
        price: number
        is_visible: boolean
      }>('SELECT id, title, price, is_visible FROM reports WHERE id = $1;', [id])

      if (repRows.length === 0 || !repRows[0].is_visible) {
        res.status(404).json({ error: 'Report not found' })
        return
      }

      const report = repRows[0]
      const cleanEmail = email && email.trim() !== '' ? email.trim() : null

      const { rows: orderRows } = await pool.query<{ id: string }>(
        `INSERT INTO report_orders (
           report_id, report_title, source, name, email,
           whatsapp_number, gender, birth_date, birth_time, birth_time_unknown,
           birth_place, notes, amount, status
         ) VALUES ($1, $2, 'online', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'new')
         RETURNING id;`,
        [
          report.id,
          report.title,
          name,
          cleanEmail,
          whatsapp_number,
          gender || null,
          birth_date || null,
          birth_time_unknown ? null : birth_time || null,
          birth_time_unknown,
          birth_place || null,
          notes || null,
          report.price,
        ]
      )

      // Dispatch email notification to yanushka655@gmail.com
      sendAdminPurchaseNotification({
        type: 'report',
        name,
        whatsappNumber: whatsapp_number,
        email: cleanEmail,
        amount: report.price,
        reportTitle: report.title,
        gender: gender || null,
        birthDate: birth_date || null,
        birthTime: birth_time_unknown ? 'Unknown' : birth_time || null,
        birthPlace: birth_place || null,
        notes: notes || null,
      }).catch((err) =>
        console.error('[Public:ReportOrder:Email] Error dispatching notification to yanushka655@gmail.com:', err)
      )

      res.status(201).json({
        success: true,
        orderId: orderRows[0]?.id,
        message: 'Order initiated successfully. Opening WhatsApp...',
      })
    } catch (err: any) {
      console.error('[Public:ReportOrder] Error creating report order:', err)
      res.status(500).json({ error: 'Failed to process report order. Please try again.' })
    }
  }
)



