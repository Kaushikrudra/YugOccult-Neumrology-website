import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/usePageMeta'
import { Mail, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react'

export default function ForgotPassword() {
  usePageMeta({
    title: 'Forgot Password',
    description: 'Request a password reset link for your account.',
    noindex: true,
  })

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() })
      setSubmitted(true)
    } catch (err: any) {
      // Even if there's an error, don't leak account existence unless network/429
      if (err?.status === 429) {
        setError('Too many reset requests. Please wait an hour before requesting another link.')
      } else {
        setSubmitted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] bg-[#FBF7EE] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#2E2A5C]/10 shadow-sm p-8 sm:p-10">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#5B3E96] hover:text-[#2E2A5C] font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#5B3E96]/10 text-[#5B3E96] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#2E2A5C] mb-3">Check Your Inbox</h1>
            <p className="text-sm text-[#2B2A3D]/80 leading-relaxed mb-6">
              If an account exists for <span className="font-semibold text-[#2E2A5C]">{email}</span>, we have sent a secure password reset link. Please check your inbox and spam folder.
            </p>
            <p className="text-xs text-[#2B2A3D]/60 mb-6">
              The link is valid for 1 hour.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] font-medium hover:bg-[#5B3E96] transition-colors"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#2E2A5C]/5 text-[#5B3E96] flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2A5C] mb-2">
              Forgot Password
            </h1>
            <p className="text-sm text-[#2B2A3D]/70 mb-6">
              Enter the email address registered with your account to receive a secure password reset link.
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
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seeker@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#2E2A5C]/20 focus:border-[#5B3E96] focus:ring-1 focus:ring-[#5B3E96] text-sm text-[#2B2A3D]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#5B3E96] text-white font-semibold text-sm hover:bg-[#2E2A5C] shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
