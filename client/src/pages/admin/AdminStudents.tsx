import React, { useEffect, useState, useCallback } from 'react'
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Clock,
  GraduationCap,
  X,
  Eye,
  Download,
  Activity,
} from 'lucide-react'
import { api, ApiError } from '../../lib/api'

interface Enrollment {
  id: string
  user_id: string
  course_id: string
  order_id: string | null
  status: 'active' | 'revoked'
  source: 'payment' | 'admin'
  granted_at: string
  expires_at: string | null
  is_expired?: boolean
  buyer_name: string
  buyer_email: string
  buyer_phone: string | null
  course_title: string
  order_amount: number | null
  order_status: string | null
  last_accessed_at: string | null
  total_access_count: number
}

interface AccessLog {
  id: string
  user_id: string
  course_id: string
  material_id: string | null
  action: 'view' | 'download'
  ip: string
  user_agent: string
  created_at: string
  user_name: string
  user_email: string
  course_title: string
  material_title: string | null
  material_kind: string | null
}

interface CourseOption {
  id: string
  title: string
}

export const AdminStudents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'enrollments' | 'logs'>('enrollments')

  // Courses list for filter & modal dropdowns
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([])

  // --- ENROLLMENTS STATE ---
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)
  const [enrPage, setEnrPage] = useState(1)
  const [enrTotalPages, setEnrTotalPages] = useState(1)
  const [enrTotal, setEnrTotal] = useState(0)
  const [searchEnr, setSearchEnr] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStatus, setFilterStatus] = useState<'active' | 'revoked' | ''>('')

  // Grant Access Modal State
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantCourseId, setGrantCourseId] = useState('')
  const [grantError, setGrantError] = useState<string | null>(null)
  const [isGranting, setIsGranting] = useState(false)

  // Revoke/Reactivate Confirmation State
  const [toggleEnrollment, setToggleEnrollment] = useState<Enrollment | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // --- ACCESS LOGS STATE ---
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [logPage, setLogPage] = useState(1)
  const [logTotalPages, setLogTotalPages] = useState(1)
  const [logTotal, setLogTotal] = useState(0)
  const [logSearch, setLogSearch] = useState('')
  const [logCourseId, setLogCourseId] = useState('')
  const [logAction, setLogAction] = useState<'view' | 'download' | ''>('')

  // Fetch course list for dropdowns
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get<{ courses: CourseOption[] }>('/api/admin/courses')
        setCourseOptions(res.courses || [])
      } catch (err) {
        console.error('Failed to load courses for filter:', err)
      }
    }
    fetchCourses()
  }, [])

  // Fetch Enrollments
  const fetchEnrollments = useCallback(async () => {
    try {
      setLoadingEnrollments(true)
      setEnrollmentError(null)

      const params: Record<string, any> = {
        page: enrPage,
        limit: 10,
      }
      if (searchEnr.trim()) params.search = searchEnr.trim()
      if (filterCourse) params.course_id = filterCourse
      if (filterStatus) params.status = filterStatus

      const res = await api.get<{
        enrollments: Enrollment[]
        pagination: { total: number; totalPages: number }
      }>('/api/admin/enrollments', { params })

      setEnrollments(res.enrollments || [])
      setEnrTotalPages(res.pagination?.totalPages || 1)
      setEnrTotal(res.pagination?.total || 0)
    } catch (err: any) {
      console.error('Failed to fetch enrollments:', err)
      setEnrollmentError(err?.message || 'Failed to retrieve enrollments')
    } finally {
      setLoadingEnrollments(false)
    }
  }, [enrPage, searchEnr, filterCourse, filterStatus])

  useEffect(() => {
    if (activeTab === 'enrollments') {
      fetchEnrollments()
    }
  }, [fetchEnrollments, activeTab])

  // Fetch Access Logs
  const fetchAccessLogs = useCallback(async () => {
    try {
      setLoadingLogs(true)
      setLogError(null)

      const params: Record<string, any> = {
        page: logPage,
        limit: 15,
      }
      if (logSearch.trim()) params.search = logSearch.trim()
      if (logCourseId) params.course_id = logCourseId
      if (logAction) params.action = logAction

      const res = await api.get<{
        logs: AccessLog[]
        pagination: { total: number; totalPages: number }
      }>('/api/admin/access-logs', { params })

      setLogs(res.logs || [])
      setLogTotalPages(res.pagination?.totalPages || 1)
      setLogTotal(res.pagination?.total || 0)
    } catch (err: any) {
      console.error('Failed to load access logs:', err)
      setLogError(err?.message || 'Failed to retrieve access logs')
    } finally {
      setLoadingLogs(false)
    }
  }, [logPage, logSearch, logCourseId, logAction])

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchAccessLogs()
    }
  }, [fetchAccessLogs, activeTab])

  // Handle Grant Access
  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGrantError(null)

    if (!grantEmail.trim() || !grantCourseId) {
      setGrantError('Please provide both the client email and select a course.')
      return
    }

    try {
      setIsGranting(true)
      await api.post('/api/admin/enrollments', {
        email: grantEmail.trim(),
        course_id: grantCourseId,
      })

      setShowGrantModal(false)
      setGrantEmail('')
      setGrantCourseId('')
      fetchEnrollments()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setGrantError(err.message)
      } else {
        setGrantError('Failed to grant access. Please try again.')
      }
    } finally {
      setIsGranting(false)
    }
  }

  // Handle Revoke / Reactivate Status
  const handleConfirmStatusToggle = async () => {
    if (!toggleEnrollment) return
    const isRevoking = toggleEnrollment.status === 'active' && !toggleEnrollment.is_expired
    const newStatus = isRevoking ? 'revoked' : 'active'

    try {
      setIsUpdatingStatus(true)
      await api.patch(`/api/admin/enrollments/${toggleEnrollment.id}`, {
        status: newStatus,
      })
      setToggleEnrollment(null)
      fetchEnrollments()
    } catch (err: any) {
      console.error('Failed to update status:', err)
      alert(err?.message || 'Failed to update enrollment status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2A3D]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Course Access Management</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#2E2A5C] mt-1">
            Clients & Enrollments
          </h1>
          <p className="text-sm text-[#2B2A3D]/70 mt-0.5">
            Manage client course permissions, manual access grants, and audit access logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setGrantError(null)
              setShowGrantModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Grant Access</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-[#5B3E96]/15 pb-1">
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'enrollments'
              ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
              : 'text-[#2B2A3D]/70 hover:bg-[#EFEAF8]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Course Enrollments ({enrTotal})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'logs'
              ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
              : 'text-[#2B2A3D]/70 hover:bg-[#EFEAF8]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Access Audit Logs</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ENROLLMENTS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'enrollments' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#5B3E96]/15 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#2B2A3D]/40" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={searchEnr}
                  onChange={(e) => {
                    setSearchEnr(e.target.value)
                    setEnrPage(1)
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>

              {/* Course filter */}
              <select
                value={filterCourse}
                onChange={(e) => {
                  setFilterCourse(e.target.value)
                  setEnrPage(1)
                }}
                className="w-full sm:w-52 py-2 px-3 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs text-[#2B2A3D] focus:outline-none"
              >
                <option value="">All Courses</option>
                {courseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as any)
                  setEnrPage(1)
                }}
                className="w-full sm:w-36 py-2 px-3 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs text-[#2B2A3D] focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="active">Active Access</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <button
              onClick={fetchEnrollments}
              disabled={loadingEnrollments}
              className="p-2 self-end md:self-auto rounded-xl border border-[#5B3E96]/20 hover:bg-[#EFEAF8] text-[#2E2A5C] transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loadingEnrollments ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {enrollmentError && (
            <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs text-[#2E2A5C]">
              {enrollmentError}
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-[#5B3E96]/15 shadow-sm overflow-hidden">
            {loadingEnrollments ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-[#FBF7EE] rounded-xl animate-pulse border border-[#5B3E96]/10"
                  />
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="py-16 text-center px-4">
                <Users className="w-10 h-10 text-[#5B3E96] mx-auto mb-2 opacity-50" />
                <h3 className="font-heading text-lg font-bold text-[#2E2A5C]">
                  No client enrollments found
                </h3>
                <p className="text-xs text-[#2B2A3D]/70 max-w-sm mx-auto mt-1">
                  No enrollments match your current filters. Click "Grant Access" to manually assign
                  a course to a registered client.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FBF7EE] border-b border-[#5B3E96]/10 text-[11px] font-semibold uppercase tracking-wider text-[#2B2A3D]/70">
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Course Enrolled</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Granted At</th>
                      <th className="py-3 px-4">Activity & Access</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5B3E96]/10 text-xs">
                    {enrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-[#FBF7EE]/40 transition-colors">
                        {/* Status Badge: Active = Royal Violet, Expired/Revoked = Soft Gold outline */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {enr.status === 'active' && !enr.is_expired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5B3E96]/15 text-[#5B3E96] border border-[#5B3E96]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5B3E96]" />
                              Active
                            </span>
                          ) : enr.is_expired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#C9A227] border border-[#C9A227]/40 bg-[#C9A227]/10">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#C9A227] border border-[#C9A227]/40 bg-[#C9A227]/10">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                              Revoked
                            </span>
                          )}
                        </td>

                        {/* Client Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#2E2A5C]">{enr.buyer_name}</div>
                          <div className="text-[11px] text-[#2B2A3D]/70">{enr.buyer_email}</div>
                          {enr.buyer_phone && (
                            <div className="text-[10px] text-[#2B2A3D]/50">{enr.buyer_phone}</div>
                          )}
                        </td>

                        {/* Course */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-[#2E2A5C] truncate">
                            {enr.course_title}
                          </div>
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="capitalize px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EFEAF8] text-[#2E2A5C]">
                            {enr.source}
                          </span>
                        </td>

                        {/* Granted & Validity */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#2B2A3D]/70">
                          <div>
                            Granted: {new Date(enr.granted_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          {enr.expires_at && (
                            <div
                              className={`text-[10px] mt-0.5 ${
                                enr.is_expired ? 'text-[#C9A227] font-semibold' : 'text-[#5B3E96] font-medium'
                              }`}
                            >
                              Expires: {new Date(enr.expires_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          )}
                        </td>

                        {/* Activity: Last accessed & total count */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#2E2A5C]">
                            {enr.total_access_count} downloads / views
                          </div>
                          <div className="text-[10px] text-[#2B2A3D]/50 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-[#5B3E96]" />
                            {enr.last_accessed_at ? (
                              <span>
                                Last:{' '}
                                {new Date(enr.last_accessed_at).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            ) : (
                              <span>Never accessed yet</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setToggleEnrollment(enr)}
                            className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors ${
                              enr.status === 'active' && !enr.is_expired
                                ? 'bg-[#2E2A5C]/10 text-[#2E2A5C] hover:bg-[#2E2A5C] hover:text-[#FBF7EE]'
                                : 'bg-[#5B3E96]/15 text-[#5B3E96] hover:bg-[#5B3E96] hover:text-[#FBF7EE]'
                            }`}
                          >
                            {enr.status === 'active' && !enr.is_expired
                              ? 'Revoke Access'
                              : enr.is_expired
                              ? 'Renew (1-Yr)'
                              : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {enrTotalPages > 1 && (
              <div className="p-4 bg-[#FBF7EE] border-t border-[#5B3E96]/10 flex items-center justify-between text-xs text-[#2B2A3D]/70">
                <div>
                  Page <span className="font-semibold">{enrPage}</span> of{' '}
                  <span className="font-semibold">{enrTotalPages}</span> ({enrTotal} enrollments)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEnrPage((p) => Math.max(1, p - 1))}
                    disabled={enrPage <= 1}
                    className="px-3 py-1 rounded-lg bg-white border border-[#5B3E96]/20 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setEnrPage((p) => Math.min(enrTotalPages, p + 1))}
                    disabled={enrPage >= enrTotalPages}
                    className="px-3 py-1 rounded-lg bg-white border border-[#5B3E96]/20 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACCESS AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Logs Filters */}
          <div className="bg-white rounded-2xl p-4 border border-[#5B3E96]/15 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#2B2A3D]/40" />
              <input
                type="text"
                placeholder="Search client name or email..."
                value={logSearch}
                onChange={(e) => {
                  setLogSearch(e.target.value)
                  setLogPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <select
              value={logCourseId}
              onChange={(e) => {
                setLogCourseId(e.target.value)
                setLogPage(1)
              }}
              className="w-full sm:w-56 py-2 px-3 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs"
            >
              <option value="">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              value={logAction}
              onChange={(e) => {
                setLogAction(e.target.value as any)
                setLogPage(1)
              }}
              className="w-full sm:w-36 py-2 px-3 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs"
            >
              <option value="">All Actions</option>
              <option value="view">View</option>
              <option value="download">Download</option>
            </select>

            <button
              onClick={fetchAccessLogs}
              disabled={loadingLogs}
              className="p-2 rounded-xl border border-[#5B3E96]/20 hover:bg-[#EFEAF8] text-[#2E2A5C] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {logError && (
            <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs text-[#2E2A5C]">
              {logError}
            </div>
          )}

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-[#5B3E96]/15 shadow-sm overflow-hidden">
            {loadingLogs ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-[#FBF7EE] rounded-xl animate-pulse border border-[#5B3E96]/10"
                  />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#2B2A3D]/60">
                No access audit logs found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FBF7EE] border-b border-[#5B3E96]/10 text-[11px] font-semibold uppercase tracking-wider text-[#2B2A3D]/70">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Material Accessed</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5B3E96]/10 text-xs">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FBF7EE]/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-[#2B2A3D]/70">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#2E2A5C]">{log.user_name}</div>
                          <div className="text-[10px] text-[#2B2A3D]/60">{log.user_email}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-[#2E2A5C] font-medium">
                          {log.course_title}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-[#2E2A5C]">
                          {log.material_title || 'General Material'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.action === 'download' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F08A24]/15 text-[#F08A24] border border-[#F08A24]/30">
                              <Download className="w-3 h-3" />
                              Download
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#5B3E96]/15 text-[#5B3E96] border border-[#5B3E96]/30">
                              <Eye className="w-3 h-3" />
                              View
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#2B2A3D]/60 font-mono text-[11px]">
                          {log.ip || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Logs Pagination Footer */}
            {logTotalPages > 1 && (
              <div className="p-4 bg-[#FBF7EE] border-t border-[#5B3E96]/10 flex items-center justify-between text-xs text-[#2B2A3D]/70">
                <div>
                  Page <span className="font-semibold">{logPage}</span> of{' '}
                  <span className="font-semibold">{logTotalPages}</span> ({logTotal} total log entries)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                    disabled={logPage <= 1}
                    className="px-3 py-1 rounded-lg bg-white border border-[#5B3E96]/20 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setLogPage((p) => Math.min(logTotalPages, p + 1))}
                    disabled={logPage >= logTotalPages}
                    className="px-3 py-1 rounded-lg bg-white border border-[#5B3E96]/20 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: GRANT ENROLLMENT */}
      {/* ========================================================================= */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#5B3E96]/20 relative">
            <button
              onClick={() => setShowGrantModal(false)}
              className="absolute top-4 right-4 p-2 text-[#2B2A3D]/40 hover:text-[#2E2A5C]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
              <Plus className="w-4 h-4" />
              <span>Manual Course Access</span>
            </div>
            <h3 className="font-heading text-xl font-bold text-[#2E2A5C] mb-1">
              Grant Course Access
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 mb-5">
              Assign full access of a sacred course to an existing client member.
            </p>

            {grantError && (
              <div className="p-3 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs text-[#2E2A5C] mb-4">
                {grantError}
              </div>
            )}

            <form onSubmit={handleGrantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] mb-1.5 uppercase tracking-wider">
                  Client Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@example.com"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
                <span className="text-[10px] text-[#2B2A3D]/50 mt-1 block">
                  Client must already be signed up with this email.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] mb-1.5 uppercase tracking-wider">
                  Select Course *
                </label>
                <select
                  required
                  value={grantCourseId}
                  onChange={(e) => setGrantCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs text-[#2B2A3D] focus:outline-none"
                >
                  <option value="">-- Choose Course --</option>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#5B3E96]/10">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2B2A3D] hover:bg-[#FBF7EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGranting}
                  className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-md disabled:opacity-60"
                >
                  {isGranting ? 'Granting Access...' : 'Confirm Grant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRM REVOKE / REACTIVATE */}
      {/* ========================================================================= */}
      {toggleEnrollment && (() => {
        const isRevoking = toggleEnrollment.status === 'active' && !toggleEnrollment.is_expired
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#5B3E96]/20 relative">
              <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
                {isRevoking ? 'Revoke Course Access?' : 'Renew / Reactivate 1-Year Access?'}
              </h3>
              <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-2 leading-relaxed">
                {isRevoking ? (
                  <>
                    Are you sure you want to revoke access for{' '}
                    <strong className="text-[#2E2A5C]">{toggleEnrollment.buyer_email}</strong> to{' '}
                    <span className="italic">"{toggleEnrollment.course_title}"</span>? They will no
                    longer be able to view or download lesson materials.
                  </>
                ) : (
                  <>
                    Grant fresh 1-year active access for{' '}
                    <strong className="text-[#2E2A5C]">{toggleEnrollment.buyer_email}</strong> to{' '}
                    <span className="italic">"{toggleEnrollment.course_title}"</span> starting from today.
                  </>
                )}
              </p>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#5B3E96]/10">
                <button
                  onClick={() => setToggleEnrollment(null)}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 rounded-xl border border-[#5B3E96]/20 text-xs font-semibold text-[#2B2A3D]"
                >
                  Cancel
                </button>
                {/* Note: Deep Indigo filled button, strictly no red! */}
                <button
                  onClick={handleConfirmStatusToggle}
                  disabled={isUpdatingStatus}
                  className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-md disabled:opacity-60"
                >
                  {isUpdatingStatus ? 'Updating...' : isRevoking ? 'Confirm Revocation' : 'Grant 1-Year Access'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default AdminStudents
