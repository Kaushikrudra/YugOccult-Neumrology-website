import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  ChevronDown,
  Award,
  Info,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import Container from '../components/Container'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import LeadCaptureSection from '../components/LeadCaptureSection'
import OnlineConsultationSection from '../components/OnlineConsultationSection'
import { consultationData } from '../data/consultation'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { api } from '../lib/api'

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

  // Auto-scroll to #kundli-request, #free-kundli, or #book-consultation if navigated via anchor
  useEffect(() => {
    if (
      window.location.hash === '#free-kundli' ||
      window.location.hash === '#kundli-request' ||
      window.location.hash === '#book-consultation'
    ) {
      const timer = setTimeout(() => {
        const hash = window.location.hash.substring(1)
        const el =
          document.getElementById(hash) ||
          (hash === 'free-kundli' ? document.getElementById('kundli-request') : null)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1')
  // Booking toast state
  const [showBookingToast, setShowBookingToast] = useState(false)

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id))
  }

  const handleBookAndPay = () => {
    setShowBookingToast(true)
    setTimeout(() => {
      setShowBookingToast(false)
    }, 6000)
  }

  return (
    <div className="space-y-12 sm:space-y-20 pb-12 sm:pb-24 pt-4 sm:pt-8">
      {/* Toast Notification for Book & Pay */}
      {showBookingToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-primary text-ivory p-4 sm:p-5 rounded-2xl shadow-xl border border-secondary/40 flex items-start gap-3">
            <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h5 className="font-heading text-lg font-bold text-accent">
                Online Payment Gateway Coming Soon!
              </h5>
              <p className="text-xs text-ivory/85 leading-relaxed">
                Direct online payment (Cashfree) is scheduled for the next phase. To reserve your consultation slot right now, please reach out via our Contact form or WhatsApp.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Link
                  to="/contact"
                  onClick={() => setShowBookingToast(false)}
                  className="text-xs font-semibold text-accent underline underline-offset-2 hover:text-ivory"
                >
                  Go to Contact Form →
                </Link>
                <button
                  type="button"
                  onClick={() => setShowBookingToast(false)}
                  className="text-xs text-ivory/60 hover:text-ivory ml-auto"
                >
                  Dismiss
                </button>
              </div>
            </div>
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
      <OnlineConsultationSection consultation={consultation} onBook={handleBookAndPay} />

      {/* 2. SERVICES GRID SECTION */}
      <section>
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Specialized Offerings"
            title="Consultation Services & Expertise"
            subtitle="Choose a specialized consultation or comprehensive reading tailored to your specific life questions."
          />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#2E2A5C]/80 rounded-2xl sm:rounded-3xl border-2 border-[#C9A227]/40 p-6 sm:p-8 animate-pulse space-y-4"
                >
                  <div className="h-6 bg-white/20 rounded-md w-1/2" />
                  <div className="h-4 bg-white/10 rounded-md w-3/4" />
                  <div className="h-24 bg-white/10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
                {consultation.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#251A4A] rounded-2xl sm:rounded-3xl border-2 border-[#C9A227] p-6 sm:p-8 shadow-lg shadow-[#1E1B4B]/25 hover:shadow-2xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {service.title}
                        </h3>
                        {service.badge && (
                          <span className="bg-[#C9A227] text-[#1E1B4B] text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider shadow-xs">
                            {service.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-white/90 text-xs sm:text-sm leading-relaxed mb-4 font-normal">
                        {service.description}
                      </p>

                      <div className="space-y-2.5 border-t border-[#C9A227]/30 pt-4 mb-6">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A227]">
                          Key Inclusions:
                        </p>
                        {service.deliverables.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-white font-normal">
                            <CheckCircle className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline-light"
                        size="sm"
                        onClick={handleBookAndPay}
                        className="w-full py-2.5 sm:py-3 !border-2 !border-[#C9A227] !text-white bg-white/5 hover:!bg-[#C9A227] hover:!text-[#1E1B4B] text-xs sm:text-sm font-semibold rounded-full flex items-center justify-center gap-2 transition-all shadow-xs"
                      >
                        <span>Select This Service</span>
                        <span className="text-[#C9A227] group-hover:text-inherit">•</span>
                        <span className="font-bold">₹5,100</span>
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
