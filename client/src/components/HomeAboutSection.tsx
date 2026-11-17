import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  BookOpen,
  Target,
  Compass,
  Quote,
  ArrowRight,
} from 'lucide-react'
import Container from './Container'
import Button from './Button'
import { homeAboutData } from '../data/homeAbout'

export const HomeAboutSection: React.FC = () => {
  const [imageError, setImageError] = useState(false)

  return (
    <section
      aria-labelledby="home-about-heading"
      className="bg-ivory py-16 md:py-24 border-b border-secondary/15 relative z-20"
    >
      <Container className="max-w-7xl">
        {/* Top Row: Landscape Photo (Left 5/12) + Narrative (Right 7/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-14 md:mb-18">
          {/* Photo Frame Column */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-lg aspect-[3/2] rounded-2xl p-1.5 border border-[#C9A227]/60 bg-white/40 backdrop-blur-xs shadow-[0_12px_28px_-6px_rgba(46,42,92,0.18)]">
              <div className="w-full h-full rounded-xl overflow-hidden border border-[#C9A227]/80 relative bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#1E1B4B]">
                {!imageError ? (
                  <img
                    src={homeAboutData.photoUrl}
                    alt={homeAboutData.photoAlt}
                    width={1536}
                    height={1024}
                    loading="lazy"
                    decoding="async"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-ivory">
                    <Sparkles className="w-8 h-8 text-[#C9A227] mb-2" />
                    <span className="font-heading text-xl font-bold text-[#FBF7EE]">
                      Anushka Yadav
                    </span>
                    <span className="text-xs text-accent uppercase tracking-wider mt-1">
                      Spiritual Guide &amp; Coach
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Narrative Column */}
          <div className="lg:col-span-7 space-y-4 md:space-y-5">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-semibold uppercase tracking-wider text-secondary">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{homeAboutData.eyebrow}</span>
            </div>

            {/* Heading with Soft Gold Divider */}
            <div>
              <h2
                id="home-about-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-primary leading-tight"
              >
                {homeAboutData.heading}
              </h2>
              <div className="h-0.5 w-16 bg-[#C9A227] rounded-full mt-3" />
            </div>

            {/* Introduction Paragraph */}
            <p className="text-ink text-base md:text-lg leading-8 font-normal">
              {homeAboutData.aboutParagraph}
            </p>
          </div>
        </div>

        {/* 3 Pillars Grid: Desktop 3 cols, Tablet 2 cols (3rd card spans 2 cols), Mobile 1 col */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-14 md:mb-18">
          {/* Card 1: A Voice of Knowledge & Inspiration */}
          <div className="bg-white rounded-2xl border border-secondary/15 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-mist flex items-center justify-center mb-5 border border-secondary/20 shadow-2xs">
                <BookOpen className="w-6 h-6 text-[#C9A227]" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary mb-3">
                {homeAboutData.cards.card1.heading}
              </h3>
              <p className="text-ink/85 text-xs sm:text-sm leading-7">
                {homeAboutData.cards.card1.text}
              </p>
            </div>
          </div>

          {/* Card 2: Mission & Vision */}
          <div className="bg-white rounded-2xl border border-secondary/15 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-mist flex items-center justify-center mb-5 border border-secondary/20 shadow-2xs">
                <Target className="w-6 h-6 text-[#C9A227]" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary mb-4">
                {homeAboutData.cards.card2.heading}
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A227] block mb-1">
                    {homeAboutData.cards.card2.missionLabel}
                  </span>
                  <p className="text-ink/85 text-xs sm:text-sm leading-7">
                    {homeAboutData.cards.card2.missionText}
                  </p>
                </div>
                <div className="pt-3 border-t border-mist">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A227] block mb-1">
                    {homeAboutData.cards.card2.visionLabel}
                  </span>
                  <p className="text-ink/85 text-xs sm:text-sm leading-7">
                    {homeAboutData.cards.card2.visionText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Your Journey Starts Here */}
          <div className="bg-white rounded-2xl border border-secondary/15 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div>
              <div className="w-12 h-12 rounded-xl bg-mist flex items-center justify-center mb-5 border border-secondary/20 shadow-2xs">
                <Compass className="w-6 h-6 text-[#C9A227]" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary mb-3">
                {homeAboutData.cards.card3.heading}
              </h3>
              <p className="text-ink/85 text-xs sm:text-sm leading-7">
                {homeAboutData.cards.card3.text}
              </p>
            </div>
          </div>
        </div>

        {/* Closing Quote Band & Dual CTAs (Compact & Elegant) */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#251A4A] border-2 border-[#C9A227] p-6 sm:p-8 md:p-9 text-center max-w-2xl lg:max-w-3xl mx-auto shadow-xl">
          {/* Subtle Celestial Ambient Glow */}
          <div
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(201,162,39,0.15)_0%,_transparent_75%)]"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-[#C9A227]/40 text-[#C9A227] text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-[#C9A227]" />
              <span>Sacred Guidance &amp; Wisdom</span>
            </div>

            <Quote className="w-6 h-6 sm:w-7 sm:h-7 text-[#C9A227] mx-auto opacity-90 drop-shadow-sm" />

            <blockquote className="font-heading text-base sm:text-lg md:text-xl text-white font-medium leading-relaxed max-w-2xl mx-auto">
              &ldquo;{homeAboutData.closingQuote}&rdquo;
            </blockquote>

            {/* Attribution */}
            <div className="pt-1 flex flex-col items-center justify-center">
              <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent mb-1.5" />
              <p className="font-heading text-sm sm:text-base font-bold text-[#C9A227] tracking-wide">
                — by Anushka Yadav
              </p>
              <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider mt-0.5 font-medium">
                Founder &amp; Mentor, Yug Skill Institute
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-1.5 flex items-center justify-center">
              <Link to={homeAboutData.secondaryCtaLink} className="w-full sm:w-auto">
                <Button
                  variant="cta"
                  size="md"
                  className="w-full sm:w-auto px-6 sm:px-7 py-2.5 sm:py-3 font-semibold shadow-md shadow-cta/25 gap-2 text-xs sm:text-sm"
                >
                  <span>{homeAboutData.secondaryCtaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default HomeAboutSection
