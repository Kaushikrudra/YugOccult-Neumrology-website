import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  BookOpen,
  Calendar,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import { api } from '../../lib/api'

interface Order {
  id: string
  type: string
  reference_id: string | null
  amount: number | string
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | string
  cashfree_order_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  created_at: string
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

  const [statusFilter, setStatusFilter] = useState(initialStatus)
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

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params: Record<string, any> = {
        page,
        limit,
      }
      if (statusFilter) {
        params.status = statusFilter
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
  }, [page, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
    if (status) {
      setSearchParams({ status })
    } else {
      setSearchParams({})
    }
  }

  // Status badges:
  // Paid = Royal Violet (#5B3E96)
  // Pending = Saffron Amber (#F08A24)
  // Failed = Soft Gold outline (#C9A227)
  const renderStatusBadge = (status: string) => {
    const normalized = (status || '').toUpperCase()

    if (normalized === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5B3E96]/15 text-[#5B3E96] border border-[#5B3E96]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5B3E96]" />
          Paid
        </span>
      )
    }

    if (normalized === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F08A24]/15 text-[#F08A24] border border-[#F08A24]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F08A24]" />
          Pending
        </span>
      )
    }

    // Failed or Refunded or other status -> Soft Gold outline (NO RED)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#C9A227] border border-[#C9A227]/40 bg-[#C9A227]/10">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
        {normalized || 'FAILED'}
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Consultation & Course Orders</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#2E2A5C] mt-1">
            Orders & Bookings
          </h1>
          <p className="text-sm text-[#2B2A3D]/70 mt-0.5">
            Read-only overview of consultations booked and sacred course purchases.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter buttons */}
          {[
            { label: 'All Orders', value: '' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Failed', value: 'FAILED' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => handleStatusChange(btn.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === btn.value
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] border-[#2E2A5C] shadow-sm'
                  : 'bg-white text-[#2B2A3D]/80 border-[#5B3E96]/20 hover:bg-[#EFEAF8]'
              }`}
            >
              {btn.label}
            </button>
          ))}

          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white border border-[#5B3E96]/20 text-[#2E2A5C] hover:bg-[#EFEAF8] shadow-sm transition-colors disabled:opacity-50"
            title="Refresh list"
            aria-label="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#2E2A5C] text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#5B3E96]" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOrders}
            className="text-xs font-semibold text-[#5B3E96] underline hover:text-[#2E2A5C]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders Table Container */}
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
        ) : orders.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#EFEAF8] text-[#5B3E96] flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[#2E2A5C]">
              No orders found
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 max-w-sm mx-auto mt-1">
              {statusFilter
                ? `No orders matching status "${statusFilter}". Try selecting "All Orders".`
                : 'No consultation or course orders recorded yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FBF7EE] border-b border-[#5B3E96]/10 text-[11px] font-semibold uppercase tracking-wider text-[#2B2A3D]/70">
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Type & Details</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Date & Gateway ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5B3E96]/10 text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FBF7EE]/60 transition-colors">
                      {/* Status badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>

                      {/* Order Type & Reference */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-[#2E2A5C] text-sm">
                          {order.type.toLowerCase() === 'course' ? (
                            <BookOpen className="w-4 h-4 text-[#5B3E96] shrink-0" />
                          ) : (
                            <Calendar className="w-4 h-4 text-[#C9A227] shrink-0" />
                          )}
                          <span className="capitalize">{order.type}</span>
                        </div>
                        <div className="text-xs text-[#2B2A3D]/70 mt-0.5 truncate max-w-xs">
                          {order.reference_id || 'Personal Astrology Consultation'}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2E2A5C] text-sm">
                          {order.customer_name}
                        </div>
                        <div className="text-xs text-[#2B2A3D]/70">{order.customer_email}</div>
                        <div className="text-[11px] text-[#2B2A3D]/50">{order.customer_phone}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-base font-bold text-[#2E2A5C]">
                          ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Date and Gateway ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#2B2A3D]/60">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#5B3E96]" />
                          <span>
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {order.cashfree_order_id && (
                          <div className="text-[11px] text-[#2B2A3D]/50 font-mono mt-0.5 flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-[#C9A227]" />
                            <span>{order.cashfree_order_id}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#5B3E96]/10">
              {orders.map((order) => (
                <div key={order.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                      {order.type}
                    </span>
                    {renderStatusBadge(order.status)}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#2E2A5C]">
                      {order.reference_id || 'Personal Astrology Consultation'}
                    </h4>
                    <p className="text-base font-extrabold text-[#2E2A5C] mt-1">
                      ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Buyer details line on mobile */}
                  <div className="bg-[#FBF7EE] p-3 rounded-xl border border-[#5B3E96]/10 text-xs">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#5B3E96] block mb-0.5">
                      Buyer Information
                    </span>
                    <div className="font-semibold text-[#2E2A5C]">{order.customer_name}</div>
                    <div className="text-[#2B2A3D]/70">{order.customer_email}</div>
                    <div className="text-[#2B2A3D]/50 text-[11px]">{order.customer_phone}</div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#2B2A3D]/60 pt-1">
                    <span>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {order.cashfree_order_id && (
                      <span className="font-mono text-[#C9A227]">{order.cashfree_order_id}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#FBF7EE] border-t border-[#5B3E96]/10 flex items-center justify-between text-xs text-[#2B2A3D]/70">
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
