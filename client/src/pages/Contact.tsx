import React, { useState } from 'react'
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
} from 'lucide-react'
import Container from '../components/Container'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import { useSiteSettings } from '../context/SiteSettingsContext'

interface FormState {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
}

export const Contact: React.FC = () => {
  const { settings } = useSiteSettings()
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
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    name: false,
    email: false,
    phone: false,
    subject: false,
    message: false,
  })

  const [isSubmitted, setIsSubmitted] = useState(false)

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
      const error = validateField(field, data[field])
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
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

    // Submission succeeded (mock local state)
    setIsSubmitted(true)
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: 'Astrology Consultation Enquiry',
      message: '',
    })
    setErrors({})
    setTouched({
      name: false,
      email: false,
      phone: false,
      subject: false,
      message: false,
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
                    YugSkills Learning institute
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
                            href={`https://wa.me/${cleanWhatsApp}?text=Hare%20Krishna,%20I%20would%20like%20to%20enquire%20about%20YugSkills%20Learning%20Institute%20consultations.`}
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
                      Thank You for Reaching Out
                    </h4>
                    <p className="text-xs sm:text-sm text-ink/80 max-w-md mx-auto leading-relaxed">
                      Your enquiry has been successfully recorded. Our Vedic coordinator will reach out to your provided phone number or email within 24 business hours.
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleReset}
                      >
                        Send Another Message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
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

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="cta"
                        size="md"
                        className="w-full sm:w-auto gap-2"
                      >
                        <span>Submit Enquiry</span>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default Contact
