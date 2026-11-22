import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, Sparkles, ShieldAlert, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { ApiError } from '../lib/api'
import { usePageMeta } from '../lib/usePageMeta'

export const Login: React.FC = () => {
  usePageMeta({
    title: 'Sign In',
    description: 'Sign in to access your course materials and consultations.',
    noindex: true,
  })
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        const queryParams = new URLSearchParams(location.search)
        const redirect = queryParams.get('redirect') || '/account'
        navigate(redirect, { replace: true })
      }
    }
  }, [user, navigate, location.search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.')
      return
    }

    try {
      setIsSubmitting(true)
      const authUser = await login(email.trim(), password)
      if (authUser.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        const queryParams = new URLSearchParams(location.search)
        const redirect = queryParams.get('redirect') || '/account'
        navigate(redirect, { replace: true })
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Invalid email or password.')
      } else {
        setErrorMessage('Unable to connect to service. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7EE] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-[#2B2A3D]">
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

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#5B3E96]/15 p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="full" className="h-14 sm:h-16 w-auto" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEAF8] text-[#5B3E96] text-xs font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seeker & Member Portal</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C]">
            Sign In to Your Account
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-1">
            Access your sacred course materials, consultation bookings, and Vedic insights.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#2E2A5C] text-sm flex items-start gap-3 animate-fade-in"
          >
            <ShieldAlert className="w-5 h-5 text-[#5B3E96] shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2B2A3D]/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-sm text-[#2B2A3D] placeholder-[#2B2A3D]/40 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#5B3E96] font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2B2A3D]/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] font-semibold text-sm tracking-wide shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#5B3E96]/10 text-center text-xs text-[#2B2A3D]/70 space-y-2.5">
          <div>
            <span>Don't have an account yet? </span>
            <Link to="/signup" className="font-semibold text-[#5B3E96] hover:underline">
              Create an Account
            </Link>
          </div>
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

export default Login
