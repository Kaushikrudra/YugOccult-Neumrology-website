import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Quote,
  Star,
  CheckCircle,
} from 'lucide-react'
import Container from '../components/Container'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import CourseCard from '../components/CourseCard'
import ZodiacWheel from '../components/ZodiacWheel'
import HeroSideDecor from '../components/HeroSideDecor'
import HomeAboutSection from '../components/HomeAboutSection'
import { coursesData, Course } from '../data/courses'
import { consultationData } from '../data/consultation'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { api } from '../lib/api'

interface HomeTestimonial {
  id: string
  name: string
  text: string
  location: string | null
  rating: number | null
  position: number
}

export const Home: React.FC = () => {
  const { settings } = useSiteSettings()

  // Testimonial Carousel State (Strictly DB data, never mock fallback)
  const [testimonials, setTestimonials] = useState<HomeTestimonial[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState<boolean>(true)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Real course catalog with API fetching & mock fallback
  const [courses, setCourses] = useState<Course[]>(coursesData)

  // Master consultation settings (fee, duration) from DB with consultationData fallback
  const [consultation, setConsultation] = useState({
    fee: consultationData.fee,
    duration_minutes: consultationData.duration_minutes,
  })

  useEffect(() => {
    let isMounted = true

    // Fetch courses
    api.get<{ courses: Course[] }>('/api/courses')
      .then((res) => {
        if (isMounted && res?.courses && res.courses.length > 0) {
          setCourses(res.courses)
        }
      })
      .catch(() => {})

    // Fetch visible testimonials - strictly DB only (hide section if empty or failed)
    api.get<{ testimonials: HomeTestimonial[] }>('/api/testimonials')
      .then((res) => {
        if (isMounted && res?.testimonials) {
          setTestimonials(res.testimonials)
        }
      })
      .catch(() => {
        if (isMounted) setTestimonials([])
      })
      .finally(() => {
        if (isMounted) setLoadingTestimonials(false)
      })

    // Fetch consultation master fee & duration
    api.get<{ fee: number; duration_minutes: number }>('/api/consultation')
      .then((res) => {
        if (isMounted && res) {
          setConsultation({
            fee: Number(res.fee) || consultationData.fee,
            duration_minutes: Number(res.duration_minutes) || consultationData.duration_minutes,
          })
        }
      })
      .catch(() => {})

    return () => { isMounted = false }
  }, [])

  const featuredCourses = useMemo(() => {
    const feat = courses.filter((c) => c.is_visible !== false && c.is_featured)
    if (feat.length > 0) return feat.slice(0, 3)
    return courses.filter((c) => c.is_visible !== false).slice(0, 3)
  }, [courses])

  const totalVisibleCourses = useMemo(() => {
    return courses.filter((c) => c.is_visible !== false).length
  }, [courses])

  // Carousel Controls
  const nextTestimonial = () => {
    if (testimonials.length === 0) return
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    if (testimonials.length === 0) return
    setActiveTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    )
  }

  // Auto-advance carousel
  useEffect(() => {
    if (testimonials.length <= 1) return
    autoPlayRef.current = setInterval(() => {
      nextTestimonial()
    }, 6000)

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [testimonials.length])

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextTestimonial()
    } else if (isRightSwipe) {
      prevTestimonial()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <div className="space-y-14 sm:space-y-24 pb-14 sm:pb-24">
      {/* 1. Hero Section with Deep Indigo Gradient, Rotating Zodiac Wheel & Concentric Orbit Rings */}
      <section className="relative overflow-hidden flex flex-col justify-center items-center min-h-[640px] md:min-h-[720px] lg:min-h-[800px] xl:min-h-[850px] py-16 sm:py-20 md:py-24 bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#3B2A70] border-b-[3px] border-accent">
        {/* Soft Radial Celestial Glow (Violet/Gold, strictly no black) */}
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(201,162,39,0.08)_0%,_rgba(91,62,150,0.18)_50%,_transparent_75%)]"
          aria-hidden="true"
        />

        {/* Outer Concentric Orbit Rings & Constellations (Spanning to left and right edges, behind wheel) */}
        <div
          className="absolute inset-0 pointer-events-none select-none flex items-center justify-center z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="aspect-square flex items-center justify-center w-[250%] sm:w-[220%] md:w-auto md:h-[220%] lg:h-[235%] xl:h-[250%] max-w-none">
            <HeroSideDecor className="w-full h-full animate-orbit-slow" color="#C9A227" />
          </div>
        </div>

        {/* Large Prominent Rotating Zodiac Wheel (High Visibility 0.92, Full Circle Fit, Center Aligned) */}
        <div
          className="absolute inset-0 pointer-events-none select-none flex items-center justify-center z-[1] overflow-hidden"
          aria-hidden="true"
        >
          <div className="aspect-square opacity-[0.92] flex items-center justify-center w-[92%] max-w-[560px] md:w-auto md:max-w-[92%] md:h-[90%] lg:h-[92%] max-h-full">
            <ZodiacWheel
              className="w-full h-full animate-spin-slow"
              color="#C9A227"
            />
          </div>
        </div>

        {/* Clean Sharp 3px Gold Bottom Divider Line */}
        <div
          className="absolute inset-x-0 bottom-0 h-[3px] bg-accent z-30"
          aria-hidden="true"
        />

        {/* Widened Hero Content Container */}
        <Container size="full" className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 relative z-20 my-auto min-w-0">
          <div className="text-center w-full mx-auto space-y-4 sm:space-y-6 min-w-0">
            {/* Sacred Eyebrow Pill */}
            {settings.hero_badge && (
              <div className="inline-flex max-w-full items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-ivory/10 backdrop-blur-md border border-accent/40 text-ivory shadow-xs hero-text-shadow">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent animate-pulse shrink-0" />
                <span className="text-[11px] min-[360px]:text-xs sm:text-sm font-semibold tracking-wider uppercase text-accent">
                  {settings.hero_badge}
                </span>
              </div>
            )}

            {/* Stretched Main Headline */}
            {settings.hero_headline && (
              <div className="max-w-5xl mx-auto w-full min-w-0 px-1 sm:px-2">
                <h1 className="text-2xl min-[360px]:text-[1.75rem] min-[400px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-ivory leading-[1.15] tracking-tight hero-text-shadow break-words">
                  {settings.hero_headline}
                </h1>
              </div>
            )}

            {/* Stretched Tagline / Subtitle */}
            {settings.hero_subtitle && (
              <div className="max-w-4xl mx-auto w-full min-w-0 px-1 sm:px-2">
                <p className="text-xs min-[360px]:text-sm sm:text-base md:text-lg text-[#EFEAF8] leading-relaxed font-normal hero-text-shadow break-words">
                  {settings.hero_subtitle}
                </p>
              </div>
            )}

            {/* Stretched Dual Action Buttons (Shifted down ~2 lines) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 pt-6 sm:pt-8 md:pt-10 w-full max-w-sm sm:max-w-xl md:max-w-2xl mx-auto min-w-0">
              <Link to="/consultation" className="w-full sm:flex-1 min-w-0">
                <Button
                  variant="cta"
                  size="lg"
                  className="w-full min-h-[48px] py-3.5 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-semibold gap-2 shadow-lg shadow-cta/25 justify-center"
                >
                  <span>Book Consultation</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </Button>
              </Link>
              <Link to="/courses" className="w-full sm:flex-1 min-w-0">
                <Button
                  variant="outline-light"
                  size="lg"
                  className="w-full min-h-[48px] py-3.5 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-semibold justify-center"
                >
                  Explore Sacred Courses
                </Button>
              </Link>
            </div>

            {/* Stretched Micro Highlights across width */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 md:gap-10 pt-4 sm:pt-6 text-xs sm:text-sm md:text-base text-ivory/90 font-medium hero-text-shadow w-full max-w-4xl mx-auto px-1">
              <span className="inline-flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent shrink-0" />
                <span>No Superstitious Fears</span>
              </span>
              <span className="inline-flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent shrink-0" />
                <span>100% Confidential</span>
              </span>
              <span className="inline-flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent shrink-0" />
                <span>Practical Solutions</span>
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Stats Strip (Rendered ONLY if show_stats is true AND stats has items) */}
      {settings.show_stats && settings.stats && settings.stats.length > 0 && (
        <section className="mt-8 sm:mt-12 relative z-20">
          <Container>
            <div className="bg-[#5B3E96] rounded-2xl sm:rounded-3xl border border-[#C9A227]/35 shadow-xl p-5 sm:p-8">
              <div
                className={`grid grid-cols-2 ${
                  settings.stats.length >= 4
                    ? 'lg:grid-cols-4'
                    : settings.stats.length === 3
                    ? 'lg:grid-cols-3'
                    : 'lg:grid-cols-2'
                } gap-6 sm:gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-[#C9A227]/25`}
              >
                {settings.stats.map((item, idx) => (
                  <div key={idx} className="pt-2 lg:pt-0">
                    <span className="block font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#C9A227]">
                      {item.value}
                    </span>
                    <span className="text-xs sm:text-sm text-[#C9A227]/90 font-medium uppercase tracking-wider mt-1 block">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 2.5 About Section (Meet Anushka Yadav) */}
      <HomeAboutSection />

      {/* 3. Featured Courses Section */}
      <section>
        <Container>
          <SectionHeading
            eyebrow="Certified Sacred Learning"
            title="Featured Vedic Courses"
            subtitle="Learn time-tested astrological techniques and master numerology directly from structured curricula."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredCourses.map((course) => (
              <CourseCard
                key={course.id || course.slug}
                id={course.id}
                slug={course.slug}
                title={course.title}
                description={course.description}
                price={course.price}
                original_price={course.original_price}
                discount_percent={course.discount_percent}
                duration={course.duration}
                level={course.level}
                category={course.category}
                imageUrl={course.image_url}
                instructor={course.instructor || 'Anushka Yadav'}
                is_package={course.is_package}
                bundle_items={course.bundle_items}
                onSelect={() => {
                  window.location.href = '/courses'
                }}
                onViewDetails={() => {
                  window.location.href = '/courses'
                }}
                onBuyNow={() => {
                  window.location.href = '/courses'
                }}
              />
            ))}
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <Link to="/courses" className="inline-block w-full sm:w-auto">
              <Button variant="outline" size="md" className="gap-2 w-full sm:w-auto border-secondary/30 text-secondary hover:bg-mist">
                <span>View All {totalVisibleCourses || 29} Courses</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Kundli Consultation Compact CTA Strip */}
      <section className="relative z-20">
        <Container>
          <div className="bg-gradient-to-r from-[#EFEAF8] via-[#FBF7EE] to-[#EFEAF8] rounded-3xl border border-secondary/20 shadow-md p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Personalized Jyotish Guidance</span>
              </div>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
                Get Your Kundli Report &amp; Chart Assessment
              </h3>
              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                Submit your birth particulars to receive your comprehensive Vedic chart, planetary dasha insights, and practical guidance directly from our certified astrologer on WhatsApp for just ₹499.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto text-center">
              <Link to="/consultation#kundli-request" className="inline-block w-full sm:w-auto">
                <Button
                  variant="cta"
                  size="lg"
                  className="w-full sm:w-auto gap-2 shadow-lg shadow-cta/20 min-h-[48px] justify-center px-6 py-3.5 font-bold text-sm tracking-wide"
                >
                  <span>Order Kundli (₹499)</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Consultation Highlight Card */}
      <section className="bg-mist/70 py-12 sm:py-20 border-y border-secondary/15">
        <Container>
          <div className="bg-white/95 rounded-3xl border border-secondary/20 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 p-6 sm:p-12 items-center">
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-semibold uppercase tracking-wider text-secondary">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>1-on-1 Personal Guidance</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-heading font-bold text-primary leading-tight">
                Private Vedic Life & Destiny Consultation
              </h2>

              <p className="text-ink/80 text-xs sm:text-base leading-relaxed">
                Connect directly with Anushka Yadav for deep birth chart reading, Mahadasha analysis, numerological name vibration evaluation, and constructive karmic remedies.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-ink/85">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-accent shrink-0" />
                  <span>Duration: <strong>{consultation.duration_minutes} Minutes</strong> focused session</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                  <span>Mode: <strong>Audio / Video Call</strong></span>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/consultation" className="inline-block w-full sm:w-auto">
                  <Button variant="cta" size="lg" className="w-full sm:w-auto gap-2">
                    <span>Book Consultation (₹{consultation.fee.toLocaleString('en-IN')})</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Fee & Inclusions Box */}
            <div className="lg:col-span-5 bg-primary text-ivory rounded-2xl p-6 sm:p-8 space-y-5 border border-secondary/40 shadow-sm">
              <div className="flex items-baseline justify-between border-b border-secondary/40 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                    Session Fee
                  </span>
                  <span className="font-heading text-4xl sm:text-5xl font-bold text-ivory">
                    ₹{consultation.fee.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="bg-secondary/70 text-ivory text-xs px-3 py-1 rounded-full font-medium border border-secondary/50">
                  {consultation.duration_minutes} Mins
                </span>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-ivory/85">
                <p className="font-semibold text-accent text-xs uppercase tracking-wider">
                  What You Receive:
                </p>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Complete Kundali & divisional chart calculations</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Numerology grid & name vibration analysis</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Specific answers for career, marriage & finance</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Custom Vedic remedies without commercial exploitation</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Testimonials Slider / Carousel - Strictly DB-driven; completely hidden if no visible testimonials */}
      {!loadingTestimonials && testimonials.length > 0 && (
        <section>
          <Container>
            <SectionHeading
              eyebrow="Seeker Experiences"
              title="Voices of Transformation"
              subtitle="Read genuine experiences from individuals who gained direction and clarity through our consultations and courses."
            />

            <div
              className="max-w-4xl mx-auto relative px-2 sm:px-6"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Active Testimonial Card */}
              {testimonials[activeTestimonial] && (
                <div className="bg-white/95 rounded-3xl border border-secondary/20 shadow-md p-6 sm:p-12 relative overflow-hidden transition-all duration-300">
                  {/* Quote Watermark */}
                  <Quote className="absolute top-4 right-4 sm:top-6 sm:right-6 w-16 h-16 sm:w-24 sm:h-24 text-secondary/10 pointer-events-none" />

                  <div className="flex items-center gap-1 text-accent mb-4">
                    {[...Array(testimonials[activeTestimonial].rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent" />
                    ))}
                  </div>

                  <blockquote className="text-ink text-sm sm:text-lg leading-relaxed italic mb-6 relative z-10">
                    &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                  </blockquote>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-mist pt-4 gap-2">
                    <div>
                      <h4 className="font-heading text-lg sm:text-xl font-bold text-primary">
                        {testimonials[activeTestimonial].name}
                      </h4>
                      {testimonials[activeTestimonial].location && (
                        <p className="text-xs sm:text-sm text-ink/70">
                          {testimonials[activeTestimonial].location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons (shown only if more than 1 testimonial) */}
              {testimonials.length > 1 && (
                <div className="flex items-center justify-between mt-6">
                  {/* Dot Indicators */}
                  <div className="flex items-center gap-2">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveTestimonial(idx)}
                        aria-label={`Go to testimonial ${idx + 1}`}
                        className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                          activeTestimonial === idx
                            ? 'w-8 bg-secondary'
                            : 'w-2.5 bg-secondary/25 hover:bg-secondary/50'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Prev / Next Arrows */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prevTestimonial}
                      aria-label="Previous Testimonial"
                      className="w-10 h-10 rounded-full bg-white border border-secondary/25 flex items-center justify-center text-primary hover:bg-mist active:scale-95 transition-all focus:outline-none"
                    >
                      <ChevronLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <button
                      type="button"
                      onClick={nextTestimonial}
                      aria-label="Next Testimonial"
                      className="w-10 h-10 rounded-full bg-white border border-secondary/25 flex items-center justify-center text-primary hover:bg-mist active:scale-95 transition-all focus:outline-none"
                    >
                      <ChevronRight className="w-5 h-5 text-secondary" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* 6. Final CTA Banner */}
      <section>
        <Container>
          <div className="rounded-3xl bg-primary text-ivory p-6 sm:p-14 text-center space-y-4 sm:space-y-6 relative overflow-hidden border border-secondary/40 shadow-lg">
            {/* Background sacred ambient rings */}
            <svg
              className="absolute -right-20 -bottom-20 w-80 h-80 opacity-15 pointer-events-none"
              viewBox="0 0 200 200"
              fill="none"
            >
              <circle cx="100" cy="100" r="90" stroke="#C9A227" strokeWidth="2" strokeDasharray="4 6" />
              <circle cx="100" cy="100" r="60" stroke="#EFEAF8" strokeWidth="1" />
            </svg>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold text-ivory leading-tight break-words">
              Ready to Align with Your Highest Cosmic Potential?
            </h2>

            <p className="text-ivory/80 max-w-2xl mx-auto text-xs sm:text-base leading-relaxed break-words">
              Book a personalized {consultation.duration_minutes}-minute consultation today or enroll in our sacred knowledge courses to master ancient Vedic wisdom.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 w-full max-w-sm sm:max-w-none mx-auto min-w-0">
              <Link to="/consultation" className="w-full sm:w-auto min-w-0">
                <Button variant="cta" size="lg" className="w-full sm:w-auto min-h-[44px]">
                  Book Your Session (₹{consultation.fee.toLocaleString('en-IN')})
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto min-w-0">
                <Button variant="outline" size="lg" className="border-ivory/60 text-ivory hover:bg-secondary w-full sm:w-auto min-h-[44px]">
                  Ask a Question
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default Home
