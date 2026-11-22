import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  FileText,
  ShieldCheck,
  Scale,
  BookOpen,
  CreditCard,
  RefreshCw,
  HelpCircle,
  Lock,
} from 'lucide-react'
import Container from '../components/Container'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { api } from '../lib/api'
import { usePageMeta } from '../lib/usePageMeta'

interface FormState {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  website?: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
  website?: string
}

export const Contact: React.FC = () => {
  const { settings } = useSiteSettings()
  const location = useLocation()

  usePageMeta({
    title: 'Contact',
    description:
      'Connect with YugOccult Learning Academy for Vedic astrology consultations, numerology queries, and course admissions.',
    canonicalPath: '/contact',
  })

  // Smoothly scroll to Terms & Conditions section if redirected via #terms
  useEffect(() => {
    if (location.hash === '#terms') {
      const scrollToTerms = () => {
        const el = document.getElementById('terms')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      // Small timeout ensures DOM elements and fonts are fully mounted
      const timer = setTimeout(scrollToTerms, 150)
      return () => clearTimeout(timer)
    }
  }, [location.hash])

  const rawWhatsApp = (settings.whatsapp_number || '918922946307').replace(/\D/g, '')
  const cleanWhatsApp = rawWhatsApp.length === 10 ? `91${rawWhatsApp}` : rawWhatsApp
  const hasAnyContactCard = Boolean(
    settings.address ||
      settings.phone ||
      cleanWhatsApp ||
      settings.email ||
      settings.timings
  )

  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    subject: 'Astrology Consultation Enquiry',
    message: '',
    website: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    name: false,
    email: false,
    phone: false,
    subject: false,
    message: false,
    website: false,
  })

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Validation function with clear spiritual & user-friendly messages
  const validateField = (name: keyof FormState, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required.'
        if (value.trim().length < 2) return 'Name should be at least 2 characters.'
        return undefined

      case 'email':
        if (!value.trim()) return 'Email address is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address (e.g. name@example.com).'
        }
        return undefined

      case 'phone': {
        if (!value.trim()) return 'Contact phone or WhatsApp number is required.'
        const digits = value.replace(/\D/g, '')
        if (digits.length < 10) {
          return 'Please provide a valid phone number (at least 10 digits).'
        }
        return undefined
      }

      case 'subject':
        if (!value.trim()) return 'Please select a topic for your enquiry.'
        return undefined

      case 'message':
        if (!value.trim()) {
          return 'Please share your query or birth details (DOB, Time, Place).'
        }
        if (value.trim().length < 10) {
          return 'Message must be at least 10 characters long.'
        }
        return undefined

      default:
        return undefined
    }
  }

  const validateAll = (data: FormState): FormErrors => {
    const newErrors: FormErrors = {}
    ;(Object.keys(data) as Array<keyof FormState>).forEach((field) => {
      const error = validateField(field, data[field] || '')
      if (error) {
        newErrors[field] = error
      }
    })
    return newErrors
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const fieldName = name as keyof FormState

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))

    // Real-time inline feedback if field was already touched
    if (touched[fieldName]) {
      const fieldError = validateField(fieldName, value)
      setErrors((prev) => ({
        ...prev,
        [fieldName]: fieldError,
      }))
    }
  }

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const fieldName = name as keyof FormState

    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }))

    const fieldError = validateField(fieldName, value)
    setErrors((prev) => ({
      ...prev,
      [fieldName]: fieldError,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
      website: true,
    })

    const validationErrors = validateAll(formData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      // Focus the first invalid element for accessibility
      const firstInvalidKey = Object.keys(validationErrors)[0]
      const element = document.getElementById(firstInvalidKey)
      if (element) {
        element.focus()
      }
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    try {
      await api.post('/api/enquiries', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        website: formData.website?.trim() || undefined,
      })
      setIsSubmitted(true)
    } catch (err: any) {
      console.error('[ContactForm] Submission error:', err)
      if (err?.status === 429) {
        setApiError('Too many requests. Please wait a few minutes before sending another message.')
      } else {
        setApiError(
          err?.message ||
            'Failed to deliver your message. Please try again or connect directly on WhatsApp.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setIsSubmitting(false)
    setApiError(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: 'Astrology Consultation Enquiry',
      message: '',
      website: '',
    })
    setErrors({})
    setTouched({
      name: false,
      email: false,
      phone: false,
      subject: false,
      message: false,
      website: false,
    })
  }

  return (
    <div className="space-y-10 sm:space-y-16 pb-12 sm:pb-20 pt-4 sm:pt-8">
      {/* Page Header */}
      <section>
        <Container>
          <SectionHeading
            eyebrow="Get In Touch"
            title="Connect With Our Institute"
            subtitle="Have questions about our Astrology, Numerology &amp; Tarot consultations, certified courses, or Vedic remedies? We are here to guide you."
          />
        </Container>
      </section>

      {/* Main Content Grid */}
      <section>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 w-full mx-auto">
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              {/* Sacred Sanctum Card */}
              <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-primary text-ivory space-y-5 sm:space-y-6 border border-secondary/40 shadow-md">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent shrink-0" />
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-ivory">
                    Yug Skill Institute
                  </h3>
                </div>
                <p className="text-ivory/80 text-xs sm:text-sm leading-relaxed">
                  Direct appointment queries, birth-detail submissions, and course enrollments are addressed within 24 business hours.
                </p>

                {/* Contact Info List (Rendered only for non-empty fields) */}
                {hasAnyContactCard && (
                  <div className="space-y-4 pt-2 border-t border-secondary/30 text-xs sm:text-sm">
                    {/* Address Card */}
                    {settings.address && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <strong className="block text-accent font-semibold mb-0.5">
                            Center Address
                          </strong>
                          <span className="text-ivory/80 leading-relaxed block">
                            {settings.address}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Phone Card */}
                    {settings.phone && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Phone className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <strong className="block text-accent font-semibold mb-0.5">
                            Direct Phone / Helpline
                          </strong>
                          <a
                            href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                            className="text-ivory/90 hover:text-accent transition-colors font-medium"
                          >
                            {settings.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Quick Connect */}
                    {cleanWhatsApp && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageCircle className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <strong className="block text-accent font-semibold mb-0.5">
                            WhatsApp Guidance
                          </strong>
                          <a
                            href={`https://wa.me/${cleanWhatsApp}?text=Hare%20Krishna,%20I%20would%20like%20to%20enquire%20about%20Yug%20Skill%20Institute%20consultations.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ivory/90 hover:text-accent transition-colors font-medium"
                          >
                            Chat with our coordinator on WhatsApp
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Email Card */}
                    {settings.email && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Mail className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <strong className="block text-accent font-semibold mb-0.5">
                            Email Inquiries
                          </strong>
                          <a
                            href={`mailto:${settings.email}`}
                            className="text-ivory/90 hover:text-accent transition-colors font-medium"
                          >
                            {settings.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Timings Card */}
                    {settings.timings && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <strong className="block text-accent font-semibold mb-0.5">
                            Consultation Timings
                          </strong>
                          <span className="text-ivory/80 leading-relaxed block">
                            {settings.timings}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Data Privacy Assurance Box */}
              <div className="p-5 sm:p-6 rounded-2xl bg-mist border border-secondary/15 text-xs sm:text-sm text-ink/80 space-y-2">
                <h4 className="font-heading text-base sm:text-lg font-bold text-primary">
                  Birth Chart Data Confidentiality
                </h4>
                <p className="text-[11px] sm:text-xs text-ink/75 leading-relaxed">
                  Your sacred birth particulars (date, time, and birthplace) are preserved with complete confidentiality and utilized solely by your assigned astrologer for your Vedic horoscope reading.
                </p>
              </div>
            </div>

            {/* Enquiry Form Column */}
            <div className="lg:col-span-7">
              <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-white/80 border border-secondary/15 shadow-md">
                <h3 className="font-heading text-xl sm:text-3xl font-bold text-primary mb-1.5 sm:mb-2">
                  Send an Enquiry
                </h3>
                <p className="text-ink/75 text-xs sm:text-sm mb-5 sm:mb-6">
                  Please fill in your contact information and query below. Our spiritual coordinator will get in touch with you promptly.
                </p>

                {isSubmitted ? (
                  <div className="p-6 sm:p-8 rounded-2xl bg-mist border border-secondary/20 text-center space-y-4 animate-in fade-in">
                    <div className="w-14 h-14 mx-auto rounded-full bg-secondary text-accent flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-7 h-7 text-accent" />
                    </div>
                    <h4 className="font-heading text-xl sm:text-2xl font-bold text-primary">
                      Thank You
                    </h4>
                    <p className="text-xs sm:text-sm text-ink/80 max-w-md mx-auto leading-relaxed">
                      Thank you. We have received your message and will get back to you.
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleReset}
                      >
                        Send another message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                    {/* Royal Violet Error Alert */}
                    {apiError && (
                      <div className="p-4 rounded-xl bg-[#5B3E96]/10 border border-[#5B3E96]/20 text-[#5B3E96] text-xs sm:text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-[#5B3E96]" />
                        <span>{apiError}</span>
                      </div>
                    )}

                    {/* Honeypot field (hidden from genuine users) */}
                    <div
                      style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                      aria-hidden="true"
                    >
                      <label htmlFor="website">Website</label>
                      <input
                        id="website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formData.website || ''}
                        onChange={handleChange}
                      />
                    </div>
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      {/* Name Field */}
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary mb-1.5"
                        >
                          Full Name <span className="text-secondary">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-invalid={!!errors.name}
                          aria-describedby={errors.name ? 'name-error' : undefined}
                          placeholder="e.g. Ramesh Sharma"
                          className={`w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-ivory/50 text-ink placeholder:text-ink/40 text-xs sm:text-sm transition-all outline-none border ${
                            errors.name && touched.name
                              ? 'border-secondary ring-1 ring-secondary/30 focus:border-secondary focus:ring-secondary/50'
                              : 'border-secondary/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                          }`}
                        />
                        {errors.name && touched.name && (
                          <div id="name-error" className="flex items-center gap-1.5 mt-1.5 text-secondary text-xs">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-secondary" />
                            <span className="font-medium text-secondary">{errors.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Email Field */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary mb-1.5"
                        >
                          Email Address <span className="text-secondary">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                          placeholder="ramesh@example.com"
                          className={`w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-ivory/50 text-ink placeholder:text-ink/40 text-xs sm:text-sm transition-all outline-none border ${
                            errors.email && touched.email
                              ? 'border-secondary ring-1 ring-secondary/30 focus:border-secondary focus:ring-secondary/50'
                              : 'border-secondary/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                          }`}
                        />
                        {errors.email && touched.email && (
                          <div id="email-error" className="flex items-center gap-1.5 mt-1.5 text-secondary text-xs">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-secondary" />
                            <span className="font-medium text-secondary">{errors.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Phone & Subject Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      {/* Phone Field */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary mb-1.5"
                        >
                          Phone / WhatsApp <span className="text-secondary">*</span>
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-invalid={!!errors.phone}
                          aria-describedby={errors.phone ? 'phone-error' : undefined}
                          placeholder="+91 98765 43210"
                          className={`w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-ivory/50 text-ink placeholder:text-ink/40 text-xs sm:text-sm transition-all outline-none border ${
                            errors.phone && touched.phone
                              ? 'border-secondary ring-1 ring-secondary/30 focus:border-secondary focus:ring-secondary/50'
                              : 'border-secondary/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                          }`}
                        />
                        {errors.phone && touched.phone && (
                          <div id="phone-error" className="flex items-center gap-1.5 mt-1.5 text-secondary text-xs">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-secondary" />
                            <span className="font-medium text-secondary">{errors.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Subject Field */}
                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary mb-1.5"
                        >
                          Subject <span className="text-secondary">*</span>
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-invalid={!!errors.subject}
                          aria-describedby={errors.subject ? 'subject-error' : undefined}
                          className={`w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-ivory/50 text-ink text-xs sm:text-sm transition-all outline-none border ${
                            errors.subject && touched.subject
                              ? 'border-secondary ring-1 ring-secondary/30 focus:border-secondary focus:ring-secondary/50'
                              : 'border-secondary/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                          }`}
                        >
                          <option value="Astrology Consultation Enquiry">
                            Astrology Consultation
                          </option>
                          <option value="Numerology Consultation">
                            Numerology &amp; Name Correction
                          </option>
                          <option value="Tarot Reading Consultation">
                            Tarot Reading &amp; Guidance
                          </option>
                          <option value="Courses & Academy Admissions">
                            Course Admission Enquiry
                          </option>
                          <option value="General Spiritual Query">
                            General Query
                          </option>
                        </select>
                        {errors.subject && touched.subject && (
                          <div id="subject-error" className="flex items-center gap-1.5 mt-1.5 text-secondary text-xs">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-secondary" />
                            <span className="font-medium text-secondary">{errors.subject}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message Field */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary mb-1.5"
                      >
                        Your Message / Birth Details <span className="text-secondary">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'message-error' : undefined}
                        placeholder="Please include your Date of Birth, exact Time of Birth, and Birth Place if inquiring about a Kundli reading or horoscope consultation..."
                        className={`w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-ivory/50 text-ink placeholder:text-ink/40 text-xs sm:text-sm transition-all outline-none resize-none border ${
                          errors.message && touched.message
                            ? 'border-secondary ring-1 ring-secondary/30 focus:border-secondary focus:ring-secondary/50'
                            : 'border-secondary/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                        }`}
                      />
                      {errors.message && touched.message && (
                        <div id="message-error" className="flex items-center gap-1.5 mt-1.5 text-secondary text-xs">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-secondary" />
                          <span className="font-medium text-secondary">{errors.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button & Privacy Policy note */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="cta"
                        size="md"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto gap-2 disabled:opacity-50"
                      >
                        <span>{isSubmitting ? 'Sending Message...' : 'Submit Enquiry'}</span>
                        <Send className="w-4 h-4" />
                      </Button>
                      <p className="text-xs text-ink/60 mt-3">
                        By submitting, you agree to our{' '}
                        <Link
                          to="/privacy-policy"
                          className="text-[#5B3E96] font-medium underline hover:text-primary transition-colors"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ========================================================================= */}
      {/* TERMS & CONDITIONS SECTION */}
      {/* ========================================================================= */}
      <section
        id="terms"
        className="scroll-mt-16 py-16 sm:py-24 bg-[#FBF7EE] border-t border-[#5B3E96]/15 relative"
      >
        <Container>
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#5B3E96] text-xs font-bold uppercase tracking-wider mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span>Legal &amp; Sacred Advisory Terms</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2E2A5C] tracking-tight mb-4">
              Terms &amp; Conditions
            </h2>
            <p className="text-sm sm:text-base text-[#2B2A3D]/75 leading-relaxed">
              Welcome to <strong>Yug Skill Institute</strong>. Please review these official
              terms, 1-year course validity policies, payment security guidelines, and sacred consultation
              ethics governing your use of our platform.
            </p>
            <div className="mt-3 text-xs text-[#2B2A3D]/60 flex items-center justify-center gap-2">
              <span>Last Updated: November 2026</span>
              <span>•</span>
              <span>Governed under the Laws of India</span>
            </div>
          </div>

          {/* Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* 1. Agreement & Purpose */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  1. Acceptance &amp; Sacred Purpose
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  By accessing <strong>Yug Skill Institute</strong>, purchasing courses,
                  booking 1-on-1 consultations, or downloading ebooks &amp; reports, you agree to comply with
                  and be bound by these Terms. All sacred sciences—Vedic Astrology, Numerology, Tarot,
                  and Vastu—are offered with pure spiritual intent for personal empowerment and conscious living.
                </p>
              </div>
            </div>

            {/* 2. Course Validity (1-Year Access) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  2. 1-Year Course Access &amp; IP
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  Every enrolled or purchased course includes <strong>1-Year (365 days) full access</strong> to
                  lesson materials, video lectures, and study notes from the grant date. Access expires after 1
                  year and may be renewed. All lesson resources are protected intellectual property of
                  Anushka Yadav; sharing, screen-recording, or commercial redistribution is strictly prohibited.
                </p>
              </div>
            </div>

            {/* 3. Consultation Bookings */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  3. 1-on-1 Consultations
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  Consultation appointments (Morning, Afternoon, or Evening slots) are confirmed upon
                  successful booking and payment. Accurate birth details (Date, exact Time, and Place of Birth)
                  must be provided for genuine planetary calculations. Rescheduling is available free of charge
                  when requested at least 24 hours prior to the appointment.
                </p>
              </div>
            </div>

            {/* 4. Personalised Reports & Ebooks */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  4. Reports &amp; Digital Ebooks
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  Custom astrological reports are uniquely prepared and delivered to your account dashboard
                  within 2 to 5 business days. Digital ebooks are unlocked for instant PDF download upon
                  payment. Due to the bespoke preparation of reports and immediate access to digital ebooks,
                  all digital orders are final and non-refundable.
                </p>
              </div>
            </div>

            {/* 5. Payments & Cashfree Security */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  5. Payment Security &amp; Gateway
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  All transactions are billed in Indian Rupees (₹) and processed via encrypted, bank-grade
                  protocols through Cashfree Payment Gateway (supporting UPI, Cards, NetBanking, and Wallets).
                  Yug Skill Institute does not collect, store, or view sensitive payment credentials,
                  card numbers, or banking PINs.
                </p>
              </div>
            </div>

            {/* 6. Spiritual Guidance Disclaimer */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  6. Spiritual Advisory Disclaimer
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  Astrology, numerology, vastu, and tarot are sacred advisory sciences meant for spiritual
                  guidance and self-discovery. They do <strong>NOT</strong> substitute for certified medical,
                  psychiatric, financial, or legal counsel. No deterministic guarantees are made; individual
                  free will, personal judgment, and karmic actions remain the sole responsibility of the seeker.
                </p>
              </div>
            </div>

            {/* 7. Cancellation & Refunds */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  7. Cancellation &amp; Refunds
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  Consultation appointments may be rescheduled with at least 24 hours advance notice. Cancellations
                  requested prior to reading preparation may be considered for credit. Missed appointments
                  without notice will forfeit the booking. Due to instant access, course fees and downloadable
                  digital ebooks are strictly non-refundable once unlocked.
                </p>
              </div>
            </div>

            {/* 8. Privacy & Confidentiality */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  8. Privacy &amp; Data Sanctity
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  Your personal birth charts, horoscope inquiries, contact details, and consultation recordings
                  are preserved with the highest spiritual sanctity and strict confidentiality. We maintain
                  rigorous privacy standards and never sell, trade, or share your private information with
                  external third parties or advertisers.
                </p>
              </div>
            </div>

            {/* 9. Support & Contact */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#5B3E96] mb-4">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-2.5">
                  9. Queries &amp; Support
                </h3>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                  If you have any questions or require support regarding your course access, orders, or these
                  Terms &amp; Conditions, please reach out to our team via the contact form above, official
                  WhatsApp at <strong>+{cleanWhatsApp}</strong>, or our official helpline.
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgement Callout */}
          <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-3xl bg-white border border-[#C9A227]/40 shadow-xs text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#2E2A5C] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#C9A227]" />
              <span>Sacred Student &amp; Seeker Agreement</span>
            </div>
            <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
              By accessing our platform, enrolling in courses, or completing any booking, you acknowledge
              that you have read, understood, and agreed to abide by these Terms &amp; Conditions and our
              1-year course validity policy.
            </p>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default Contact
