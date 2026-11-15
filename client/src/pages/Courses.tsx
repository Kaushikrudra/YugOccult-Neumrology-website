import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Award,
  X,
  CheckCircle,
  Users,
  Info,
  Search,
  Layers,
  ArrowRight,
} from 'lucide-react'
import Container from '../components/Container'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import CourseCard from '../components/CourseCard'
import EbookCard from '../components/EbookCard'
import { coursesData, Course } from '../data/courses'
import { Ebook } from '../types/ebook'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const PREFERRED_CATEGORY_ORDER = [
  'Packages',
  'Tarot',
  'Astrology',
  'Numerology',
  'Vastu',
  'Manifestation',
  'Healing',
  'Remedies',
  'Switchwords',
  'Other',
]

export const Courses: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Courses state (initialized with fallback mock data, updated from API if available)
  const [courses, setCourses] = useState<Course[]>(coursesData)
  const [loading, setLoading] = useState(false)

  // Ebooks state (fetched from /api/ebooks)
  const [ebooks, setEbooks] = useState<Ebook[]>([])

  // Enrolled course IDs for current user
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set())

  // State for filter tab
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Search input state
  const [searchQuery, setSearchQuery] = useState('')

  // State for active course modal
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // State for Buy Now Toast
  const [buyNowToast, setBuyNowToast] = useState<string | null>(null)

  // State for Free Enrollment Success Toast
  const [enrollSuccessToast, setEnrollSuccessToast] = useState<string | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // 1. Fetch courses from API
  useEffect(() => {
    let isMounted = true

    async function loadApiCourses() {
      try {
        setLoading(true)
        const res = await api.get<{ courses: Course[] }>('/api/courses')
        if (isMounted && res?.courses && res.courses.length > 0) {
          setCourses(res.courses)
        }
      } catch {
        // Fallback to mock data already in state
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadApiCourses()

    return () => {
      isMounted = false
    }
  }, [])

  // 1b. Fetch free ebooks from /api/ebooks
  useEffect(() => {
    let isMounted = true

    async function loadEbooks() {
      try {
        const res = await api.get<{ ebooks: Ebook[] }>('/api/ebooks')
        if (isMounted && res?.ebooks && Array.isArray(res.ebooks)) {
          setEbooks(res.ebooks)
        }
      } catch {
        // Non-fatal fallback: if API fails, section remains hidden
      }
    }

    loadEbooks()

    return () => {
      isMounted = false
    }
  }, [])

  // 2. Fetch user's active enrollments if logged in
  useEffect(() => {
    let isMounted = true

    async function loadEnrolledCourses() {
      if (!user) {
        setEnrolledCourseIds(new Set())
        return
      }

      try {
        const res = await api.get<{ courses: Array<{ id: string }> }>('/api/account/courses')
        if (isMounted && res?.courses) {
          setEnrolledCourseIds(new Set(res.courses.map((c) => c.id)))
        }
      } catch {
        // Non-fatal, fallback to empty
      }
    }

    loadEnrolledCourses()

    return () => {
      isMounted = false
    }
  }, [user])

  // 3. Compute dynamic category list with counts
  const categoryChips = useMemo(() => {
    const visibleCourses = courses.filter((c) => c.is_visible !== false)

    // Count per category
    const countMap = new Map<string, number>()
    for (const c of visibleCourses) {
      countMap.set(c.category, (countMap.get(c.category) || 0) + 1)
    }

    // Order by predefined list
    const availableCategories: Array<{ name: string; count: number }> = []

    for (const cat of PREFERRED_CATEGORY_ORDER) {
      const count = countMap.get(cat)
      if (count && count > 0) {
        availableCategories.push({ name: cat, count })
      }
    }

    // Add any unexpected category if exists
    countMap.forEach((count, cat) => {
      if (!PREFERRED_CATEGORY_ORDER.includes(cat) && count > 0) {
        availableCategories.push({ name: cat, count })
      }
    })

    return [
      { name: 'All', count: visibleCourses.length },
      ...availableCategories,
    ]
  }, [courses])

  // 4. Filter courses client-side by category and search query
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (course.is_visible === false) return false

      if (selectedCategory !== 'All' && course.category !== selectedCategory) {
        return false
      }

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const matchesTitle = course.title.toLowerCase().includes(query)
        const matchesCategory = course.category.toLowerCase().includes(query)
        const matchesDesc = course.description.toLowerCase().includes(query)
        return matchesTitle || matchesCategory || matchesDesc
      }

      return true
    })
  }, [courses, selectedCategory, searchQuery])

  // Keyboard accessibility: ESC key to close modal & focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCourse) {
        setSelectedCourse(null)
      }
    }

    if (selectedCourse) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 50)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedCourse])

  const handleBuyNow = (courseTitle: string) => {
    setBuyNowToast(courseTitle)
    setTimeout(() => {
      setBuyNowToast(null)
    }, 6000)
  }

  const handleEnrollSuccess = (courseTitle: string) => {
    setEnrollSuccessToast(courseTitle)
    setTimeout(() => {
      setEnrollSuccessToast(null)
    }, 6000)
  }

  return (
    <div className="space-y-10 sm:space-y-16 pb-12 sm:pb-24 pt-4 sm:pt-8 min-w-0">
      {/* Toast Notification for Buy Now */}
      {buyNowToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-primary text-ivory p-4 sm:p-5 rounded-2xl shadow-xl border border-secondary/40 flex items-start gap-3">
            <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h5 className="font-heading text-lg font-bold text-accent">
                Enrollment for &ldquo;{buyNowToast}&rdquo;
              </h5>
              <p className="text-xs text-ivory/85 leading-relaxed">
                Direct online payment checkout will be enabled in Phase 5. To reserve your seat in the upcoming cohort right now, please submit an enquiry on our Contact page or message on WhatsApp.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Link
                  to="/contact"
                  onClick={() => setBuyNowToast(null)}
                  className="text-xs font-semibold text-accent underline underline-offset-2 hover:text-ivory"
                >
                  Reserve Seat via Contact Form →
                </Link>
                <button
                  type="button"
                  onClick={() => setBuyNowToast(null)}
                  className="text-xs text-ivory/60 hover:text-ivory ml-auto"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Free Enrollment Success */}
      {enrollSuccessToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-primary text-ivory p-4 sm:p-5 rounded-2xl shadow-xl border border-secondary/40 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h5 className="font-heading text-lg font-bold text-accent">
                Enrolled Successfully!
              </h5>
              <p className="text-xs text-ivory/85 leading-relaxed">
                You now have free lifetime access to &ldquo;{enrollSuccessToast}&rdquo;. Access all study resources and materials in your member portal.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Link
                  to="/account"
                  onClick={() => setEnrollSuccessToast(null)}
                  className="text-xs font-semibold text-accent underline underline-offset-2 hover:text-ivory"
                >
                  Go to My Courses →
                </Link>
                <button
                  type="button"
                  onClick={() => setEnrollSuccessToast(null)}
                  className="text-xs text-ivory/60 hover:text-ivory ml-auto"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Page Header */}
      <section>
        <Container>
          <SectionHeading
            eyebrow="Certified Sacred Academy"
            title="Astrology, Numerology & Tarot Courses"
            subtitle="Explore our comprehensive curriculum of authentic shastric programs, practical remedies, and transformative bundle packages guided by Anushka Yadav."
          />

          {/* Search Box */}
          <div className="max-w-xl mx-auto mt-6 mb-6 px-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-ink/40 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by title or topic..."
                className="w-full pl-11 pr-10 py-3 rounded-full border border-secondary/25 bg-white/90 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 p-1 text-ink/40 hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Horizontally Scrollable Category Filter Chips */}
          <div className="w-full max-w-full overflow-x-auto no-scrollbar py-2 px-1">
            <div className="inline-flex items-center gap-2 min-w-max mx-auto justify-center w-full">
              {categoryChips.map((chip) => {
                const isActive = selectedCategory === chip.name

                return (
                  <button
                    key={chip.name}
                    type="button"
                    onClick={() => setSelectedCategory(chip.name)}
                    className={`py-2 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive
                        ? 'bg-secondary text-ivory shadow-sm'
                        : 'bg-white/80 text-ink/75 hover:text-secondary hover:bg-white border border-secondary/20'
                    }`}
                  >
                    <span>{chip.name}</span>
                    <span
                      className={`ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-ivory/25 text-ivory' : 'bg-mist text-ink/60'
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Jump Link to Free Ebooks (Only rendered when ebooks exist) */}
          {ebooks.length > 0 && (
            <div className="flex justify-center mt-3">
              <a
                href="#ebooks"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('ebooks')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5B3E96] bg-[#EFEAF8] hover:bg-[#E2D9F3] border border-[#5B3E96]/20 transition-all shadow-xs group"
              >
                <span>Free Ebooks</span>
                <span className="text-[12px] font-bold group-hover:translate-y-0.5 transition-transform">↓</span>
              </a>
            </div>
          )}
        </Container>
      </section>

      {/* 3. Responsive Course Grid */}
      <section>
        <Container>
          {loading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin mx-auto mb-3" />
              <p className="text-xs uppercase tracking-wider text-ink/60 font-semibold">
                Loading Sacred Courses...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
                {filteredCourses.map((course) => (
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
                    isEnrolled={enrolledCourseIds.has(course.id)}
                    onViewDetails={() => setSelectedCourse(course)}
                    onBuyNow={() => handleBuyNow(course.title)}
                    onEnrollSuccess={handleEnrollSuccess}
                  />
                ))}
              </div>

              {filteredCourses.length > 0 && (
                <div className="mt-8 pt-4 border-t border-secondary/15 text-center">
                  <p className="text-[11px] sm:text-xs text-ink/65 leading-relaxed">
                    * Non-refundable policy: No refund will be provided in any case.
                  </p>
                </div>
              )}

              {filteredCourses.length === 0 && (
                <div className="text-center py-16 bg-white/80 rounded-3xl border border-secondary/20 p-8 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-mist flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-secondary/60" />
                  </div>
                  <h4 className="font-heading text-lg font-bold text-primary mb-1">
                    No courses found
                  </h4>
                  <p className="text-ink/70 text-xs sm:text-sm">
                    {searchQuery
                      ? `No courses matching "${searchQuery}". Try a different keyword or category.`
                      : 'No courses available in this category.'}
                  </p>
                  {(searchQuery || selectedCategory !== 'All') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCategory('All')
                      }}
                      className="mt-4 text-xs font-semibold text-secondary underline hover:opacity-80"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      {/* 3b. Free Ebooks Section (Rendered ONLY when visible ebooks are available) */}
      {ebooks.length > 0 && (
        <section
          id="ebooks"
          className="py-12 sm:py-20 bg-ivory/60 border-t border-secondary/20 scroll-mt-20"
        >
          <Container>
            {/* Header: Cormorant Garamond heading, gold divider line, eyebrow badge "DOWNLOADS" */}
            <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#5B3E96] bg-[#EFEAF8] border border-[#5B3E96]/20 mb-3">
                DOWNLOADS
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2E2A5C] tracking-tight">
                Free Ebooks
              </h2>
              <div className="w-16 h-0.5 bg-[#C9A227] mx-auto my-3 rounded-full" />
              <p className="text-sm sm:text-base text-[#2B2A3D]/80 max-w-xl mx-auto">
                Download free guides in PDF format. Log in to download.
              </p>
            </div>

            {/* Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {ebooks.map((ebook) => (
                <EbookCard key={ebook.id} ebook={ebook} />
              ))}
            </div>

            {/* Security Notice */}
            <p className="text-center text-xs text-[#2B2A3D]/60 mt-8">
              Your downloads are recorded for security.
            </p>
          </Container>
        </section>
      )}

      {/* 4. Why Study With Us Section */}
      <section className="bg-mist/70 py-12 sm:py-20 border-y border-secondary/15">
        <Container>
          <SectionHeading
            eyebrow="Pedagogical Standard"
            title="Why Learn With Anushka Yadav?"
            subtitle="Classical traditional lineage wisdom combined with modern clinical calculations and ethical guidance."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 rounded-2xl sm:rounded-3xl bg-ivory border border-secondary/15 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-3.5">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="font-heading text-xl font-bold text-primary mb-2">
                Classical Shastra References
              </h4>
              <p className="text-xs sm:text-sm text-ink/75 leading-relaxed">
                Every calculation and principle is grounded in Brihat Parashara Hora Shastra, Jaimini Sutras, Lal Kitab, and authentic lineage sources.
              </p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-3xl bg-ivory border border-secondary/15 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-accent flex items-center justify-center mx-auto mb-3.5">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h4 className="font-heading text-xl font-bold text-primary mb-2">
                Practical Real-World Application
              </h4>
              <p className="text-xs sm:text-sm text-ink/75 leading-relaxed">
                Analyze genuine live case studies, participate in interactive chart discussions, and master remedies without superstition.
              </p>
            </div>

            <div className="p-6 rounded-2xl sm:rounded-3xl bg-ivory border border-secondary/15 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-cta flex items-center justify-center mx-auto mb-3.5">
                <Award className="w-6 h-6 text-cta" />
              </div>
              <h4 className="font-heading text-xl font-bold text-primary mb-2">
                Recognized Certification
              </h4>
              <p className="text-xs sm:text-sm text-ink/75 leading-relaxed">
                Receive an authentic certificate recognizing your accomplishment upon passing the course evaluation.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Course Details Modal */}
      {selectedCourse && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-primary/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-ivory rounded-3xl border border-secondary/25 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-mist pb-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="bg-secondary text-ivory text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {selectedCourse.category}
                  </span>
                  {selectedCourse.is_package && (
                    <span className="bg-[#EFEAF8] text-[#5B3E96] text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#5B3E96]/30">
                      Package Course
                    </span>
                  )}
                  {selectedCourse.level && (
                    <span className="bg-[#C9A227] text-[#1E1B4B] text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {selectedCourse.level}
                    </span>
                  )}
                </div>
                <h3
                  id="course-modal-title"
                  className="font-heading text-2xl sm:text-3xl font-bold text-primary"
                >
                  {selectedCourse.title}
                </h3>
                <p className="text-xs text-secondary font-medium mt-1">
                  Instructor: {selectedCourse.instructor || 'Anushka Yadav'}
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSelectedCourse(null)}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full bg-mist hover:bg-secondary/20 flex items-center justify-center text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
              >
                <X className="w-5 h-5 text-secondary" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs sm:text-sm text-ink/85 leading-relaxed">
              <p>{selectedCourse.description}</p>

              {/* If Package: Show Included Courses List */}
              {selectedCourse.is_package && (
                <div className="p-4 rounded-2xl bg-white border border-[#5B3E96]/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary">
                    <Layers className="w-4 h-4 text-accent" />
                    <span>This package includes:</span>
                  </div>

                  {selectedCourse.bundle_items && selectedCourse.bundle_items.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {selectedCourse.bundle_items.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-start gap-2 text-xs sm:text-sm">
                          <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          <span className="font-medium text-ink">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink/70">
                      Curated 4-course master program curriculum.
                    </p>
                  )}
                </div>
              )}

              {/* Pricing strip in modal */}
              <div className="flex items-baseline justify-between p-4 rounded-2xl bg-white/80 border border-secondary/15">
                <div>
                  <span className="text-[11px] text-ink/60 uppercase block font-medium">Fee</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    {selectedCourse.price === 0 ? (
                      <span className="font-heading text-2xl font-bold text-[#5B3E96]">Free</span>
                    ) : (
                      <span className="font-heading text-2xl font-bold text-primary">
                        ₹{selectedCourse.price.toLocaleString('en-IN')}
                      </span>
                    )}

                    {selectedCourse.original_price && selectedCourse.original_price > selectedCourse.price && (
                      <span className="text-sm text-[#2B2A3D]/50 line-through">
                        ₹{selectedCourse.original_price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {selectedCourse.discount_percent != null && selectedCourse.discount_percent > 0 && (
                  <span className="bg-[#F8E7A2] text-[#1E1B4B] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                    Save {selectedCourse.discount_percent}%
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-mist flex flex-col sm:flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedCourse(null)}
                className="w-full sm:w-auto border-secondary/30 text-secondary hover:bg-mist justify-center"
              >
                Close
              </Button>

              {enrolledCourseIds.has(selectedCourse.id) ? (
                <Link to="/account" className="w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="cta"
                    size="md"
                    className="w-full sm:w-auto justify-center gap-1.5"
                  >
                    <span>Go to My Courses</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : selectedCourse.price === 0 ? (
                <Button
                  type="button"
                  variant="cta"
                  size="md"
                  onClick={() => {
                    const cTitle = selectedCourse.title
                    setSelectedCourse(null)
                    if (!user) {
                      navigate('/login?redirect=/courses')
                    } else {
                      api
                        .post(`/api/courses/${selectedCourse.id}/enroll-free`, {})
                        .then(() => handleEnrollSuccess(cTitle))
                        .catch(console.error)
                    }
                  }}
                  className="w-full sm:w-auto justify-center"
                >
                  Enroll Free
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="cta"
                  size="md"
                  onClick={() => {
                    const cTitle = selectedCourse.title
                    setSelectedCourse(null)
                    handleBuyNow(cTitle)
                  }}
                  className="w-full sm:w-auto justify-center"
                >
                  Buy Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Courses
