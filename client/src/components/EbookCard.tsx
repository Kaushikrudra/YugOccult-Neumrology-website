import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Download, FileText, Loader2, Sparkles } from 'lucide-react'
import { Ebook } from '../types/ebook'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'

interface EbookCardProps {
  ebook: Ebook
}

export const EbookCard: React.FC<EbookCardProps> = ({ ebook }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0.0 MB'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const handleDownload = async () => {
    if (downloading) return
    setDownloadError(null)

    // 1. Logged-out user redirection
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/courses#ebooks')}`)
      return
    }

    // 2. Logged-in user download flow
    try {
      setDownloading(true)
      const res = await api.post<{ url: string }>(`/api/ebooks/${ebook.id}/download`, {})

      if (res?.url) {
        // Trigger secure browser download
        const a = document.createElement('a')
        a.href = res.url
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.download = ''
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        throw new Error('No download link was received from server.')
      }
    } catch (err: any) {
      console.error('[EbookCard:Download] Error:', err)
      const status = (err as ApiError)?.status || (err as any)?.statusCode
      if (status === 501) {
        setDownloadError('Downloads are not available right now')
      } else if (status === 402) {
        setDownloadError('This ebook is not available yet')
      } else {
        setDownloadError(err?.message || 'Download could not be initiated. Please try again.')
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <article className="bg-white/95 rounded-2xl border border-secondary/15 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1">
      {/* Ebook Cover Image or Spiritual Indigo-Violet Gradient Placeholder */}
      <div className="relative h-48 sm:h-52 w-full bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#3B2A70] border-b border-[#C9A227]/30 overflow-hidden flex items-center justify-center">
        {ebook.cover_image_url ? (
          <img
            src={ebook.cover_image_url}
            alt={ebook.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center relative select-none">
            {/* Sacred geometric ring pattern */}
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

            {/* Sacred Book Emblem */}
            <div className="w-13 h-13 rounded-full bg-ivory/10 backdrop-blur-md flex items-center justify-center shadow-xs mb-2 border border-[#C9A227]/40 relative z-10 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-[#C9A227]" />
            </div>

            <span className="font-heading text-base sm:text-lg text-ivory font-bold line-clamp-2 px-3 relative z-10 hero-text-shadow">
              {ebook.title}
            </span>
          </div>
        )}

        {/* Top Badges (Free + PDF) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/30 shadow-xs">
            Free
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2E2A5C]/80 backdrop-blur-sm text-[#FBF7EE] border border-[#C9A227]/40">
            PDF
          </span>
        </div>

        {/* File Size Badge */}
        <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#2E2A5C]/80 backdrop-blur-sm text-ivory/90 border border-[#C9A227]/30 flex items-center gap-1 z-20">
          <FileText className="w-3 h-3 text-[#C9A227]" />
          <span>{formatFileSize(ebook.size_bytes)}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-heading text-lg sm:text-xl font-bold text-[#2E2A5C] line-clamp-2 leading-snug mb-2 group-hover:text-[#5B3E96] transition-colors">
            {ebook.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#2B2A3D]/75 line-clamp-3 leading-relaxed mb-4">
            {ebook.description || 'Download this comprehensive sacred Vedic astrology and spiritual guide in PDF format.'}
          </p>
        </div>

        {/* Bottom Action Area */}
        <div className="pt-3 border-t border-secondary/15">
          <div className="flex items-center justify-between gap-3 mb-3 text-xs text-[#2B2A3D]/65">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B3E96]">
              <Sparkles className="w-3 h-3" />
              Instant Digital Download
            </span>
            <span className="text-[11px] font-medium">
              {formatFileSize(ebook.size_bytes)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
                <span>Preparing Download...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#C9A227]" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Download Error Notice in Royal Violet */}
          {downloadError && (
            <div className="mt-2.5 p-2 rounded-lg bg-[#EFEAF8] border border-[#5B3E96]/20 text-[#5B3E96] text-xs font-medium text-center animate-fade-in">
              {downloadError}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default EbookCard
