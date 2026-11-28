import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Clock,
  Award,
  Sparkles,
  Compass,
  Layers,
  CheckCircle,
  BookOpen,
  Heart,
  Flame,
  ArrowRight,
  Briefcase,
  Brain,
  Lightbulb,
  Crown,
} from 'lucide-react'
import Button from './Button'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export interface BundleItemRef {
  id: string
  title: string
}

export interface CourseCardProps {
  id: string
  slug?: string
  title: string
  description: string
  price: number
  original_price?: number | null
  discount_percent?: number | null
  duration?: string | null
  level?: string | null
  imageUrl?: string | null
  category?: string
  instructor?: string
  is_package?: boolean
  bundle_items?: BundleItemRef[] | null
  isEnrolled?: boolean
  onSelect?: () => void
  onViewDetails?: () => void
  onBuyNow?: () => void
  onEnrollSuccess?: (courseTitle: string) => void
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  description,
  price,
  original_price,
  discount_percent,
  duration,
  level,
  imageUrl,
  category,
  instructor = 'Anushka Yadav',
  is_package = false,
  bundle_items = [],
  isEnrolled = false,
  onSelect,
  onViewDetails,
  onBuyNow,
  onEnrollSuccess,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [enrolling, setEnrolling] = useState(false)
  const [justEnrolled, setJustEnrolled] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const isFree = price === 0
  const isUserEnrolled = isEnrolled || justEnrolled

  // Category Icon helper for inline SVG placeholder
  const getCategoryIcon = () => {
    switch (category) {
      case 'Packages':
        return <Layers className="w-6 h-6 text-accent" />
      case 'Tarot':
        return <Sparkles className="w-6 h-6 text-accent" />
      case 'Astrology':
        return <Sparkles className="w-6 h-6 text-secondary" />
      case 'Numerology':
        return <Compass className="w-6 h-6 text-accent" />
      case 'Vastu':
        return <Compass className="w-6 h-6 text-secondary" />
      case 'Manifestation':
        return <Flame className="w-6 h-6 text-accent" />
      case 'Healing':
        return <Heart className="w-6 h-6 text-accent" />
      case 'Remedies':
        return <Award className="w-6 h-6 text-accent" />
      case 'Switchwords':
        return <BookOpen className="w-6 h-6 text-secondary" />
      case 'Business':
        return <Briefcase className="w-6 h-6 text-accent" />
      case 'NLP':
        return <Brain className="w-6 h-6 text-secondary" />
      case 'Life Skill':
        return <Lightbulb className="w-6 h-6 text-accent" />
      case 'Membership':
        return <Crown className="w-6 h-6 text-accent" />
      default:
        return <Sparkles className="w-6 h-6 text-accent" />
    }
  }

  // Handle Free Enrollment
  const handleEnrollFree = async () => {
    setEnrollError(null)

    if (!user) {
      // Redirect to login, then come back to current page
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }

    try {
      setEnrolling(true)
      await api.post(`/api/courses/${id}/enroll-free`, {})
      setJustEnrolled(true)
      if (onEnrollSuccess) {
        onEnrollSuccess(title)
      }
    } catch (err: any) {
      console.error('Free enrollment failed:', err)
      setEnrollError(err?.message || 'Enrollment could not be completed. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <article className="bg-white/95 rounded-2xl border border-secondary/15 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1">
      {/* Course Image or Spiritual Gradient Placeholder */}
      <div className="relative h-44 sm:h-48 w-full bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#3B2A70] border-b border-[#C9A227]/30 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center relative select-none">
            {/* Subtle sacred ambient geometric background pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
              viewBox="0 0 200 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="100" cy="60" r="50" stroke="#C9A227" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="100" cy="60" r="35" stroke="#EFEAF8" strokeWidth="1" />
              <circle cx="100" cy="60" r="20" stroke="#C9A227" strokeWidth="0.75" />
            </svg>

            {/* Sacred Emblem Circle */}
            <div className="w-12 h-12 rounded-full bg-ivory/10 backdrop-blur-md flex items-center justify-center shadow-xs mb-2 border border-[#C9A227]/40 relative z-10 group-hover:scale-110 transition-transform">
              {getCategoryIcon()}
            </div>

            <span className="font-heading text-base sm:text-lg text-ivory font-bold line-clamp-2 px-2 relative z-10 hero-text-shadow">
              {title}
            </span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {category && (
              <span className="bg-ivory/95 backdrop-blur-xs text-secondary border border-secondary/20 text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-semibold shadow-xs">
                {category}
              </span>
            )}
            {is_package && (
              <span className="bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/30 text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                Package{bundle_items && bundle_items.length > 0 ? ` · ${bundle_items.length} courses` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {isFree && (
              <span className="bg-[#5B3E96] text-[#FBF7EE] text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                Free
              </span>
            )}
            {level && (
              <span className="bg-[#C9A227] text-[#1E1B4B] text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                {level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading text-lg sm:text-xl font-bold text-primary mb-1.5 line-clamp-2 group-hover:text-secondary transition-colors">
            {title}
          </h3>

          <p className="text-ink/80 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-2">
            {description}
          </p>

          {/* Instructor & Meta info */}
          <div className="flex items-center justify-between gap-2 text-xs text-ink/70 mb-3 pb-3 border-b border-mist">
            <span className="truncate font-medium text-secondary">
              Instructor: {instructor}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold text-[#5B3E96] bg-[#EFEAF8] px-2 py-0.5 rounded-full">
                1-Yr Access
              </span>
              {duration && (
                <span className="hidden sm:flex items-center gap-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{duration}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Actions */}
        <div className="pt-1">
          {/* Price Strip with Discount */}
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              {isFree ? (
                <span className="font-heading text-xl sm:text-2xl font-bold text-[#5B3E96]">
                  Free
                </span>
              ) : (
                <span className="font-heading text-xl sm:text-2xl font-bold text-primary">
                  ₹{price.toLocaleString('en-IN')}
                </span>
              )}

              {original_price && original_price > price && (
                <span className="text-xs sm:text-sm text-[#2B2A3D]/50 line-through font-normal">
                  ₹{original_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {discount_percent != null && discount_percent > 0 && (
              <span className="bg-[#F8E7A2] text-[#1E1B4B] text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                Save {discount_percent}%
              </span>
            )}
          </div>

          {/* Inline notification if free enrollment completed */}
          {justEnrolled && (
            <div className="mb-2.5 p-2 rounded-xl bg-mist text-[#2E2A5C] text-xs flex items-center justify-between gap-1.5 animate-in fade-in">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                <span>Enrolled! Find it in My Courses</span>
              </span>
              <Link to="/account" className="font-bold underline text-secondary shrink-0">
                View
              </Link>
            </div>
          )}

          {enrollError && (
            <div className="mb-2.5 p-2 rounded-xl bg-mist text-[#5B3E96] text-xs leading-tight animate-in fade-in">
              {enrollError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewDetails || onSelect}
              className="w-full text-xs px-2 sm:px-3 py-2 border-secondary/30 text-secondary hover:bg-mist justify-center"
            >
              View Details
            </Button>

            {isUserEnrolled ? (
              <Link to="/account" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs px-2 sm:px-3 py-2 bg-mist text-secondary border-secondary/30 hover:bg-mist/80 justify-center gap-1"
                >
                  <span>My Courses</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            ) : isFree ? (
              <Button
                type="button"
                variant="cta"
                size="sm"
                disabled={enrolling}
                onClick={handleEnrollFree}
                className="w-full text-xs px-2 sm:px-3 py-2 justify-center"
              >
                {enrolling ? 'Enrolling...' : 'Enroll Free'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="cta"
                size="sm"
                onClick={onBuyNow}
                className="w-full text-xs px-2 sm:px-3 py-2 justify-center"
              >
                Buy Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default CourseCard
