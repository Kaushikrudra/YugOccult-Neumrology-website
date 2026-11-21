import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  BookOpen,
  Calendar,
  FileText,
  Home,
} from 'lucide-react'
import Container from '../components/Container'
import { api } from '../lib/api'

interface OrderStatusData {
  orderId: string
  status: 'paid' | 'pending' | 'failed' | 'cancelled' | string
  type: 'course' | 'consultation' | 'ebook' | 'report' | string
  referenceTitle: string | null
  amount: number
  paidAt: string | null
  failureReason: string | null
}

export const PaymentStatus: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('order_id') || searchParams.get('orderId')

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderStatusData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStatus = useCallback(async (isManualRefresh = false) => {
    if (!orderId) {
      setError('No order reference ID provided.')
      setLoading(false)
      return
    }

    try {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      const data = await api.get<OrderStatusData>(`/api/payments/status/${orderId}`)
      setOrder(data)
    } catch (err: any) {
      console.error('[PaymentStatus] Error checking order status:', err)
      setError(err?.message || 'Could not verify payment status. Please try refreshing.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return ''
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return isoString
    }
  }

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'course':
        return 'Course Enrollment'
      case 'consultation':
        return '1-on-1 Consultation'
      case 'ebook':
        return 'Sacred Ebook'
      case 'report':
        return 'Personalised Report'
      default:
        return 'Order'
    }
  }

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-5 h-5 text-[#5B3E96]" />
      case 'consultation':
        return <Calendar className="w-5 h-5 text-[#5B3E96]" />
      case 'ebook':
        return <FileText className="w-5 h-5 text-[#5B3E96]" />
      case 'report':
        return <Sparkles className="w-5 h-5 text-[#5B3E96]" />
      default:
        return <ShoppingBag className="w-5 h-5 text-[#5B3E96]" />
    }
  }

  return (
    <div className="py-12 sm:py-20 bg-[#FAF7F2] min-h-[75vh] flex items-center">
      <Container className="max-w-2xl">
        <div className="bg-white rounded-3xl border border-[#2E2A5C]/15 shadow-lg overflow-hidden">
          {/* Card Header Strip */}
          <div className="bg-[#2E2A5C] px-6 py-6 text-center border-b border-[#C9A227]/30">
            <span className="text-[#C9A227] text-xs font-semibold uppercase tracking-widest block mb-1">
              Payment Verification
            </span>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#FBF7EE]">
              Transaction Details
            </h1>
          </div>

          <div className="p-6 sm:p-10">
            {loading ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-[#EFEAF8] border-t-[#5B3E96] animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[#2E2A5C] tracking-wide">
                  Checking payment confirmation with Cashfree...
                </p>
                <p className="text-xs text-[#2B2A3D]/70">
                  Please hold on while we verify your transaction status.
                </p>
              </div>
            ) : error ? (
              <div className="py-8 text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-[#EFEAF8] border border-[#5B3E96]/30 flex items-center justify-center mx-auto text-[#5B3E96]">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-1">
                    Status Verification Notice
                  </h3>
                  <p className="text-xs sm:text-sm text-[#2B2A3D]/80 max-w-md mx-auto leading-relaxed">
                    {error}
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fetchStatus(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:bg-[#3C3775] transition-all disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Try Again</span>
                  </button>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#2E2A5C]/20 text-[#2E2A5C] text-xs font-semibold hover:bg-[#FAF7F2] transition-all"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Back to Home</span>
                  </Link>
                </div>
              </div>
            ) : order ? (
              <div className="space-y-6">
                {/* Status Hero Block */}
                {order.status === 'paid' && (
                  <div className="text-center space-y-3 pb-6 border-b border-[#2E2A5C]/10">
                    <div className="w-16 h-16 rounded-full bg-[#5B3E96] text-[#FBF7EE] flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-9 h-9 text-[#C9A227]" />
                    </div>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/30 mb-2">
                        Payment Successful
                      </span>
                      <h2 className="font-heading text-2xl font-bold text-[#2E2A5C]">
                        Thank You!
                      </h2>
                      <p className="text-xs sm:text-sm text-[#2B2A3D]/75 max-w-md mx-auto mt-1 leading-relaxed">
                        Your payment has been received and verified successfully.
                      </p>
                    </div>
                  </div>
                )}

                {order.status === 'pending' && (
                  <div className="text-center space-y-3 pb-6 border-b border-[#2E2A5C]/10">
                    <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border-2 border-[#F08A24] text-[#F08A24] flex items-center justify-center mx-auto shadow-sm">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4E6] text-[#F08A24] border border-[#F08A24]/40 mb-2">
                        Payment Pending Confirmation
                      </span>
                      <h2 className="font-heading text-2xl font-bold text-[#2E2A5C]">
                        Confirming Your Payment
                      </h2>
                      <p className="text-xs sm:text-sm text-[#2B2A3D]/75 max-w-md mx-auto mt-1 leading-relaxed">
                        We are waiting for final confirmation from your bank or payment app. Please click below to refresh the status.
                      </p>
                    </div>
                  </div>
                )}

                {(order.status === 'failed' || order.status === 'cancelled') && (
                  <div className="text-center space-y-3 pb-6 border-b border-[#2E2A5C]/10">
                    <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border-2 border-[#C9A227] text-[#2E2A5C] flex items-center justify-center mx-auto shadow-sm">
                      <AlertCircle className="w-8 h-8 text-[#5B3E96]" />
                    </div>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FAF7F2] text-[#2E2A5C] border border-[#C9A227] mb-2">
                        {order.status === 'cancelled' ? 'Order Cancelled' : 'Payment Incomplete'}
                      </span>
                      <h2 className="font-heading text-2xl font-bold text-[#2E2A5C]">
                        Transaction Not Completed
                      </h2>
                      <p className="text-xs sm:text-sm text-[#2B2A3D]/75 max-w-md mx-auto mt-1 leading-relaxed">
                        {order.failureReason || 'The transaction could not be processed at the payment gateway.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Summary Details Table */}
                <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#2E2A5C]/10 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2E2A5C]/10">
                    <span className="text-[#2B2A3D]/70 font-medium">Item</span>
                    <div className="flex items-center gap-1.5 font-bold text-[#2E2A5C] text-right">
                      {getTypeIcon(order.type)}
                      <span>{order.referenceTitle || getTypeLabel(order.type)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#2E2A5C]/10">
                    <span className="text-[#2B2A3D]/70 font-medium">Order Type</span>
                    <span className="font-semibold text-[#5B3E96]">{getTypeLabel(order.type)}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#2E2A5C]/10">
                    <span className="text-[#2B2A3D]/70 font-medium">Order Reference</span>
                    <span className="font-mono text-xs font-medium text-[#2E2A5C]">
                      {order.orderId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#2E2A5C]/10">
                    <span className="text-[#2B2A3D]/70 font-medium">Amount</span>
                    <span className="font-heading text-lg font-bold text-[#2E2A5C]">
                      ₹{order.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {order.paidAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#2B2A3D]/70 font-medium">Paid On</span>
                      <span className="font-medium text-[#2B2A3D]">
                        {formatDate(order.paidAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contextual Next Steps & Guidance */}
                {order.status === 'paid' && (
                  <div className="p-4 rounded-2xl bg-[#EFEAF8]/60 border border-[#5B3E96]/20 text-xs text-[#2E2A5C] space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-[#5B3E96]">
                      <Sparkles className="w-4 h-4 text-[#C9A227]" />
                      Next Steps
                    </span>
                    {order.type === 'course' && (
                      <p className="leading-relaxed text-[#2B2A3D]/80">
                        Your course access has been activated immediately. You can now access all learning materials, videos, and class schedules in your student dashboard.
                      </p>
                    )}
                    {order.type === 'ebook' && (
                      <p className="leading-relaxed text-[#2B2A3D]/80">
                        Your sacred ebook is ready for download in your account dashboard under &ldquo;My Ebooks&rdquo;.
                      </p>
                    )}
                    {order.type === 'consultation' && (
                      <p className="leading-relaxed text-[#2B2A3D]/80">
                        Our consultation coordinator will review your submitted birth details and connect with you via WhatsApp or email to confirm the exact session schedule and video meeting link.
                      </p>
                    )}
                    {order.type === 'report' && (
                      <p className="leading-relaxed text-[#2B2A3D]/80">
                        Anushka Yadav ji and her Vedic analysis team will manually prepare your sacred report within 24 to 48 hours. The completed PDF will be uploaded to your account and notified via WhatsApp.
                      </p>
                    )}
                  </div>
                )}

                {/* Actions Button Group */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {order.status === 'paid' && (
                    <>
                      {order.type === 'course' && (
                        <Link
                          to="/account"
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span>Go to My Courses</span>
                          <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                        </Link>
                      )}
                      {order.type === 'ebook' && (
                        <Link
                          to="/account"
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span>Go to My Ebooks</span>
                          <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                        </Link>
                      )}
                      {order.type === 'report' && (
                        <Link
                          to="/account"
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span>View My Reports</span>
                          <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                        </Link>
                      )}
                      {order.type === 'consultation' && (
                        <Link
                          to="/account"
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span>View My Account</span>
                          <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                        </Link>
                      )}
                      <Link
                        to="/"
                        className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#2E2A5C]/25 text-[#2E2A5C] hover:bg-[#FAF7F2] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center"
                      >
                        <span>Back to Home</span>
                      </Link>
                    </>
                  )}

                  {order.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => fetchStatus(true)}
                        disabled={refreshing}
                        className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Check Status Again</span>
                      </button>
                      <Link
                        to="/contact"
                        className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#2E2A5C]/25 text-[#2E2A5C] hover:bg-[#FAF7F2] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center"
                      >
                        <span>Contact Support</span>
                      </Link>
                    </>
                  )}

                  {(order.status === 'failed' || order.status === 'cancelled') && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>Try Again</span>
                      </button>
                      <Link
                        to="/contact"
                        className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#2E2A5C]/25 text-[#2E2A5C] hover:bg-[#FAF7F2] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center"
                      >
                        <span>Need Help?</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  )
}

export default PaymentStatus
