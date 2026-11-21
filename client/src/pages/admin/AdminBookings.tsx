import React, { useEffect, useState, useCallback } from 'react'
import {
  Calendar,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { api } from '../../lib/api'

interface BookingRecord {
  id: string
  order_id: string
  user_id: string | null
  name: string
  email: string
  phone: string
  service_title: string | null
  preferred_date: string
  preferred_slot: 'Morning' | 'Afternoon' | 'Evening' | string
  birth_date: string | null
  birth_time: string | null
  birth_time_unknown: boolean
  birth_place: string | null
  topic: string | null
  message: string
  status: 'new' | 'confirmed' | 'completed' | 'cancelled'
  admin_notes: string | null
  created_at: string
  updated_at: string
  order_amount: number | null
  payment_status: string | null
  payment_method: string | null
  paid_at: string | null
  cashfree_order_id: string | null
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const AdminBookings: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit / Details Modal State
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null)
  const [editStatus, setEditStatus] = useState<'new' | 'confirmed' | 'completed' | 'cancelled'>('new')
  const [editAdminNotes, setEditAdminNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params: Record<string, any> = {
        page,
        limit,
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const res = await api.get<{ bookings: BookingRecord[]; pagination: PaginationMeta }>(
        '/api/admin/bookings',
        { params }
      )

      setBookings(res.bookings || [])
      setPagination(res.pagination)
    } catch (err: any) {
      console.error('[AdminBookings] Error fetching bookings:', err)
      setError(err?.message || 'Failed to retrieve consultation bookings')
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleOpenEdit = (booking: BookingRecord) => {
    setSelectedBooking(booking)
    setEditStatus(booking.status)
    setEditAdminNotes(booking.admin_notes || '')
    setUpdateError(null)
  }

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    try {
      setIsUpdating(true)
      setUpdateError(null)

      const res = await api.patch<{ success: boolean; booking: BookingRecord }>(
        `/api/admin/bookings/${selectedBooking.id}`,
        {
          status: editStatus,
          admin_notes: editAdminNotes.trim() || null,
        }
      )

      if (res?.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBooking.id ? { ...b, ...res.booking } : b))
        )
        setSelectedBooking(null)
      }
    } catch (err: any) {
      console.error('[AdminBookings:Update] Error:', err)
      setUpdateError(err?.message || 'Failed to update consultation booking')
    } finally {
      setIsUpdating(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFF4E6] text-[#F08A24] border border-[#F08A24]/40">
            New Request
          </span>
        )
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/30">
            Confirmed
          </span>
        )
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF7F2] text-[#2E2A5C] border border-[#C9A227]">
            Completed
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2B2A3D]/10 text-[#2B2A3D]/60">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-mist text-secondary">
            {status}
          </span>
        )
    }
  }

  const renderPaymentBadge = (paymentStatus?: string | null) => {
    const s = (paymentStatus || '').toLowerCase()
    if (s === 'paid') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/30">
          Paid
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E6] text-[#F08A24] border border-[#F08A24]/40">
        Pending
      </span>
    )
  }

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—'
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        dateStyle: 'medium',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#5B3E96]/15">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#5B3E96]" />
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C]">
              Consultation Bookings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-1">
            Review 1-on-1 private appointments, birth charts, schedule slots, and client requests.
          </p>
        </div>

        <button
          onClick={() => fetchBookings()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#5B3E96]/20 text-[#2E2A5C] text-xs font-semibold hover:bg-[#EFEAF8] transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { label: 'All Bookings', value: 'all' },
            { label: 'New', value: 'new' },
            { label: 'Confirmed', value: 'confirmed' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                statusFilter === tab.value
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
                  : 'bg-white text-[#2B2A3D]/70 border border-[#5B3E96]/15 hover:bg-[#EFEAF8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#2B2A3D]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by client name, email, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-[#5B3E96]/20 text-xs text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-[#5B3E96]/15 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#2B2A3D]/60 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5B3E96]" />
            <p className="font-semibold">Loading consultation bookings...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#5B3E96] mx-auto" />
            <p className="text-xs sm:text-sm text-[#2E2A5C] font-semibold">{error}</p>
            <button
              onClick={() => fetchBookings()}
              className="px-4 py-2 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#2B2A3D]/60 space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-[#5B3E96]/40" />
            <p className="text-sm font-semibold text-[#2E2A5C]">No consultation bookings found</p>
            <p>Try clearing your search query or switching tabs.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF7F2] text-[#2E2A5C] uppercase text-[10px] tracking-wider border-b border-[#5B3E96]/15 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Client Details</th>
                    <th className="py-3.5 px-4">Service &amp; Slot</th>
                    <th className="py-3.5 px-4">Birth Details</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Booked On</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5B3E96]/10 text-xs">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      {/* Booking Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(booking.status)}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2E2A5C] text-xs sm:text-sm">
                          {booking.name}
                        </div>
                        <div className="text-[11px] text-[#2B2A3D]/70">{booking.email}</div>
                        <div className="text-[11px] text-[#2B2A3D]/50 font-mono">{booking.phone}</div>
                      </td>

                      {/* Service & Slot */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-[#2E2A5C] truncate">
                          {booking.service_title || '1-on-1 Comprehensive Session'}
                        </div>
                        <div className="text-[11px] text-[#5B3E96] font-medium mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDate(booking.preferred_date)} • {booking.preferred_slot} Slot
                          </span>
                        </div>
                      </td>

                      {/* Birth Details */}
                      <td className="py-3.5 px-4 text-xs text-[#2B2A3D]/75">
                        {booking.birth_date ? (
                          <div>
                            <div>DOB: {formatDate(booking.birth_date)}</div>
                            <div className="text-[10px] text-[#2B2A3D]/50">
                              Time: {booking.birth_time_unknown ? 'Unknown' : booking.birth_time || '—'}
                              {booking.birth_place ? ` • ${booking.birth_place}` : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#2B2A3D]/40 italic">Not provided</span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {renderPaymentBadge(booking.payment_status)}
                          <span className="font-bold text-[#2E2A5C]">
                            ₹{Number(booking.order_amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {booking.cashfree_order_id && (
                          <div className="text-[10px] text-[#2B2A3D]/50 font-mono mt-0.5 truncate max-w-[120px]">
                            {booking.cashfree_order_id}
                          </div>
                        )}
                      </td>

                      {/* Booked Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#2B2A3D]/60 text-xs">
                        {formatDate(booking.created_at)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(booking)}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/20 text-xs font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#FAF7F2] border-t border-[#5B3E96]/10 flex items-center justify-between text-xs text-[#2B2A3D]/70">
            <div>
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total}{' '}
              total bookings)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#5B3E96]/20 text-[#2E2A5C] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EFEAF8] transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#5B3E96]/20 text-[#2E2A5C] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EFEAF8] transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Manage Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-lg rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden text-[#2B2A3D] max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#2E2A5C] text-[#FBF7EE] p-5 sm:p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FBF7EE] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase tracking-wider text-[#C9A227] font-semibold block mb-1">
                Consultation Management
              </span>
              <h3 className="text-xl font-bold font-heading text-[#FBF7EE]">
                {selectedBooking.name}
              </h3>
              <p className="text-xs text-[#FBF7EE]/80 mt-0.5">
                {selectedBooking.service_title || '1-on-1 Comprehensive Session'}
              </p>
            </div>

            {/* Content & Edit Form */}
            <form onSubmit={handleSaveBooking} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {updateError && (
                <div className="p-3 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs font-semibold text-[#5B3E96]">
                  {updateError}
                </div>
              )}

              {/* Client & Booking Summary Info */}
              <div className="p-4 rounded-xl bg-white border border-[#5B3E96]/15 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#2B2A3D]/70">Contact:</span>
                  <span className="font-semibold text-[#2E2A5C]">
                    {selectedBooking.email} • {selectedBooking.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2B2A3D]/70">Slot Requested:</span>
                  <span className="font-semibold text-[#5B3E96]">
                    {formatDate(selectedBooking.preferred_date)} ({selectedBooking.preferred_slot})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2B2A3D]/70">Gateway Order:</span>
                  <span className="font-mono text-[#2E2A5C]">
                    {selectedBooking.cashfree_order_id || '—'} (Status: {selectedBooking.payment_status || 'pending'})
                  </span>
                </div>
                {selectedBooking.birth_date && (
                  <div className="flex items-center justify-between pt-1 border-t border-[#5B3E96]/10">
                    <span className="text-[#2B2A3D]/70">Birth:</span>
                    <span className="font-medium text-[#2E2A5C]">
                      DOB: {formatDate(selectedBooking.birth_date)} | Time: {selectedBooking.birth_time_unknown ? 'Unknown' : selectedBooking.birth_time || '—'} | Place: {selectedBooking.birth_place || '—'}
                    </span>
                  </div>
                )}
                {selectedBooking.message && (
                  <div className="pt-1 border-t border-[#5B3E96]/10">
                    <span className="text-[#2B2A3D]/70 block mb-0.5">Seeker Note / Area of Concern:</span>
                    <p className="text-[#2E2A5C] bg-[#FAF7F2] p-2 rounded-lg italic">
                      &ldquo;{selectedBooking.message}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1.5">
                  Booking Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['new', 'confirmed', 'completed', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 px-2 text-xs rounded-xl font-bold transition-all border text-center capitalize ${
                        editStatus === st
                          ? 'bg-[#2E2A5C] text-[#FBF7EE] border-[#2E2A5C] shadow-xs'
                          : 'bg-white text-[#2B2A3D]/70 border-secondary/20 hover:bg-mist'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1.5">
                  Internal Admin Notes
                </label>
                <textarea
                  rows={3}
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Record Google Meet / Zoom meeting link, call notes, or follow-up status..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary/25 bg-white text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-secondary/40 leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-xl border border-secondary/25 text-[#2B2A3D] hover:bg-mist text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold transition-all shadow-sm disabled:opacity-60"
                >
                  {isUpdating ? 'Saving...' : 'Save Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBookings
