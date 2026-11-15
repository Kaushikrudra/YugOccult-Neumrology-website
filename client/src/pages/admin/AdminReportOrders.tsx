import React, { useEffect, useState, useCallback } from 'react'
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Download,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Phone,
  Eye,
} from 'lucide-react'
import { api } from '../../lib/api'
import {
  ReportOrder,
  ReportOrderStatus,
  AdminReport,
  ReportOrderGender,
} from '../../types/report'

const STATUS_CONFIG: Record<
  ReportOrderStatus,
  { label: string; badgeClass: string; bgClass: string }
> = {
  new: {
    label: 'New Order',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    bgClass: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    badgeClass: 'bg-purple-100 text-[#5B3E96] border-purple-300',
    bgClass: 'bg-[#5B3E96]',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    bgClass: 'bg-blue-600',
  },
  delivered: {
    label: 'Delivered',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    bgClass: 'bg-emerald-600',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
    bgClass: 'bg-gray-500',
  },
}

export const AdminReportOrders: React.FC = () => {
  const [orders, setOrders] = useState<ReportOrder[]>([])
  const [reportsCatalog, setReportsCatalog] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [reportFilter, setReportFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState<ReportOrder | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Deliver PDF modal
  const [deliverModalOpen, setDeliverModalOpen] = useState(false)
  const [orderToDeliver, setOrderToDeliver] = useState<ReportOrder | null>(null)
  const [deliverFile, setDeliverFile] = useState<File | null>(null)
  const [delivering, setDelivering] = useState(false)

  // Create Manual Order modal
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [manualFormData, setManualFormData] = useState({
    report_id: '',
    report_title: '',
    name: '',
    email: '',
    whatsapp_number: '',
    gender: '' as ReportOrderGender | '',
    birth_date: '',
    birth_time: '',
    birth_time_unknown: false,
    birth_place: '',
    notes: '',
    amount: 0,
    status: 'paid' as ReportOrderStatus,
    admin_notes: '',
  })
  const [creatingOrder, setCreatingOrder] = useState(false)

  // Admin notes saving state
  const [savingAdminNotes, setSavingAdminNotes] = useState(false)
  const [currentAdminNotes, setCurrentAdminNotes] = useState('')

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev))
    }, 5000)
  }

  // 1. Fetch available reports for dropdowns
  useEffect(() => {
    async function loadReports() {
      try {
        const res = await api.get<{ reports: AdminReport[] }>('/api/admin/reports')
        if (res?.reports) {
          setReportsCatalog(res.reports)
        }
      } catch (err) {
        console.error('[AdminReportOrders:Reports] Failed to fetch catalog:', err)
      }
    }
    loadReports()
  }, [])

  // 2. Fetch orders list
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (reportFilter) {
        params.set('report_id', reportFilter)
      }
      if (search.trim()) {
        params.set('search', search.trim())
      }

      const res = await api.get<{
        success: boolean
        orders: ReportOrder[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(`/api/admin/report-orders?${params.toString()}`)

      if (res?.orders) {
        setOrders(res.orders)
        setTotalCount(res.pagination.total)
        setTotalPages(res.pagination.totalPages)
      }
    } catch (err: any) {
      console.error('[AdminReportOrders:Fetch] Error:', err)
      showToast('error', 'Failed to retrieve report orders')
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter, reportFilter, search])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 3. Open Detail Drawer
  const openDetailModal = (order: ReportOrder) => {
    setSelectedOrder(order)
    setCurrentAdminNotes(order.admin_notes || '')
    setDetailModalOpen(true)
  }

  // 4. Update Status directly
  const handleStatusChange = async (orderId: string, newStatus: ReportOrderStatus) => {
    try {
      const res = await api.patch<{ success: boolean; order: ReportOrder }>(
        `/api/admin/report-orders/${orderId}`,
        { status: newStatus }
      )
      if (res?.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, delivered_at: res.order.delivered_at } : o))
        )
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(res.order)
        }
        showToast('success', `Status updated to ${STATUS_CONFIG[newStatus].label}`)
      }
    } catch (err: any) {
      console.error('[AdminReportOrders:Status] Error:', err)
      showToast('error', 'Failed to update order status')
    }
  }

  // 5. Save Admin Notes
  const handleSaveAdminNotes = async () => {
    if (!selectedOrder) return
    try {
      setSavingAdminNotes(true)
      const res = await api.patch<{ success: boolean; order: ReportOrder }>(
        `/api/admin/report-orders/${selectedOrder.id}`,
        { admin_notes: currentAdminNotes }
      )
      if (res?.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === selectedOrder.id ? { ...o, admin_notes: currentAdminNotes } : o))
        )
        setSelectedOrder(res.order)
        showToast('success', 'Admin notes saved')
      }
    } catch (err: any) {
      console.error('[AdminReportOrders:Notes] Error:', err)
      showToast('error', 'Failed to save admin notes')
    } finally {
      setSavingAdminNotes(false)
    }
  }

  // 6. Download delivered PDF
  const handleDownloadFile = async (order: ReportOrder) => {
    try {
      const res = await api.get<{ url: string }>(`/api/admin/report-orders/${order.id}/file`)
      if (res?.url) {
        const a = document.createElement('a')
        a.href = res.url
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.download = order.delivered_file_name || 'report.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        throw new Error('Signed download URL not provided')
      }
    } catch (err: any) {
      console.error('[AdminReportOrders:Download] Error:', err)
      showToast('error', err?.message || 'Failed to download report PDF')
    }
  }

  // 7. Deliver PDF Upload
  const openDeliverModal = (order: ReportOrder) => {
    setOrderToDeliver(order)
    setDeliverFile(null)
    setDeliverModalOpen(true)
  }

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderToDeliver || !deliverFile) {
      showToast('error', 'Please choose a PDF file to deliver')
      return
    }

    try {
      setDelivering(true)
      const form = new FormData()
      form.append('file', deliverFile)

      const response = await fetch(`/api/admin/report-orders/${orderToDeliver.id}/deliver`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      const res = await response.json()
      if (!response.ok) {
        throw new Error(res?.error || 'Failed to deliver report PDF')
      }

      if (res?.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderToDeliver.id ? res.order : o))
        )
        if (selectedOrder && selectedOrder.id === orderToDeliver.id) {
          setSelectedOrder(res.order)
        }
        setDeliverModalOpen(false)
        setOrderToDeliver(null)
        setDeliverFile(null)
        showToast('success', 'Finished report delivered successfully!')
      }
    } catch (err: any) {
      console.error('[AdminReportOrders:Deliver] Error:', err)
      showToast('error', err?.message || 'Failed to deliver report PDF')
    } finally {
      setDelivering(false)
    }
  }

  // 8. Create Manual Order Submit
  const handleManualOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!manualFormData.name.trim()) {
      showToast('error', 'Customer name is required')
      return
    }
    if (!manualFormData.whatsapp_number.trim()) {
      showToast('error', 'Customer WhatsApp number is required')
      return
    }

    try {
      setCreatingOrder(true)
      const payload = {
        report_id: manualFormData.report_id || null,
        report_title: manualFormData.report_title.trim() || undefined,
        name: manualFormData.name.trim(),
        email: manualFormData.email.trim() || null,
        whatsapp_number: manualFormData.whatsapp_number.trim(),
        gender: manualFormData.gender || null,
        birth_date: manualFormData.birth_date || null,
        birth_time: manualFormData.birth_time_unknown ? null : manualFormData.birth_time || null,
        birth_time_unknown: manualFormData.birth_time_unknown,
        birth_place: manualFormData.birth_place.trim() || null,
        notes: manualFormData.notes.trim() || null,
        amount: Number(manualFormData.amount) || 0,
        status: manualFormData.status,
        admin_notes: manualFormData.admin_notes.trim() || null,
      }

      const res = await api.post<{ success: boolean; order: ReportOrder }>(
        '/api/admin/report-orders',
        payload
      )

      if (res?.success) {
        setManualModalOpen(false)
        showToast('success', 'Manual order registered successfully!')
        fetchOrders()
      }
    } catch (err: any) {
      console.error('[AdminReportOrders:Create] Error:', err)
      showToast('error', err?.message || 'Failed to create manual order')
    } finally {
      setCreatingOrder(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-md hover:bg-black/5 ml-auto text-current"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-secondary/15">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2A3D]">
              Personalised Report Orders
            </h1>
            <span className="text-xs bg-[#5B3E96]/10 text-[#5B3E96] font-bold px-2.5 py-0.5 rounded-full">
              {totalCount} {totalCount === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink/75 mt-1">
            Track customer birth details, update fulfilment stages, and upload finished PDF reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 rounded-xl border border-secondary/20 hover:bg-mist text-ink/70 hover:text-ink transition-colors disabled:opacity-50"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setManualFormData({
                report_id: '',
                report_title: '',
                name: '',
                email: '',
                whatsapp_number: '',
                gender: '',
                birth_date: '',
                birth_time: '',
                birth_time_unknown: false,
                birth_place: '',
                notes: '',
                amount: 0,
                status: 'paid',
                admin_notes: '',
              })
              setManualModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] text-sm font-semibold hover:opacity-95 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            <span>Add Manual Order</span>
          </button>
        </div>
      </div>

      {/* Filters: Search & Dropdowns & Tabs */}
      <div className="space-y-3">
        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['all', 'new', 'paid', 'in_progress', 'delivered', 'cancelled'] as const).map(
            (st) => {
              const active = statusFilter === st
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st)
                    setPage(1)
                  }}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shrink-0 capitalize ${
                    active
                      ? 'bg-[#5B3E96] text-white shadow-xs'
                      : 'bg-white border border-secondary/20 text-ink/75 hover:bg-mist'
                  }`}
                >
                  {st === 'all' ? 'All Orders' : STATUS_CONFIG[st as ReportOrderStatus]?.label || st}
                </button>
              )
            }
          )}
        </div>

        {/* Search & Report filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by customer name, email, WhatsApp, or report title..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-secondary/20 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={reportFilter}
              onChange={(e) => {
                setReportFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 rounded-xl border border-secondary/20 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
            >
              <option value="">Filter by Report (All)</option>
              {reportsCatalog.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#5B3E96] animate-spin mb-3" />
          <p className="text-sm text-ink/70">Loading report orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-secondary/25 p-6">
          <FileText className="w-12 h-12 text-[#C9A227] mx-auto mb-3" />
          <h3 className="font-heading text-lg font-bold text-[#2B2A3D] mb-1">
            No Report Orders Found
          </h3>
          <p className="text-xs sm:text-sm text-ink/70 max-w-md mx-auto mb-5">
            {search || statusFilter !== 'all' || reportFilter
              ? 'No orders matched your filter criteria.'
              : 'There are no report orders recorded in the system yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-secondary/20 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#2E2A5C] text-[#FBF7EE] text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Report</th>
                    <th className="py-3 px-4 font-semibold">Birth Details</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Delivery</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/10">
                  {orders.map((order) => {
                    const cleanPhone = (order.whatsapp_number || '').replace(/\D/g, '')
                    return (
                      <tr key={order.id} className="hover:bg-mist/30 transition-colors">
                        {/* Customer */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#2B2A3D]">{order.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-ink/70">
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#5B3E96] hover:underline flex items-center gap-1 font-medium"
                              title="Chat on WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {order.whatsapp_number}
                            </a>
                            {order.source === 'manual' && (
                              <span className="text-[10px] bg-mist text-ink/60 px-1.5 py-0.2 rounded font-semibold uppercase">
                                manual
                              </span>
                            )}
                          </div>
                          {order.email && (
                            <p className="text-[11px] text-ink/60 truncate max-w-[160px]">
                              {order.email}
                            </p>
                          )}
                        </td>

                        {/* Report */}
                        <td className="py-3 px-4 max-w-[200px]">
                          <p className="font-semibold text-[#2B2A3D] truncate" title={order.report_title}>
                            {order.report_title}
                          </p>
                          <span className="text-[11px] text-ink/50">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>

                        {/* Birth Details */}
                        <td className="py-3 px-4 text-xs text-ink/80">
                          <div className="space-y-0.5">
                            <p>
                              <strong>DOB:</strong> {order.birth_date || 'Not specified'}
                            </p>
                            <p>
                              <strong>Time:</strong>{' '}
                              {order.birth_time_unknown
                                ? 'Unknown'
                                : order.birth_time || 'Not specified'}
                            </p>
                            {order.birth_place && (
                              <p className="truncate max-w-[140px]" title={order.birth_place}>
                                <strong>Place:</strong> {order.birth_place}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 font-bold text-[#2E2A5C]">
                          ₹{order.amount.toLocaleString('en-IN')}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as ReportOrderStatus)
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                              STATUS_CONFIG[order.status]?.badgeClass || ''
                            }`}
                          >
                            <option value="new">New Order</option>
                            <option value="paid">Paid</option>
                            <option value="in_progress">In Progress</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Delivery */}
                        <td className="py-3 px-4">
                          {order.delivered_pdf_path ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(order)}
                                className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 font-semibold transition-colors"
                                title="Download delivered PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeliverModal(order)}
                                className="text-[11px] text-[#5B3E96] hover:underline"
                                title="Replace PDF"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openDeliverModal(order)}
                              className="inline-flex items-center gap-1 text-xs text-[#5B3E96] bg-[#5B3E96]/10 hover:bg-[#5B3E96]/20 px-2.5 py-1 rounded-lg border border-[#5B3E96]/30 font-semibold transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Deliver</span>
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openDetailModal(order)}
                            className="p-1.5 rounded-lg border border-secondary/20 hover:bg-mist text-ink/75 hover:text-ink transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {orders.map((order) => {
              const cleanPhone = (order.whatsapp_number || '').replace(/\D/g, '')
              return (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-2xl border border-secondary/20 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#2B2A3D]">
                        {order.name}
                      </h4>
                      <p className="text-xs font-semibold text-[#5B3E96] mt-0.5">
                        {order.report_title}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        STATUS_CONFIG[order.status]?.badgeClass || ''
                      }`}
                    >
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-ink/75 bg-mist/40 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-ink/50 uppercase block">Birth Date</span>
                      <span className="font-medium">{order.birth_date || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink/50 uppercase block">Birth Time</span>
                      <span className="font-medium">
                        {order.birth_time_unknown ? 'Unknown' : order.birth_time || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink/50 uppercase block">Amount</span>
                      <span className="font-bold text-[#2E2A5C]">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink/50 uppercase block">WhatsApp</span>
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5B3E96] font-medium hover:underline"
                      >
                        {order.whatsapp_number}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-secondary/10">
                    {order.delivered_pdf_path ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(order)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-300 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openDeliverModal(order)}
                        className="inline-flex items-center gap-1 text-xs text-[#5B3E96] bg-[#5B3E96]/10 px-2.5 py-1.5 rounded-lg border border-[#5B3E96]/30 font-semibold"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Deliver Report</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openDetailModal(order)}
                      className="px-3 py-1.5 rounded-lg border border-secondary/25 text-xs font-semibold hover:bg-mist"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-secondary/15 text-xs text-ink/70">
              <span>
                Page {page} of {totalPages} ({totalCount} total orders)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-secondary/25 disabled:opacity-40 hover:bg-mist font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-secondary/25 disabled:opacity-40 hover:bg-mist font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL / DRAWER */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-xl rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden max-h-[90vh] flex flex-col text-[#2B2A3D]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2E2A5C] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A227]">
                  Order Details
                </span>
                <h3 className="font-heading text-lg font-bold text-[#FBF7EE]">
                  {selectedOrder.report_title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Customer info */}
              <div className="bg-white p-4 rounded-xl border border-secondary/15 space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#5B3E96]">
                  Customer Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p>
                    <strong>Name:</strong> {selectedOrder.name}
                  </p>
                  <p>
                    <strong>WhatsApp:</strong>{' '}
                    <a
                      href={`https://wa.me/${selectedOrder.whatsapp_number.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5B3E96] font-semibold underline"
                    >
                      {selectedOrder.whatsapp_number}
                    </a>
                  </p>
                  {selectedOrder.email && (
                    <p>
                      <strong>Email:</strong> {selectedOrder.email}
                    </p>
                  )}
                  {selectedOrder.gender && (
                    <p className="capitalize">
                      <strong>Gender:</strong> {selectedOrder.gender}
                    </p>
                  )}
                  <p>
                    <strong>Order Source:</strong>{' '}
                    <span className="uppercase text-[11px] font-semibold">{selectedOrder.source}</span>
                  </p>
                  <p>
                    <strong>Order Amount:</strong>{' '}
                    <span className="font-bold text-[#2E2A5C]">
                      ₹{selectedOrder.amount.toLocaleString('en-IN')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Birth Chart Data */}
              <div className="bg-white p-4 rounded-xl border border-secondary/15 space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#5B3E96]">
                  Birth Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p>
                    <strong>Date of Birth:</strong> {selectedOrder.birth_date || 'Not provided'}
                  </p>
                  <p>
                    <strong>Time of Birth:</strong>{' '}
                    {selectedOrder.birth_time_unknown
                      ? 'Unknown (Time not available)'
                      : selectedOrder.birth_time || 'Not provided'}
                  </p>
                  <p className="sm:col-span-2">
                    <strong>Place of Birth:</strong>{' '}
                    {selectedOrder.birth_place || 'Not provided'}
                  </p>
                </div>

                {selectedOrder.notes && (
                  <div className="pt-2 border-t border-secondary/10">
                    <span className="text-[11px] font-bold text-ink/70 block mb-0.5">
                      Client's Specific Questions / Notes:
                    </span>
                    <p className="text-xs bg-mist/50 p-2.5 rounded-lg whitespace-pre-line text-ink/90">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Fulfilment & PDF Status */}
              <div className="bg-white p-4 rounded-xl border border-secondary/15 space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#5B3E96]">
                  Report Delivery Status
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Status:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) =>
                        handleStatusChange(selectedOrder.id, e.target.value as ReportOrderStatus)
                      }
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                        STATUS_CONFIG[selectedOrder.status]?.badgeClass || ''
                      }`}
                    >
                      <option value="new">New Order</option>
                      <option value="paid">Paid</option>
                      <option value="in_progress">In Progress</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {selectedOrder.delivered_pdf_path ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(selectedOrder)}
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl font-bold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false)
                        openDeliverModal(selectedOrder)
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-[#5B3E96] bg-[#5B3E96]/10 hover:bg-[#5B3E96]/20 px-3 py-1.5 rounded-xl font-bold transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Finished PDF</span>
                    </button>
                  )}
                </div>

                {selectedOrder.delivered_at && (
                  <p className="text-[11px] text-ink/60">
                    Delivered on: {new Date(selectedOrder.delivered_at).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {/* Admin Notes */}
              <div className="bg-white p-4 rounded-xl border border-secondary/15 space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-[#5B3E96] block">
                  Internal Team Notes
                </label>
                <textarea
                  rows={3}
                  value={currentAdminNotes}
                  onChange={(e) => setCurrentAdminNotes(e.target.value)}
                  placeholder="Private internal notes regarding astrology analysis, pending follow-ups, or special instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 resize-y"
                />
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleSaveAdminNotes}
                    disabled={savingAdminNotes}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5B3E96] text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50"
                  >
                    {savingAdminNotes && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELIVER PDF MODAL */}
      {deliverModalOpen && orderToDeliver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-md rounded-2xl shadow-2xl border border-secondary/20 p-6 text-[#2B2A3D]">
            <div className="flex items-center justify-between pb-3 border-b border-secondary/15 mb-4">
              <h3 className="font-heading text-lg font-bold text-[#2B2A3D]">
                Deliver Personalised Report
              </h3>
              <button
                type="button"
                onClick={() => setDeliverModalOpen(false)}
                className="p-1 rounded-full text-ink/60 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-mist/60 p-3 rounded-xl border border-secondary/15 text-xs text-ink/85 space-y-1">
                <p>
                  <strong>Customer:</strong> {orderToDeliver.name}
                </p>
                <p>
                  <strong>Report:</strong> {orderToDeliver.report_title}
                </p>
              </div>

              {orderToDeliver.delivered_pdf_path && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 inline mr-1 -mt-0.5" />
                  <strong>Note:</strong> A report PDF was already delivered. Uploading a new file will replace the previous PDF.
                </div>
              )}

              <form onSubmit={handleDeliverSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                    Select Finished PDF Report (Max 25MB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="file"
                    required
                    accept="application/pdf,.pdf"
                    onChange={(e) => setDeliverFile(e.target.files?.[0] || null)}
                    className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#5B3E96] file:text-white hover:file:opacity-95"
                  />
                  <p className="text-[11px] text-ink/50 mt-1">
                    Only authentic PDF documents (.pdf) starting with `%PDF-` are accepted.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliverModalOpen(false)}
                    disabled={delivering}
                    className="px-4 py-2 rounded-xl border border-secondary/25 text-xs font-semibold hover:bg-mist"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={delivering || !deliverFile}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:opacity-95 disabled:opacity-50 shadow-md"
                  >
                    {delivering && <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />}
                    <span>Upload & Deliver Report</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL ORDER MODAL */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-2xl rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden max-h-[90vh] flex flex-col text-[#2B2A3D]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2E2A5C] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[#FBF7EE]">
                  Record Manual Report Order
                </h3>
                <p className="text-xs text-[#C9A227] mt-0.5">
                  For offline bookings, phone inquiries, or WhatsApp direct requests
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleManualOrderSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Report Selection */}
              <div className="bg-white p-4 rounded-xl border border-secondary/15 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B3E96] block">
                  Select Report Product
                </label>
                <select
                  value={manualFormData.report_id}
                  onChange={(e) => {
                    const repId = e.target.value
                    const found = reportsCatalog.find((r) => r.id === repId)
                    setManualFormData((prev) => ({
                      ...prev,
                      report_id: repId,
                      report_title: found ? found.title : prev.report_title,
                      amount: found ? found.price : prev.amount,
                    }))
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm"
                >
                  <option value="">Select from catalog (or custom title below)</option>
                  {reportsCatalog.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} (₹{r.price.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/75 block">
                    Report Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualFormData.report_title}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, report_title: e.target.value })
                    }
                    placeholder="e.g. Personalised Kundli & Life Prediction Report"
                    className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-white p-4 rounded-xl border border-secondary/15 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B3E96] block">
                  Customer Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink/80 block">
                      Customer Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={manualFormData.name}
                      onChange={(e) => setManualFormData({ ...manualFormData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink/80 block">
                      WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={manualFormData.whatsapp_number}
                      onChange={(e) =>
                        setManualFormData({ ...manualFormData, whatsapp_number: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink/80 block">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={manualFormData.email}
                      onChange={(e) =>
                        setManualFormData({ ...manualFormData, email: e.target.value })
                      }
                      placeholder="customer@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink/80 block">Gender</label>
                    <select
                      value={manualFormData.gender}
                      onChange={(e) =>
                        setManualFormData({
                          ...manualFormData,
                          gender: e.target.value as ReportOrderGender | '',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Birth Chart Details */}
              <div className="bg-white p-4 rounded-xl border border-secondary/15 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B3E96] block">
                  Birth Chart Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink/80 block">Date of Birth</label>
                    <input
                      type="date"
                      value={manualFormData.birth_date}
                      onChange={(e) =>
                        setManualFormData({ ...manualFormData, birth_date: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink/80 block">Birth Time</label>
                    <input
                      type="time"
                      disabled={manualFormData.birth_time_unknown}
                      value={manualFormData.birth_time}
                      onChange={(e) =>
                        setManualFormData({ ...manualFormData, birth_time: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs disabled:opacity-40"
                    />
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-ink/70 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={manualFormData.birth_time_unknown}
                        onChange={(e) =>
                          setManualFormData({
                            ...manualFormData,
                            birth_time_unknown: e.target.checked,
                          })
                        }
                        className="rounded border-secondary/30 text-[#5B3E96]"
                      />
                      <span>Time unknown</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink/80 block">Birth Place</label>
                    <input
                      type="text"
                      value={manualFormData.birth_place}
                      onChange={(e) =>
                        setManualFormData({ ...manualFormData, birth_place: e.target.value })
                      }
                      placeholder="City, State"
                      className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink/80 block">
                    Client's Questions / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={manualFormData.notes}
                    onChange={(e) => setManualFormData({ ...manualFormData, notes: e.target.value })}
                    placeholder="Specific questions about career, marriage, health, etc."
                    className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs resize-y"
                  />
                </div>
              </div>

              {/* Order Amount & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-secondary/15">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualFormData.amount}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, amount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm font-bold text-[#2E2A5C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                    Initial Status
                  </label>
                  <select
                    value={manualFormData.status}
                    onChange={(e) =>
                      setManualFormData({
                        ...manualFormData,
                        status: e.target.value as ReportOrderStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm font-semibold"
                  >
                    <option value="paid">Paid</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                  Team Admin Notes (Internal)
                </label>
                <textarea
                  rows={2}
                  value={manualFormData.admin_notes}
                  onChange={(e) =>
                    setManualFormData({ ...manualFormData, admin_notes: e.target.value })
                  }
                  placeholder="Payment received via UPI, phone consultation scheduled, etc."
                  className="w-full px-3 py-2 rounded-xl border border-secondary/25 text-xs resize-y"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-secondary/15 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  disabled={creatingOrder}
                  className="px-4 py-2 rounded-xl border border-secondary/25 text-xs font-semibold hover:bg-mist"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:opacity-95 disabled:opacity-50 shadow-md"
                >
                  {creatingOrder && <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />}
                  <span>Record Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReportOrders
