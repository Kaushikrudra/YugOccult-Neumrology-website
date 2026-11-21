import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  GraduationCap,
  User,
  LogOut,
  ExternalLink,
  Download,
  FileText,
  Video,
  Link as LinkIcon,
  Layers,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  BookOpen,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Container from '../components/Container'

interface EnrolledCourse {
  id: string
  title: string
  description: string
  level: string
  duration: string
  image_url: string | null
  enrollment_id: string
  status: string
  source: string
  granted_at: string
  expires_at: string | null
  is_expired?: boolean
  materials_count: number
}

interface CourseMaterial {
  id: string
  course_id: string
  title: string
  kind: 'file' | 'video_link' | 'link'
  url: string | null
  file_name: string | null
  size_bytes: number | null
  position: number
  created_at: string
}

interface UserOrder {
  id: string
  type: string
  reference_title: string | null
  amount: number
  status: string
  payment_method: string | null
  paid_at: string | null
  created_at: string
  cashfree_order_id: string | null
  failure_reason: string | null
}

interface PurchasedEbook {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  file_name: string
  size_bytes: number
  price: number
  purchased_at: string
}

interface UserReportOrder {
  id: string
  report_id: string
  report_title: string
  amount: number
  status: string
  details: string | null
  delivered_at: string | null
  delivered_file_name: string | null
  has_file: boolean
  created_at: string
  payment_status: string
}

export const Account: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialTab = (searchParams.get('tab') as any) || 'courses'
  const [activeTab, setActiveTab] = useState<'courses' | 'ebooks' | 'reports' | 'orders' | 'profile'>(
    ['courses', 'ebooks', 'reports', 'orders', 'profile'].includes(initialTab) ? initialTab : 'courses'
  )

  // Enrolled Courses State
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  // Selected course for viewing materials
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)
  const [accessingMaterialId, setAccessingMaterialId] = useState<string | null>(null)

  // Orders State
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  // Ebooks State
  const [ebooks, setEbooks] = useState<PurchasedEbook[]>([])
  const [loadingEbooks, setLoadingEbooks] = useState(false)
  const [downloadingEbookId, setDownloadingEbookId] = useState<string | null>(null)

  // Reports State
  const [reports, setReports] = useState<UserReportOrder[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/account', { replace: true })
    }
  }, [user, authLoading, navigate])

  // Fetch enrolled courses
  const fetchEnrolledCourses = async () => {
    try {
      setLoadingCourses(true)
      setCoursesError(null)
      const data = await api.get<{ courses: EnrolledCourse[] }>('/api/account/courses')
      setCourses(data.courses || [])
    } catch (err: any) {
      console.error('Failed to load courses:', err)
      setCoursesError(err?.message || 'Failed to load your enrolled courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      setOrdersError(null)
      const data = await api.get<{ orders: UserOrder[] }>('/api/account/orders')
      setOrders(data.orders || [])
    } catch (err: any) {
      console.error('Failed to load orders:', err)
      setOrdersError(err?.message || 'Failed to load order history')
    } finally {
      setLoadingOrders(false)
    }
  }

  // Fetch purchased ebooks
  const fetchEbooks = async () => {
    try {
      setLoadingEbooks(true)
      const data = await api.get<{ ebooks: PurchasedEbook[] }>('/api/account/ebooks')
      setEbooks(data.ebooks || [])
    } catch (err) {
      console.error('Failed to load ebooks:', err)
    } finally {
      setLoadingEbooks(false)
    }
  }

  // Fetch report orders
  const fetchReports = async () => {
    try {
      setLoadingReports(true)
      const data = await api.get<{ reports: UserReportOrder[] }>('/api/account/report-orders')
      setReports(data.reports || [])
    } catch (err) {
      console.error('Failed to load report orders:', err)
    } finally {
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses()
      fetchOrders()
      fetchEbooks()
      fetchReports()
    }
  }, [user])

  // Fetch materials when a course is selected
  const handleSelectCourse = async (course: EnrolledCourse) => {
    setSelectedCourse(course)
    setMaterials([])
    setMaterialsError(null)

    if (course.is_expired) {
      setMaterialsError(
        'Your 1-year course access has ended. Please renew your course enrollment to access lesson materials and videos.'
      )
      return
    }

    setLoadingMaterials(true)

    try {
      const data = await api.get<{ materials: CourseMaterial[] }>(
        `/api/account/courses/${course.id}/materials`
      )
      setMaterials(data.materials || [])
    } catch (err: any) {
      console.error('Failed to load materials:', err)
      setMaterialsError(err?.message || 'Failed to load course materials')
    } finally {
      setLoadingMaterials(false)
    }
  }

  // Access material
  const handleAccessMaterial = async (material: CourseMaterial, action: 'view' | 'download' = 'view') => {
    try {
      setAccessingMaterialId(material.id)
      const res = await api.post<{
        success: boolean
        accessType: 'signed_url' | 'link'
        url: string
        fileName?: string
      }>(`/api/account/materials/${material.id}/access`, { action })

      if (res.accessType === 'signed_url' && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      } else if (res.accessType === 'link' && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      }
    } catch (err: any) {
      console.error('Failed to open material:', err)
      alert(err?.message || 'Could not access material. Please try again.')
    } finally {
      setAccessingMaterialId(null)
    }
  }

  // Download purchased ebook
  const handleDownloadEbook = async (ebook: PurchasedEbook) => {
    try {
      setDownloadingEbookId(ebook.id)
      const res = await api.post<{ url: string }>(`/api/ebooks/${ebook.id}/download`, {})
      if (res?.url) {
        const a = document.createElement('a')
        a.href = res.url
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.download = ebook.file_name || 'Ebook.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (err: any) {
      console.error('Ebook download error:', err)
      alert(err?.message || 'Failed to download ebook')
    } finally {
      setDownloadingEbookId(null)
    }
  }

  // Download delivered report
  const handleDownloadReport = async (reportOrder: UserReportOrder) => {
    try {
      setDownloadingReportId(reportOrder.id)
      const res = await api.post<{ url: string; fileName: string }>(
        `/api/account/report-orders/${reportOrder.id}/download`,
        {}
      )
      if (res?.url) {
        const a = document.createElement('a')
        a.href = res.url
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.download = res.fileName || 'Personalised-Report.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (err: any) {
      console.error('Report download error:', err)
      alert(err?.message || 'Failed to download report PDF')
    } finally {
      setDownloadingReportId(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return ''
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
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

  const getRemainingValidity = (expiresAt?: string | null) => {
    if (!expiresAt) return null
    try {
      const exp = new Date(expiresAt).getTime()
      const now = Date.now()
      const diffMs = exp - now
      if (diffMs <= 0) return { expired: true, text: 'Access expired' }
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      if (days <= 30) {
        return { expired: false, urgent: true, text: `${days} day${days === 1 ? '' : 's'} left` }
      }
      return { expired: false, urgent: false, text: `${days} days remaining` }
    } catch {
      return null
    }
  }

  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase()
    switch (s) {
      case 'paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/30">
            Paid
          </span>
        )
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E6] text-[#F08A24] border border-[#F08A24]/40">
            Pending
          </span>
        )
      case 'failed':
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#2E2A5C] border border-[#C9A227]">
            {s === 'cancelled' ? 'Cancelled' : 'Failed'}
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#2B2A3D]/70 border border-[#2B2A3D]/20">
            {status}
          </span>
        )
    }
  }

  if (authLoading || (!user && !coursesError)) {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-3 border-[#EFEAF8] border-t-[#2E2A5C] animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-widest uppercase text-[#2E2A5C]/70 ml-3">
          Loading Seeker Account...
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#5B3E96]/20 max-w-md w-full shadow-sm">
          <ShieldAlert className="w-12 h-12 text-[#5B3E96] mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-[#2E2A5C] mb-2">
            Sign In Required
          </h2>
          <p className="text-xs text-[#2B2A3D]/75 mb-6">
            Please sign in to access your course materials and account dashboard.
          </p>
          <Link
            to="/login?redirect=/account"
            className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:bg-[#3C3775] transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF7EE] py-10 sm:py-14 text-[#2B2A3D]">
      <Container>
        {/* Profile Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#5B3E96]/15 shadow-sm mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center justify-center text-[#2E2A5C] text-2xl font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFEAF8] text-[#5B3E96] mb-1">
                  <Sparkles className="w-3 h-3 text-[#C9A227]" />
                  <span>Seeker Member</span>
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C]">
                  {user.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#2B2A3D]/70">{user.email}</p>
                {user.phone && <p className="text-xs text-[#2B2A3D]/50 mt-0.5">{user.phone}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold shadow-sm hover:bg-[#3C3775] transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE] hover:bg-[#EFEAF8] text-xs font-semibold text-[#2E2A5C] transition-colors"
              >
                <LogOut className="w-4 h-4 text-[#5B3E96]" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-[#5B3E96]/10 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setActiveTab('courses')
                setSelectedCourse(null)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === 'courses'
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
                  : 'bg-[#FBF7EE] text-[#2B2A3D]/70 hover:bg-[#EFEAF8]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>My Courses ({courses.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ebooks')
                setSelectedCourse(null)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === 'ebooks'
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
                  : 'bg-[#FBF7EE] text-[#2B2A3D]/70 hover:bg-[#EFEAF8]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>My Ebooks ({ebooks.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('reports')
                setSelectedCourse(null)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
                  : 'bg-[#FBF7EE] text-[#2B2A3D]/70 hover:bg-[#EFEAF8]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Reports ({reports.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders')
                setSelectedCourse(null)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
                  : 'bg-[#FBF7EE] text-[#2B2A3D]/70 hover:bg-[#EFEAF8]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>My Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile')
                setSelectedCourse(null)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
                  : 'bg-[#FBF7EE] text-[#2B2A3D]/70 hover:bg-[#EFEAF8]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </div>
        </div>

        {/* TAB 1: COURSES */}
        {activeTab === 'courses' && (
          <div>
            {selectedCourse ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#5B3E96]/15 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#5B3E96]/10 flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B3E96] hover:text-[#2E2A5C]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to all courses</span>
                  </button>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="text-[#2B2A3D]/60">
                      Enrolled on {formatDate(selectedCourse.granted_at)}
                    </span>
                    {selectedCourse.expires_at && (
                      <span
                        className={
                          selectedCourse.is_expired
                            ? 'text-[#C9A227] font-semibold'
                            : 'text-[#5B3E96] font-semibold'
                        }
                      >
                        • {selectedCourse.is_expired ? 'Access Expired' : `Valid till ${formatDate(selectedCourse.expires_at)}`}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="font-heading text-2xl font-bold text-[#2E2A5C] mb-1">
                    {selectedCourse.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed">
                    {selectedCourse.description}
                  </p>
                </div>

                {selectedCourse.is_expired && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF7EE] border border-[#C9A227] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-heading font-bold text-[#2E2A5C] text-sm sm:text-base">
                        1-Year Access Period Expired
                      </h4>
                      <p className="text-xs text-[#2B2A3D]/70 mt-1 leading-relaxed">
                        Your 1-year course enrollment expired on {formatDate(selectedCourse.expires_at)}. Lesson materials and video sessions are locked. Renew your enrollment to continue learning.
                      </p>
                    </div>
                    <Link
                      to="/courses"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#3C3775] text-xs font-semibold shrink-0 transition-colors"
                    >
                      Renew Course Access
                    </Link>
                  </div>
                )}

                <div className="pt-2">
                  <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-3">
                    Course Lesson Materials
                  </h3>

                  {loadingMaterials ? (
                    <div className="py-12 text-center text-xs text-[#2B2A3D]/60">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5B3E96]" />
                      Loading course materials...
                    </div>
                  ) : materialsError ? (
                    <div className="p-4 rounded-xl bg-[#EFEAF8] text-[#5B3E96] text-xs font-medium">
                      {materialsError}
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#FBF7EE] border border-[#5B3E96]/10 text-center text-xs text-[#2B2A3D]/60">
                      No lesson materials uploaded for this course yet. Please check back soon.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {materials.map((mat) => (
                        <div
                          key={mat.id}
                          className="p-4 rounded-2xl bg-[#FBF7EE] border border-[#5B3E96]/15 hover:border-[#5B3E96]/30 transition-all flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-[#5B3E96]/20 flex items-center justify-center shrink-0 text-[#5B3E96]">
                              {mat.kind === 'file' ? (
                                <FileText className="w-5 h-5" />
                              ) : mat.kind === 'video_link' ? (
                                <Video className="w-5 h-5" />
                              ) : (
                                <LinkIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-xs sm:text-sm text-[#2E2A5C] truncate">
                                {mat.title}
                              </h4>
                              <p className="text-[11px] text-[#2B2A3D]/60">
                                {mat.kind === 'file'
                                  ? `PDF Document ${mat.size_bytes ? `• ${formatFileSize(mat.size_bytes)}` : ''}`
                                  : mat.kind === 'video_link'
                                  ? 'Video Lecture Session'
                                  : 'Resource Link'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={accessingMaterialId === mat.id}
                              onClick={() => handleAccessMaterial(mat, 'view')}
                              className="px-3.5 py-1.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#3C3775] text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60"
                            >
                              {accessingMaterialId === mat.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="w-3.5 h-3.5" />
                              )}
                              <span>Access</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {loadingCourses ? (
                  <div className="py-16 text-center text-xs text-[#2B2A3D]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5B3E96]" />
                    Loading your enrolled courses...
                  </div>
                ) : courses.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 border border-[#5B3E96]/15 text-center max-w-md mx-auto space-y-4">
                    <GraduationCap className="w-12 h-12 text-[#5B3E96] mx-auto" />
                    <h3 className="font-heading text-lg font-bold text-[#2E2A5C]">
                      No Courses Enrolled Yet
                    </h3>
                    <p className="text-xs text-[#2B2A3D]/70">
                      Explore our sacred Vedic astrology, numerology, and tarot courses to start your learning journey.
                    </p>
                    <Link
                      to="/courses"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:bg-[#3C3775] transition-colors"
                    >
                      Browse Courses
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                      const validity = getRemainingValidity(course.expires_at)
                      return (
                        <div
                          key={course.id}
                          onClick={() => handleSelectCourse(course)}
                          className={`bg-white rounded-3xl p-5 border transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group ${
                            course.is_expired
                              ? 'border-[#C9A227]/40 bg-[#FBF7EE]/40'
                              : 'border-[#5B3E96]/15 hover:border-[#5B3E96]/35'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3 text-[11px] font-semibold gap-2 flex-wrap">
                              <span className="text-[#5B3E96]">{course.level || 'Sacred Course'}</span>
                              {course.is_expired ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[#C9A227] text-[#2E2A5C] bg-[#FBF7EE]">
                                  Expired
                                </span>
                              ) : validity?.urgent ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[#F08A24]/40 text-[#F08A24] bg-[#FFF4E6]">
                                  {validity.text}
                                </span>
                              ) : (
                                <span className="text-[#2B2A3D]/60">{course.duration}</span>
                              )}
                            </div>
                            <h3 className="font-heading text-lg font-bold text-[#2E2A5C] group-hover:text-[#5B3E96] transition-colors mb-2">
                              {course.title}
                            </h3>
                            <p className="text-xs text-[#2B2A3D]/70 line-clamp-2 mb-3 leading-relaxed">
                              {course.description}
                            </p>

                            {/* Access Validity Date */}
                            <div className="text-[11px] text-[#2B2A3D]/65 mb-4">
                              {course.expires_at ? (
                                <span>
                                  {course.is_expired ? 'Expired on: ' : 'Valid till: '}
                                  <strong className="text-[#2E2A5C]">{formatDate(course.expires_at)}</strong>
                                  {!course.is_expired && validity && ` • ${validity.text}`}
                                </span>
                              ) : (
                                <span>1-Year Lifetime Access</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#5B3E96]/10 flex items-center justify-between text-xs">
                            <span className="inline-flex items-center gap-1.5 font-medium text-[#2B2A3D]/70">
                              <Layers className="w-3.5 h-3.5 text-[#5B3E96]" />
                              {course.materials_count} Lesson Materials
                            </span>
                            {course.is_expired ? (
                              <Link
                                to="/courses"
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-[#5B3E96] hover:underline"
                              >
                                Renew Access →
                              </Link>
                            ) : (
                              <span className="font-semibold text-[#5B3E96] group-hover:underline">
                                View Materials →
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY EBOOKS */}
        {activeTab === 'ebooks' && (
          <div>
            {loadingEbooks ? (
              <div className="py-16 text-center text-xs text-[#2B2A3D]/60">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5B3E96]" />
                Loading your purchased ebooks...
              </div>
            ) : ebooks.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-[#5B3E96]/15 text-center max-w-md mx-auto space-y-4">
                <BookOpen className="w-12 h-12 text-[#5B3E96] mx-auto" />
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C]">
                  No Purchased Ebooks Yet
                </h3>
                <p className="text-xs text-[#2B2A3D]/70">
                  Explore our collection of sacred astrology guides and Vedic ebooks.
                </p>
                <Link
                  to="/courses#ebooks"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:bg-[#3C3775] transition-colors"
                >
                  Browse Ebooks
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ebooks.map((ebook) => (
                  <div
                    key={ebook.id}
                    className="bg-white rounded-3xl p-5 border border-[#5B3E96]/15 hover:border-[#5B3E96]/35 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#5B3E96] text-[#FBF7EE] px-2.5 py-0.5 rounded-full">
                          Purchased PDF
                        </span>
                        <span className="text-[11px] text-[#2B2A3D]/60">
                          {formatFileSize(ebook.size_bytes)}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-1.5 line-clamp-2">
                        {ebook.title}
                      </h3>
                      <p className="text-xs text-[#2B2A3D]/70 line-clamp-3 mb-4 leading-relaxed">
                        {ebook.description || 'Vedic Astrology Guide PDF'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#5B3E96]/10 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#2B2A3D]/60">
                        {formatDate(ebook.purchased_at)}
                      </span>
                      <button
                        type="button"
                        disabled={downloadingEbookId === ebook.id}
                        onClick={() => handleDownloadEbook(ebook)}
                        className="px-4 py-2 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#3C3775] text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {downloadingEbookId === ebook.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A227]" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-[#C9A227]" />
                        )}
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY REPORTS */}
        {activeTab === 'reports' && (
          <div>
            {loadingReports ? (
              <div className="py-16 text-center text-xs text-[#2B2A3D]/60">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5B3E96]" />
                Loading your personalised report orders...
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-[#5B3E96]/15 text-center max-w-md mx-auto space-y-4">
                <FileText className="w-12 h-12 text-[#5B3E96] mx-auto" />
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C]">
                  No Reports Ordered Yet
                </h3>
                <p className="text-xs text-[#2B2A3D]/70">
                  Order personalised birth chart, career, wealth, and relationship reports prepared by Anushka Yadav ji.
                </p>
                <Link
                  to="/reports"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:bg-[#3C3775] transition-colors"
                >
                  Explore Reports
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-[#5B3E96]/15 hover:border-[#5B3E96]/30 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-base sm:text-lg font-bold text-[#2E2A5C]">
                          {rep.report_title}
                        </span>
                        {renderStatusBadge(rep.payment_status)}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#2E2A5C] border border-[#2E2A5C]/20">
                          {rep.status === 'delivered'
                            ? 'Delivered'
                            : rep.status === 'in_progress'
                            ? 'Under Analysis'
                            : 'Order Received'}
                        </span>
                      </div>
                      <p className="text-xs text-[#2B2A3D]/70 line-clamp-2">
                        Details: {rep.details || 'Personalised consultation request'}
                      </p>
                      <p className="text-[11px] text-[#2B2A3D]/50">
                        Ordered on {formatDate(rep.created_at)} • Fee: ₹{Number(rep.amount).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {rep.status === 'delivered' && rep.has_file ? (
                        <button
                          type="button"
                          disabled={downloadingReportId === rep.id}
                          onClick={() => handleDownloadReport(rep)}
                          className="px-4 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#3C3775] text-xs font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-60"
                        >
                          {downloadingReportId === rep.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
                          ) : (
                            <Download className="w-4 h-4 text-[#C9A227]" />
                          )}
                          <span>Download Report PDF</span>
                        </button>
                      ) : (
                        <div className="text-right text-xs text-[#5B3E96] font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Preparing Report (24-48 hrs)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY ORDERS */}
        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <div className="py-16 text-center text-xs text-[#2B2A3D]/60">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5B3E96]" />
                Loading your order history...
              </div>
            ) : ordersError ? (
              <div className="p-4 rounded-xl bg-[#EFEAF8] text-[#5B3E96] text-xs font-semibold text-center">
                {ordersError}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-[#5B3E96]/15 text-center max-w-md mx-auto space-y-4">
                <ShoppingBag className="w-12 h-12 text-[#5B3E96] mx-auto" />
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C]">
                  No Orders Found
                </h3>
                <p className="text-xs text-[#2B2A3D]/70">
                  You haven&apos;t placed any orders yet. Check out our courses, consultations, and reports.
                </p>
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:bg-[#3C3775] transition-colors"
                >
                  Explore Offerings
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#5B3E96]/15 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#FAF7F2] text-[#2E2A5C] uppercase text-[10px] tracking-wider border-b border-[#5B3E96]/15 font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Order Ref</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5">Item</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Amount</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#5B3E96]/10 text-xs">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                          <td className="px-5 py-4 font-mono font-medium text-[#2E2A5C]">
                            {ord.cashfree_order_id || ord.id.slice(0, 8)}
                          </td>
                          <td className="px-5 py-4 uppercase font-semibold text-[#5B3E96] text-[11px]">
                            {ord.type}
                          </td>
                          <td className="px-5 py-4 font-bold text-[#2E2A5C] max-w-[200px] truncate">
                            {ord.reference_title || 'Sacred Offering'}
                          </td>
                          <td className="px-5 py-4 text-[#2B2A3D]/70 whitespace-nowrap">
                            {formatDate(ord.created_at)}
                          </td>
                          <td className="px-5 py-4 font-heading font-bold text-[#2E2A5C] whitespace-nowrap">
                            ₹{Number(ord.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {renderStatusBadge(ord.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#5B3E96]/15 shadow-sm max-w-xl mx-auto">
            <h2 className="font-heading text-xl font-bold text-[#2E2A5C] mb-4">
              Seeker Profile Details
            </h2>
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-[#FBF7EE] border border-[#5B3E96]/10">
                <span className="text-[#2B2A3D]/60 block text-xs">Full Name</span>
                <span className="font-semibold text-[#2E2A5C] text-sm">{user.name}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#FBF7EE] border border-[#5B3E96]/10">
                <span className="text-[#2B2A3D]/60 block text-xs">Email Address</span>
                <span className="font-semibold text-[#2E2A5C] text-sm">{user.email}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#FBF7EE] border border-[#5B3E96]/10">
                <span className="text-[#2B2A3D]/60 block text-xs">Phone Number</span>
                <span className="font-semibold text-[#2E2A5C] text-sm">
                  {user.phone || 'Not added yet'}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#FBF7EE] border border-[#5B3E96]/10">
                <span className="text-[#2B2A3D]/60 block text-xs">Role / Privileges</span>
                <span className="font-semibold text-[#5B3E96] capitalize text-sm">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}

export default Account
