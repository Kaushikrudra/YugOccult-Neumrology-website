import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Calendar,
  AlertCircle,
  FileText,
  Sparkles,
  Filter,
  HelpCircle,
} from 'lucide-react'
import { api } from '../../lib/api'

interface Order {
  id: string
  type: 'course' | 'consultation' | 'ebook' | 'report' | string
  reference_id: string | null
  reference_title: string | null
  amount: number | string
  status: 'paid' | 'pending' | 'failed' | 'cancelled' | string
  cashfree_order_id: string | null
  payment_session_id: string | null
  cashfree_payment_id: string | null
  payment_method: string | null
  paid_at: string | null
  failure_reason: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  created_at: string
  updated_at?: string
  user_id: string | null
  user_name?: string | null
  user_email?: string | null
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const AdminOrders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const initialType = searchParams.get('type') || ''

  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [typeFilter, setTypeFilter] = useState(initialType)
  const [page, setPage] = useState(1)
  const limit = 10

  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
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
      if (typeFilter && typeFilter !== 'all') {
        params.type = typeFilter
      }

      const res = await api.get<{ orders: Order[]; pagination: PaginationMeta }>(
        '/api/admin/orders',
        { params }
      )

      setOrders(res.orders || [])
      setPagination(res.pagination)
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err?.message || 'Failed to retrieve orders')
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, typeFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
    const newParams: Record<string, string> = {}
    if (status && status !== 'all') newParams.status = status
    if (typeFilter && typeFilter !== 'all') newParams.type = typeFilter
    setSearchParams(newParams)
  }

  const handleTypeChange = (type: string) => {
    setTypeFilter(type)
    setPage(1)
    const newParams: Record<string, string> = {}
    if (statusFilter && statusFilter !== 'all') newParams.status = statusFilter
    if (type && type !== 'all') newParams.type = type
    setSearchParams(newParams)
  }

  // Manually sync order status with Cashfree
  const handleSyncOrder = async (orderId: string) => {
    try {
      setSyncingOrderId(orderId)
      const res = await api.post<{ success: boolean; order: Order; alreadyPaid?: boolean }>(
        `/api/admin/orders/${orderId}/sync`,
        {}
      )
      if (res?.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...res.order } : o))
        )
      }
    } catch (err: any) {
      console.error('Error syncing order:', err)
      alert(err?.message || 'Failed to sync with Cashfree')
    } finally {
      setSyncingOrderId(null)
    }
  }

  // Status badges:
  // Paid = Royal Violet (#5B3E96)
  // Pending = Saffron Amber (#F08A24)
  // Failed = Soft Gold outline (#C9A227)
  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase()
    switch (s) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B3E96]" />
            Paid
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4E6] text-[#F08A24] border border-[#F08A24]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F08A24]" />
            Pending
          </span>
        )
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#2E2A5C] border border-[#C9A227]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
            {s === 'cancelled' ? 'Cancelled' : 'Failed'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#2B2A3D]/70 border border-[#2B2A3D]/20">
            {status}
          </span>
        )
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'course':
        return <BookOpen className="w-4 h-4 text-[#5B3E96] shrink-0" />
      case 'consultation':
        return <Calendar className="w-4 h-4 text-[#C9A227] shrink-0" />
      case 'ebook':
        return <FileText className="w-4 h-4 text-[#5B3E96] shrink-0" />
      case 'report':
        return <Sparkles className="w-4 h-4 text-[#5B3E96] shrink-0" />
      case 'kundli':
        return <Sparkles className="w-4 h-4 text-[#C9A227] shrink-0" />
      case 'ask_question':
        return <HelpCircle className="w-4 h-4 text-[#F08A24] shrink-0" />
      default:
        return <ShoppingBag className="w-4 h-4 text-[#5B3E96] shrink-0" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#5B3E96]/15">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#5B3E96]" />
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C]">
              Orders & Transactions
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-1">
            Real-time Cashfree payments, customer purchases, and gateway reconciliation.
          </p>
        </div>

        <button
          onClick={() => fetchOrders()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#5B3E96]/20 text-[#2E2A5C] text-xs font-semibold hover:bg-[#EFEAF8] transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { label: 'All Statuses', value: '' },
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
            { label: 'Failed / Cancelled', value: 'failed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
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

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#5B3E96]" />
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#5B3E96]/20 text-[#2E2A5C] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
          >
            <option value="">All Offering Types</option>
            <option value="course">Courses</option>
            <option value="consultation">Consultation Bookings</option>
            <option value="ebook">Sacred Ebooks</option>
            <option value="report">Personalised Reports</option>
            <option value="kundli">Kundli Requests</option>
            <option value="ask_question">Astrology Questions</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-3xl border border-[#5B3E96]/15 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#2B2A3D]/60 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5B3E96]" />
            <p className="font-semibold">Loading orders data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#5B3E96] mx-auto" />
            <p className="text-xs sm:text-sm text-[#2E2A5C] font-semibold">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="px-4 py-2 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#2B2A3D]/60 space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-[#5B3E96]/40" />
            <p className="text-sm font-semibold text-[#2E2A5C]">No orders found</p>
            <p>Try adjusting your status or type filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF7F2] text-[#2E2A5C] uppercase text-[10px] tracking-wider border-b border-[#5B3E96]/15 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Offering / Title</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Gateway Reference</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5B3E96]/10 text-xs">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>

                      {/* Type & Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-[#2E2A5C]">
                          {getTypeIcon(order.type)}
                          <span className="capitalize">{order.type}</span>
                        </div>
                        <div className="font-bold text-[#2E2A5C] text-xs sm:text-sm mt-0.5 truncate">
                          {order.reference_title || order.reference_id || 'Sacred Offering'}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2E2A5C] text-xs sm:text-sm">
                          {order.customer_name}
                        </div>
                        <div className="text-[11px] text-[#2B2A3D]/70">{order.customer_email}</div>
                        <div className="text-[11px] text-[#2B2A3D]/50 font-mono">{order.customer_phone}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#2E2A5C]">
                          ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {order.payment_method && (
                          <div className="text-[10px] text-[#5B3E96] font-semibold mt-0.5">
                            {order.payment_method}
                          </div>
                        )}
                      </td>

                      {/* Gateway ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <div className="font-mono text-[#2E2A5C] font-semibold">
                          {order.cashfree_order_id || '—'}
                        </div>
                        {order.cashfree_payment_id && (
                          <div className="text-[10px] text-[#2B2A3D]/50 font-mono">
                            PID: {order.cashfree_payment_id}
                          </div>
                        )}
                        {order.failure_reason && (
                          <div className="text-[10px] text-[#5B3E96] max-w-xs truncate">
                            {order.failure_reason}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#2B2A3D]/70">
                        <div>
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-[#2B2A3D]/50">
                          {new Date(order.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Sync Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={syncingOrderId === order.id}
                          onClick={() => handleSyncOrder(order.cashfree_order_id || order.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/20 text-[11px] font-semibold transition-all inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} />
                          <span>Sync Gateway</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-[#5B3E96]/10">
              {orders.map((order) => (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] flex items-center gap-1.5">
                      {getTypeIcon(order.type)}
                      <span>{order.type}</span>
                    </span>
                    {renderStatusBadge(order.status)}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#2E2A5C]">
                      {order.reference_title || order.reference_id || 'Sacred Offering'}
                    </h4>
                    <p className="text-base font-bold text-[#2E2A5C] mt-1">
                      ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#5B3E96]/10 text-xs space-y-0.5">
                    <div className="font-bold text-[#2E2A5C]">{order.customer_name}</div>
                    <div className="text-[#2B2A3D]/70">{order.customer_email}</div>
                    <div className="text-[#2B2A3D]/50 font-mono text-[11px]">{order.customer_phone}</div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#2B2A3D]/60 pt-1">
                    <span>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <button
                      type="button"
                      disabled={syncingOrderId === order.id}
                      onClick={() => handleSyncOrder(order.cashfree_order_id || order.id)}
                      className="px-2.5 py-1 rounded-md bg-[#FAF7F2] hover:bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/20 text-[10px] font-semibold inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} />
                      <span>Sync</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#FAF7F2] border-t border-[#5B3E96]/10 flex items-center justify-between text-xs text-[#2B2A3D]/70">
            <div>
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total}{' '}
              total orders)
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
    </div>
  )
}

export default AdminOrders
