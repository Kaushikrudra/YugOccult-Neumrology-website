import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import {
  FileText,
  Save,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit3,
  Calendar,
  Info,
} from 'lucide-react'

interface AdminPageRecord {
  id: string
  slug: string
  title: string
  body: string
  reviewed: boolean
  updated_at: string
}

export default function AdminLegalPages() {
  const { settings } = useSiteSettings()
  const [pages, setPages] = useState<AdminPageRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [reviewing, setReviewing] = useState<boolean>(false)
  const [activeSlug, setActiveSlug] = useState<string>('terms')
  const [activeTitle, setActiveTitle] = useState<string>('')
  const [activeBody, setActiveBody] = useState<string>('')
  const [originalTitle, setOriginalTitle] = useState<string>('')
  const [originalBody, setOriginalBody] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isDirty = activeTitle !== originalTitle || activeBody !== originalBody

  // Prompt before window unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const fetchPages = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ pages: AdminPageRecord[] }>('/api/admin/pages')
      if (res && res.pages) {
        setPages(res.pages)
        const current = res.pages.find((p) => p.slug === activeSlug) || res.pages[0]
        if (current) {
          setActiveSlug(current.slug)
          setActiveTitle(current.title)
          setActiveBody(current.body)
          setOriginalTitle(current.title)
          setOriginalBody(current.body)
        }
      }
    } catch (err: any) {
      console.error('[AdminLegalPages] Error fetching legal pages:', err)
      setMessage({ type: 'error', text: err?.message || 'Failed to load legal pages' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const handleSelectPage = (slug: string) => {
    if (isDirty) {
      const confirmSwitch = window.confirm(
        'You have unsaved edits in this document. Are you sure you want to discard them and switch?'
      )
      if (!confirmSwitch) return
    }

    setActiveSlug(slug)
    const target = pages.find((p) => p.slug === slug)
    if (target) {
      setActiveTitle(target.title)
      setActiveBody(target.body)
      setOriginalTitle(target.title)
      setOriginalBody(target.body)
    }
    setMessage(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      const res = await api.put<{ success: boolean; page: AdminPageRecord }>(
        `/api/admin/pages/${activeSlug}`,
        {
          title: activeTitle,
          body: activeBody,
        }
      )

      if (res && res.page) {
        setOriginalTitle(res.page.title)
        setOriginalBody(res.page.body)
        setPages((prev) => prev.map((p) => (p.slug === activeSlug ? res.page : p)))
        setMessage({
          type: 'success',
          text: 'Document updated successfully. Status set to "Draft: needs review".',
        })
      }
    } catch (err: any) {
      console.error('[AdminLegalPages] Error saving document:', err)
      setMessage({ type: 'error', text: err?.message || 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  const handleMarkReviewed = async () => {
    if (isDirty) {
      alert('Please save your pending edits before marking the document as reviewed.')
      return
    }

    try {
      setReviewing(true)
      setMessage(null)
      const res = await api.patch<{ success: boolean; page: AdminPageRecord }>(
        `/api/admin/pages/${activeSlug}/reviewed`
      )

      if (res && res.page) {
        setPages((prev) => prev.map((p) => (p.slug === activeSlug ? res.page : p)))
        setMessage({
          type: 'success',
          text: 'Document successfully marked as Reviewed!',
        })
      }
    } catch (err: any) {
      console.error('[AdminLegalPages] Error marking reviewed:', err)
      setMessage({ type: 'error', text: err?.message || 'Failed to update review status' })
    } finally {
      setReviewing(false)
    }
  }

  const currentPage = pages.find((p) => p.slug === activeSlug)

  // Live preview parser
  const renderPreview = () => {
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

    const rawLines = activeBody.split('\n')
    const keptLines: string[] = []

    for (const rawLine of rawLines) {
      let line = rawLine
      let drop = false
      for (const [p, v] of Object.entries(placeholderMap)) {
        if (line.includes(p)) {
          if (!v) {
            drop = true
            break
          } else {
            line = line.split(p).join(v)
          }
        }
      }
      if (!drop) keptLines.push(line)
    }

    return (
      <div className="space-y-4 text-sm text-[#2B2A3D] leading-7 bg-white p-6 rounded-xl border border-[#2E2A5C]/15">
        <h1 className="font-serif text-2xl font-bold text-[#2E2A5C] pb-2 border-b border-[#2E2A5C]/10">
          {activeTitle || 'Untitled Document'}
        </h1>
        {keptLines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={idx} className="h-2" />
          if (trimmed.startsWith('## ')) {
            return (
              <h2
                key={idx}
                className="font-serif text-lg font-bold text-[#2E2A5C] pt-3 pb-1 border-b border-[#2E2A5C]/10"
              >
                {trimmed.replace(/^##\s+/, '')}
              </h2>
            )
          }
          if (trimmed.startsWith('- ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-[#2B2A3D]">
                {trimmed.replace(/^-\s+/, '')}
              </li>
            )
          }
          return <p key={idx}>{trimmed}</p>
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4 max-w-4xl">
          <div className="h-8 bg-[#2E2A5C]/10 rounded w-1/4" />
          <div className="h-12 bg-[#2E2A5C]/10 rounded w-full" />
          <div className="h-64 bg-[#2E2A5C]/10 rounded w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-[#2E2A5C]/15">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#2E2A5C]">
            Legal Pages Management
          </h1>
          <p className="text-sm text-[#2B2A3D]/70 mt-1">
            Edit and review statutory customer terms, privacy policy, and refund rules.
          </p>
        </div>

        {currentPage && (
          <div className="flex items-center gap-3">
            {currentPage.reviewed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#5B3E96]/10 text-[#5B3E96] border border-[#5B3E96]/20">
                <CheckCircle className="w-3.5 h-3.5 text-[#5B3E96]" /> Reviewed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F08A24]/15 text-[#F08A24] border border-[#F08A24]/30">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F08A24]" /> Draft: needs review
              </span>
            )}
          </div>
        )}
      </div>

      {/* Unsaved alert banner */}
      {isDirty && (
        <div className="mb-6 p-4 rounded-xl bg-[#F08A24]/10 border border-[#F08A24]/30 flex items-center justify-between text-xs sm:text-sm text-[#2B2A3D]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F08A24] shrink-0" />
            <span>You have unsaved changes in this policy document.</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 rounded-lg bg-[#F08A24] text-white text-xs font-medium hover:opacity-90"
          >
            {saving ? 'Saving...' : 'Save now'}
          </button>
        </div>
      )}

      {/* Message feedback */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-[#5B3E96]/10 text-[#5B3E96] border border-[#5B3E96]/20'
              : 'bg-[#5B3E96]/10 text-[#5B3E96] border border-[#5B3E96]/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Document Selector Tabs */}
      <div className="flex border-b border-[#2E2A5C]/15 mb-6 gap-2">
        {pages.map((p) => {
          const isActive = p.slug === activeSlug
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => handleSelectPage(p.slug)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                isActive
                  ? 'border-[#5B3E96] text-[#5B3E96]'
                  : 'border-transparent text-[#2B2A3D]/70 hover:text-[#2E2A5C]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{p.title}</span>
              {p.reviewed ? (
                <span className="w-2 h-2 rounded-full bg-[#5B3E96]" title="Reviewed" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#F08A24]" title="Needs Review" />
              )}
            </button>
          )
        })}
      </div>

      {/* Editor & Actions Card */}
      <div className="bg-white rounded-2xl border border-[#2E2A5C]/10 shadow-sm overflow-hidden">
        {/* Sub-header Controls */}
        <div className="p-4 bg-[#FBF7EE] border-b border-[#2E2A5C]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'edit'
                  ? 'bg-[#2E2A5C] text-white'
                  : 'bg-white text-[#2B2A3D]/70 hover:bg-[#2E2A5C]/5'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-[#2E2A5C] text-white'
                  : 'bg-white text-[#2B2A3D]/70 hover:bg-[#2E2A5C]/5'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Live Preview
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                isDirty
                  ? 'bg-[#5B3E96] text-white hover:bg-[#2E2A5C] shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Document'}
            </button>

            {currentPage && !currentPage.reviewed && (
              <button
                type="button"
                onClick={handleMarkReviewed}
                disabled={reviewing || isDirty}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#2E2A5C] text-white hover:bg-[#5B3E96] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isDirty ? 'Save your changes first' : 'Confirm policy text is approved'}
              >
                <CheckCircle className="w-4 h-4 text-[#C9A227]" />
                {reviewing ? 'Updating...' : 'Mark as reviewed'}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'edit' ? (
            <div className="space-y-6">
              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-2">
                  Document Title (Max 120 chars)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={activeTitle}
                  onChange={(e) => setActiveTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#2E2A5C]/20 focus:border-[#5B3E96] focus:ring-1 focus:ring-[#5B3E96] text-[#2B2A3D] text-sm"
                  placeholder="e.g. Terms & Conditions"
                />
              </div>

              {/* Formatting Helper Guide */}
              <div className="p-4 rounded-xl bg-[#2E2A5C]/5 border border-[#2E2A5C]/10 text-xs text-[#2B2A3D]/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#2E2A5C]">
                  <Info className="w-4 h-4 text-[#C9A227]" /> Formatting & Placeholders Guide
                </div>
                <p>
                  • Start a line with <code className="bg-white px-1.5 py-0.5 rounded border border-[#2E2A5C]/15">## Section Title</code> for a section heading.
                </p>
                <p>
                  • Start a line with <code className="bg-white px-1.5 py-0.5 rounded border border-[#2E2A5C]/15">- Bullet item</code> for list bullets.
                </p>
                <p>
                  • Leave an empty blank line to separate paragraphs.
                </p>
                <p>
                  • Use placeholders: <code className="bg-white px-1.5 py-0.5 rounded border border-[#2E2A5C]/15">&#123;&#123;brand&#125;&#125;</code>,{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-[#2E2A5C]/15">&#123;&#123;email&#125;&#125;</code>,{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-[#2E2A5C]/15">&#123;&#123;phone&#125;&#125;</code>,{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-[#2E2A5C]/15">&#123;&#123;address&#125;&#125;</code>.
                  (If a setting is missing, lines containing it are automatically hidden on the public page).
                </p>
              </div>

              {/* Body Textarea */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2E2A5C]">
                    Document Body (Max 20,000 chars)
                  </label>
                  <span className="text-xs text-[#2B2A3D]/60">
                    {activeBody.length} / 20,000 characters
                  </span>
                </div>
                <textarea
                  rows={18}
                  maxLength={20000}
                  value={activeBody}
                  onChange={(e) => setActiveBody(e.target.value)}
                  className="w-full font-mono text-xs sm:text-sm p-4 rounded-xl border border-[#2E2A5C]/20 focus:border-[#5B3E96] focus:ring-1 focus:ring-[#5B3E96] text-[#2B2A3D] leading-relaxed"
                  placeholder="Enter policy text..."
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-xs text-[#2B2A3D]/60 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C9A227]" />
                <span>Simulated live view with current Site Settings replaced:</span>
              </div>
              {renderPreview()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
