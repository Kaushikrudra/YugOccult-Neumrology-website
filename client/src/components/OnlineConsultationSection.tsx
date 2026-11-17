import React from 'react'
import {
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import Container from './Container'

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
  return (
    <section
      aria-labelledby="book-consultation"
      className="bg-[#FAF7F2] py-8 sm:py-12 border-b border-[#5B3E96]/15"
    >
      <Container className="max-w-7xl">
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
                <span>Driver, Conductor, &amp; Name vibration report</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <span>Dasha timing for career, wealth, and relationship</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <span>Actionable Vedic remedies &amp; gemstone recommendations</span>
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
      </Container>
    </section>
  )
}

export default OnlineConsultationSection
