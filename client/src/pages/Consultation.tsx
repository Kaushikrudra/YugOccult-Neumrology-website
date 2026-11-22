import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Award,
  Sparkles,
  ShieldCheck,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Lock,
  Loader2,
  X,
} from 'lucide-react'
import Container from '../components/Container'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import LeadCaptureSection from '../components/LeadCaptureSection'
import OnlineConsultationSection from '../components/OnlineConsultationSection'
import { consultationData } from '../data/consultation'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { startCheckout } from '../lib/cashfree'

const AFTERNOON_SLOTS = [
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
] as const

const EVENING_SLOTS = [
  '08:00 PM - 09:00 PM',
  '09:00 PM - 10:00 PM',
] as const

const ALL_SLOTS = [...AFTERNOON_SLOTS, ...EVENING_SLOTS]

export const Consultation: React.FC = () => {
  // Master consultation settings from API (with consultationData fallback)
  const [consultation, setConsultation] = useState({
    fee: consultationData.fee,
    duration_minutes: consultationData.duration_minutes,
    session_mode: consultationData.session_mode,
    services: consultationData.services,
    processSteps: consultationData.processSteps,
    faqs: consultationData.faqs,
  })
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const { settings } = useSiteSettings()

  const photoSrc = !imageError ? (settings.about_photo_url || '/images/anushka-yadav.jpg') : null
  const rawTitle = settings.about_title || 'Occult Master Astrologer, Numerologist & Tarot Guide'
  const displayTitle = rawTitle.startsWith('Master ') ? `Occult ${rawTitle}` : rawTitle

  useEffect(() => {
    let isMounted = true
    api.get<{
      fee: number
      duration_minutes: number
      services: any[]
      process_steps: any[]
      faqs: any[]
    }>('/api/consultation')
      .then((res) => {
        if (isMounted && res) {
          setConsultation({
            fee: Number(res.fee) || consultationData.fee,
            duration_minutes: Number(res.duration_minutes) || consultationData.duration_minutes,
            session_mode: consultationData.session_mode,
            services: res.services && res.services.length > 0 ? res.services : consultationData.services,
            processSteps:
              res.process_steps && res.process_steps.length > 0
                ? res.process_steps
                : consultationData.processSteps,
            faqs: res.faqs && res.faqs.length > 0 ? res.faqs : consultationData.faqs,
          })
        }
      })
      .catch((err) => {
        console.warn('Consultation API failed, using fallback:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const location = useLocation()

  // Auto-scroll directly to #kundli-request, #kundli-form, or #book-consultation
  useEffect(() => {
    const validHashes = ['#free-kundli', '#kundli-request', '#kundli-form', '#book-consultation']
    if (validHashes.includes(location.hash)) {
      const targetHash = location.hash.substring(1)
      const targetId =
        targetHash === 'free-kundli' || targetHash === 'kundli-form'
          ? 'kundli-request'
          : targetHash

      const doScroll = () => {
        const el = document.getElementById(targetId) || document.getElementById('kundli-request')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }

      // Initial scroll and secondary scroll to compensate for dynamic layout shifts
      const t1 = setTimeout(doScroll, 150)
      const t2 = setTimeout(doScroll, 500)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [location.hash, loading])

  const { user } = useAuth()

  // Accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1')

  // Tomorrow as minimum date, 60 days ahead as maximum
  const tomorrowStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  const maxDateStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 60)
    return d.toISOString().split('T')[0]
  })()

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('1-on-1 Comprehensive Session')
  const [bookName, setBookName] = useState('')
  const [bookEmail, setBookEmail] = useState('')
  const [bookPhone, setBookPhone] = useState('')
  const [bookDate, setBookDate] = useState(tomorrowStr)
  const [bookSlot, setBookSlot] = useState<string>('12:00 PM - 01:00 PM')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingBookedSlots, setLoadingBookedSlots] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Fetch booked slots whenever bookDate changes
  useEffect(() => {
    if (!bookDate) {
      setBookedSlots([])
      return
    }
    let isMounted = true
    setLoadingBookedSlots(true)
    api
      .get<{ bookedSlots: string[] }>(`/api/consultation/booked-slots?date=${bookDate}`)
      .then((res) => {
        if (isMounted && res?.bookedSlots) {
          setBookedSlots(res.bookedSlots)
          if (res.bookedSlots.includes(bookSlot)) {
            const firstAvailable = ALL_SLOTS.find((s) => !res.bookedSlots.includes(s))
            if (firstAvailable) setBookSlot(firstAvailable)
          }
        }
      })
      .catch(() => {
        if (isMounted) setBookedSlots([])
      })
      .finally(() => {
        if (isMounted) setLoadingBookedSlots(false)
      })
    return () => {
      isMounted = false
    }
  }, [bookDate])

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      const now = new Date()
      const minMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const prevM = new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      return prevM < minMonth ? prev : prevM
    })
  }

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      const maxM = new Date(maxDateStr)
      const maxMonth = new Date(maxM.getFullYear(), maxM.getMonth(), 1)
      const nextM = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      return nextM > maxMonth ? prev : nextM
    })
  }
  const [bookBirthDate, setBookBirthDate] = useState('')
  const [bookBirthTime, setBookBirthTime] = useState('')
  const [bookBirthTimeUnknown, setBookBirthTimeUnknown] = useState(false)
  const [bookBirthPlace, setBookBirthPlace] = useState('')
  const [bookMessage, setBookMessage] = useState('')
  const [bookConsent, setBookConsent] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id))
  }

  const handleOpenBookingModal = (serviceTitle?: string) => {
    if (serviceTitle) {
      setSelectedServiceTitle(serviceTitle)
    } else {
      setSelectedServiceTitle('1-on-1 Comprehensive Session')
    }
    if (user) {
      if (user.name && !bookName) setBookName(user.name)
      if (user.email && !bookEmail) setBookEmail(user.email)
    }
    setBookingError(null)
    setShowBookingModal(true)
  }

  // Handle Book & Pay via Cashfree
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError(null)

    const nameToUse = bookName.trim()
    const emailToUse = bookEmail.trim()
    const cleanPhone = bookPhone.trim().replace(/\D/g, '').slice(-10)

    if (!nameToUse || nameToUse.length < 2) {
      setBookingError('Please enter your full name (at least 2 characters).')
      return
    }

    if (!emailToUse || !emailToUse.includes('@')) {
      setBookingError('Please enter a valid email address for session confirmation and links.')
      return
    }

    if (cleanPhone.length !== 10) {
      setBookingError('Please enter a valid 10-digit mobile number.')
      return
    }

    if (!bookDate) {
      setBookingError('Please select your preferred consultation date.')
      return
    }

    if (!bookConsent) {
      setBookingError('Please agree to the booking and consultation policy to proceed.')
      return
    }

    try {
      setIsSubmittingBooking(true)
      const res = await api.post<{ orderId: string; paymentSessionId: string }>(
        '/api/payments/consultation-order',
        {
          name: nameToUse,
          email: emailToUse,
          phone: cleanPhone,
          service_title: selectedServiceTitle,
          preferred_date: bookDate,
          preferred_slot: bookSlot,
          birth_date: bookBirthDate || null,
          birth_time: bookBirthTimeUnknown ? null : bookBirthTime || null,
          birth_time_unknown: bookBirthTimeUnknown,
          birth_place: bookBirthPlace.trim() || null,
          message: bookMessage.trim() || '',
          consent: true,
        }
      )

      if (res?.paymentSessionId) {
        setShowBookingModal(false)
        await startCheckout(res.paymentSessionId)
      } else {
        throw new Error('No payment session received.')
      }
    } catch (err: any) {
      console.error('[Consultation:Booking] Error:', err)
      setBookingError(err?.message || 'Failed to initiate booking payment. Please try again.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  return (
    <div className="space-y-12 sm:space-y-20 pb-12 sm:pb-24 pt-4 sm:pt-8">
      {/* Consultation Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-xl rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden text-[#2B2A3D] max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2E2A5C] text-white p-5 sm:p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#C9A227]" />
                <span className="text-xs uppercase tracking-wider text-[#C9A227] font-semibold">
                  1-on-1 Private Consultation
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#FBF7EE] font-heading pr-8">
                {selectedServiceTitle}
              </h3>
              <p className="text-xs text-[#C9A227] font-semibold mt-1">
                Consultation Fee: ₹{consultation.fee.toLocaleString('en-IN')} ({consultation.duration_minutes} Mins)
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitBooking} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {bookingError && (
                <div className="p-3 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs font-semibold text-[#5B3E96] animate-in fade-in">
                  {bookingError}
                </div>
              )}

              {/* Seeker Name & Email */}
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
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      placeholder="e.g. Ananya Sen"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Mobile / WhatsApp <span className="text-[#C9A227]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-secondary absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={bookPhone}
                      onChange={(e) => setBookPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1">
                  Email Address <span className="text-[#C9A227]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-secondary absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={bookEmail}
                    onChange={(e) => setBookEmail(e.target.value)}
                    placeholder="For session link & calendar invite"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
              </div>

              {/* Date & Slot Selection (Interactive Calendar & 1-Hour Time Slots) */}
              <div className="pt-3 border-t border-secondary/15 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#5B3E96] flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#C9A227]" />
                    <span>Choose Consultation Date &amp; Slot</span>
                  </p>
                  <span className="text-[11px] text-[#2B2A3D]/70 font-semibold bg-[#EFEAF8] text-[#5B3E96] px-2.5 py-0.5 rounded-full">
                    1 Hour Session
                  </span>
                </div>

                {/* Interactive Visual Calendar */}
                <div className="bg-white rounded-2xl p-4 border border-secondary/20 shadow-xs">
                  {/* Calendar Header with Month Navigation */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-secondary/10">
                    <span className="font-heading font-bold text-sm sm:text-base text-[#2E2A5C]">
                      {calendarMonth.toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        disabled={
                          calendarMonth.getFullYear() === new Date().getFullYear() &&
                          calendarMonth.getMonth() <= new Date().getMonth()
                        }
                        className="p-1.5 rounded-lg border border-secondary/20 hover:bg-mist text-[#2E2A5C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        disabled={(() => {
                          const maxM = new Date(maxDateStr)
                          return (
                            calendarMonth.getFullYear() === maxM.getFullYear() &&
                            calendarMonth.getMonth() >= maxM.getMonth()
                          )
                        })()}
                        className="p-1.5 rounded-lg border border-secondary/20 hover:bg-mist text-[#2E2A5C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday Names */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-1.5 text-[11px] font-semibold text-[#5B3E96]">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {/* Blank offset days */}
                    {Array.from({
                      length: new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        1
                      ).getDay(),
                    }).map((_, idx) => (
                      <div key={`blank-${idx}`} className="h-8" />
                    ))}

                    {/* Day numbers */}
                    {Array.from({
                      length: new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth() + 1,
                        0
                      ).getDate(),
                    }).map((_, idx) => {
                      const dayNum = idx + 1
                      const dateObj = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        dayNum
                      )
                      const isPast = dateObj < new Date(new Date().setHours(0, 0, 0, 0) + 86400000)
                      const maxDateLimit = new Date()
                      maxDateLimit.setDate(maxDateLimit.getDate() + 60)
                      const isTooFar = dateObj > maxDateLimit
                      const isSelectable = !isPast && !isTooFar

                      const yyyy = calendarMonth.getFullYear()
                      const mm = String(calendarMonth.getMonth() + 1).padStart(2, '0')
                      const dd = String(dayNum).padStart(2, '0')
                      const dateStr = `${yyyy}-${mm}-${dd}`
                      const isSelected = bookDate === dateStr

                      return (
                        <button
                          key={`day-${dayNum}`}
                          type="button"
                          disabled={!isSelectable}
                          onClick={() => setBookDate(dateStr)}
                          className={`h-8 sm:h-8.5 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#5B3E96] text-[#FBF7EE] shadow-sm ring-2 ring-[#C9A227] font-bold scale-105'
                              : !isSelectable
                              ? 'text-[#2B2A3D]/25 bg-transparent cursor-not-allowed'
                              : 'bg-white text-[#2E2A5C] hover:bg-[#EFEAF8] border border-secondary/15 hover:border-[#5B3E96]/30'
                          }`}
                        >
                          {dayNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Selected Date indicator */}
                  <div className="mt-3 pt-2.5 border-t border-secondary/10 flex items-center justify-between text-xs">
                    <span className="text-[#2B2A3D]/70 font-medium">Selected Date:</span>
                    <span className="font-bold text-[#5B3E96] flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-[#C9A227]" />
                      {bookDate
                        ? new Date(bookDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Please choose a date'}
                    </span>
                  </div>
                </div>

                {/* 1-Hour Time Slots */}
                <div className="space-y-3">
                  {/* Afternoon Slots (12-5 PM) */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2E2A5C] mb-2 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-[#F08A24]" />
                      <span>Afternoon Slots (12:00 PM – 05:00 PM)</span>
                      <span className="text-[10px] text-[#2B2A3D]/60 font-normal">
                        • 1 hr each
                      </span>
                      {loadingBookedSlots && (
                        <Loader2 className="w-3 h-3 animate-spin text-[#5B3E96] inline ml-1" />
                      )}
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AFTERNOON_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot)
                        const isSelected = bookSlot === slot
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setBookSlot(slot)}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center justify-between gap-2 text-left ${
                              isSelected
                                ? 'bg-[#5B3E96] text-[#FBF7EE] border-[#5B3E96] shadow-sm ring-1 ring-[#C9A227]'
                                : isBooked
                                ? 'bg-mist/60 text-[#2B2A3D]/40 border-secondary/10 cursor-not-allowed'
                                : 'bg-white text-[#2E2A5C] border-secondary/20 hover:border-[#5B3E96]/40 hover:bg-[#EFEAF8]/40'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Clock
                                className={`w-3.5 h-3.5 ${
                                  isSelected ? 'text-[#C9A227]' : 'text-secondary'
                                }`}
                              />
                              <span>{slot}</span>
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isBooked
                                  ? 'bg-[#2E2A5C]/10 text-[#2E2A5C]'
                                  : isSelected
                                  ? 'bg-white/20 text-[#FBF7EE]'
                                  : 'bg-[#EFEAF8] text-[#5B3E96]'
                              }`}
                            >
                              {isBooked ? 'Booked' : '1 Hr'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Evening Slots (8-10 PM) */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2E2A5C] mb-2 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-[#5B3E96]" />
                      <span>Evening Slots (08:00 PM – 10:00 PM)</span>
                      <span className="text-[10px] text-[#2B2A3D]/60 font-normal">
                        • 1 hr each
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EVENING_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot)
                        const isSelected = bookSlot === slot
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setBookSlot(slot)}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center justify-between gap-2 text-left ${
                              isSelected
                                ? 'bg-[#5B3E96] text-[#FBF7EE] border-[#5B3E96] shadow-sm ring-1 ring-[#C9A227]'
                                : isBooked
                                ? 'bg-mist/60 text-[#2B2A3D]/40 border-secondary/10 cursor-not-allowed'
                                : 'bg-white text-[#2E2A5C] border-secondary/20 hover:border-[#5B3E96]/40 hover:bg-[#EFEAF8]/40'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Clock
                                className={`w-3.5 h-3.5 ${
                                  isSelected ? 'text-[#C9A227]' : 'text-secondary'
                                }`}
                              />
                              <span>{slot}</span>
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isBooked
                                  ? 'bg-[#2E2A5C]/10 text-[#2E2A5C]'
                                  : isSelected
                                  ? 'bg-white/20 text-[#FBF7EE]'
                                  : 'bg-[#EFEAF8] text-[#5B3E96]'
                              }`}
                            >
                              {isBooked ? 'Booked' : '1 Hr'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Birth Details (Optional) */}
              <div className="pt-2 border-t border-secondary/15 space-y-3">
                <p className="text-xs uppercase tracking-wider font-bold text-[#5B3E96]">
                  Birth Details <span className="text-xs font-normal text-ink/60 lowercase">(optional – for horoscope analysis)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#2B2A3D] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={bookBirthDate}
                      onChange={(e) => setBookBirthDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-[#2B2A3D]">Birth Time</label>
                      <label className="text-[11px] text-ink/70 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bookBirthTimeUnknown}
                          onChange={(e) => setBookBirthTimeUnknown(e.target.checked)}
                          className="rounded text-[#5B3E96] focus:ring-0"
                        />
                        <span>Unknown</span>
                      </label>
                    </div>
                    <input
                      type="time"
                      disabled={bookBirthTimeUnknown}
                      value={bookBirthTime}
                      onChange={(e) => setBookBirthTime(e.target.value)}
                      className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40 ${
                        bookBirthTimeUnknown ? 'opacity-50 cursor-not-allowed bg-mist' : ''
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2B2A3D] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-secondary" />
                    Place of Birth (City, State)
                  </label>
                  <input
                    type="text"
                    value={bookBirthPlace}
                    onChange={(e) => setBookBirthPlace(e.target.value)}
                    placeholder="e.g. Lucknow, Uttar Pradesh"
                    maxLength={100}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
              </div>

              {/* Message / Questions */}
              <div>
                <label className="block text-xs font-medium text-[#2B2A3D] mb-1">
                  Questions / Key Topics for Anushka ji
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={bookMessage}
                  onChange={(e) => setBookMessage(e.target.value)}
                  placeholder="Outline the key questions or life areas you wish to address..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none leading-relaxed"
                />
              </div>

              {/* Consent Policy */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-[#2B2A3D]/85 cursor-pointer leading-relaxed">
                  <input
                    type="checkbox"
                    checked={bookConsent}
                    onChange={(e) => setBookConsent(e.target.checked)}
                    className="rounded text-[#5B3E96] focus:ring-0 mt-0.5"
                  />
                  <span>
                    I agree to the consultation booking policy and understand that appointment fees are non-refundable. Rescheduling is available with 24 hours prior notice.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-3 border-t border-secondary/15">
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] font-semibold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {isSubmittingBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
                      <span>Redirecting to Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#C9A227]" />
                      <span>Pay &amp; Confirm Booking (₹{consultation.fee.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <section>
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Sacred Guidance"
            title="Personalized Spiritual Consultation"
            subtitle="Connect directly with an experienced Vedic astrologer and numerologist for deep clarity, astrological remedies, and life roadmap guidance."
          />
        </Container>
      </section>

      {/* 1. ABOUT THE ASTROLOGER SECTION (Rendered ONLY if about_bio is non-empty) */}
      {settings.about_bio && settings.about_bio.trim() !== '' && (
        <section className="bg-mist/70 py-10 sm:py-16 border-y border-secondary/15">
          <Container className="max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Visual Portrait Card */}
              <div className="lg:col-span-5 flex justify-center lg:sticky lg:top-24">
                <div className="relative w-full max-w-sm lg:max-w-md rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1E1B4B] via-[#2E2A5C] to-[#1E1B4B] p-6 sm:p-7 border border-[#C9A227]/35 shadow-xl text-center text-ivory">
                  {/* Portrait Photo Frame with Double Gold Borders & Centered Badge */}
                  {photoSrc ? (
                    <div className="relative mx-auto mb-6 w-[220px] sm:w-[260px] aspect-[4/5] rounded-2xl p-1.5 border border-[#C9A227]/60 bg-white/5 backdrop-blur-xs shadow-[0_12px_28px_-6px_rgba(201,162,39,0.22)]">
                      <div className="w-full h-full rounded-xl overflow-hidden border border-[#C9A227]/80 relative bg-[#1E1B4B]/60">
                        <img
                          src={photoSrc}
                          alt={settings.about_name || 'Anushka Yadav'}
                          width={260}
                          height={325}
                          decoding="async"
                          onError={() => setImageError(true)}
                          className="w-full h-full object-cover object-[center_20%]"
                        />
                      </div>
                      {/* Vedic Jyotish Gold Badge positioned higher */}
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#C9A227] text-[#1E1B4B] text-[10px] font-bold px-3.5 py-1 rounded-full shadow-md uppercase tracking-wider whitespace-nowrap z-10 border border-[#1E1B4B]">
                        Vedic Jyotish
                      </span>
                    </div>
                  ) : (
                    /* Fallback Avatar Placeholder Circle */
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-5">
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-secondary via-primary to-[#1E1B4B] flex items-center justify-center text-ivory shadow-md border-4 border-accent/50 overflow-hidden">
                        <svg
                          className="w-20 h-20 sm:w-24 sm:h-24 text-accent/90"
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="50" cy="35" r="16" fill="#C9A227" opacity="0.9" />
                          <path
                            d="M 22 85 C 22 62, 78 62, 78 85 Z"
                            fill="#EFEAF8"
                            opacity="0.85"
                          />
                          <circle
                            cx="50"
                            cy="35"
                            r="24"
                            stroke="#C9A227"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            opacity="0.6"
                          />
                          <polygon
                            points="50,6 52,12 58,12 53,16 55,22 50,18 45,22 47,16 42,12 48,12"
                            fill="#C9A227"
                          />
                        </svg>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-accent text-[#1E1B4B] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase border border-[#1E1B4B]">
                        Vedic Jyotish
                      </span>
                    </div>
                  )}

                  {settings.about_name && (
                    <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#FBF7EE] mt-2">
                      {settings.about_name}
                    </h3>
                  )}
                  {displayTitle && (
                    <p className="text-[#C9A227] text-xs sm:text-sm font-semibold tracking-wide uppercase mt-1">
                      {displayTitle}
                    </p>
                  )}

                  {/* Expertise Chips (Rendered only when non-empty) */}
                  {settings.about_expertise && settings.about_expertise.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3.5">
                      {settings.about_expertise.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-white/10 text-[#FBF7EE] border border-[#C9A227]/30 text-[11px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-2xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* About Narrative & Philosophy */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-5 sm:space-y-6">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-semibold uppercase tracking-wider text-secondary">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>Yug Skill Institute • Anushka Yadav</span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-primary leading-tight">
                      Meet Your Mentor Anushka Yadav
                    </h2>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-heading font-bold text-primary/90 mt-1 sm:mt-1.5 leading-snug">
                      Ready for Astrology, Numerology &amp; Holistic Transformation
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-accent uppercase tracking-wider mt-2">
                      Guiding Lives. Transforming Destinies. Empowering Souls.
                    </p>
                  </div>

                  <div className="text-ink/85 text-xs sm:text-base leading-relaxed space-y-3">
                    <p className="font-semibold text-primary text-sm sm:text-lg">
                      Welcome to Yug Skill Institute!
                    </p>
                    <p>
                      I am a dedicated Astrologer, Numerologist, Tarot Card Reader, Vastu Consultant, Life Coach, Counsellor, and Holistic Healer, passionate about helping individuals discover their true potential, overcome life&apos;s challenges, and move towards a more balanced, successful, and fulfilling life.
                    </p>
                    <p>
                      With over <strong>6+ years of professional experience</strong> in astrology, numerology, tarot reading, Vastu, counselling, and spiritual guidance, I have had the privilege of training and empowering <strong>21,000+ students</strong> through my knowledge, practical expertise, and personalized guidance.
                    </p>
                  </div>

                  {/* My Expertise & Services */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                      <Award className="w-4 h-4 text-accent" />
                      <span>My Expertise &amp; Services</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs sm:text-sm text-ink/90">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <span><strong>Vedic Astrology:</strong> Understanding planetary influences, Kundali analysis, career, marriage, relationships, finance, and life direction.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <span><strong>Numerology:</strong> Birth number analysis, destiny numbers, name numerology, and personal vibration guidance.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <span><strong>Tarot Card Reading:</strong> Intuitive readings and meaningful insights to help navigate life&apos;s important decisions.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <span><strong>Vastu Consultation:</strong> Creating harmonious and positive living and working environments.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <span><strong>Life Coaching:</strong> Helping individuals build confidence, clarity, discipline, and achieve their personal and professional goals.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <span><strong>Counselling &amp; Guidance:</strong> Offering compassionate support for emotional challenges, relationships, career decisions, and personal growth.</span>
                      </div>
                      <div className="flex items-start gap-2.5 sm:col-span-2">
                        <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <span><strong>Holistic Healing:</strong> Personalized spiritual practices and remedies to encourage positivity, inner balance, and personal transformation.</span>
                      </div>
                    </div>
                  </div>

                  {/* My Mission */}
                  <div className="space-y-2.5 pt-2 border-t border-secondary/15">
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span>My Mission</span>
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-secondary leading-relaxed">
                      My mission is not just to predict the future but to empower people to create a better one.
                    </p>
                    <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                      I believe that every individual deserves clarity, confidence, and the right guidance to make informed decisions in life. Through the combined wisdom of astrology, numerology, tarot, Vastu, coaching, and healing practices, I aim to help people understand themselves better and unlock their hidden potential.
                    </p>
                    <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                      Whether you are facing career uncertainties, relationship challenges, financial concerns, emotional struggles, or seeking spiritual growth, I am here to guide you with personalized attention, practical insights, and a compassionate approach.
                    </p>
                  </div>
                </div>

                {/* My Promise to You & Sign-off Card */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/90 border border-secondary/20 shadow-xs space-y-3 mt-4">
                  <h3 className="font-heading text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>My Promise to You</span>
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-secondary">
                    Your journey matters. Your growth matters. Your transformation matters.
                  </p>
                  <p className="text-xs sm:text-sm text-ink/85 leading-relaxed">
                    I believe in ethical guidance, client confidentiality, personalized solutions, and empowering people without creating fear or dependency.
                  </p>
                  <p className="text-xs sm:text-sm text-ink/85 leading-relaxed">
                    Let&apos;s work together to bring clarity to your life, confidence to your decisions, and positivity to your journey.
                  </p>
                  <div className="pt-3 border-t border-secondary/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm font-semibold italic text-primary">
                      &ldquo;With Wisdom, Guidance &amp; Healing – Let&apos;s Transform Lives Together.&rdquo;
                    </p>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-[11px] text-ink/65 uppercase tracking-wider font-semibold">Founder of Yug Skill Institute</p>
                      <p className="font-heading font-bold text-base sm:text-lg text-primary">Anushka Yadav</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Online Consultation Benefits & 1-on-1 Comprehensive Session Section */}
      <OnlineConsultationSection
        consultation={consultation}
        onBook={() => handleOpenBookingModal('1-on-1 Comprehensive Session')}
      />

      {/* 2. SERVICES GRID SECTION */}
      <section>
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Specialized Offerings"
            title="Consultation Services & Expertise"
            subtitle="Choose a specialized consultation or comprehensive reading tailored to your specific life questions."
          />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#2E2A5C]/80 rounded-2xl border-2 border-[#C9A227]/40 p-5 sm:p-6 animate-pulse space-y-3"
                >
                  <div className="h-5 bg-white/20 rounded-md w-1/2" />
                  <div className="h-3.5 bg-white/10 rounded-md w-3/4" />
                  <div className="h-20 bg-white/10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {consultation.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#251A4A] rounded-2xl border-2 border-[#C9A227] p-5 sm:p-6 shadow-md shadow-[#1E1B4B]/20 hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-heading text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                          {service.title.replace(/^\d+[\.\s]+\s*/, '')}
                        </h3>
                        {service.badge && (
                          <span className="bg-[#C9A227] text-[#1E1B4B] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider shadow-xs">
                            {service.badge}
                          </span>
                        )}
                      </div>
                      {service.subtitle && (
                        <p className="text-[#C9A227] text-xs font-semibold tracking-wide mb-1.5 leading-snug">
                          {service.subtitle}
                        </p>
                      )}
                      <p className="text-white/90 text-xs leading-relaxed mb-3 font-normal">
                        {service.description}
                      </p>

                      <div className="space-y-1.5 border-t border-[#C9A227]/30 pt-3 mb-4">
                        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#C9A227]">
                          {service.inclusions_title || 'Key Inclusions:'}
                        </p>
                        {service.deliverables.map((item, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-white font-normal leading-snug">
                            <CheckCircle className="w-3.5 h-3.5 text-[#C9A227] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                        {service.note && (
                          <p className="mt-2.5 pt-2 border-t border-[#C9A227]/20 text-[11px] sm:text-xs text-white/80 leading-relaxed font-normal">
                            {service.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline-light"
                        size="sm"
                        onClick={() => handleOpenBookingModal(service.title.replace(/^\d+[\.\s]+\s*/, ''))}
                        className="w-full py-2 sm:py-2.5 !border-2 !border-[#C9A227] !text-white bg-white/5 hover:!bg-[#C9A227] hover:!text-[#1E1B4B] text-xs font-semibold rounded-full flex items-center justify-center gap-2 transition-all shadow-xs"
                      >
                        <span>Book Consultation</span>
                        <span className="text-[#C9A227] group-hover:text-inherit">•</span>
                        <span className="font-bold">
                          {service.price ? `₹${Number(service.price).toLocaleString('en-IN')}` : '₹5,100'}
                        </span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-secondary/15 text-center">
                <p className="text-[11px] sm:text-xs text-ink/65 leading-relaxed">
                  * Non-refundable policy: No refund will be provided in any case.
                </p>
              </div>
            </>
          )}
        </Container>
      </section>

      {/* 3. HOW IT WORKS 4-STEP TIMELINE */}
      <section className="bg-mist/70 py-12 sm:py-20 border-y border-secondary/15">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Simple Roadmap"
            title="How It Works"
            subtitle="Our structured 4-step process ensures thorough preparation, accurate chart analysis, and practical outcomes."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {consultation.processSteps.map((step) => (
              <div
                key={step.step}
                className="bg-white/95 rounded-2xl border border-secondary/20 p-5 sm:p-6 shadow-sm relative flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-secondary text-accent font-heading font-bold text-lg flex items-center justify-center mb-4 border border-accent/30 shadow-xs">
                    {step.step}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-accent block mb-1">
                    {step.subtitle}
                  </span>
                  <h4 className="font-heading text-lg sm:text-xl font-bold text-primary mb-2">
                    {step.title}
                  </h4>
                  <p className="text-ink/80 text-xs sm:text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. FAQ ACCORDION (KEYBOARD ACCESSIBLE) */}
      <section>
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Got Questions?"
            title="Frequently Asked Questions"
            subtitle="Find answers to common queries regarding preparation, consultation mode, and Vedic remedies."
          />

          <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-3.5">
            {consultation.faqs.map((faq) => {
              const isOpen = openFaqId === faq.id

              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-secondary/20 bg-white/95 overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="font-heading text-lg sm:text-xl font-bold text-primary">
                      {faq.question}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full bg-mist flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-secondary/15' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 text-secondary" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-ink/80 leading-relaxed border-t border-mist/80 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* 6. Lead Capture Section: Free Kundli & Ask the Astrologer (Placed at page bottom) */}
      <LeadCaptureSection />
    </div>
  )
}

export default Consultation
