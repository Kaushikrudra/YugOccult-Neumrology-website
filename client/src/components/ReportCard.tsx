import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Info,
  X,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Loader2,
  Lock,
} from 'lucide-react'
import { Report, ReportBadge } from '../types/report'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { startCheckout } from '../lib/cashfree'

interface ReportCardProps {
  report: Report
}

const BADGE_CONFIG: Record<ReportBadge, { label: string; className: string }> = {
  popular: {
    label: 'Most Popular',
    className: 'bg-[#C9A227] text-white font-bold',
  },
  trending: {
    label: 'Trending',
    className: 'bg-[#5B3E96] text-white font-bold',
  },
  best_seller: {
    label: 'Best Seller',
    className: 'bg-amber-600 text-white font-bold',
  },
  new: {
    label: 'New',
    className: 'bg-[#2E2A5C] text-[#FBF7EE] font-bold',
  },
}

export const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const { settings } = useSiteSettings()
  const { user } = useAuth()
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Order form fields
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerGender, setBuyerGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false)
  const [birthPlace, setBirthPlace] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [consentAgreed, setConsentAgreed] = useState(false)

  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user && showOrderModal) {
      if (user.name && !buyerName) setBuyerName(user.name)
      if (user.email && !buyerEmail) setBuyerEmail(user.email)
    }
  }, [user, showOrderModal, buyerName, buyerEmail])

  const cleanPhone = (settings.whatsapp_number || '918922946307').replace(/\D/g, '')

  const handleOrderClick = () => {
    setFormError('')
    setShowOrderModal(true)
  }

  // Handle Cashfree Online Checkout
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const nameToUse = buyerName.trim()
    const rawPhone = buyerPhone.trim().replace(/\D/g, '').slice(-10)
    const emailToUse = buyerEmail.trim()
    const detailsToUse = reportDetails.trim()

    if (!nameToUse || nameToUse.length < 2) {
      setFormError('Please enter your full name (at least 2 characters).')
      return
    }

    if (rawPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit WhatsApp number.')
      return
    }

    if (!emailToUse || !emailToUse.includes('@')) {
      setFormError('Please enter a valid email address for receiving your invoice and report updates.')
      return
    }

    if (!detailsToUse || detailsToUse.length < 5) {
      setFormError('Please provide details regarding the person or area of concern (at least 5 characters).')
      return
    }

    if (!consentAgreed) {
      setFormError('Please agree to the sacred report terms and consent to proceed.')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await api.post<{ orderId: string; paymentSessionId: string }>(
        '/api/payments/report-order',
        {
          reportId: report.id,
          name: nameToUse,
          whatsapp_number: rawPhone,
          email: emailToUse,
          gender: buyerGender || null,
          birth_date: birthDate || null,
          birth_time: birthTimeUnknown ? null : birthTime || null,
          birth_time_unknown: birthTimeUnknown,
          birth_place: birthPlace.trim() || null,
          details: detailsToUse,
          notes: null,
          consent: true,
        }
      )

      if (res?.paymentSessionId) {
        setShowOrderModal(false)
        await startCheckout(res.paymentSessionId)
      } else {
        throw new Error('No payment session received from server.')
      }
    } catch (err: any) {
      console.error('[ReportCard:Payment] Error:', err)
      setFormError(err?.message || 'Failed to initiate payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fallback direct WhatsApp enquiry
  const handleOpenWhatsApp = () => {
    const nameToUse = buyerName.trim() || 'Seeker'
    const messageLines = [
      `Namaste Anushka ji, I am interested in the *${report.title}* report (₹${report.price.toLocaleString('en-IN')}).`,
      `My Name: ${nameToUse}`,
      buyerPhone ? `Phone: ${buyerPhone}` : null,
      reportDetails.trim() ? `Details: ${reportDetails.trim()}` : null,
      `Please guide me on how to proceed.`,
    ]
      .filter(Boolean)
      .join('\n')

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageLines)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <article className="bg-white rounded-2xl border border-secondary/15 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1">
        {/* Cover Image or Celestial Placeholder */}
        <div className="relative h-44 sm:h-48 w-full bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#3B2A70] border-b border-[#C9A227]/30 overflow-hidden flex items-center justify-center">
          {report.cover_image_url ? (
            <img
              src={report.cover_image_url}
              alt={report.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center relative select-none">
              <svg
                className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                viewBox="0 0 200 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="100" cy="60" r="50" stroke="#C9A227" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="100" cy="60" r="35" stroke="#EFEAF8" strokeWidth="1" />
                <circle cx="100" cy="60" r="20" stroke="#C9A227" strokeWidth="0.75" />
              </svg>

              <div className="w-12 h-12 rounded-full bg-ivory/10 backdrop-blur-md flex items-center justify-center shadow-xs mb-2 border border-[#C9A227]/40 relative z-10 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-[#C9A227]" />
              </div>

              <span className="font-heading text-base sm:text-lg text-ivory font-bold line-clamp-2 px-3 relative z-10 hero-text-shadow">
                {report.title}
              </span>
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
            {report.badge && BADGE_CONFIG[report.badge] ? (
              <span
                className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full shadow-xs ${BADGE_CONFIG[report.badge].className}`}
              >
                {BADGE_CONFIG[report.badge].label}
              </span>
            ) : <span />}

            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#2E2A5C]/80 backdrop-blur-sm text-[#FBF7EE] border border-[#C9A227]/40">
              Vedic Analysis
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-primary mb-1 line-clamp-1 group-hover:text-secondary transition-colors">
              {report.title}
            </h3>

            {report.tagline && (
              <p className="text-xs font-medium text-secondary/90 mb-2 line-clamp-1">
                {report.tagline}
              </p>
            )}

            <p className="text-ink/75 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-2">
              {report.description}
            </p>

            {/* Inclusions Highlights */}
            {report.included && report.included.length > 0 && (
              <div className="mb-3 pb-3 border-b border-mist space-y-1">
                {report.included.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-ink/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A227] shrink-0 mt-0.5" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & CTA */}
          <div className="pt-1">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-heading text-xl sm:text-2xl font-bold text-primary">
                  {report.price === 0 ? 'Free' : `₹${report.price.toLocaleString('en-IN')}`}
                </span>

                {report.original_price && report.original_price > report.price && (
                  <span className="text-xs sm:text-sm text-[#2B2A3D]/50 line-through font-normal">
                    ₹{report.original_price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {report.discount_percent != null && report.discount_percent > 0 && (
                <span className="bg-[#F8E7A2] text-[#1E1B4B] text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                  Save {report.discount_percent}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowDetailsModal(true)}
                className="w-full text-xs font-semibold py-2 px-2 sm:px-3 rounded-xl border border-secondary/30 text-secondary hover:bg-mist transition-colors flex items-center justify-center gap-1 min-h-[38px]"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>

              <button
                type="button"
                onClick={handleOrderClick}
                className="w-full text-xs font-semibold py-2 px-2 sm:px-3 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#3C3775] transition-all flex items-center justify-center gap-1 shadow-sm active:scale-[0.99] min-h-[38px]"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Order Now</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* 1. DETAILS MODAL */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-lg rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden text-[#2B2A3D] max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2E2A5C] text-white p-5 sm:p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-[#FBF7EE] font-heading pr-8">
                {report.title}
              </h3>
              {report.tagline && (
                <p className="text-xs text-[#C9A227] font-medium mt-1">
                  {report.tagline}
                </p>
              )}
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <p className="text-[#2B2A3D]/85 leading-relaxed">
                {report.description}
              </p>

              {report.included && report.included.length > 0 && (
                <div>
                  <h4 className="font-heading text-sm font-bold text-[#2E2A5C] mb-2 uppercase tracking-wider">
                    What&apos;s Included In This Report:
                  </h4>
                  <ul className="space-y-2">
                    {report.included.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                        <span className="text-[#2B2A3D]/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-secondary/15 flex items-center justify-between">
                <span className="font-heading text-lg font-bold text-[#2E2A5C]">
                  {report.price === 0 ? 'Free' : `₹${report.price.toLocaleString('en-IN')}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleOrderClick()
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#3C3775] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Order Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDER / CASHFREE PAYMENT MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-lg rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden text-[#2B2A3D] max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2E2A5C] text-white p-5 sm:p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#C9A227]" />
                <span className="text-xs uppercase tracking-wider text-[#C9A227] font-semibold">
                  Personalised Vedic Report Order
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#FBF7EE] font-heading pr-8">
                {report.title}
              </h3>
              <p className="text-xs text-[#C9A227] font-semibold mt-1">
                Total Fee: ₹{report.price.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleProceedToPayment} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs font-semibold text-[#5B3E96] animate-in fade-in">
                  {formError}
                </div>
              )}

              {/* Seeker Name & WhatsApp Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Your Full Name <span className="text-[#C9A227]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-secondary absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    WhatsApp Number <span className="text-[#C9A227]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-secondary absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Email Address <span className="text-[#C9A227]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-secondary absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="For payment & PDF delivery"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Gender <span className="text-xs font-normal text-ink/60">(Optional)</span>
                  </label>
                  <select
                    value={buyerGender}
                    onChange={(e) => setBuyerGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Details Text Area (Free-text for buyer) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                  Report Subject &amp; Focus Details <span className="text-[#C9A227]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  maxLength={1000}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Enter the name of the person/business or your core area of concern (e.g., career switch timing, marital compatibility, business expansion)..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40 leading-relaxed"
                />
                <span className="text-[11px] text-ink/60">Minimum 5 characters.</span>
              </div>

              {/* Birth / Personal Details (Optional) */}
              <div className="pt-2 border-t border-secondary/15">
                <p className="text-xs uppercase tracking-wider font-bold text-[#5B3E96] mb-2">
                  Birth Details <span className="text-xs font-normal text-ink/60 lowercase">(optional – adds planetary precision)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#2B2A3D] mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-secondary" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-[#2B2A3D] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-secondary" />
                        Birth Time
                      </label>
                      <label className="text-[11px] text-ink/70 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={birthTimeUnknown}
                          onChange={(e) => setBirthTimeUnknown(e.target.checked)}
                          className="rounded text-[#5B3E96] focus:ring-0"
                        />
                        <span>Unknown</span>
                      </label>
                    </div>
                    <input
                      type="time"
                      disabled={birthTimeUnknown}
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40 ${
                        birthTimeUnknown ? 'opacity-50 cursor-not-allowed bg-mist' : ''
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-[#2B2A3D] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-secondary" />
                    Place of Birth (City, State)
                  </label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="e.g. Varanasi, Uttar Pradesh"
                    maxLength={100}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-[#2B2A3D]/85 cursor-pointer leading-relaxed">
                  <input
                    type="checkbox"
                    checked={consentAgreed}
                    onChange={(e) => setConsentAgreed(e.target.checked)}
                    className="rounded text-[#5B3E96] focus:ring-0 mt-0.5"
                  />
                  <span>
                    I confirm the above details are accurate and agree to the 24-48 hr report analysis timeline.
                  </span>
                </label>
              </div>

              {/* CTA */}
              <div className="pt-3 border-t border-secondary/15 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] font-semibold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
                      <span>Redirecting to Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#C9A227]" />
                      <span>Pay Online via Cashfree (₹{report.price.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="text-xs text-[#5B3E96] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>Have questions first? Enquire via WhatsApp</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ReportCard
