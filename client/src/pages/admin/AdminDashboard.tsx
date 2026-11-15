import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Mail,
  ShoppingBag,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react'
import { api } from '../../lib/api'

interface DashboardStats {
  totalEnquiries: number
  unreadEnquiries: number
  totalOrders: number
  paidOrders: number
  totalRevenue: number
}

interface EnquiryItem {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  is_read: boolean
  created_at: string
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEnquiries, setRecentEnquiries] = useState<EnquiryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statsData, enquiriesData] = await Promise.all([
        api.get<DashboardStats>('/api/admin/stats'),
        api.get<{ enquiries: EnquiryItem[] }>('/api/admin/enquiries', {
          params: { page: 1, limit: 5 },
        }),
      ])

      setStats(statsData)
      setRecentEnquiries(enquiriesData?.enquiries || [])
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err?.message || 'Failed to load dashboard metrics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    {
      title: 'Total Enquiries',
      value: stats?.totalEnquiries ?? 0,
      icon: MessageSquare,
      color: 'text-[#2E2A5C]',
      bg: 'bg-[#2E2A5C]/10',
      border: 'border-[#2E2A5C]/20',
      link: '/admin/enquiries',
      actionText: 'View All',
    },
    {
      title: 'Unread Enquiries',
      value: stats?.unreadEnquiries ?? 0,
      icon: Mail,
      color: 'text-[#F08A24]',
      bg: 'bg-[#F08A24]/10',
      border: 'border-[#F08A24]/30',
      link: '/admin/enquiries?unread=true',
      actionText: 'Filter Unread',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      color: 'text-[#5B3E96]',
      bg: 'bg-[#5B3E96]/10',
      border: 'border-[#5B3E96]/20',
      link: '/admin/orders',
      actionText: 'View Orders',
    },
    {
      title: 'Paid Orders',
      value: stats?.paidOrders ?? 0,
      icon: CheckCircle2,
      color: 'text-[#C9A227]',
      bg: 'bg-[#C9A227]/15',
      border: 'border-[#C9A227]/40',
      link: '/admin/orders?status=PAID',
      actionText: 'Paid Orders',
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-[#2E2A5C]',
      bg: 'bg-[#EFEAF8]',
      border: 'border-[#5B3E96]/30',
      link: '/admin/orders',
      actionText: 'Revenue Details',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dashboard Overview</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#2E2A5C] mt-1">
            Portal Control Center
          </h1>
          <p className="text-sm text-[#2B2A3D]/70 mt-1">
            Live consultation requests, course enrollments, and seeker messages.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#5B3E96]/20 rounded-xl text-xs font-semibold text-[#2E2A5C] hover:bg-[#EFEAF8] shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#2E2A5C] text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="text-xs font-semibold text-[#5B3E96] underline hover:text-[#2E2A5C]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-2xl p-5 border ${card.border} shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#2B2A3D]/60">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>

              {isLoading ? (
                <div className="h-8 w-24 bg-[#EFEAF8] animate-pulse rounded-lg my-1" />
              ) : (
                <div className="text-2xl font-bold text-[#2E2A5C] tracking-tight">
                  {card.value}
                </div>
              )}
            </div>

            <Link
              to={card.link}
              className="mt-4 pt-3 border-t border-[#5B3E96]/10 inline-flex items-center justify-between text-xs font-medium text-[#5B3E96] hover:text-[#2E2A5C] transition-colors"
            >
              <span>{card.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

      {/* Recent Enquiries Preview */}
      <div className="bg-white rounded-2xl border border-[#5B3E96]/15 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#5B3E96]/10">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Recent Enquiries
            </h2>
            <p className="text-xs text-[#2B2A3D]/70 mt-0.5">
              Latest inquiries received from website visitors
            </p>
          </div>
          <Link
            to="/admin/enquiries"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B3E96] hover:text-[#2E2A5C] transition-colors"
          >
            <span>View All Enquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-16 bg-[#FBF7EE] rounded-xl animate-pulse border border-[#5B3E96]/10"
              />
            ))}
          </div>
        ) : recentEnquiries.length === 0 ? (
          <div className="py-12 text-center text-[#2B2A3D]/60 text-sm">
            No enquiries received yet. Run sample seed script or test public contact submission.
          </div>
        ) : (
          <div className="divide-y divide-[#5B3E96]/10">
            {recentEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FBF7EE]/60 px-3 rounded-xl transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#2E2A5C] truncate">
                      {enquiry.name}
                    </span>
                    {!enquiry.is_read ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F08A24]/15 text-[#F08A24] border border-[#F08A24]/30">
                        New
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFEAF8] text-[#5B3E96]">
                        Read
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#2B2A3D]/80 truncate font-medium">
                    {enquiry.subject}
                  </p>
                  <p className="text-[11px] text-[#2B2A3D]/60 truncate mt-0.5">
                    {enquiry.email} • {enquiry.phone}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:self-center text-xs text-[#2B2A3D]/60">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-[#5B3E96]" />
                    {new Date(enquiry.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <Link
                    to="/admin/enquiries"
                    className="px-3 py-1.5 rounded-lg bg-[#EFEAF8] hover:bg-[#5B3E96]/15 text-[#2E2A5C] text-xs font-semibold transition-colors"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
