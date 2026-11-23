import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { requireAuth, getJwtSecret, AuthUserPayload } from '../middleware/auth'
import { isCashfreeConfigured, createCashfreeOrder, verifyWebhookSignature } from '../services/cashfree'
import { syncOrderWithCashfree } from '../services/payments'

export const paymentsRouter = Router()

// Rate limit: 10 order creation requests per 10 minutes per user / IP
const orderCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || '') || 'anonymous',
  message: {
    error: 'Too many order attempts. Please try again after 10 minutes.',
  },
})

// Optional auth middleware for guest/logged-in order endpoints
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.auth_token || req.cookies?.admin_token
    if (token) {
      const decoded = jwt.verify(token, getJwtSecret()) as AuthUserPayload
      req.user = decoded
    }
  } catch {
    // Ignore invalid/expired tokens for public endpoints
  }
  next()
}

function getClientReturnUrl(): string {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')
  return `${clientUrl}/payment/status?order_id={order_id}`
}

function getWebhookNotifyUrl(): string | undefined {
  const serverUrl = (process.env.SERVER_PUBLIC_URL || '').trim().replace(/\/+$/, '')
  return serverUrl ? `${serverUrl}/api/payments/webhook` : undefined
}

function generateCashfreeOrderId(): string {
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `YO_${timestamp}_${randomPart}`
}

function formatZodError(parseResult: { error: z.ZodError }): { error: string; details: Record<string, string[]> } {
  const fieldErrors = parseResult.error.flatten().fieldErrors as Record<string, string[]>
  const allMessages = Object.values(fieldErrors).flat()
  const error = allMessages[0] || 'Validation error'
  return { error, details: fieldErrors }
}

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

const MOCK_COURSE_ID_TO_SLUG: Record<string, string> = {
  'course-pkg-1': 'diwali-special-bundle-course',
  'course-pkg-2': 'occult-master-package-bundle-courses-3-month-program',
  'course-pkg-3': 'occult-master-package-bundle-courses',
  'course-pkg-4': 'tarot-course-package',
  'course-tarot-1': 'osho-zen-tarot-reading-course',
  'course-tarot-2': 'angel-oracle-card-reading-certification-course',
  'course-tarot-3': 'tarot-card-reading-certification-course',
  'course-astro-1': 'balance-the-9-planets-with-food-course',
  'course-astro-2': 'lal-kitab-course',
  'course-astro-3': 'mohini-vidhya-special-course',
  'course-num-1': 'numerology-foundation-course-live',
  'course-num-2': 'name-and-mobile-numerology-program',
  'course-num-3': 'prediction-through-time-numerology',
  'course-num-4': 'vedic-numerology-best-course',
  'course-vastu-1': 'vastu-shastra-course-with-practical-remedies',
  'course-vastu-2': 'vastu-course',
  'course-rem-3': 'law-of-attraction-with-occult-remedies',
  'course-rem-4': '30-days-gratitude-practical-course',
  'course-heal-1': 'reiki-healing-program-level-1-and-2',
  'course-heal-2': 'colour-therapy-expert-course',
  'course-heal-3': 'cord-cutting-special-session',
  'course-rem-1': 'dhanvarsha-laxmi-potli',
  'course-rem-2': 'diwali-special-remedies-advanced-level',
  'course-rem-5': 'durga-prashnawali-course',
  'course-rem-6': 'gayatri-mantra-sadhana',
  'course-rem-7': 'italian-switchwords-mastery-course',
  'course-rem-8': 'vedic-switchwords-mastery-course',
  'course-coach-1': 'online-coaching-business-program',
  'course-astro-4': 'vedic-astrology-course-basic-to-advanced',
  'course-num-5': 'loshu-grid-numerology-basic-to-advanced',
}

// -----------------------------------------------------------------------------
// POST /api/payments/course-order (requireAuth)
// -----------------------------------------------------------------------------
const CourseOrderSchema = z.object({
  courseId: z.string().trim().min(1, 'Course ID is required'),
  phone: z.string().trim().optional(),
})

paymentsRouter.post(
  '/course-order',
  requireAuth,
  orderCreateLimiter,
  async (req: Request, res: Response) => {
    if (!isCashfreeConfigured()) {
      res.status(503).json({ error: 'Payments not configured' })
      return
    }

    const parseResult = CourseOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      const { error, details } = formatZodError(parseResult)
      res.status(400).json({ error, details })
      return
    }

    const { courseId, phone: providedPhone } = parseResult.data
    const userId = req.user!.id

    try {
      // 1. Fetch course details & ensure it is visible (supports UUID, slug, or mock fallback ID)
      const resolvedTarget = MOCK_COURSE_ID_TO_SLUG[courseId] || courseId
      const courseRes = isUuid(resolvedTarget)
        ? await pool.query<{
            id: string
            title: string
            price: number
            is_visible: boolean
          }>('SELECT id, title, price, is_visible FROM courses WHERE id = $1 LIMIT 1;', [resolvedTarget])
        : await pool.query<{
            id: string
            title: string
            price: number
            is_visible: boolean
          }>('SELECT id, title, price, is_visible FROM courses WHERE slug = $1 LIMIT 1;', [resolvedTarget])

      if (courseRes.rows.length === 0 || !courseRes.rows[0].is_visible) {
        res.status(404).json({ error: 'Course not found or currently unavailable' })
        return
      }

      const course = courseRes.rows[0]
      if (course.price <= 0) {
        res.status(400).json({ error: 'This course is free. Please use Enroll Free.' })
        return
      }

      // 2. Check if user already has an active enrollment
      const enrollmentRes = await pool.query<{
        id: string
        status: string
        expires_at: string | null
      }>(
        `SELECT id, status, expires_at FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'active' LIMIT 1;`,
        [userId, course.id]
      )

      let isRenewal = false
      if (enrollmentRes.rows.length > 0) {
        const existing = enrollmentRes.rows[0]
        const isExpired = existing.expires_at ? new Date(existing.expires_at) <= new Date() : false
        if (!isExpired) {
          res.status(409).json({ error: 'You already have active access to this course.' })
          return
        }
        isRenewal = true
      }

      // 3. Retrieve user profile
      const userRes = await pool.query<{
        name: string | null
        email: string
        phone: string | null
      }>('SELECT name, email, phone FROM users WHERE id = $1 LIMIT 1;', [userId])

      if (userRes.rows.length === 0) {
        res.status(404).json({ error: 'User profile not found' })
        return
      }

      const userProfile = userRes.rows[0]
      const rawPhone = providedPhone || userProfile.phone || ''
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10)

      if (cleanPhone.length !== 10) {
        res.status(400).json({ error: 'Please add a 10-digit phone number in your account.' })
        return
      }

      // If phone was provided and user didn't have one saved, save it
      if (providedPhone && !userProfile.phone) {
        await pool.query('UPDATE users SET phone = $1 WHERE id = $2;', [cleanPhone, userId])
      }

      const cashfreeOrderId = generateCashfreeOrderId()
      const customerName = userProfile.name?.trim() || 'Student'
      const customerEmail = userProfile.email.trim()

      const courseTitleRef = isRenewal
        ? `${course.title} (1-Year Renewal)`
        : `${course.title} (1-Year Access)`

      // 4. Create local pending order
      const orderInsertRes = await pool.query<{ id: string }>(
        `INSERT INTO orders (
          type, reference_id, reference_title, amount, status,
          cashfree_order_id, customer_name, customer_email, customer_phone, user_id
        ) VALUES (
          'course', $1, $2, $3, 'pending',
          $4, $5, $6, $7, $8
        ) RETURNING id;`,
        [
          course.id,
          courseTitleRef,
          course.price,
          cashfreeOrderId,
          customerName,
          customerEmail,
          cleanPhone,
          userId,
        ]
      )

      const localOrderId = orderInsertRes.rows[0].id

      // 5. Initiate Cashfree Order
      const cfResult = await createCashfreeOrder({
        orderId: cashfreeOrderId,
        orderAmount: course.price,
        customerId: userId,
        customerName,
        customerEmail,
        customerPhone: cleanPhone,
        returnUrl: getClientReturnUrl(),
        notifyUrl: getWebhookNotifyUrl(),
      })

      // Update order with payment session id
      await pool.query(
        `UPDATE orders SET payment_session_id = $1 WHERE id = $2;`,
        [cfResult.paymentSessionId, localOrderId]
      )

      res.status(200).json({
        orderId: cashfreeOrderId,
        paymentSessionId: cfResult.paymentSessionId,
      })
    } catch (err: any) {
      console.error('[Payments:CourseOrder] Error:', err?.message || err)
      res.status(500).json({ error: err?.message || 'Failed to initiate course payment' })
    }
  }
)

// -----------------------------------------------------------------------------
// POST /api/payments/ebook-order (requireAuth)
// -----------------------------------------------------------------------------
const EbookOrderSchema = z.object({
  ebookId: z.string().trim().min(1, 'Ebook ID is required'),
  phone: z.string().trim().optional(),
})

paymentsRouter.post(
  '/ebook-order',
  requireAuth,
  orderCreateLimiter,
  async (req: Request, res: Response) => {
    if (!isCashfreeConfigured()) {
      res.status(503).json({ error: 'Payments not configured' })
      return
    }

    const parseResult = EbookOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      const { error, details } = formatZodError(parseResult)
      res.status(400).json({ error, details })
      return
    }

    const { ebookId, phone: providedPhone } = parseResult.data
    const userId = req.user!.id

    try {
      // 1. Fetch ebook
      const ebookRes = isUuid(ebookId)
        ? await pool.query<{
            id: string
            title: string
            price: number
            is_visible: boolean
          }>('SELECT id, title, price, is_visible FROM ebooks WHERE id = $1 LIMIT 1;', [ebookId])
        : await pool.query<{
            id: string
            title: string
            price: number
            is_visible: boolean
          }>('SELECT id, title, price, is_visible FROM ebooks WHERE slug = $1 LIMIT 1;', [ebookId])

      if (ebookRes.rows.length === 0 || !ebookRes.rows[0].is_visible) {
        res.status(404).json({ error: 'Ebook not found or currently unavailable' })
        return
      }

      const ebook = ebookRes.rows[0]
      if (ebook.price <= 0) {
        res.status(400).json({ error: 'This ebook is free. Please download it directly.' })
        return
      }

      // 2. Check if already purchased
      const purchaseRes = await pool.query(
        `SELECT id FROM ebook_purchases WHERE user_id = $1 AND ebook_id = $2 LIMIT 1;`,
        [userId, ebook.id]
      )

      if (purchaseRes.rows.length > 0) {
        res.status(409).json({ error: 'You have already purchased this ebook.' })
        return
      }

      // 3. User info
      const userRes = await pool.query<{
        name: string | null
        email: string
        phone: string | null
      }>('SELECT name, email, phone FROM users WHERE id = $1 LIMIT 1;', [userId])

      if (userRes.rows.length === 0) {
        res.status(404).json({ error: 'User profile not found' })
        return
      }

      const userProfile = userRes.rows[0]
      const rawPhone = providedPhone || userProfile.phone || ''
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10)

      if (cleanPhone.length !== 10) {
        res.status(400).json({ error: 'Please add a 10-digit phone number in your account.' })
        return
      }

      if (providedPhone && !userProfile.phone) {
        await pool.query('UPDATE users SET phone = $1 WHERE id = $2;', [cleanPhone, userId])
      }

      const cashfreeOrderId = generateCashfreeOrderId()
      const customerName = userProfile.name?.trim() || 'Reader'
      const customerEmail = userProfile.email.trim()

      // 4. Create local pending order
      const orderInsertRes = await pool.query<{ id: string }>(
        `INSERT INTO orders (
          type, reference_id, reference_title, amount, status,
          cashfree_order_id, customer_name, customer_email, customer_phone, user_id
        ) VALUES (
          'ebook', $1, $2, $3, 'pending',
          $4, $5, $6, $7, $8
        ) RETURNING id;`,
        [
          ebook.id,
          ebook.title,
          ebook.price,
          cashfreeOrderId,
          customerName,
          customerEmail,
          cleanPhone,
          userId,
        ]
      )

      const localOrderId = orderInsertRes.rows[0].id

      // 5. Initiate Cashfree Order
      const cfResult = await createCashfreeOrder({
        orderId: cashfreeOrderId,
        orderAmount: ebook.price,
        customerId: userId,
        customerName,
        customerEmail,
        customerPhone: cleanPhone,
        returnUrl: getClientReturnUrl(),
        notifyUrl: getWebhookNotifyUrl(),
      })

      await pool.query(
        `UPDATE orders SET payment_session_id = $1 WHERE id = $2;`,
        [cfResult.paymentSessionId, localOrderId]
      )

      res.status(200).json({
        orderId: cashfreeOrderId,
        paymentSessionId: cfResult.paymentSessionId,
      })
    } catch (err: any) {
      console.error('[Payments:EbookOrder] Error:', err?.message || err)
      res.status(500).json({ error: err?.message || 'Failed to initiate ebook payment' })
    }
  }
)

// -----------------------------------------------------------------------------
// POST /api/payments/consultation-order (auth optional)
// -----------------------------------------------------------------------------
const ConsultationOrderSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(10, 'Valid phone number is required'),
  service_title: z.string().trim().max(150).optional().nullable(),
  preferred_date: z.string().refine((val) => {
    const date = new Date(val)
    if (isNaN(date.getTime())) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 60)
    return date >= today && date <= maxDate
  }, 'Preferred date must be within the next 60 days'),
  preferred_slot: z.string().trim().min(1, 'Preferred slot is required').max(100),
  birth_date: z.string().optional().nullable(),
  birth_time: z.string().optional().nullable(),
  birth_time_unknown: z.boolean().optional().default(false),
  birth_place: z.string().trim().max(150).optional().nullable(),
  topic: z.string().trim().max(150).optional().nullable(),
  message: z.string().trim().max(1000, 'Message must not exceed 1000 characters').optional().default(''),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the consultation booking policy',
  }),
})

paymentsRouter.post(
  '/consultation-order',
  optionalAuth,
  orderCreateLimiter,
  async (req: Request, res: Response) => {
    if (!isCashfreeConfigured()) {
      res.status(503).json({ error: 'Payments not configured' })
      return
    }

    const parseResult = ConsultationOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      const { error, details } = formatZodError(parseResult)
      res.status(400).json({ error, details })
      return
    }

    const data = parseResult.data
    const userId = req.user?.id || null

    const cleanPhone = data.phone.replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) {
      res.status(400).json({ error: 'Please provide a valid 10-digit phone number.' })
      return
    }

    try {
      // 1. Fetch consultation fee from consultation_settings
      const settingsRes = await pool.query<{ fee: number }>(
        'SELECT fee FROM consultation_settings LIMIT 1;'
      )
      const fee = settingsRes.rows[0]?.fee || 0

      if (fee <= 0) {
        res.status(400).json({ error: 'Consultation fee is not configured' })
        return
      }

      const cashfreeOrderId = generateCashfreeOrderId()
      const serviceTitle = data.service_title || '1-on-1 Consultation'

      // 2. Create local pending order and consultation booking in transaction
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        const orderRes = await client.query<{ id: string }>(
          `INSERT INTO orders (
            type, reference_title, amount, status,
            cashfree_order_id, customer_name, customer_email, customer_phone, user_id
          ) VALUES (
            'consultation', $1, $2, 'pending',
            $3, $4, $5, $6, $7
          ) RETURNING id;`,
          [
            serviceTitle,
            fee,
            cashfreeOrderId,
            data.name,
            data.email,
            cleanPhone,
            userId,
          ]
        )

        const orderId = orderRes.rows[0].id

        await client.query(
          `INSERT INTO consultation_bookings (
            order_id, user_id, name, email, phone, service_title,
            preferred_date, preferred_slot, birth_date, birth_time,
            birth_time_unknown, birth_place, topic, message, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14, 'new'
          );`,
          [
            orderId,
            userId,
            data.name,
            data.email,
            cleanPhone,
            serviceTitle,
            data.preferred_date,
            data.preferred_slot,
            data.birth_date || null,
            data.birth_time || null,
            data.birth_time_unknown || false,
            data.birth_place || null,
            data.topic || null,
            data.message || '',
          ]
        )

        // 3. Initiate Cashfree Order
        const cfResult = await createCashfreeOrder({
          orderId: cashfreeOrderId,
          orderAmount: fee,
          customerId: userId || `guest_${cleanPhone}`,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: cleanPhone,
          returnUrl: getClientReturnUrl(),
          notifyUrl: getWebhookNotifyUrl(),
        })

        await client.query(
          `UPDATE orders SET payment_session_id = $1 WHERE id = $2;`,
          [cfResult.paymentSessionId, orderId]
        )

        await client.query('COMMIT')

        res.status(200).json({
          orderId: cashfreeOrderId,
          paymentSessionId: cfResult.paymentSessionId,
        })
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    } catch (err: any) {
      console.error('[Payments:ConsultationOrder] Error:', err?.message || err)
      res.status(500).json({ error: err?.message || 'Failed to initiate consultation payment' })
    }
  }
)

// -----------------------------------------------------------------------------
// POST /api/payments/report-order (auth optional)
// -----------------------------------------------------------------------------
const ReportOrderSchema = z.object({
  reportId: z.string().trim().min(1, 'Report ID is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Valid email is required'),
  whatsapp_number: z.string().trim().min(10, 'Valid WhatsApp number is required'),
  gender: z.string().trim().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  birth_time: z.string().optional().nullable(),
  birth_time_unknown: z.boolean().optional().default(false),
  birth_place: z.string().trim().max(150).optional().nullable(),
  details: z.string().trim().min(5, 'Please provide details (minimum 5 characters)').max(1000),
  notes: z.string().trim().max(1000).optional().nullable(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must provide consent to proceed',
  }),
})

paymentsRouter.post(
  '/report-order',
  optionalAuth,
  orderCreateLimiter,
  async (req: Request, res: Response) => {
    if (!isCashfreeConfigured()) {
      res.status(503).json({ error: 'Payments not configured' })
      return
    }

    const parseResult = ReportOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      const { error, details } = formatZodError(parseResult)
      res.status(400).json({ error, details })
      return
    }

    const data = parseResult.data
    const userId = req.user?.id || null

    const cleanPhone = data.whatsapp_number.replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) {
      res.status(400).json({ error: 'Please provide a valid 10-digit WhatsApp number.' })
      return
    }

    try {
      // 1. Fetch report details
      const reportRes = isUuid(data.reportId)
        ? await pool.query<{
            id: string
            title: string
            price: number
            is_visible: boolean
          }>('SELECT id, title, price, is_visible FROM reports WHERE id = $1 LIMIT 1;', [data.reportId])
        : await pool.query<{
            id: string
            title: string
            price: number
            is_visible: boolean
          }>('SELECT id, title, price, is_visible FROM reports WHERE slug = $1 LIMIT 1;', [data.reportId])

      if (reportRes.rows.length === 0 || !reportRes.rows[0].is_visible) {
        res.status(404).json({ error: 'Report not found or currently unavailable' })
        return
      }

      const report = reportRes.rows[0]
      if (report.price <= 0) {
        res.status(400).json({ error: 'Report price must be greater than zero' })
        return
      }

      const cashfreeOrderId = generateCashfreeOrderId()

      // 2. Create local pending order and report order record in transaction
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        const orderRes = await client.query<{ id: string }>(
          `INSERT INTO orders (
            type, reference_id, reference_title, amount, status,
            cashfree_order_id, customer_name, customer_email, customer_phone, user_id
          ) VALUES (
            'report', $1, $2, $3, 'pending',
            $4, $5, $6, $7, $8
          ) RETURNING id;`,
          [
            report.id,
            report.title,
            report.price,
            cashfreeOrderId,
            data.name,
            data.email,
            cleanPhone,
            userId,
          ]
        )

        const orderId = orderRes.rows[0].id

        await client.query(
          `INSERT INTO report_orders (
            report_id, report_title, order_id, user_id, source, name, email,
            whatsapp_number, gender, birth_date, birth_time, birth_time_unknown,
            birth_place, details, notes, amount, status, consent, consent_at
          ) VALUES (
            $1, $2, $3, $4, 'online', $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, 'new', true, timezone('utc'::text, now())
          );`,
          [
            report.id,
            report.title,
            orderId,
            userId,
            data.name,
            data.email,
            cleanPhone,
            data.gender || null,
            data.birth_date || null,
            data.birth_time || null,
            data.birth_time_unknown || false,
            data.birth_place || null,
            data.details,
            data.notes || null,
            report.price,
          ]
        )

        // 3. Initiate Cashfree Order
        const cfResult = await createCashfreeOrder({
          orderId: cashfreeOrderId,
          orderAmount: report.price,
          customerId: userId || `guest_${cleanPhone}`,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: cleanPhone,
          returnUrl: getClientReturnUrl(),
          notifyUrl: getWebhookNotifyUrl(),
        })

        await client.query(
          `UPDATE orders SET payment_session_id = $1 WHERE id = $2;`,
          [cfResult.paymentSessionId, orderId]
        )

        await client.query('COMMIT')

        res.status(200).json({
          orderId: cashfreeOrderId,
          paymentSessionId: cfResult.paymentSessionId,
        })
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    } catch (err: any) {
      console.error('[Payments:ReportOrder] Error:', err?.message || err)
      res.status(500).json({ error: err?.message || 'Failed to initiate report payment' })
    }
  }
)

// -----------------------------------------------------------------------------
// POST /api/payments/kundli-order (auth optional)
// Online Cashfree payment initiation for Kundli Analysis (₹499)
// -----------------------------------------------------------------------------
const KundliOrderSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  whatsapp_number: z.string().trim().refine(
    (val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length >= 10 && digits.length <= 15
    },
    { message: 'Valid 10 to 15-digit WhatsApp number required' }
  ),
  email: z.string().trim().email('Valid email required').optional().nullable(),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Please select a gender (Male, Female, or Other)',
  }),
  birth_date: z.string().trim().refine(
    (val) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false
      const d = new Date(val + 'T00:00:00Z')
      const minDate = new Date('1900-01-01T00:00:00Z')
      const now = new Date()
      return !isNaN(d.getTime()) && d >= minDate && d <= now
    },
    { message: 'Birth date must be between 1900 and today' }
  ),
  birth_time: z.string().trim().optional().nullable(),
  birth_time_unknown: z.boolean().default(false),
  birth_place: z.string().trim().min(2, 'Birth place must be at least 2 characters').max(120),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms to proceed',
  }),
  website: z.string().optional().nullable(),
})

paymentsRouter.post(
  '/kundli-order',
  optionalAuth,
  orderCreateLimiter,
  async (req: Request, res: Response) => {
    if (!isCashfreeConfigured()) {
      res.status(503).json({ error: 'Payments not configured' })
      return
    }

    if (req.body?.website && typeof req.body.website === 'string' && req.body.website.trim() !== '') {
      res.status(200).json({ orderId: 'ok', paymentSessionId: '' })
      return
    }

    const parseResult = KundliOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      const { error, details } = formatZodError(parseResult)
      res.status(400).json({ error, details })
      return
    }

    const data = parseResult.data
    const userId = req.user?.id || null
    const cleanPhone = data.whatsapp_number.replace(/\D/g, '').slice(-10)
    const fixedAmount = 499

    try {
      const orderId = crypto.randomUUID()
      const cashfreeOrderId = generateCashfreeOrderId()

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // 1. Insert order record
        await client.query(
          `INSERT INTO orders (
             id, user_id, type, reference_id, reference_title,
             amount, status, cashfree_order_id,
             customer_name, customer_email, customer_phone
           ) VALUES ($1, $2, 'kundli', NULL, $3, $4, 'pending', $5, $6, $7, $8);`,
          [
            orderId,
            userId,
            'Kundli Analysis Request (₹499)',
            fixedAmount,
            cashfreeOrderId,
            data.name,
            data.email || 'support@yugskill.com',
            cleanPhone,
          ]
        )

        // 2. Insert into enquiries linked to order
        const birthDate = data.birth_date && data.birth_date.trim() !== '' ? data.birth_date : null
        const birthTime = data.birth_time_unknown || !data.birth_time ? null : data.birth_time.trim()

        await client.query(
          `INSERT INTO enquiries (
             name, phone, whatsapp_number, email, subject, message,
             enquiry_type, gender, birth_date, birth_time, birth_time_unknown,
             birth_place, consent, consent_at, lead_status,
             amount, question_count, order_id, payment_status
           ) VALUES (
             $1, $2, $3, $4, $5, $6,
             'kundli', $7, $8, $9, $10,
             $11, true, timezone('utc'::text, now()), 'new',
             $12, 1, $13, 'pending'
           );`,
          [
            data.name,
            cleanPhone,
            data.whatsapp_number.trim(),
            data.email || null,
            'Kundli Request (₹499)',
            `Kundli Request (₹499) for ${data.name}`,
            data.gender,
            birthDate,
            birthTime,
            data.birth_time_unknown,
            data.birth_place.trim(),
            fixedAmount,
            orderId,
          ]
        )

        // 3. Initiate Cashfree Order
        const cfResult = await createCashfreeOrder({
          orderId: cashfreeOrderId,
          orderAmount: fixedAmount,
          customerId: userId || `guest_${cleanPhone}`,
          customerName: data.name,
          customerEmail: data.email || 'support@yugskill.com',
          customerPhone: cleanPhone,
          returnUrl: getClientReturnUrl(),
          notifyUrl: getWebhookNotifyUrl(),
        })

        await client.query(
          `UPDATE orders SET payment_session_id = $1 WHERE id = $2;`,
          [cfResult.paymentSessionId, orderId]
        )

        await client.query('COMMIT')

        res.status(200).json({
          orderId: cashfreeOrderId,
          paymentSessionId: cfResult.paymentSessionId,
        })
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    } catch (err: any) {
      console.error('[Payments:KundliOrder] Error:', err?.message || err)
      res.status(500).json({ error: err?.message || 'Failed to initiate Kundli payment' })
    }
  }
)

// -----------------------------------------------------------------------------
// POST /api/payments/ask-question-order (auth optional)
// Online Cashfree payment initiation for Ask the Astrologer Questions (₹699, ₹999, ₹1599)
// -----------------------------------------------------------------------------
const QUESTION_TIER_PRICING: Record<1 | 2 | 3, number> = {
  1: 699,
  2: 999,
  3: 1599,
}

const AskQuestionOrderSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  whatsapp_number: z.string().trim().refine(
    (val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length >= 10 && digits.length <= 15
    },
    { message: 'Valid 10 to 15-digit WhatsApp number required' }
  ),
  email: z.string().trim().email('Valid email required').optional().nullable(),
  question_count: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  question: z.string().trim().min(5, 'Question must be at least 5 characters').max(3000),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  birth_date: z.string().trim().optional().nullable(),
  birth_time: z.string().trim().optional().nullable(),
  birth_time_unknown: z.boolean().optional().default(false),
  birth_place: z.string().trim().max(120).optional().nullable(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms to proceed',
  }),
  website: z.string().optional().nullable(),
})

paymentsRouter.post(
  '/ask-question-order',
  optionalAuth,
  orderCreateLimiter,
  async (req: Request, res: Response) => {
    if (!isCashfreeConfigured()) {
      res.status(503).json({ error: 'Payments not configured' })
      return
    }

    if (req.body?.website && typeof req.body.website === 'string' && req.body.website.trim() !== '') {
      res.status(200).json({ orderId: 'ok', paymentSessionId: '' })
      return
    }

    const parseResult = AskQuestionOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      const { error, details } = formatZodError(parseResult)
      res.status(400).json({ error, details })
      return
    }

    const data = parseResult.data
    const userId = req.user?.id || null
    const cleanPhone = data.whatsapp_number.replace(/\D/g, '').slice(-10)
    const count = data.question_count as 1 | 2 | 3
    const amount = QUESTION_TIER_PRICING[count] || 699
    const subject = `Astrology Question (${count} Qs - ₹${amount})`

    try {
      const orderId = crypto.randomUUID()
      const cashfreeOrderId = generateCashfreeOrderId()

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // 1. Insert order record
        await client.query(
          `INSERT INTO orders (
             id, user_id, type, reference_id, reference_title,
             amount, status, cashfree_order_id,
             customer_name, customer_email, customer_phone
           ) VALUES ($1, $2, 'ask_question', NULL, $3, $4, 'pending', $5, $6, $7, $8);`,
          [
            orderId,
            userId,
            subject,
            amount,
            cashfreeOrderId,
            data.name,
            data.email || 'support@yugskill.com',
            cleanPhone,
          ]
        )

        // 2. Insert into enquiries linked to order
        const birthDate = data.birth_date && data.birth_date.trim() !== '' ? data.birth_date : null
        const birthTime = data.birth_time_unknown || !data.birth_time ? null : data.birth_time.trim()

        await client.query(
          `INSERT INTO enquiries (
             name, phone, whatsapp_number, email, subject, message,
             enquiry_type, gender, birth_date, birth_time, birth_time_unknown,
             birth_place, question, consent, consent_at, lead_status,
             amount, question_count, order_id, payment_status
           ) VALUES (
             $1, $2, $3, $4, $5, $6,
             'ask_question', $7, $8, $9, $10,
             $11, $12, true, timezone('utc'::text, now()), 'new',
             $13, $14, $15, 'pending'
           );`,
          [
            data.name,
            cleanPhone,
            data.whatsapp_number.trim(),
            data.email || null,
            subject,
            data.question.trim(),
            data.gender || null,
            birthDate,
            birthTime,
            data.birth_time_unknown || false,
            data.birth_place ? data.birth_place.trim() : null,
            data.question.trim(),
            amount,
            count,
            orderId,
          ]
        )

        // 3. Initiate Cashfree Order
        const cfResult = await createCashfreeOrder({
          orderId: cashfreeOrderId,
          orderAmount: amount,
          customerId: userId || `guest_${cleanPhone}`,
          customerName: data.name,
          customerEmail: data.email || 'support@yugskill.com',
          customerPhone: cleanPhone,
          returnUrl: getClientReturnUrl(),
          notifyUrl: getWebhookNotifyUrl(),
        })

        await client.query(
          `UPDATE orders SET payment_session_id = $1 WHERE id = $2;`,
          [cfResult.paymentSessionId, orderId]
        )

        await client.query('COMMIT')

        res.status(200).json({
          orderId: cashfreeOrderId,
          paymentSessionId: cfResult.paymentSessionId,
        })
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    } catch (err: any) {
      console.error('[Payments:AskQuestionOrder] Error:', err?.message || err)
      res.status(500).json({ error: err?.message || 'Failed to initiate question payment' })
    }
  }
)

// -----------------------------------------------------------------------------
// GET /api/payments/status/:orderId (auth optional)
// -----------------------------------------------------------------------------
paymentsRouter.get('/status/:orderId', optionalAuth, async (req: Request, res: Response) => {
  const { orderId } = req.params

  if (!orderId || typeof orderId !== 'string') {
    res.status(400).json({ error: 'Order ID is required' })
    return
  }

  try {
    const syncResult = await syncOrderWithCashfree(orderId)
    const order = syncResult.order

    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    // Access control: If order belongs to a registered user, ensure only that user or an admin can view it
    if (order.user_id) {
      const currentUserId = req.user?.id
      const currentUserRole = req.user?.role
      if (currentUserId && currentUserId !== order.user_id && currentUserRole !== 'admin') {
        res.status(403).json({ error: 'You do not have permission to view this order.' })
        return
      }
    }

    // Return sanitized status info without customer PII
    res.status(200).json({
      orderId: order.cashfree_order_id || order.id,
      cashfreeOrderId: order.cashfree_order_id,
      customerName: order.customer_name,
      status: order.status,
      type: order.type,
      referenceTitle: order.reference_title,
      amount: order.amount,
      paidAt: order.paid_at,
      failureReason: order.failure_reason,
    })
  } catch (err: any) {
    console.error('[Payments:Status] Error:', err?.message || err)
    res.status(500).json({ error: 'Failed to retrieve order status' })
  }
})

// -----------------------------------------------------------------------------
// Webhook handler logic exported for mounting with express.raw() in index.ts
// -----------------------------------------------------------------------------
export async function handlePaymentsWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['x-webhook-signature'] as string | undefined
  const timestamp = req.headers['x-webhook-timestamp'] as string | undefined

  if (!signature || !timestamp) {
    console.warn('[Payments:Webhook] Missing signature or timestamp headers')
    res.status(400).json({ error: 'Missing required webhook signature headers' })
    return
  }

  // Obtain raw body string
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string'
    ? req.body
    : JSON.stringify(req.body)

  try {
    // 1. Strictly verify cryptographic HMAC signature
    verifyWebhookSignature(signature, rawBody, timestamp)

    // 2. Parse payload safely
    const payload = JSON.parse(rawBody)
    const eventType = payload.type || payload.event || 'UNKNOWN_EVENT'

    // Cashfree PG sends order details in data.order or data
    const orderData = payload.data?.order || payload.data || {}
    const orderId = orderData.order_id || orderData.orderId

    // Log ONLY sanitized metadata - never secrets or full payload
    console.log(`[Cashfree:Webhook] Verified event: ${eventType} for order: ${orderId || 'unknown'}`)

    if (orderId) {
      // 3. Confirm directly with Cashfree gateway before updating DB
      await syncOrderWithCashfree(String(orderId))
    }

    res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    console.error('[Cashfree:Webhook] Signature verification failed or error processing:', err?.message || err)
    res.status(401).json({ error: 'Invalid webhook signature' })
  }
}
