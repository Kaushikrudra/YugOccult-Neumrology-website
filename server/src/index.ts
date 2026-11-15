import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'path'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth'
import { adminRouter } from './routes/admin'
import { publicRouter } from './routes/public'
import { accountRouter } from './routes/account'
import { getJwtSecret } from './middleware/auth'
import { getLocalUploadsPath, ensureUploadDirs } from './services/storage'

dotenv.config()

// Ensure local upload directories exist on startup
ensureUploadDirs().catch((err) =>
  console.error('[Storage:Init] Failed to create upload directories:', err)
)

// Ensure security configurations are valid on startup
try {
  getJwtSecret()
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  console.warn(`[Startup Warning] ${message}`)
}

const app = express()
const PORT = Number(process.env.PORT) || 5000
const HOST = '0.0.0.0'
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const normalizedClientUrl = CLIENT_URL.replace(/\/+$/, '')

// Trust proxy hops for Netlify (proxy 1) -> Render (proxy 2) architecture
// Default: 2 in production, 0 in development. Never boolean true to avoid rate-limiter validation errors.
const rawTrustHops = process.env.TRUST_PROXY_HOPS
const defaultHops = process.env.NODE_ENV === 'production' ? 2 : 0
const trustProxyHops =
  rawTrustHops !== undefined && !isNaN(parseInt(rawTrustHops, 10))
    ? parseInt(rawTrustHops, 10)
    : defaultHops

if (trustProxyHops > 0) {
  app.set('trust proxy', trustProxyHops)
}

// Hardening
app.disable('x-powered-by')
app.use(helmet())

// Strict CORS with credentials
const allowedOrigins = [
  CLIENT_URL,
  normalizedClientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not permitted by CORS`))
      }
    },
    credentials: true,
  })
)

// Body parser with 10kb limit
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

// Serve public uploaded assets (course banners, report covers)
app.use('/uploads', express.static(getLocalUploadsPath()))

// Health Check Route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'astrology-numerology-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// Public Routes (Enquiries submission, etc.)
app.use('/api', publicRouter)

// Auth Routes (/api/auth/login, /api/auth/logout, /api/auth/me)
app.use('/api/auth', authRouter)

// Admin Protected Routes (/api/admin/stats, /api/admin/enquiries, /api/admin/orders)
app.use('/api/admin', adminRouter)

// User Account & Enrolled Course Materials Routes (/api/account/courses, /api/account/materials)
app.use('/api/account', accountRouter)

// Root Welcome Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'YugSkills Learning Institute API is running.',
    health: '/api/health',
  })
})

// 404 Route handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
  })
})

// Global Error Handler (prevents stack trace leaks in production)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]', err?.message || err)
  const isProd = process.env.NODE_ENV === 'production'
  const statusCode = err?.status || err?.statusCode || 500
  res.status(statusCode).json({
    error: isProd ? 'Internal server error' : (err?.message || 'Internal server error'),
  })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`[Server] YugSkills Learning Institute API running on http://${HOST}:${PORT}`)
  })
}

export default app
