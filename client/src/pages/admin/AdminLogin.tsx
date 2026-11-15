import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Compass, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'
import { ApiError } from '../../lib/api'

export const AdminLogin: React.FC = () => {
  const { admin, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Enforce noindex on login
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    const hadExistingMeta = !!metaRobots

    if (!metaRobots) {
      metaRobots = document.createElement('meta')
      metaRobots.name = 'robots'
      document.head.appendChild(metaRobots)
    }

    const previousContent = metaRobots.getAttribute('content') || ''
    metaRobots.setAttribute('content', 'noindex, nofollow')

    return () => {
      if (hadExistingMeta) {
        metaRobots?.setAttribute('content', previousContent)
      } else {
        metaRobots?.remove()
      }
    }
  }, [])

  // If already logged in, redirect to admin dashboard
  useEffect(() => {
    if (admin) {
      const target = (location.state as any)?.from?.pathname || '/admin'
      navigate(target, { replace: true })
    }
  }, [admin, navigate, location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      await login(email.trim(), password)
      const target = (location.state as any)?.from?.pathname || '/admin'
      navigate(target, { replace: true })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Invalid credentials. Please verify your email and password.')
      } else {
        setErrorMessage('Unable to connect to administration server. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7EE] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background celestial orbit accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-[#C9A227]/20 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full border border-[#5B3E96]/20 pointer-events-none" />

      {/* Top navigation helper */}
      <div className="w-full max-w-md mb-3 flex items-center justify-start z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B3E96] hover:text-[#2E2A5C] transition-colors focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 rounded-lg px-2.5 py-1.5 bg-white/80 hover:bg-white border border-[#5B3E96]/15 shadow-2xs"
          aria-label="Back to Website Home"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Website</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#5B3E96]/15 p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="full" className="h-14 sm:h-16 w-auto" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEAF8] text-[#5B3E96] text-xs font-semibold tracking-wider uppercase mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Administrative Gateway</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C]">
            Portal Authentication
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-1">
            Sign in to manage spiritual consultations, courses, and seeker enquiries in Astrology, Numerology &amp; Tarot.
          </p>
        </div>

        {/* Error notification (Styled in Royal Violet - strictly NO RED) */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#2E2A5C] text-sm flex items-start gap-3 animate-fade-in"
          >
            <ShieldAlert className="w-5 h-5 text-[#5B3E96] shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-2"
            >
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2B2A3D]/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yugoccult.com"
                className="w-full pl-10 pr-4 py-3 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-sm text-[#2B2A3D] placeholder-[#2B2A3D]/40 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-2"
            >
              Security Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2B2A3D]/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-sm text-[#2B2A3D] placeholder-[#2B2A3D]/40 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#2B2A3D]/50 hover:text-[#2E2A5C] focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit action button (Deep Indigo filled) */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] font-semibold text-sm tracking-wide shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Access Admin Portal</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#5B3E96]/10 text-center space-y-3">
          <p className="text-xs text-[#2B2A3D]/50">
            Protected internal area. Unauthorized access attempts are monitored and recorded.
          </p>
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B3E96] hover:text-[#2E2A5C] transition-colors focus:outline-none focus:underline"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Return to Main Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
