import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { usePageMeta } from '../lib/usePageMeta'
import { ShieldCheck, Calendar, ArrowLeft } from 'lucide-react'

interface LegalPageData {
  slug: string
  title: string
  body: string
  updated_at: string
}

type ParsedBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet-list'; items: string[] }

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>()
  const { settings, loading: settingsLoading } = useSiteSettings()
  const [page, setPage] = useState<LegalPageData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchPage = async () => {
      try {
        const data = await api.get<LegalPageData>(`/api/pages/${slug}`)
        if (isMounted) {
          setPage(data)
          setLoading(false)
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[LegalPage] Error loading legal document:', err)
          setError(err?.message || 'Failed to load document')
          setLoading(false)
        }
      }
    }

    if (slug) {
      fetchPage()
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  // SEO metadata hook
  usePageMeta({
    title: page?.title || 'Legal Document',
    description: page?.title
      ? `Read our official ${page.title.toLowerCase()} policy for YugOccult Learning Academy.`
      : 'Legal document and terms of service.',
    canonicalPath: `/${slug}`,
  })

  // Safe markdown-like parsing without dangerouslySetInnerHTML or external packages
  const renderContent = () => {
    if (!page || !page.body) return null

    const brand = 'YugOccult Learning Academy'
    const email = settings.email?.trim() || ''
    const phone = settings.phone?.trim() || ''
    const address = settings.address?.trim() || ''

    const placeholderMap: Record<string, string> = {
      '{{brand}}': brand,
      '{{email}}': email,
      '{{phone}}': phone,
      '{{address}}': address,
    }

    // 1. Process line by line for placeholders
    const rawLines = page.body.split('\n')
    const keptLines: string[] = []

    for (const rawLine of rawLines) {
      let line = rawLine
      let shouldDropLine = false

      // Check if line contains any placeholder
      for (const [placeholder, value] of Object.entries(placeholderMap)) {
        if (line.includes(placeholder)) {
          if (!value) {
            // Placeholder has no value -> drop entire line
            shouldDropLine = true
            break
          } else {
            line = line.split(placeholder).join(value)
          }
        }
      }

      if (!shouldDropLine) {
        keptLines.push(line)
      }
    }

    // 2. Parse into blocks and remove empty headings
    const rawBlocks: ParsedBlock[] = []
    let currentBullets: string[] = []

    const flushBullets = () => {
      if (currentBullets.length > 0) {
        rawBlocks.push({ type: 'bullet-list', items: [...currentBullets] })
        currentBullets = []
      }
    }

    for (let i = 0; i < keptLines.length; i++) {
      const line = keptLines[i].trim()
      if (!line) {
        flushBullets()
        continue
      }

      if (line.startsWith('## ')) {
        flushBullets()
        rawBlocks.push({
          type: 'heading',
          text: line.replace(/^##\s+/, '').trim(),
        })
      } else if (line.startsWith('- ')) {
        currentBullets.push(line.replace(/^-\s+/, '').trim())
      } else {
        flushBullets()
        rawBlocks.push({
          type: 'paragraph',
          text: line,
        })
      }
    }
    flushBullets()

    // 3. Drop headings that have no content before the next heading or end
    const filteredBlocks: ParsedBlock[] = []
    for (let i = 0; i < rawBlocks.length; i++) {
      const block = rawBlocks[i]
      if (block.type === 'heading') {
        const nextBlock = rawBlocks[i + 1]
        if (!nextBlock || nextBlock.type === 'heading') {
          // Orphan heading with no content -> omit
          continue
        }
      }
      filteredBlocks.push(block)
    }

    return (
      <div className="space-y-6 text-[#2B2A3D] text-base leading-8 break-words">
        {filteredBlocks.map((block, idx) => {
          if (block.type === 'heading') {
            return (
              <h2
                key={idx}
                className="font-serif text-2xl md:text-3xl font-bold text-[#2E2A5C] pt-6 pb-1 border-b border-[#2E2A5C]/10"
              >
                {block.text}
              </h2>
            )
          }
          if (block.type === 'bullet-list') {
            return (
              <ul key={idx} className="list-disc list-outside pl-6 space-y-2.5">
                {block.items.map((item, bulletIdx) => (
                  <li key={bulletIdx} className="leading-7 pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            )
          }
          if (block.type === 'paragraph') {
            return (
              <p key={idx} className="leading-8 text-[#2B2A3D]/90">
                {block.text}
              </p>
            )
          }
          return null
        })}
      </div>
    )
  }

  const formatLastUpdated = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return null
    }
  }

  if (loading || settingsLoading) {
    return (
      <main className="min-h-[70vh] bg-[#FBF7EE] py-16 px-4">
        <div className="max-w-3xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-[#2E2A5C]/10 rounded w-1/3 mb-8" />
          <div className="h-12 bg-[#2E2A5C]/10 rounded w-2/3" />
          <div className="h-4 bg-[#2E2A5C]/10 rounded w-1/4 mb-10" />
          <div className="space-y-4">
            <div className="h-4 bg-[#2E2A5C]/10 rounded w-full" />
            <div className="h-4 bg-[#2E2A5C]/10 rounded w-5/6" />
            <div className="h-4 bg-[#2E2A5C]/10 rounded w-4/6" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !page) {
    return (
      <main className="min-h-[70vh] bg-[#FBF7EE] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-[#2E2A5C]/10">
          <ShieldCheck className="w-12 h-12 text-[#5B3E96] mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-[#2E2A5C] mb-2">Document Unavailable</h1>
          <p className="text-sm text-[#2B2A3D]/70 mb-6">
            The requested legal policy could not be loaded at this time.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5B3E96] text-white font-medium hover:bg-[#2E2A5C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </main>
    )
  }

  const updatedDate = formatLastUpdated(page.updated_at)

  return (
    <main className="min-h-screen bg-[#FBF7EE] py-12 md:py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#5B3E96] hover:text-[#2E2A5C] font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <header className="mb-10 pb-6 border-b border-[#2E2A5C]/15">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#2E2A5C] tracking-tight mb-3">
            {page.title}
          </h1>
          {updatedDate && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2B2A3D]/60 font-medium">
              <Calendar className="w-4 h-4 text-[#C9A227]" />
              <span>Last updated: {updatedDate}</span>
            </div>
          )}
        </header>

        {/* Content Body (Safe React Render) */}
        <article className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-[#2E2A5C]/10 shadow-sm overflow-hidden">
          {renderContent()}
        </article>

        {/* Bottom Support Note */}
        <div className="mt-10 p-6 rounded-xl bg-[#2E2A5C]/5 border border-[#2E2A5C]/10 text-center text-sm text-[#2B2A3D]/80">
          Have questions regarding our policies? Write to us directly at{' '}
          <a
            href={`mailto:${settings.email || 'yanushka655@gmail.com'}`}
            className="text-[#5B3E96] font-semibold hover:underline"
          >
            {settings.email || 'yanushka655@gmail.com'}
          </a>
          .
        </div>
      </div>
    </main>
  )
}
