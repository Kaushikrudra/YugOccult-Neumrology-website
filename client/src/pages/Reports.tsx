import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Sparkles,
  Search,
  X,
  Calendar,
  Clock,
  Shield,
  Loader2,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react'
import Container from '../components/Container'
import SectionHeading from '../components/SectionHeading'
import ReportCard from '../components/ReportCard'
import { Report } from '../types/report'
import { REPORT_SECTIONS } from '../data/reportSections'
import { api } from '../lib/api'

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      try {
        setLoading(true)
        const res = await api.get<{ reports: Report[] }>('/api/reports')
        if (isMounted && res?.reports) {
          setReports(res.reports)
        }
      } catch (err) {
        console.error('[Reports:Load] Failed to load reports:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadReports()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredReports = reports.filter((rep) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const matchTitle = rep.title.toLowerCase().includes(q)
    const matchTagline = rep.tagline ? rep.tagline.toLowerCase().includes(q) : false
    const matchDesc = rep.description ? rep.description.toLowerCase().includes(q) : false
    return matchTitle || matchTagline || matchDesc
  })

  // Group filtered reports by section
  const personalizedReports = filteredReports.filter((r) => (r.section || 'personalized') === 'personalized')
  const additionalReports = filteredReports.filter((r) => r.section === 'additional')

  const sectionsData = REPORT_SECTIONS.map((sec) => ({
    ...sec,
    reports: sec.key === 'personalized' ? personalizedReports : additionalReports,
  })).filter((sec) => sec.reports.length > 0)

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 sm:pb-24 pt-4 sm:pt-8 min-w-0">
      {/* 1. Page Header */}
      <section>
        <Container>
          <SectionHeading
            eyebrow="Personalised Astrological & Numerological Solutions"
            title="Personalised Reports, Prepared for You"
            subtitle="Choose a report, share your details, and receive a report prepared for you."
          />

          {/* Key Value Highlights */}
          <div className="max-w-4xl mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-secondary/15 shadow-xs">
              <Sparkles className="w-5 h-5 text-[#C9A227] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#2E2A5C]">100% Handcrafted</p>
              <p className="text-[11px] text-ink/70">No automated bot text</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-secondary/15 shadow-xs">
              <Calendar className="w-5 h-5 text-[#5B3E96] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#2E2A5C]">Vedic & Numerology</p>
              <p className="text-[11px] text-ink/70">Rigorous calculations</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-secondary/15 shadow-xs">
              <Clock className="w-5 h-5 text-[#C9A227] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#2E2A5C]">2-7 Days Delivery</p>
              <p className="text-[11px] text-ink/70">Fast & confidential</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-secondary/15 shadow-xs">
              <Shield className="w-5 h-5 text-[#5B3E96] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#2E2A5C]">PDF Document</p>
              <p className="text-[11px] text-ink/70">Permanent lifetime copy</p>
            </div>
          </div>

          {/* Search Box & Anchor Chips (rendered when reports exist) */}
          {reports.length > 0 && (
            <div className="max-w-2xl mx-auto mt-8 px-2 space-y-4">
              {/* Search Box */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-ink/40 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search personalised reports..."
                  className="w-full pl-11 pr-10 py-3 rounded-full border border-secondary/25 bg-white text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 shadow-xs transition-all"
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

              {/* Anchor Navigation Chips for Visible Sections */}
              {sectionsData.length > 0 && (
                <div className="w-full overflow-x-auto no-scrollbar py-1">
                  <div className="flex items-center justify-center gap-2.5 min-w-max mx-auto px-1">
                    {sectionsData.map((sec) => (
                      <button
                        key={sec.key}
                        type="button"
                        onClick={() => scrollToSection(sec.key)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/25 bg-white hover:bg-mist text-xs sm:text-sm font-semibold text-[#2E2A5C] shadow-2xs hover:shadow-xs transition-all active:scale-95"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#C9A227]" />
                        <span>{sec.title}</span>
                        <span className="text-[11px] font-normal text-ink/60 bg-mist px-1.5 py-0.2 rounded-full">
                          {sec.reports.length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>
      </section>

      {/* 2. Reports Sections / Empty State */}
      <section>
        <Container>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-[#5B3E96] animate-spin mb-4" />
              <p className="text-sm font-medium text-ink/70">Loading personalised reports...</p>
            </div>
          ) : reports.length === 0 ? (
            /* Empty State */
            <div className="max-w-xl mx-auto py-16 px-6 text-center bg-white rounded-3xl border border-secondary/20 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-mist flex items-center justify-center mx-auto mb-4 border border-secondary/20 text-[#5B3E96]">
                <FileText className="w-8 h-8 text-[#C9A227]" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#2B2A3D] mb-2">
                Personalised Reports Coming Soon
              </h3>
              <p className="text-sm text-ink/75 leading-relaxed mb-6">
                Our personalised astrology and numerology reports are currently being prepared. Check back soon or book a direct, one-on-one consultation with Anushka Yadav for immediate personalized guidance.
              </p>
              <Link
                to="/consultation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cta text-ivory font-semibold text-sm hover:opacity-95 shadow-md active:scale-95 transition-all"
              >
                <span>Book a Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : filteredReports.length === 0 ? (
            /* Search yielded no results */
            <div className="max-w-md mx-auto py-12 px-6 text-center bg-white rounded-2xl border border-secondary/20">
              <HelpCircle className="w-10 h-10 text-ink/40 mx-auto mb-3" />
              <h4 className="font-heading text-lg font-bold text-[#2B2A3D] mb-1">
                No reports found
              </h4>
              <p className="text-xs text-ink/70 mb-4">
                We couldn't find any reports matching &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-[#5B3E96] underline hover:text-[#2E2A5C]"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            /* 2 Distinct Sections */
            <div className="space-y-16 sm:space-y-20">
              {sectionsData.map((sec) => (
                <div key={sec.key} id={sec.key} className="scroll-mt-28 space-y-8">
                  {/* Section Heading with Cormorant Garamond / font-heading & Gold Divider */}
                  <div className="text-center max-w-2xl mx-auto">
                    <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#2E2A5C] tracking-wide">
                      {sec.title}
                    </h2>
                    <div className="w-16 h-0.5 bg-[#C9A227] mx-auto mt-2.5 mb-2.5 rounded-full" />
                    <p className="text-xs sm:text-sm text-ink/70">
                      {sec.subtitle}
                    </p>
                  </div>

                  {/* Section Grid: 1 col mobile, 2 tablet, 3 desktop, 4 wide desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                    {sec.reports.map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Bottom Notice & Guidance */}
              <div className="pt-8 border-t border-secondary/15 space-y-2 max-w-3xl mx-auto text-center">
                <p className="text-xs font-semibold text-[#5B3E96]">
                  Reports are personalised. Please share accurate details.
                </p>

                <p className="text-[11px] sm:text-xs text-ink/65 leading-relaxed flex items-center justify-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                  <span>
                    Astrology offers guidance and perspective. It is not a substitute for professional medical, legal or financial advice.
                  </span>
                </p>

                <p className="text-[11px] sm:text-xs text-ink/65 leading-relaxed">
                  Non-refundable policy: No refund will be provided in any case.
                </p>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* 3. How It Works Section */}
      <section className="bg-mist/40 py-12 sm:py-16 border-y border-secondary/15">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2A3D]">
              How Your Personalised Report is Prepared
            </h2>
            <p className="text-xs sm:text-sm text-ink/75 mt-2">
              Unlike generic computer-generated printouts, every report at Yug Skill Institute is crafted with individualized precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-secondary/15 shadow-xs relative">
              <div className="w-9 h-9 rounded-full bg-[#5B3E96] text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h4 className="font-heading text-lg font-bold text-[#2B2A3D] mb-2">
                Order & Details
              </h4>
              <p className="text-xs text-ink/80 leading-relaxed">
                Choose your desired report and submit your details. Add any specific questions or focus areas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-secondary/15 shadow-xs relative">
              <div className="w-9 h-9 rounded-full bg-[#C9A227] text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h4 className="font-heading text-lg font-bold text-[#2B2A3D] mb-2">
                Share Your Details
              </h4>
              <p className="text-xs text-ink/80 leading-relaxed">
                Anushka Yadav and our seasoned Vedic researchers analyze your submitted details, planetary alignments, and numerological grids step-by-step.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-secondary/15 shadow-xs relative">
              <div className="w-9 h-9 rounded-full bg-[#2E2A5C] text-white flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h4 className="font-heading text-lg font-bold text-[#2B2A3D] mb-2">
                Secure PDF Delivery
              </h4>
              <p className="text-xs text-ink/80 leading-relaxed">
                Your polished, personalized PDF document is compiled and delivered directly to your WhatsApp and email within 2 to 7 business days.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default Reports
