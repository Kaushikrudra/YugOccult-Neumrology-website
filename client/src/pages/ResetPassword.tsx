import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/usePageMeta'
import { KeyRound, CheckCircle, ShieldAlert, Lock } from 'lucide-react'

export default function ResetPassword() {
  usePageMeta({
    title: 'Reset Password',
    description: 'Set a new password for your account.',
    noindex: true,
  })

  const [searchParams] = useSearchParams()
  const [token, setToken] = useState<string>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Token extraction and address-bar clearing for security
  useEffect(() => {
    const rawToken = searchParams.get('token')
    if (rawToken && rawToken.trim() !== '') {
      setToken(rawToken.trim())
      // Strip token from browser address bar & history to prevent referrer leaks
      try {
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (e) {
        // Safe fallback
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Missing or invalid reset token. Please request a new password reset link.')
      return
    }

    if (password.length < 8 || password.length > 72) {
      setError('Password must be between 8 and 72 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.post('/api/auth/reset-password', {
        token,
        password,
      })
      setSuccess(true)
    } catch (err: any) {
      if (err?.status === 429) {
        setError('Too many reset attempts. Please try again after some time.')
      } else {
        setError(err?.message || 'This reset link is invalid or has expired. Please request a new one.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] bg-[#FBF7EE] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#2E2A5C]/10 shadow-sm p-8 sm:p-10">
        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#5B3E96]/10 text-[#5B3E96] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#2E2A5C] mb-3">Password Reset Complete</h1>
            <p className="text-sm text-[#2B2A3D]/80 leading-relaxed mb-6">
              Your password has been securely updated. You can now sign in with your new credentials.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] font-medium hover:bg-[#5B3E96] transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        ) : !token ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#F08A24]/10 text-[#F08A24] flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#2E2A5C] mb-3">Invalid Reset Link</h1>
            <p className="text-sm text-[#2B2A3D]/80 leading-relaxed mb-6">
              No reset token was found or the link format is incomplete. Please request a new password reset link.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-[#5B3E96] text-white font-medium hover:bg-[#2E2A5C] transition-colors"
            >
              Request New Link
            </Link>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#2E2A5C]/5 text-[#5B3E96] flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2A5C] mb-2">
              Set New Password
            </h1>
            <p className="text-sm text-[#2B2A3D]/70 mb-6">
              Enter your new password below. It must be at least 8 characters long.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-[#5B3E96]/10 border border-[#5B3E96]/20 text-xs sm:text-sm text-[#5B3E96] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-[#2E2A5C]/20 focus:border-[#5B3E96] focus:ring-1 focus:ring-[#5B3E96] text-sm text-[#2B2A3D]"
                  />
                  <Lock className="w-4 h-4 text-[#2E2A5C]/40 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 rounded-xl border border-[#2E2A5C]/20 focus:border-[#5B3E96] focus:ring-1 focus:ring-[#5B3E96] text-sm text-[#2B2A3D]"
                  />
                  <Lock className="w-4 h-4 text-[#2E2A5C]/40 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#5B3E96] text-white font-semibold text-sm hover:bg-[#2E2A5C] shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
