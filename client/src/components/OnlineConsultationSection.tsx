import React from 'react'
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import Container from './Container'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { onlineConsultationContent } from '../data/onlineConsultationContent'

interface OnlineConsultationSectionProps {
  consultation?: {
    fee: number
    duration_minutes: number
    session_mode: string
  }
  onBook?: () => void
}

export const OnlineConsultationSection: React.FC<OnlineConsultationSectionProps> = ({
  consultation = {
    fee: 3000,
    duration_minutes: 45,
    session_mode: '1-on-1 Private Audio / Video Call',
  },
  onBook,
}) => {
  const { settings } = useSiteSettings()
  const astrologerName = settings.about_name?.trim() || 'Anushka Yadav'

  const whyChoosePoints = Array.isArray(settings.why_choose_points)
    ? settings.why_choose_points.filter((pt) => pt.title?.trim() && pt.description?.trim())
    : []

  const hasWhyChoose = whyChoosePoints.length > 0

  const { section1, section2, section3, section4, tarotSection } = onlineConsultationContent

  // Replace {name} placeholder
  const section3Heading = section3.headingTemplate.replace('{name}', astrologerName)
  const section3Intro = section3.introTemplate.replace('{name}', astrologerName)
  const section4Heading = section4.headingTemplate.replace('{name}', astrologerName)
  const tarotHeading = tarotSection.headingTemplate.replace('{name}', astrologerName)
  const tarotParagraphs = tarotSection.paragraphsTemplate.map((p) =>
    p.replace(/{name}/g, astrologerName)
  )

  return (
    <section
      aria-labelledby="online-consultation-heading"
      className="bg-[#FAF7F2] py-12 sm:py-16 md:py-20 border-b border-[#5B3E96]/15"
    >
      <Container className="max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEAF8] border border-[#5B3E96]/20 text-[11px] font-bold uppercase tracking-wider text-[#5B3E96] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Virtual Vedic Sanctuary</span>
          </div>

          <h2
            id="online-consultation-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-[#2E2A5C] leading-tight"
          >
            Thoughtful &amp; Personalized Online Guidance
          </h2>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/75 mt-2 leading-relaxed max-w-xl mx-auto">
            Experience authentic Vedic consultations designed around your personal horoscope,
            delivered with confidentiality, comfort, and care.
          </p>
        </div>

        {/* Stacked Full-Width Article-Style Sections */}
        <div className="w-full space-y-6 sm:space-y-8">
          {/* SECTION 1: Why Choose an Online Astrologer? */}
          <article className="rounded-2xl md:rounded-3xl bg-white border border-[#5B3E96]/15 p-6 sm:p-8 md:p-10 shadow-xs">
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-[#2E2A5C]">
              {section1.heading}
            </h3>
            <div className="h-0.5 w-12 bg-[#C9A227] rounded-full my-3 sm:my-3.5" />

            <div className="text-base md:text-[1.075rem] leading-8 text-[#2B2A3D] space-y-4">
              {section1.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </article>

          {/* SECTION 2: Why Are More People Turning to Online Consultations? (Mist / Lavender Background) */}
          <article className="rounded-2xl md:rounded-3xl bg-[#EFEAF8]/40 border border-[#5B3E96]/20 p-6 sm:p-8 md:p-10 shadow-xs">
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-[#2E2A5C]">
              {section2.heading}
            </h3>
            <div className="h-0.5 w-12 bg-[#C9A227] rounded-full my-3 sm:my-3.5" />

            <div className="text-base md:text-[1.075rem] leading-8 text-[#2B2A3D] space-y-4 mb-6">
              {section2.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Bullets: 2 columns on md+, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 pt-2">
              {section2.bullets.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-1" />
                  <span className="text-sm md:text-[0.95rem] text-[#2B2A3D] leading-relaxed">
                    <strong className="font-semibold text-[#2E2A5C] mr-1">{b.lead}</strong>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
          </article>

          {/* SECTION 3: Benefits of an Online Consultation with {name} */}
          <article className="rounded-2xl md:rounded-3xl bg-white border border-[#5B3E96]/15 p-6 sm:p-8 md:p-10 shadow-xs">
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-[#2E2A5C]">
              {section3Heading}
            </h3>
            <div className="h-0.5 w-12 bg-[#C9A227] rounded-full my-3 sm:my-3.5" />

            <p className="text-base md:text-[1.075rem] leading-8 text-[#2B2A3D] mb-6">
              {section3Intro}
            </p>

            {/* Bullets: 2 columns on md+, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 pt-2">
              {section3.bullets.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-1" />
                  <span className="text-sm md:text-[0.95rem] text-[#2B2A3D] leading-relaxed">
                    <strong className="font-semibold text-[#2E2A5C] mr-1">{b.lead}</strong>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>

            <p className="italic text-xs sm:text-sm text-[#2B2A3D]/70 pt-4 border-t border-[#5B3E96]/10 mt-6">
              {section3.closingLine}
            </p>
          </article>

          {/* SECTION 4: Why Choose {name}? (Rendered ONLY if why_choose_points is non-empty) */}
          {hasWhyChoose && (
            <article className="rounded-2xl md:rounded-3xl bg-white border border-[#5B3E96]/15 p-6 sm:p-8 md:p-10 shadow-xs">
              <h3 className="font-heading font-bold text-2xl md:text-3xl text-[#2E2A5C]">
                {section4Heading}
              </h3>
              <div className="h-0.5 w-12 bg-[#C9A227] rounded-full my-3 sm:my-3.5" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-2">
                {whyChoosePoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-[#2E2A5C] text-sm md:text-[0.95rem] leading-snug">
                        {point.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#2B2A3D]/80 leading-relaxed mt-1">
                        {point.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* SECTION: Intuitive Tarot Card Guidance with {name} */}
          <article className="rounded-2xl md:rounded-3xl bg-white border border-[#5B3E96]/15 p-6 sm:p-8 md:p-10 shadow-xs">
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-[#2E2A5C]">
              {tarotHeading}
            </h3>
            <div className="h-0.5 w-12 bg-[#C9A227] rounded-full my-3 sm:my-3.5" />

            <div className="text-base md:text-[1.075rem] leading-8 text-[#2B2A3D] space-y-4 mb-6">
              {tarotParagraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Bullets: 2 columns on md+, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 pt-2">
              {tarotSection.bullets.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-1" />
                  <span className="text-sm md:text-[0.95rem] text-[#2B2A3D] leading-relaxed">
                    <strong className="font-semibold text-[#2E2A5C] mr-1">{b.lead}</strong>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
          </article>

          {/* SECTION: 1-on-1 Comprehensive Session (Private Consultation Package) */}
          <article
            id="book-consultation"
            className="scroll-mt-24 rounded-2xl md:rounded-3xl bg-white border border-[#5B3E96]/20 shadow-md overflow-hidden"
          >
            {/* Header Strip */}
            <div className="bg-[#2E2A5C] text-[#FBF7EE] p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-[#C9A227] text-[11px] sm:text-xs uppercase tracking-widest font-semibold block mb-1">
                  Private Consultation Package
                </span>
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#FBF7EE]">
                  1-on-1 Comprehensive Session
                </h3>
                <p className="text-[#FBF7EE]/80 text-xs sm:text-sm mt-1">
                  {consultation.session_mode}
                </p>
              </div>

              <div className="bg-[#5B3E96]/50 p-4 rounded-2xl border border-[#5B3E96]/60 text-left md:text-right shrink-0">
                <span className="text-xs text-[#FBF7EE]/70 block">Consultation Fee</span>
                <div className="text-3xl sm:text-4xl font-heading font-bold text-[#C9A227]">
                  ₹{consultation.fee.toLocaleString('en-IN')}
                </div>
                <span className="text-xs text-[#FBF7EE]/70 block mt-0.5">
                  Duration: {consultation.duration_minutes} Minutes
                </span>
              </div>
            </div>

            {/* Inclusions & Book CTA */}
            <div className="p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm text-[#2B2A3D]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                  <span>Full birth chart (Lagna, Moon, Navamsha) analysis</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                  <span>Driver, Conductor, & Name vibration report</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                  <span>Dasha timing for career, wealth, and relationship</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                  <span>Actionable Vedic remedies & gemstone recommendations</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={onBook}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#2E2A5C] text-[#FBF7EE] font-semibold text-sm hover:bg-[#3C3775] transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>Book Your Consultation</span>
                  <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  )
}

export default OnlineConsultationSection
