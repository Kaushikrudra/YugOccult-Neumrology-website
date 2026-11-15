import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MessageSquare,
  Mail,
  MailOpen,
  Trash2,
  Clock,
  Eye,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Phone,
  User,
  Sparkles,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { api } from '../../lib/api'

interface Enquiry {
  id: string
  name: string
  email: string | null
  phone: string | null
  subject: string | null
  message: string | null
  is_read: boolean
  created_at: string
  enquiry_type?: 'contact' | 'free_kundli' | 'kundli' | 'ask_question'
  whatsapp_number?: string | null
  gender?: 'male' | 'female' | 'other' | null
  birth_date?: string | null
  birth_time?: string | null
  birth_time_unknown?: boolean
  birth_place?: string | null
  question?: string | null
  consent?: boolean
  consent_at?: string | null
  lead_status?: 'new' | 'contacted' | 'done'
  amount?: number | null
  question_count?: number | null
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const AdminEnquiries: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialUnread = searchParams.get('unread') === 'true'

  const [filterUnread, setFilterUnread] = useState(initialUnread)
  const [filterType, setFilterType] = useState<'all' | 'contact' | 'kundli' | 'free_kundli' | 'ask_question'>('all')
  const [filterLeadStatus, setFilterLeadStatus] = useState<'all' | 'new' | 'contacted' | 'done'>('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null)
  const [deletingEnquiry, setDeletingEnquiry] = useState<Enquiry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const fetchEnquiries = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params: Record<string, any> = {
        page,
        limit,
      }
      if (filterUnread) {
        params.unread = 'true'
      }
      if (filterType !== 'all') {
        params.type = filterType
      }
      if (filterLeadStatus !== 'all') {
        params.lead_status = filterLeadStatus
      }

      const res = await api.get<{ enquiries: Enquiry[]; pagination: PaginationMeta }>(
        '/api/admin/enquiries',
        { params }
      )

      setEnquiries(res.enquiries || [])
      setPagination(res.pagination)
    } catch (err: any) {
      console.error('Error fetching enquiries:', err)
      setError(err?.message || 'Failed to retrieve enquiries')
    } finally {
      setIsLoading(false)
    }
  }, [page, filterUnread, filterType, filterLeadStatus])

  useEffect(() => {
    fetchEnquiries()
  }, [fetchEnquiries])

  // Sync filter toggle with query param
  const handleUnreadToggle = (onlyUnread: boolean) => {
    setFilterUnread(onlyUnread)
    setPage(1)
    if (onlyUnread) {
      setSearchParams({ unread: 'true' })
    } else {
      setSearchParams({})
    }
  }

  // Toggle read status
  const handleToggleRead = async (enquiry: Enquiry) => {
    const updatedStatus = !enquiry.is_read
    try {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiry.id ? { ...e, is_read: updatedStatus } : e))
      )
      if (viewingEnquiry?.id === enquiry.id) {
        setViewingEnquiry((prev) => (prev ? { ...prev, is_read: updatedStatus } : null))
      }

      await api.patch(`/api/admin/enquiries/${enquiry.id}`, {
        is_read: updatedStatus,
      })
    } catch (err) {
      console.error('Failed to update enquiry read status:', err)
      fetchEnquiries()
    }
  }

  // Update lead status ('new' | 'contacted' | 'done')
  const handleUpdateLeadStatus = async (
    enquiryId: string,
    newStatus: 'new' | 'contacted' | 'done'
  ) => {
    try {
      setStatusUpdatingId(enquiryId)
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, lead_status: newStatus } : e))
      )
      if (viewingEnquiry?.id === enquiryId) {
        setViewingEnquiry((prev) => (prev ? { ...prev, lead_status: newStatus } : null))
      }

      await api.patch(`/api/admin/enquiries/${enquiryId}`, {
        lead_status: newStatus,
      })
    } catch (err: any) {
      console.error('Failed to update lead status:', err)
      alert(err?.message || 'Failed to update lead status')
      fetchEnquiries()
    } finally {
      setStatusUpdatingId(null)
    }
  }

  // Delete enquiry handler (Deep Indigo button - strictly no red)
  const confirmDelete = async () => {
    if (!deletingEnquiry) return

    try {
      setIsDeleting(true)
      await api.delete(`/api/admin/enquiries/${deletingEnquiry.id}`)

      setEnquiries((prev) => prev.filter((e) => e.id !== deletingEnquiry.id))
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }))
      setDeletingEnquiry(null)
      if (viewingEnquiry?.id === deletingEnquiry.id) {
        setViewingEnquiry(null)
      }
    } catch (err: any) {
      console.error('Failed to delete enquiry:', err)
      alert(err?.message || 'Failed to delete enquiry. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper: Build WhatsApp chat URL with customized greeting
  const getWhatsAppUrl = (enquiry: Enquiry) => {
    const rawNumber = enquiry.whatsapp_number || enquiry.phone
    if (!rawNumber) return null
    let digits = rawNumber.replace(/\D/g, '')
    if (digits.length === 10) {
      digits = '91' + digits
    }
    const enquiryTitle =
      enquiry.enquiry_type === 'kundli' || enquiry.enquiry_type === 'free_kundli'
        ? `Kundli Request (₹${enquiry.amount || 499})`
        : enquiry.enquiry_type === 'ask_question'
        ? `Astrology Question (${enquiry.question_count || 1} Question${(enquiry.question_count || 1) > 1 ? 's' : ''} • ₹${enquiry.amount || 499})`
        : 'Enquiry'

    const message = `Namaste ${enquiry.name}, this is YugOccult Learning Academy regarding your ${enquiryTitle}. We have received your request and payment details, and are happy to guide you.`
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
  }

  // Badge render helper for enquiry_type
  const renderTypeBadge = (type?: string, amount?: number | null, questionCount?: number | null) => {
    switch (type) {
      case 'kundli':
      case 'free_kundli':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5B3E96]/15 text-[#5B3E96] border border-[#5B3E96]/30">
            <Sparkles className="w-3 h-3 text-[#5B3E96]" />
            Kundli • ₹{amount || 499}
          </span>
        )
      case 'ask_question':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F08A24]/15 text-[#2E2A5C] border border-[#F08A24]/30">
            <HelpCircle className="w-3 h-3 text-[#F08A24]" />
            {questionCount && questionCount > 1 ? `${questionCount} Questions` : '1 Question'} • ₹{amount || 499}
          </span>
        )
      case 'contact':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2E2A5C]/10 text-[#2E2A5C] border border-[#2E2A5C]/20">
            <MessageSquare className="w-3 h-3 text-[#2E2A5C]" />
            Contact
          </span>
        )
    }
  }

  // Badge render helper for lead_status
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/20">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Done
          </span>
        )
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2E2A5C]/15 text-[#2E2A5C] border border-[#2E2A5C]/30">
            Contacted
          </span>
        )
      case 'new':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F08A24]/15 text-[#F08A24] border border-[#F08A24]/40">
            New Lead
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Consultation & Lead Management</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C] mt-1">
            Seeker Enquiries & Leads
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-0.5">
            Review Kundli requests, astrology questions, and contact messages submitted by seekers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchEnquiries}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-[#5B3E96]/20 text-[#2E2A5C] hover:bg-[#EFEAF8] shadow-sm transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh list"
            aria-label="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#5B3E96]/15 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
          {/* Enquiry Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#2E2A5C]">Type:</span>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any)
                setPage(1)
              }}
              className="px-2.5 py-1.5 rounded-xl border border-[#5B3E96]/25 bg-[#FBF7EE] text-[#2E2A5C] font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3E96] min-h-[38px]"
            >
              <option value="all">All Types</option>
              <option value="kundli">Kundli (₹499)</option>
              <option value="ask_question">Ask Question (₹499 - ₹1,299)</option>
              <option value="contact">Contact Message</option>
            </select>
          </div>

          {/* Lead Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#2E2A5C]">Status:</span>
            <select
              value={filterLeadStatus}
              onChange={(e) => {
                setFilterLeadStatus(e.target.value as any)
                setPage(1)
              }}
              className="px-2.5 py-1.5 rounded-xl border border-[#5B3E96]/25 bg-[#FBF7EE] text-[#2E2A5C] font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#5B3E96] min-h-[38px]"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Read / Unread Toggle */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => handleUnreadToggle(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all min-h-[38px] ${
                !filterUnread
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] border-[#2E2A5C] shadow-sm'
                  : 'bg-white text-[#2B2A3D]/80 border-[#5B3E96]/20 hover:bg-[#EFEAF8]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleUnreadToggle(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all min-h-[38px] ${
                filterUnread
                  ? 'bg-[#F08A24] text-[#2E2A5C] border-[#F08A24] shadow-sm font-bold'
                  : 'bg-white text-[#2B2A3D]/80 border-[#5B3E96]/20 hover:bg-[#EFEAF8]'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Unread</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#2E2A5C] text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#5B3E96]" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchEnquiries}
            className="text-xs font-semibold text-[#5B3E96] underline hover:text-[#2E2A5C]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Enquiries List Card */}
      <div className="bg-white rounded-2xl border border-[#5B3E96]/15 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-[#FBF7EE] rounded-xl animate-pulse border border-[#5B3E96]/10"
              />
            ))}
          </div>
        ) : enquiries.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#EFEAF8] text-[#5B3E96] flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[#2E2A5C]">
              No enquiries found
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 max-w-sm mx-auto mt-1">
              {filterUnread
                ? 'All filtered enquiries have been reviewed. There are no unread items matching criteria.'
                : 'No enquiries have been submitted matching the current filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop / Responsive Table View */}
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-[#FBF7EE] border-b border-[#5B3E96]/10 text-[11px] font-semibold uppercase tracking-wider text-[#2B2A3D]/70">
                  <th className="py-3.5 px-4">Type / Read</th>
                  <th className="py-3.5 px-4">Seeker</th>
                  <th className="py-3.5 px-4">Details / Summary</th>
                  <th className="py-3.5 px-4">Lead Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5B3E96]/10 text-sm">
                {enquiries.map((enquiry) => {
                  const waUrl = getWhatsAppUrl(enquiry)
                  return (
                    <tr
                      key={enquiry.id}
                      className={`hover:bg-[#FBF7EE]/60 transition-colors ${
                        !enquiry.is_read ? 'bg-[#F08A24]/5' : ''
                      }`}
                    >
                      {/* Type and Read badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1.5">
                          {renderTypeBadge(enquiry.enquiry_type, enquiry.amount, enquiry.question_count)}
                          {!enquiry.is_read ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#F08A24]/15 text-[#F08A24] border border-[#F08A24]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F08A24]" />
                              Unread
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#EFEAF8] text-[#5B3E96]">
                              Read
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Seeker Information */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2E2A5C] text-sm">{enquiry.name}</div>
                        {enquiry.whatsapp_number ? (
                          <div className="text-xs text-[#5B3E96] font-medium flex items-center gap-1 mt-0.5">
                            <span>WA:</span>
                            <span>{enquiry.whatsapp_number}</span>
                          </div>
                        ) : (
                          enquiry.phone && (
                            <div className="text-xs text-[#2B2A3D]/70">{enquiry.phone}</div>
                          )
                        )}
                        {enquiry.email && (
                          <div className="text-[11px] text-[#2B2A3D]/50">{enquiry.email}</div>
                        )}
                      </td>

                      {/* Details / Summary */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {enquiry.enquiry_type === 'kundli' || enquiry.enquiry_type === 'free_kundli' ? (
                          <div>
                            <div className="font-medium text-[#2E2A5C] text-xs">
                              Kundli Fee: ₹{enquiry.amount || 499}
                            </div>
                            <div className="text-xs text-[#2B2A3D]/70 mt-0.5">
                              DOB: {enquiry.birth_date || 'N/A'}{' '}
                              {enquiry.birth_time_unknown
                                ? '(Time Unknown)'
                                : enquiry.birth_time
                                ? `(${enquiry.birth_time})`
                                : ''}
                            </div>
                            <p className="text-xs text-[#2B2A3D]/60 truncate mt-0.5">
                              Place: {enquiry.birth_place || 'Not provided'}
                            </p>
                          </div>
                        ) : enquiry.enquiry_type === 'ask_question' ? (
                          <div>
                            <div className="font-medium text-[#2E2A5C] text-xs">
                              {enquiry.question_count || 1} Question{(enquiry.question_count || 1) > 1 ? 's' : ''} • ₹{enquiry.amount || 499}
                            </div>
                            <p className="text-xs text-[#2B2A3D]/70 line-clamp-2 mt-0.5">
                              {enquiry.question || enquiry.message || 'No question text provided'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-[#2E2A5C] truncate text-xs">
                              {enquiry.subject || 'General Inquiry'}
                            </div>
                            <p className="text-xs text-[#2B2A3D]/60 truncate mt-0.5">
                              {enquiry.message}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Lead Status Selector */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={enquiry.lead_status || 'new'}
                          disabled={statusUpdatingId === enquiry.id}
                          onChange={(e) =>
                            handleUpdateLeadStatus(
                              enquiry.id,
                              e.target.value as 'new' | 'contacted' | 'done'
                            )
                          }
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE] text-[#2E2A5C] focus:outline-none focus:ring-1 focus:ring-[#5B3E96] disabled:opacity-50"
                        >
                          <option value="new">● New</option>
                          <option value="contacted">● Contacted</option>
                          <option value="done">✓ Done</option>
                        </select>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#2B2A3D]/60">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#5B3E96]" />
                          <span>
                            {new Date(enquiry.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#2B2A3D]/40 pl-5">
                          {new Date(enquiry.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Direct Link (Deep Indigo button - strictly no green) */}
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] transition-colors"
                              title="Chat on WhatsApp"
                              aria-label="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4 text-[#F08A24]" />
                            </a>
                          )}

                          {/* View full details */}
                          <button
                            onClick={() => setViewingEnquiry(enquiry)}
                            className="p-1.5 rounded-lg bg-[#EFEAF8] hover:bg-[#5B3E96]/20 text-[#2E2A5C] transition-colors"
                            title="View Details"
                            aria-label="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Toggle Read / Unread */}
                          <button
                            onClick={() => handleToggleRead(enquiry)}
                            className="p-1.5 rounded-lg bg-[#EFEAF8] hover:bg-[#5B3E96]/20 text-[#2E2A5C] transition-colors"
                            title={enquiry.is_read ? 'Mark as Unread' : 'Mark as Read'}
                            aria-label={enquiry.is_read ? 'Mark as Unread' : 'Mark as Read'}
                          >
                            {enquiry.is_read ? (
                              <Mail className="w-4 h-4 text-[#5B3E96]" />
                            ) : (
                              <MailOpen className="w-4 h-4 text-[#F08A24]" />
                            )}
                          </button>

                          {/* Delete Enquiry trigger */}
                          <button
                            onClick={() => setDeletingEnquiry(enquiry)}
                            className="p-1.5 rounded-lg bg-[#2E2A5C]/10 hover:bg-[#2E2A5C]/20 text-[#2E2A5C] transition-colors"
                            title="Delete Enquiry"
                            aria-label="Delete Enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#FBF7EE] border-t border-[#5B3E96]/10 flex items-center justify-between text-xs text-[#2B2A3D]/70">
            <div>
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total}{' '}
              total enquiries)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#5B3E96]/20 text-[#2E2A5C] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EFEAF8] transition-colors flex items-center gap-1 min-h-[38px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#5B3E96]/20 text-[#2E2A5C] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EFEAF8] transition-colors flex items-center gap-1 min-h-[38px]"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Enquiry Details Modal */}
      {viewingEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#5B3E96]/20 relative max-h-[90vh] flex flex-col my-auto">
            <button
              onClick={() => setViewingEnquiry(null)}
              className="absolute top-4 right-4 p-2 text-[#2B2A3D]/50 hover:text-[#2E2A5C] rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {renderTypeBadge(viewingEnquiry.enquiry_type, viewingEnquiry.amount, viewingEnquiry.question_count)}
              {renderStatusBadge(viewingEnquiry.lead_status)}
              <span className="text-xs text-[#2B2A3D]/60 ml-auto mr-8">
                {new Date(viewingEnquiry.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <h3 className="font-heading text-xl font-bold text-[#2E2A5C] mb-3">
              {viewingEnquiry.enquiry_type === 'kundli' || viewingEnquiry.enquiry_type === 'free_kundli'
                ? `Kundli Request (₹${viewingEnquiry.amount || 499})`
                : viewingEnquiry.enquiry_type === 'ask_question'
                ? `Astrology Question (${viewingEnquiry.question_count || 1} Question${(viewingEnquiry.question_count || 1) > 1 ? 's' : ''} • ₹${viewingEnquiry.amount || 499})`
                : viewingEnquiry.subject || 'Inquiry Details'}
            </h3>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              {/* Seeker Contact Info Card */}
              <div className="bg-[#FBF7EE] rounded-xl p-3.5 space-y-2 border border-[#5B3E96]/10">
                <div className="flex items-center gap-2 text-[#2E2A5C]">
                  <User className="w-3.5 h-3.5 text-[#5B3E96]" />
                  <span className="font-semibold text-sm">{viewingEnquiry.name}</span>
                </div>

                {viewingEnquiry.whatsapp_number && (
                  <div className="flex items-center gap-2 text-[#2E2A5C]">
                    <MessageSquare className="w-3.5 h-3.5 text-[#F08A24]" />
                    <span className="font-medium">WhatsApp: {viewingEnquiry.whatsapp_number}</span>
                  </div>
                )}

                {viewingEnquiry.phone && (
                  <div className="flex items-center gap-2 text-[#2B2A3D]">
                    <Phone className="w-3.5 h-3.5 text-[#5B3E96]" />
                    <a
                      href={`tel:${viewingEnquiry.phone}`}
                      className="hover:underline text-[#5B3E96]"
                    >
                      {viewingEnquiry.phone}
                    </a>
                  </div>
                )}

                {viewingEnquiry.email && (
                  <div className="flex items-center gap-2 text-[#2B2A3D]">
                    <Mail className="w-3.5 h-3.5 text-[#5B3E96]" />
                    <a
                      href={`mailto:${viewingEnquiry.email}`}
                      className="hover:underline text-[#5B3E96]"
                    >
                      {viewingEnquiry.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Service Fee / Tier Info */}
              {viewingEnquiry.amount && (
                <div className="bg-[#5B3E96]/10 rounded-xl p-3 flex items-center justify-between border border-[#5B3E96]/20">
                  <div className="flex items-center gap-2 text-xs text-[#2E2A5C] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#5B3E96]" />
                    <span>Selected Service Fee:</span>
                  </div>
                  <div className="text-sm font-bold text-[#2E2A5C]">
                    ₹{viewingEnquiry.amount}
                    {viewingEnquiry.question_count && viewingEnquiry.question_count > 1 ? (
                      <span className="text-xs font-medium text-[#5B3E96] ml-1.5">
                        ({viewingEnquiry.question_count} Questions)
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Birth Particulars (If Kundli or provided for Question) */}
              {(viewingEnquiry.birth_date ||
                viewingEnquiry.birth_place ||
                viewingEnquiry.gender) && (
                <div className="bg-[#EFEAF8]/60 rounded-xl p-3.5 space-y-2 border border-[#5B3E96]/20">
                  <div className="font-semibold text-[#2E2A5C] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <Sparkles className="w-3 h-3 text-[#5B3E96]" />
                    <span>Birth Particulars</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#2B2A3D]">
                    <div>
                      <span className="text-[#2B2A3D]/60 block text-[11px]">Gender:</span>
                      <span className="font-medium text-[#2E2A5C] capitalize">
                        {viewingEnquiry.gender || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#2B2A3D]/60 block text-[11px]">Date of Birth:</span>
                      <span className="font-medium text-[#2E2A5C]">
                        {viewingEnquiry.birth_date || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#2B2A3D]/60 block text-[11px]">Time of Birth:</span>
                      <span className="font-medium text-[#2E2A5C]">
                        {viewingEnquiry.birth_time_unknown
                          ? 'Time Unknown / Not Sure'
                          : viewingEnquiry.birth_time || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#2B2A3D]/60 block text-[11px]">Place of Birth:</span>
                      <span className="font-medium text-[#2E2A5C]">
                        {viewingEnquiry.birth_place || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Seeker's Question (for ask_question) */}
              {viewingEnquiry.question && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2B2A3D]/70 mb-1.5">
                    Seeker's Question
                  </h4>
                  <p className="text-sm text-[#2B2A3D] whitespace-pre-wrap leading-relaxed bg-[#FBF7EE]/60 p-3.5 rounded-xl border border-[#5B3E96]/10">
                    {viewingEnquiry.question}
                  </p>
                </div>
              )}

              {/* Message Body (for contact forms) */}
              {viewingEnquiry.message && !viewingEnquiry.question && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2B2A3D]/70 mb-1.5">
                    Message
                  </h4>
                  <p className="text-sm text-[#2B2A3D] whitespace-pre-wrap leading-relaxed bg-[#FBF7EE]/60 p-3.5 rounded-xl border border-[#5B3E96]/10">
                    {viewingEnquiry.message}
                  </p>
                </div>
              )}

              {/* Consent confirmation */}
              {viewingEnquiry.consent && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#5B3E96] bg-[#EFEAF8] px-3 py-1.5 rounded-lg border border-[#5B3E96]/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5B3E96] shrink-0" />
                  <span>
                    Seeker consented to contact on WhatsApp
                    {viewingEnquiry.consent_at
                      ? ` on ${new Date(viewingEnquiry.consent_at).toLocaleDateString('en-IN')}`
                      : ''}
                  </span>
                </div>
              )}

              {/* Lead Status selector in modal */}
              <div className="pt-2 border-t border-[#5B3E96]/10 flex items-center justify-between">
                <span className="font-semibold text-xs text-[#2E2A5C]">Update Lead Status:</span>
                <select
                  value={viewingEnquiry.lead_status || 'new'}
                  disabled={statusUpdatingId === viewingEnquiry.id}
                  onChange={(e) =>
                    handleUpdateLeadStatus(
                      viewingEnquiry.id,
                      e.target.value as 'new' | 'contacted' | 'done'
                    )
                  }
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE] text-[#2E2A5C] focus:outline-none focus:ring-1 focus:ring-[#5B3E96] min-h-[38px]"
                >
                  <option value="new">● New Lead</option>
                  <option value="contacted">● Contacted</option>
                  <option value="done">✓ Done / Resolved</option>
                </select>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t border-[#5B3E96]/10">
              <div className="flex items-center gap-2">
                {/* Direct WhatsApp button (Deep Indigo / Saffron - strictly NO GREEN) */}
                {getWhatsAppUrl(viewingEnquiry) && (
                  <a
                    href={getWhatsAppUrl(viewingEnquiry)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#3C3775] transition-colors flex items-center gap-1.5 shadow-sm min-h-[44px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#F08A24]" />
                    <span>WhatsApp</span>
                    <ExternalLink className="w-3 h-3 text-[#FBF7EE]/60" />
                  </a>
                )}

                <button
                  onClick={() => handleToggleRead(viewingEnquiry)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EFEAF8] text-[#2E2A5C] hover:bg-[#5B3E96]/20 transition-colors min-h-[44px]"
                >
                  {viewingEnquiry.is_read ? 'Mark Unread' : 'Mark Read'}
                </button>
              </div>

              <button
                onClick={() => setViewingEnquiry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2E2A5C]/10 text-[#2E2A5C] hover:bg-[#2E2A5C]/20 transition-colors ml-auto min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (NO RED: Deep Indigo filled button) */}
      {deletingEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#5B3E96]/20 relative">
            <div className="w-12 h-12 rounded-full bg-[#2E2A5C]/10 text-[#2E2A5C] flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Delete Enquiry?
            </h3>
            <p className="text-sm text-[#2B2A3D]/70 mt-2 leading-relaxed">
              Are you sure you want to permanently delete the inquiry from{' '}
              <strong className="text-[#2E2A5C]">{deletingEnquiry.name}</strong>? This record
              cannot be recovered.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#5B3E96]/10">
              <button
                onClick={() => setDeletingEnquiry(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 text-xs font-semibold text-[#2B2A3D] hover:bg-[#FBF7EE] transition-colors disabled:opacity-50 min-h-[44px]"
              >
                Cancel
              </button>
              {/* Deep Indigo filled button, strictly no red! */}
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold tracking-wide shadow-md transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminEnquiries
