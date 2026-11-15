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
  MessageSquare,
} from 'lucide-react'
import { Report, ReportBadge } from '../types/report'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { useAuth } from '../context/AuthContext'

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
  const [orderNotes, setOrderNotes] = useState('')
  const [formError, setFormError] = useState('')

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

  const handleProceedToWhatsApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setFormError('')

    const nameToUse = buyerName.trim()
    const phoneToUse = buyerPhone.trim()

    if (!nameToUse || nameToUse.length < 2) {
      setFormError('Please enter your full name (at least 2 characters).')
      return
    }

    if (!phoneToUse || phoneToUse.replace(/\D/g, '').length < 8) {
      setFormError('Please enter a valid WhatsApp number (at least 8 digits).')
      return
    }

    const emailToUse = buyerEmail.trim() || user?.email || null

    const messageLines = [
      `Namaste Anushka ji, I would like to order the *${report.title}* report (₹${report.price.toLocaleString('en-IN')}).`,
      ``,
      `*Order Details:*`,
      `• Name: ${nameToUse}`,
      `• WhatsApp: ${phoneToUse}`,
      emailToUse ? `• Email: ${emailToUse}` : null,
      buyerGender ? `• Gender: ${buyerGender.charAt(0).toUpperCase() + buyerGender.slice(1)}` : null,
      birthDate ? `• Date of Birth: ${birthDate}` : null,
      birthTimeUnknown ? `• Time of Birth: Time Unknown` : birthTime ? `• Time of Birth: ${birthTime}` : null,
      birthPlace.trim() ? `• Place of Birth: ${birthPlace.trim()}` : null,
      orderNotes.trim() ? `• Specific Questions: ${orderNotes.trim()}` : null,
      ``,
      `Looking forward to receiving my personalised report.`,
    ]
      .filter(Boolean)
      .join('\n')

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageLines)}`

    // Asynchronously trigger server order creation & admin email notification to yanushka655@gmail.com
    fetch(`/api/reports/${report.id}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameToUse,
        whatsapp_number: phoneToUse,
        email: emailToUse,
        gender: buyerGender || null,
        birth_date: birthDate || null,
        birth_time: birthTimeUnknown ? null : birthTime || null,
        birth_time_unknown: birthTimeUnknown,
        birth_place: birthPlace.trim() || null,
        notes: orderNotes.trim() || null,
      }),
    }).catch((err) => console.warn('[ReportCard:Order] Notification error:', err))

    // Open WhatsApp immediately within user gesture context so popup blockers never intercept it
    setShowOrderModal(false)
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <article className="bg-white rounded-2xl border border-secondary/15 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1">
        {/* Cover Image or Celestial Placeholder */}
        <div className="relative h-48 sm:h-52 w-full bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#3B2A70] border-b border-[#C9A227]/30 overflow-hidden flex items-center justify-center">
          {report.cover_image_url ? (
            <img
              src={report.cover_image_url}
              alt={report.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative select-none">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C9A227_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-[#C9A227]/40 flex items-center justify-center mb-2 shadow-inner">
                <FileText className="w-7 h-7 text-[#C9A227]" />
              </div>
              <span className="text-xs uppercase tracking-widest text-[#C9A227] font-semibold">
                Personalised Report
              </span>
              <span className="text-[11px] text-white/70 mt-0.5">Handcrafted PDF</span>
            </div>
          )}

          {/* Badge */}
          {report.badge && BADGE_CONFIG[report.badge] && (
            <div className="absolute top-3 left-3 z-10">
              <span
                className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md ${
                  BADGE_CONFIG[report.badge].className
                }`}
              >
                {BADGE_CONFIG[report.badge].label}
              </span>
            </div>
          )}

          {/* PDF Format Tag */}
          <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-md text-[#FBF7EE] text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/20">
            PDF Report
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
          <div>
            {/* Title */}
            <h3 className="font-heading text-lg sm:text-xl font-bold text-[#2B2A3D] line-clamp-2 leading-snug group-hover:text-[#5B3E96] transition-colors">
              {report.title}
            </h3>

            {/* Tagline (Generic fallback if null) */}
            <p className="text-xs sm:text-sm text-ink/70 mt-1 line-clamp-1 italic">
              {report.tagline || 'A personalised report prepared for you.'}
            </p>

            {/* Description Snippet */}
            {report.description && (
              <p className="text-xs sm:text-sm text-ink/80 mt-2.5 line-clamp-2 leading-relaxed">
                {report.description}
              </p>
            )}

            {/* Included Bullets Preview */}
            {Array.isArray(report.included) && report.included.length > 0 && (
              <div className="mt-4 pt-3 border-t border-secondary/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5B3E96] mb-2">
                  What's Included:
                </p>
                <ul className="space-y-1.5">
                  {report.included.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-ink/85">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A227] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                  {report.included.length > 3 && (
                    <li className="text-[11px] text-[#5B3E96] font-medium pl-5">
                      +{report.included.length - 3} more insights included
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Pricing & Footer Actions */}
          <div className="mt-5 pt-4 border-t border-secondary/10">
            {/* Price section */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-xl sm:text-2xl font-bold text-[#2B2A3D]">
                {report.price === 0 ? 'Free' : `₹${report.price.toLocaleString('en-IN')}`}
              </span>

              {report.original_price && report.original_price > report.price && (
                <span className="text-sm text-ink/50 line-through">
                  ₹{report.original_price.toLocaleString('en-IN')}
                </span>
              )}

              {report.discount_percent && report.discount_percent > 0 && (
                <span className="text-[11px] font-bold text-[#5B3E96] bg-[#5B3E96]/10 px-2 py-0.5 rounded-full">
                  {report.discount_percent}% OFF
                </span>
              )}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowDetailsModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-secondary/30 text-ink/80 hover:text-secondary hover:bg-mist/60 text-xs sm:text-sm font-semibold transition-all focus:outline-none"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>

              <button
                type="button"
                onClick={handleOrderClick}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] hover:opacity-95 text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Order Now</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* 1. VIEW DETAILS MODAL */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-lg rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2E2A5C] text-white p-5 sm:p-6 relative">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {report.badge && BADGE_CONFIG[report.badge] && (
                <span
                  className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                    BADGE_CONFIG[report.badge].className
                  }`}
                >
                  {BADGE_CONFIG[report.badge].label}
                </span>
              )}

              <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#FBF7EE]">
                {report.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#C9A227] mt-1 font-medium italic">
                {report.tagline || 'A personalised report prepared for you.'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-[#2B2A3D]">
              {/* Description */}
              {report.description && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-[#5B3E96] mb-1.5">
                    About this report
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-ink/85">
                    {report.description}
                  </p>
                </div>
              )}

              {/* What's Included */}
              {Array.isArray(report.included) && report.included.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-secondary/15">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-[#5B3E96] mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                    What you will receive
                  </h4>
                  <ul className="space-y-2">
                    {report.included.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-ink/90">
                        <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* How it works */}
              <div className="bg-mist/50 p-4 rounded-xl border border-secondary/15 space-y-2.5">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#2E2A5C]">
                  How the Personalised Process Works
                </h4>
                <div className="grid grid-cols-1 gap-2 text-xs text-ink/80">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5B3E96] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      <strong>Submit Birth Details:</strong> Share your exact Date of Birth, Time of Birth, and Place of Birth.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5B3E96] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong>Manual Expert Analysis:</strong> Our certified astrologers study your planetary positions and numerological charts by hand (no auto-generated generic text).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5B3E96] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      <strong>Custom PDF Delivery:</strong> Your confidential, comprehensive PDF report is sent directly to your WhatsApp or Email within 24 to 48 hours.
                    </span>
                  </div>
                </div>
              </div>

              {/* Price summary & Policy */}
              <div className="pt-2 border-t border-secondary/15 flex items-center justify-between">
                <div>
                  <span className="text-xs text-ink/60 block">Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#2B2A3D]">
                      {report.price === 0 ? 'Free' : `₹${report.price.toLocaleString('en-IN')}`}
                    </span>
                    {report.original_price && report.original_price > report.price && (
                      <span className="text-xs text-ink/50 line-through">
                        ₹{report.original_price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowOrderModal(true)
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] text-sm font-semibold hover:opacity-95 shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#C9A227]" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDER NOW / WHATSAPP MODAL */}
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
                  Personalised Order
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#FBF7EE] font-heading pr-8">
                {report.title}
              </h3>
              <p className="text-xs text-[#C9A227] font-semibold mt-1">
                Price: {report.price === 0 ? 'Free' : `₹${report.price.toLocaleString('en-IN')}`}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleProceedToWhatsApp} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="bg-mist/70 p-3 rounded-xl border border-secondary/15 text-xs text-ink/85 leading-relaxed">
                <p className="font-semibold text-[#2E2A5C] mb-0.5">Direct WhatsApp Ordering & Confirmation</p>
                <p>
                  Share your details below so our team can craft your accurate report. Clicking continue opens WhatsApp to complete your order, and your request details will be sent automatically.
                </p>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-secondary/15 border border-secondary/40 text-xs font-semibold text-[#5B3E96]">
                  {formError}
                </div>
              )}

              {/* Seeker Name & WhatsApp Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Your Name <span className="text-[#C9A227]">*</span>
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
                      minLength={8}
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Email Address <span className="text-xs font-normal text-ink/60">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-secondary absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="For PDF report copy"
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

              {/* Birth / Personal Details */}
              <div className="pt-2 border-t border-secondary/15">
                <p className="text-xs uppercase tracking-wider font-bold text-[#5B3E96] mb-2">
                  Birth / Personal Details <span className="text-xs font-normal text-ink/60 lowercase">(optional – can also share in WhatsApp)</span>
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

              {/* Specific Questions / Notes */}
              <div>
                <label className="block text-xs font-medium text-[#2B2A3D] mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-secondary" />
                  Specific Questions or Focus Area <span className="text-xs font-normal text-ink/60">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Career transition timing, marriage prospects, health concern..."
                  maxLength={500}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
                />
              </div>

              {/* CTA */}
              <div className="pt-2 border-t border-secondary/15">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] hover:opacity-95 font-semibold text-sm shadow-md transition-all active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4 text-[#C9A227]" />
                  <span>Continue to WhatsApp (₹{report.price.toLocaleString('en-IN')})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ReportCard
