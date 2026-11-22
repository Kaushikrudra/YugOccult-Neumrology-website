import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  MessageCircle,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Scroll,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react'
import Container from './Container'
import { api } from '../lib/api'
import { startCheckout } from '../lib/cashfree'

interface FormErrors {
  name?: string
  whatsapp_number?: string
  gender?: string
  birth_date?: string
  birth_time?: string
  birth_place?: string
  q1?: string
  q2?: string
  q3?: string
  consent?: string
  general?: string
}

const QUESTION_PRICING: Record<1 | 2 | 3, number> = {
  1: 699,
  2: 999,
  3: 1599,
}

export const LeadCaptureSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kundli' | 'ask_question'>('kundli')

  // Automatically activate the correct tab based on anchor hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (hash === '#kundli-request' || hash === '#kundli-form' || hash === '#free-kundli') {
        setActiveTab('kundli')
      } else if (hash === '#ask-question') {
        setActiveTab('ask_question')
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Honeypot field for bot prevention (must remain empty)
  const [websiteHoneypot, setWebsiteHoneypot] = useState('')

  // ==========================================
  // Form State: Kundli Request (₹499)
  // ==========================================
  const [fkName, setFkName] = useState('')
  const [fkGender, setFkGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [fkBirthDate, setFkBirthDate] = useState('')
  const [fkBirthHour, setFkBirthHour] = useState('12')
  const [fkBirthMinute, setFkBirthMinute] = useState('00')
  const [fkBirthAmPm, setFkBirthAmPm] = useState<'AM' | 'PM'>('AM')
  const [fkBirthTimeUnknown, setFkBirthTimeUnknown] = useState(false)
  const [fkBirthPlace, setFkBirthPlace] = useState('')
  const [fkWhatsApp, setFkWhatsApp] = useState('')
  const [fkConsent, setFkConsent] = useState(false)

  // ==========================================
  // Form State: Ask the Astrologer (1 Q: ₹699 | 2 Qs: ₹999 | 3 Qs: ₹1599)
  // ==========================================
  const [questionTier, setQuestionTier] = useState<1 | 2 | 3>(1)
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')
  const [aaName, setAaName] = useState('')
  const [aaWhatsApp, setAaWhatsApp] = useState('')
  const [aaShowBirthDetails, setAaShowBirthDetails] = useState(false)
  const [aaGender, setAaGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [aaBirthDate, setAaBirthDate] = useState('')
  const [aaBirthHour, setAaBirthHour] = useState('12')
  const [aaBirthMinute, setAaBirthMinute] = useState('00')
  const [aaBirthAmPm, setAaBirthAmPm] = useState<'AM' | 'PM'>('AM')
  const [aaBirthTimeUnknown, setAaBirthTimeUnknown] = useState(false)
  const [aaBirthPlace, setAaBirthPlace] = useState('')
  const [aaConsent, setAaConsent] = useState(false)

  // ==========================================
  // Submission & UI States
  // ==========================================
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fkErrors, setFkErrors] = useState<FormErrors>({})
  const [aaErrors, setAaErrors] = useState<FormErrors>({})
  const [fkSubmitted, setFkSubmitted] = useState(false)
  const [aaSubmitted, setAaSubmitted] = useState(false)

  // Convert 12-hour (hh, mm, ampm) to 24-hour HH:MM format
  const format24HourTime = (hourStr: string, minuteStr: string, ampm: 'AM' | 'PM'): string => {
    let hour = parseInt(hourStr, 10)
    if (isNaN(hour)) hour = 12
    if (ampm === 'PM' && hour < 12) hour += 12
    if (ampm === 'AM' && hour === 12) hour = 0
    const hh = hour.toString().padStart(2, '0')
    const mm = minuteStr.padStart(2, '0')
    return `${hh}:${mm}`
  }

  // Maximum allowed birth date is today
  const todayDateStr = new Date().toISOString().split('T')[0]

  // Reset Kundli form
  const handleResetFk = () => {
    setFkName('')
    setFkGender('')
    setFkBirthDate('')
    setFkBirthHour('12')
    setFkBirthMinute('00')
    setFkBirthAmPm('AM')
    setFkBirthTimeUnknown(false)
    setFkBirthPlace('')
    setFkWhatsApp('')
    setFkConsent(false)
    setFkErrors({})
    setFkSubmitted(false)
  }

  // Reset Ask Question form
  const handleResetAa = () => {
    setQ1('')
    setQ2('')
    setQ3('')
    setAaName('')
    setAaWhatsApp('')
    setAaShowBirthDetails(false)
    setAaGender('')
    setAaBirthDate('')
    setAaBirthHour('12')
    setAaBirthMinute('00')
    setAaBirthAmPm('AM')
    setAaBirthTimeUnknown(false)
    setAaBirthPlace('')
    setAaConsent(false)
    setAaErrors({})
    setAaSubmitted(false)
  }

  // Submit Kundli Request (₹499)
  const handleSubmitKundli = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: FormErrors = {}

    if (!fkName.trim()) {
      errors.name = 'Please provide your full name.'
    } else if (fkName.trim().length < 2 || fkName.trim().length > 80) {
      errors.name = 'Name must be between 2 and 80 characters.'
    }

    if (!fkGender) {
      errors.gender = 'Please select a gender.'
    }

    if (!fkBirthDate) {
      errors.birth_date = 'Please select your date of birth.'
    } else {
      const d = new Date(fkBirthDate + 'T00:00:00Z')
      const minDate = new Date('1900-01-01T00:00:00Z')
      const now = new Date()
      if (isNaN(d.getTime()) || d < minDate || d > now) {
        errors.birth_date = 'Birth date must be between 1900 and today.'
      }
    }

    if (!fkBirthTimeUnknown) {
      const hh = parseInt(fkBirthHour, 10)
      const mm = parseInt(fkBirthMinute, 10)
      if (isNaN(hh) || isNaN(mm) || hh < 1 || hh > 12 || mm < 0 || mm > 59) {
        errors.birth_time = 'Please select a valid birth time.'
      }
    }

    if (!fkBirthPlace.trim()) {
      errors.birth_place = 'Please enter your birth city, state or country.'
    } else if (fkBirthPlace.trim().length < 2 || fkBirthPlace.trim().length > 120) {
      errors.birth_place = 'Birth place must be between 2 and 120 characters.'
    }

    const waDigits = fkWhatsApp.replace(/\D/g, '')
    if (!waDigits) {
      errors.whatsapp_number = 'WhatsApp number is required.'
    } else if (waDigits.length < 10 || waDigits.length > 15) {
      errors.whatsapp_number = 'Please enter a valid WhatsApp number (10 to 15 digits).'
    }

    if (!fkConsent) {
      errors.consent = 'Please agree to be contacted on WhatsApp regarding your request.'
    }

    if (Object.keys(errors).length > 0) {
      setFkErrors(errors)
      return
    }

    setFkErrors({})
    setIsSubmitting(true)

    try {
      const payload = {
        name: fkName.trim(),
        gender: fkGender,
        birth_date: fkBirthDate,
        birth_time: fkBirthTimeUnknown ? null : format24HourTime(fkBirthHour, fkBirthMinute, fkBirthAmPm),
        birth_time_unknown: fkBirthTimeUnknown,
        birth_place: fkBirthPlace.trim(),
        whatsapp_number: fkWhatsApp.trim(),
        consent: fkConsent,
        website: websiteHoneypot,
      }

      const res = await api.post<{ orderId: string; paymentSessionId: string }>(
        '/api/payments/kundli-order',
        payload
      )

      if (res?.paymentSessionId) {
        await startCheckout(res.paymentSessionId)
      } else {
        throw new Error('Could not initiate payment session.')
      }
    } catch (err: any) {
      console.error('[KundliRequest] Payment error:', err)
      setFkErrors({ general: err?.message || 'Failed to initiate payment. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Ask the Astrologer Request (Tiered: ₹699, ₹999, ₹1599)
  const handleSubmitAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: FormErrors = {}

    if (!aaName.trim()) {
      errors.name = 'Please provide your name.'
    } else if (aaName.trim().length < 2 || aaName.trim().length > 80) {
      errors.name = 'Name must be between 2 and 80 characters.'
    }

    const waDigits = aaWhatsApp.replace(/\D/g, '')
    if (!waDigits) {
      errors.whatsapp_number = 'WhatsApp number is required.'
    } else if (waDigits.length < 10 || waDigits.length > 15) {
      errors.whatsapp_number = 'Please enter a valid WhatsApp number (10 to 15 digits).'
    }

    // Validate based on question tier
    if (!q1.trim()) {
      errors.q1 = 'Please write Question #1.'
    } else if (q1.trim().length < 5) {
      errors.q1 = 'Question #1 must be at least 5 characters long.'
    }

    if (questionTier >= 2) {
      if (!q2.trim()) {
        errors.q2 = 'Please write Question #2.'
      } else if (q2.trim().length < 5) {
        errors.q2 = 'Question #2 must be at least 5 characters long.'
      }
    }

    if (questionTier >= 3) {
      if (!q3.trim()) {
        errors.q3 = 'Please write Question #3.'
      } else if (q3.trim().length < 5) {
        errors.q3 = 'Question #3 must be at least 5 characters long.'
      }
    }

    // Optional birth details validation if toggled open
    if (aaShowBirthDetails) {
      if (aaBirthDate) {
        const d = new Date(aaBirthDate + 'T00:00:00Z')
        const minDate = new Date('1900-01-01T00:00:00Z')
        const now = new Date()
        if (isNaN(d.getTime()) || d < minDate || d > now) {
          errors.birth_date = 'Birth date must be between 1900 and today.'
        }
      }

      if (aaBirthPlace && (aaBirthPlace.trim().length < 2 || aaBirthPlace.trim().length > 120)) {
        errors.birth_place = 'Birth place must be between 2 and 120 characters.'
      }

      if (!aaBirthTimeUnknown && (aaBirthHour || aaBirthMinute)) {
        const hh = parseInt(aaBirthHour, 10)
        const mm = parseInt(aaBirthMinute, 10)
        if (isNaN(hh) || isNaN(mm) || hh < 1 || hh > 12 || mm < 0 || mm > 59) {
          errors.birth_time = 'Please select a valid birth time.'
        }
      }
    }

    if (!aaConsent) {
      errors.consent = 'Please agree to be contacted on WhatsApp regarding your request.'
    }

    if (Object.keys(errors).length > 0) {
      setAaErrors(errors)
      return
    }

    setAaErrors({})
    setIsSubmitting(true)

    try {
      const combinedQuestions =
        questionTier === 1
          ? q1.trim()
          : questionTier === 2
          ? `Question 1: ${q1.trim()}\n\nQuestion 2: ${q2.trim()}`
          : `Question 1: ${q1.trim()}\n\nQuestion 2: ${q2.trim()}\n\nQuestion 3: ${q3.trim()}`

      const payload: Record<string, any> = {
        question_count: questionTier,
        question: combinedQuestions,
        name: aaName.trim(),
        whatsapp_number: aaWhatsApp.trim(),
        consent: aaConsent,
        website: websiteHoneypot,
      }

      if (aaShowBirthDetails) {
        if (aaGender) payload.gender = aaGender
        if (aaBirthDate) payload.birth_date = aaBirthDate
        if (!aaBirthTimeUnknown && aaBirthHour && aaBirthMinute) {
          payload.birth_time = format24HourTime(aaBirthHour, aaBirthMinute, aaBirthAmPm)
        }
        payload.birth_time_unknown = aaBirthTimeUnknown
        if (aaBirthPlace.trim()) payload.birth_place = aaBirthPlace.trim()
      }

      const res = await api.post<{ orderId: string; paymentSessionId: string }>(
        '/api/payments/ask-question-order',
        payload
      )

      if (res?.paymentSessionId) {
        await startCheckout(res.paymentSessionId)
      } else {
        throw new Error('Could not initiate payment session.')
      }
    } catch (err: any) {
      console.error('[AskQuestion] Payment error:', err)
      setAaErrors({ general: err?.message || 'Failed to initiate payment. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="free-kundli" className="py-8 sm:py-14 bg-mist/40 border-b border-secondary/15">
      <Container size="md">
        <div
          id="kundli-request"
          className="scroll-mt-24 sm:scroll-mt-28 bg-white rounded-3xl border border-secondary/25 shadow-xl overflow-hidden"
        >
          {/* Card Header with Spiritual Accent Pill */}
          <div className="bg-gradient-to-r from-primary via-[#3B2A70] to-primary p-6 sm:p-8 text-ivory text-center relative overflow-hidden">
            {/* Subtle radial glow */}
            <div
              className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(201,162,39,0.15)_0%,_transparent_70%)]"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ivory/10 border border-accent/40 text-accent text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sacred Jyotish Consultation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-ivory tracking-tight">
                Connect Directly with Our Vedic Astrologer
              </h2>
              <p className="text-xs sm:text-sm text-ivory/85 max-w-xl mx-auto leading-relaxed">
                Order your personalized Kundli report or ask your pressing life questions for clear, classical guidance.
              </p>
            </div>
          </div>

          {/* Segmented Control Tabs */}
          <div className="p-4 sm:p-6 pb-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-mist rounded-2xl border border-secondary/15">
              <button
                type="button"
                onClick={() => setActiveTab('kundli')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] cursor-pointer ${
                  activeTab === 'kundli'
                    ? 'bg-primary text-ivory shadow-md'
                    : 'text-primary/75 hover:text-primary hover:bg-white/60'
                }`}
              >
                <Scroll className="w-4 h-4 text-accent" />
                <span>Kundli Request</span>
                <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                  ₹499
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ask_question')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] cursor-pointer ${
                  activeTab === 'ask_question'
                    ? 'bg-primary text-ivory shadow-md'
                    : 'text-primary/75 hover:text-primary hover:bg-white/60'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-accent" />
                <span>Ask the Astrologer</span>
                <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                  From ₹699
                </span>
                
              </button>
            </div>
          </div>

          {/* Hidden Honeypot Input for anti-spam bots */}
          <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
            <label htmlFor="website-field">Leave this empty</label>
            <input
              id="website-field"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={websiteHoneypot}
              onChange={(e) => setWebsiteHoneypot(e.target.value)}
            />
          </div>

          {/* ============================================================== */}
          {/* TAB 1: KUNDLI REQUEST (₹499) */}
          {/* ============================================================== */}
          {activeTab === 'kundli' && (
            <div id="kundli-form" className="p-6 sm:p-8 scroll-mt-24 sm:scroll-mt-28">
              {fkSubmitted ? (
                /* Success State */
                <div className="py-8 sm:py-12 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-secondary text-accent flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-primary">
                    Kundli Request Placed Successfully
                  </h3>
                  <p className="text-sm text-ink/80 max-w-md mx-auto leading-relaxed">
                    Namaste <strong>{fkName}</strong>! Your Kundli analysis request (<strong>₹499</strong>) has been registered. Our certified astrologer will review your birth chart and connect with you directly on WhatsApp.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={`https://wa.me/918922946307?text=Namaste%20Anushka%20Ji,%20I%20have%20submitted%20my%20Kundli%20Request%20(₹499)%20for%20${encodeURIComponent(
                        fkName
                      )}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-ivory text-xs font-semibold hover:bg-primary/90 transition-all shadow-md min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4 text-accent" />
                      <span>Confirm on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleResetFk}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-secondary/30 text-xs font-semibold text-primary hover:bg-mist transition-colors min-h-[44px]"
                    >
                      <span>Submit Another Request</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Kundli Request Form */
                <form onSubmit={handleSubmitKundli} noValidate className="space-y-5">
                  {/* Pricing Overview Strip */}
                  <div className="p-4 rounded-2xl bg-ivory border border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
                        Vedic Horoscope Analysis
                      </span>
                      <h4 className="font-heading text-lg font-bold text-primary">
                        Personalized Kundli Report &amp; Chart Assessment
                      </h4>
                      <p className="text-xs text-ink/70 mt-0.5">
                        Complete Lagna, Moon, and Navamsha chart review with planetary dasha guidance.
                      </p>
                    </div>

                    <div className="bg-secondary/15 px-4 py-2.5 rounded-xl border border-secondary/30 shrink-0 text-left sm:text-right">
                      <span className="text-[10px] uppercase font-semibold text-primary/70 block">
                        Consultation Fee
                      </span>
                      <span className="text-2xl font-heading font-bold text-primary">
                        ₹499
                      </span>
                    </div>
                  </div>

                  {fkErrors.general && (
                    <div className="p-3.5 rounded-xl bg-mist border border-secondary/30 text-secondary text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-secondary" />
                      <span>{fkErrors.general}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                      Full Legal Name <span className="text-secondary">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-secondary absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={fkName}
                        onChange={(e) => setFkName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        maxLength={80}
                        className={`w-full pl-10 pr-3.5 py-3 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 min-h-[44px] ${
                          fkErrors.name
                            ? 'border-secondary focus:ring-secondary/40'
                            : 'border-secondary/20 focus:ring-secondary/30'
                        }`}
                      />
                    </div>
                    {fkErrors.name && (
                      <p className="text-xs text-secondary font-medium mt-1">{fkErrors.name}</p>
                    )}
                  </div>

                  {/* Gender (Radio Group) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                      Gender <span className="text-secondary">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {(['male', 'female', 'other'] as const).map((g) => (
                        <label
                          key={g}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all min-h-[44px] ${
                            fkGender === g
                              ? 'bg-secondary/15 border-secondary text-primary font-bold shadow-xs'
                              : 'border-secondary/20 bg-white hover:bg-mist text-ink/80'
                          }`}
                        >
                          <input
                            type="radio"
                            name="fk-gender"
                            value={g}
                            checked={fkGender === g}
                            onChange={() => setFkGender(g)}
                            className="sr-only"
                          />
                          <span className="capitalize">{g}</span>
                        </label>
                      ))}
                    </div>
                    {fkErrors.gender && (
                      <p className="text-xs text-secondary font-medium mt-1">{fkErrors.gender}</p>
                    )}
                  </div>

                  {/* Date of Birth & Place of Birth */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date of Birth */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                        Date of Birth <span className="text-secondary">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-secondary absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="date"
                          max={todayDateStr}
                          value={fkBirthDate}
                          onChange={(e) => setFkBirthDate(e.target.value)}
                          className={`w-full pl-10 pr-3.5 py-3 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 min-h-[44px] ${
                            fkErrors.birth_date
                              ? 'border-secondary focus:ring-secondary/40'
                              : 'border-secondary/20 focus:ring-secondary/30'
                          }`}
                        />
                      </div>
                      {fkErrors.birth_date && (
                        <p className="text-xs text-secondary font-medium mt-1">{fkErrors.birth_date}</p>
                      )}
                    </div>

                    {/* Place of Birth */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                        Place of Birth (City, State) <span className="text-secondary">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-secondary absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          value={fkBirthPlace}
                          onChange={(e) => setFkBirthPlace(e.target.value)}
                          placeholder="e.g. Lucknow, Uttar Pradesh"
                          maxLength={120}
                          className={`w-full pl-10 pr-3.5 py-3 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 min-h-[44px] ${
                            fkErrors.birth_place
                              ? 'border-secondary focus:ring-secondary/40'
                              : 'border-secondary/20 focus:ring-secondary/30'
                          }`}
                        />
                      </div>
                      {fkErrors.birth_place && (
                        <p className="text-xs text-secondary font-medium mt-1">{fkErrors.birth_place}</p>
                      )}
                    </div>
                  </div>

                  {/* Time of Birth */}
                  <div className="space-y-2 p-4 rounded-2xl bg-ivory/60 border border-secondary/15">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                        Time of Birth <span className="text-secondary">*</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-ink/80 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={fkBirthTimeUnknown}
                          onChange={(e) => setFkBirthTimeUnknown(e.target.checked)}
                          className="w-4 h-4 rounded text-secondary focus:ring-secondary"
                        />
                        <span>Not sure / Exact time unknown</span>
                      </label>
                    </div>

                    {!fkBirthTimeUnknown ? (
                      <div className="grid grid-cols-3 gap-2">
                        {/* Hour */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-primary/70 mb-1">
                            Hour
                          </label>
                          <select
                            value={fkBirthHour}
                            onChange={(e) => setFkBirthHour(e.target.value)}
                            className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-secondary/20 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 min-h-[44px]"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                              const s = h.toString().padStart(2, '0')
                              return (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              )
                            })}
                          </select>
                        </div>

                        {/* Minute */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-primary/70 mb-1">
                            Minute
                          </label>
                          <select
                            value={fkBirthMinute}
                            onChange={(e) => setFkBirthMinute(e.target.value)}
                            className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-secondary/20 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 min-h-[44px]"
                          >
                            {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                              const s = m.toString().padStart(2, '0')
                              return (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              )
                            })}
                          </select>
                        </div>

                        {/* AM/PM */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-primary/70 mb-1">
                            AM / PM
                          </label>
                          <select
                            value={fkBirthAmPm}
                            onChange={(e) => setFkBirthAmPm(e.target.value as 'AM' | 'PM')}
                            className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-secondary/20 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 min-h-[44px]"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-ink/70 italic pt-1">
                        Our astrologer will use Surya Lagna &amp; Chandra Kundli to analyze your chart when exact birth time is unavailable.
                      </p>
                    )}

                    {fkErrors.birth_time && (
                      <p className="text-xs text-secondary font-medium mt-1">{fkErrors.birth_time}</p>
                    )}
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                      WhatsApp Number <span className="text-secondary">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-3.5 text-xs font-bold text-secondary pointer-events-none">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={fkWhatsApp}
                        onChange={(e) => setFkWhatsApp(e.target.value)}
                        placeholder="8922946307"
                        maxLength={15}
                        className={`w-full pl-12 pr-3.5 py-3 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 min-h-[44px] ${
                          fkErrors.whatsapp_number
                            ? 'border-secondary focus:ring-secondary/40'
                            : 'border-secondary/20 focus:ring-secondary/30'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-ink/60">
                      Your Kundli report summary and consultation follow-up will be shared on this WhatsApp number.
                    </p>
                    {fkErrors.whatsapp_number && (
                      <p className="text-xs text-secondary font-medium mt-1">{fkErrors.whatsapp_number}</p>
                    )}
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={fkConsent}
                        onChange={(e) => setFkConsent(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-secondary focus:ring-secondary shrink-0"
                      />
                      <span className="text-xs text-ink/80 leading-relaxed">
                        I agree to be contacted on WhatsApp regarding my Kundli request and understand that Vedic astrology offers guidance and perspective.
                      </span>
                    </label>
                    {fkErrors.consent && (
                      <p className="text-xs text-secondary font-medium mt-1">{fkErrors.consent}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-2xl bg-primary text-ivory text-sm font-semibold tracking-wide hover:bg-primary/95 transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                          <span>Securing Order & Opening Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-accent" />
                          <span>Pay Online &amp; Order Kundli • ₹499</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: ASK THE ASTROLOGER (1 Q: ₹699 | 2 Qs: ₹999 | 3 Qs: ₹1599) */}
          {/* ============================================================== */}
          {activeTab === 'ask_question' && (
            <div className="p-6 sm:p-8">
              {aaSubmitted ? (
                /* Success State */
                <div className="py-8 sm:py-12 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-secondary text-accent flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-primary">
                    Questions Submitted Successfully
                  </h3>
                  <p className="text-sm text-ink/80 max-w-md mx-auto leading-relaxed">
                    Namaste <strong>{aaName}</strong>! Your inquiry for <strong>{questionTier} question{questionTier > 1 ? 's' : ''}</strong> (<strong>₹{QUESTION_PRICING[questionTier]}</strong>) has been registered. Our astrologer will analyze your horoscope and reply directly on WhatsApp.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={`https://wa.me/918922946307?text=Namaste%20Anushka%20Ji,%20I%20have%20submitted%20${questionTier}%20question${questionTier > 1 ? 's' : ''}%20(₹${QUESTION_PRICING[questionTier]})%20for%20${encodeURIComponent(
                        aaName
                      )}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-ivory text-xs font-semibold hover:bg-primary/90 transition-all shadow-md min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4 text-accent" />
                      <span>Confirm on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleResetAa}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-secondary/30 text-xs font-semibold text-primary hover:bg-mist transition-colors min-h-[44px]"
                    >
                      <span>Ask Another Question</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Ask Question Form */
                <form onSubmit={handleSubmitAskQuestion} noValidate className="space-y-5">
                  {/* Question Plan / Tier Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                      Select Question Package <span className="text-secondary">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {([1, 2, 3] as const).map((count) => {
                        const price = QUESTION_PRICING[count]
                        const isSelected = questionTier === count

                        return (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setQuestionTier(count)}
                            className={`p-3.5 rounded-2xl border text-left transition-all min-h-[44px] cursor-pointer relative ${
                              isSelected
                                ? 'bg-primary text-ivory border-primary shadow-md'
                                : 'bg-ivory/60 border-secondary/20 hover:bg-mist text-ink'
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-accent text-primary flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                            <div className="font-semibold text-xs uppercase tracking-wider opacity-90">
                              {count} Question{count > 1 ? 's' : ''}
                            </div>
                            <div className="text-xl font-heading font-bold mt-1 text-accent">
                              ₹{price.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] opacity-75 mt-0.5">
                              {count === 1
                                ? 'Quick specific query'
                                : count === 2
                                ? 'Career & Relationship'
                                : 'Comprehensive life clarity'}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {aaErrors.general && (
                    <div className="p-3.5 rounded-xl bg-mist border border-secondary/30 text-secondary text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-secondary" />
                      <span>{aaErrors.general}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                      Your Name <span className="text-secondary">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-secondary absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={aaName}
                        onChange={(e) => setAaName(e.target.value)}
                        placeholder="e.g. Priya Verma"
                        maxLength={80}
                        className={`w-full pl-10 pr-3.5 py-3 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 min-h-[44px] ${
                          aaErrors.name
                            ? 'border-secondary focus:ring-secondary/40'
                            : 'border-secondary/20 focus:ring-secondary/30'
                        }`}
                      />
                    </div>
                    {aaErrors.name && (
                      <p className="text-xs text-secondary font-medium mt-1">{aaErrors.name}</p>
                    )}
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-primary">
                      WhatsApp Number <span className="text-secondary">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-3.5 text-xs font-bold text-secondary pointer-events-none">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={aaWhatsApp}
                        onChange={(e) => setAaWhatsApp(e.target.value)}
                        placeholder="8922946307"
                        maxLength={15}
                        className={`w-full pl-12 pr-3.5 py-3 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 min-h-[44px] ${
                          aaErrors.whatsapp_number
                            ? 'border-secondary focus:ring-secondary/40'
                            : 'border-secondary/20 focus:ring-secondary/30'
                        }`}
                      />
                    </div>
                    {aaErrors.whatsapp_number && (
                      <p className="text-xs text-secondary font-medium mt-1">{aaErrors.whatsapp_number}</p>
                    )}
                  </div>

                  {/* Question Inputs (Dynamically render 1, 2, or 3 question textareas) */}
                  <div className="space-y-4 pt-1">
                    {/* Question 1 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold uppercase tracking-wider text-primary">
                          Question 1 <span className="text-secondary">*</span>
                        </label>
                        <span className="text-ink/50 text-[11px]">{q1.length}/1000</span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={q1}
                        onChange={(e) => setQ1(e.target.value)}
                        placeholder="e.g. When will I switch to my next job or start a business? Which timing is favorable?"
                        className={`w-full p-3.5 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 leading-relaxed ${
                          aaErrors.q1
                            ? 'border-secondary focus:ring-secondary/40'
                            : 'border-secondary/20 focus:ring-secondary/30'
                        }`}
                      />
                      {aaErrors.q1 && (
                        <p className="text-xs text-secondary font-medium">{aaErrors.q1}</p>
                      )}
                    </div>

                    {/* Question 2 (If tier >= 2) */}
                    {questionTier >= 2 && (
                      <div className="space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold uppercase tracking-wider text-primary">
                            Question 2 <span className="text-secondary">*</span>
                          </label>
                          <span className="text-ink/50 text-[11px]">{q2.length}/1000</span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={q2}
                          onChange={(e) => setQ2(e.target.value)}
                          placeholder="e.g. How does my chart indicate relationship harmony or marriage timing?"
                          className={`w-full p-3.5 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 leading-relaxed ${
                            aaErrors.q2
                              ? 'border-secondary focus:ring-secondary/40'
                              : 'border-secondary/20 focus:ring-secondary/30'
                          }`}
                        />
                        {aaErrors.q2 && (
                          <p className="text-xs text-secondary font-medium">{aaErrors.q2}</p>
                        )}
                      </div>
                    )}

                    {/* Question 3 (If tier === 3) */}
                    {questionTier >= 3 && (
                      <div className="space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold uppercase tracking-wider text-primary">
                            Question 3 <span className="text-secondary">*</span>
                          </label>
                          <span className="text-ink/50 text-[11px]">{q3.length}/1000</span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={q3}
                          onChange={(e) => setQ3(e.target.value)}
                          placeholder="e.g. Which planetary remedies or gemstone alignment would support my current dasha?"
                          className={`w-full p-3.5 text-base sm:text-sm rounded-xl border bg-ivory/40 text-ink focus:outline-none focus:ring-2 leading-relaxed ${
                            aaErrors.q3
                              ? 'border-secondary focus:ring-secondary/40'
                              : 'border-secondary/20 focus:ring-secondary/30'
                          }`}
                        />
                        {aaErrors.q3 && (
                          <p className="text-xs text-secondary font-medium">{aaErrors.q3}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Optional Birth Details Accordion */}
                  <div className="border border-secondary/20 rounded-2xl overflow-hidden bg-ivory/30">
                    <button
                      type="button"
                      onClick={() => setAaShowBirthDetails(!aaShowBirthDetails)}
                      className="w-full p-3.5 text-left flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-primary hover:bg-mist transition-colors min-h-[44px]"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-secondary" />
                        <span>Add Birth Particulars (Recommended for chart accuracy)</span>
                      </span>
                      {aaShowBirthDetails ? (
                        <ChevronUp className="w-4 h-4 text-secondary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-secondary" />
                      )}
                    </button>

                    {aaShowBirthDetails && (
                      <div className="p-4 pt-1 space-y-4 border-t border-secondary/15 animate-in fade-in">
                        {/* Gender */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-primary/80">
                            Gender
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['male', 'female', 'other'] as const).map((g) => (
                              <label
                                key={g}
                                className={`flex items-center justify-center py-2 px-2.5 rounded-lg border text-xs cursor-pointer transition-all min-h-[40px] ${
                                  aaGender === g
                                    ? 'bg-secondary/15 border-secondary text-primary font-bold'
                                    : 'border-secondary/20 bg-white hover:bg-mist text-ink/75'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="aa-gender"
                                  value={g}
                                  checked={aaGender === g}
                                  onChange={() => setAaGender(g)}
                                  className="sr-only"
                                />
                                <span className="capitalize">{g}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* DOB & Place */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-primary/80">
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              max={todayDateStr}
                              value={aaBirthDate}
                              onChange={(e) => setAaBirthDate(e.target.value)}
                              className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-secondary/20 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 min-h-[44px]"
                            />
                            {aaErrors.birth_date && (
                              <p className="text-xs text-secondary font-medium">{aaErrors.birth_date}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-primary/80">
                              Place of Birth
                            </label>
                            <input
                              type="text"
                              value={aaBirthPlace}
                              onChange={(e) => setAaBirthPlace(e.target.value)}
                              placeholder="e.g. Lucknow, India"
                              maxLength={120}
                              className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-secondary/20 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 min-h-[44px]"
                            />
                          </div>
                        </div>

                        {/* Birth Time */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-primary/80">
                              Time of Birth
                            </label>
                            <label className="inline-flex items-center gap-1.5 text-xs text-ink/75 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={aaBirthTimeUnknown}
                                onChange={(e) => setAaBirthTimeUnknown(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-secondary focus:ring-secondary"
                              />
                              <span>Time unknown</span>
                            </label>
                          </div>

                          {!aaBirthTimeUnknown && (
                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={aaBirthHour}
                                onChange={(e) => setAaBirthHour(e.target.value)}
                                className="px-2.5 py-2 text-base sm:text-xs rounded-xl border border-secondary/20 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 min-h-[44px]"
                              >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                                  const s = h.toString().padStart(2, '0')
                                  return (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  )
                                })}
                              </select>
                              <select
                                value={aaBirthMinute}
                                onChange={(e) => setAaBirthMinute(e.target.value)}
                                className="px-2.5 py-2 text-base sm:text-xs rounded-xl border border-secondary/20 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 min-h-[44px]"
                              >
                                {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                                  const s = m.toString().padStart(2, '0')
                                  return (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  )
                                })}
                              </select>
                              <select
                                value={aaBirthAmPm}
                                onChange={(e) => setAaBirthAmPm(e.target.value as 'AM' | 'PM')}
                                className="px-2.5 py-2 text-base sm:text-xs rounded-xl border border-secondary/20 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 min-h-[44px]"
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Consent */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={aaConsent}
                        onChange={(e) => setAaConsent(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-secondary focus:ring-secondary shrink-0"
                      />
                      <span className="text-xs text-ink/80 leading-relaxed">
                        I agree to be contacted on WhatsApp regarding my query and understand that Vedic astrology offers guidance and perspective.
                      </span>
                    </label>
                    {aaErrors.consent && (
                      <p className="text-xs text-secondary font-medium mt-1">{aaErrors.consent}</p>
                    )}
                  </div>

                  {/* Price Summary & Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-2xl bg-primary text-ivory text-sm font-semibold tracking-wide hover:bg-primary/95 transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                          <span>Securing Order & Opening Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-accent" />
                          <span>
                            Pay Online &amp; Ask {questionTier} Question{questionTier > 1 ? 's' : ''} • ₹
                            {QUESTION_PRICING[questionTier].toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Privacy & Sacred Ethos Note */}
          <div className="p-4 bg-mist/60 border-t border-secondary/15 text-center text-[11px] text-ink/70 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4">
            <span className="flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
              <span>100% Confidential &amp; Protected. We never sell your personal information or spam you.</span>
            </span>
            <span className="text-ink/65">
              • Non-refundable policy: No refund will be provided in any case.
            </span>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default LeadCaptureSection
