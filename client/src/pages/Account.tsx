import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  User,
  LogOut,
  ExternalLink,
  Download,
  FileText,
  Video,
  Link as LinkIcon,
  Music,
  Layers,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  FileBox,
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

export const Account: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'courses' | 'profile'>('courses')
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  // Selected course for viewing materials
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)
  const [accessingMaterialId, setAccessingMaterialId] = useState<string | null>(null)

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

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses()
    }
  }, [user])

  // Fetch materials when a course is selected
  const handleSelectCourse = async (course: EnrolledCourse) => {
    setSelectedCourse(course)
    setMaterials([])
    setMaterialsError(null)
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

  // Access material (generates temporary signed URL or opens link)
  const handleAccessMaterial = async (material: CourseMaterial, action: 'view' | 'download' = 'view') => {
    try {
      setAccessingMaterialId(material.id)
      const res = await api.post<{
        success: boolean
        accessType: 'signed_url' | 'link'
        url: string
        fileName?: string
      }>(`/api/account/materials/${material.id}/access`, { action })

      if (res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      }
    } catch (err: any) {
      console.error('Failed to access material:', err)
      alert(err?.message || 'Unable to open material. Please try again.')
    } finally {
      setAccessingMaterialId(null)
    }
  }

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes || bytes <= 0) return ''
    const mb = bytes / (1024 * 1024)
    if (mb < 1) {
      return `${Math.round(bytes / 1024)} KB`
    }
    return `${mb.toFixed(1)} MB`
  }

  const getMaterialIcon = (kind: string, fileName: string | null) => {
    if (kind === 'video_link') return <Video className="w-5 h-5 text-[#5B3E96]" />
    if (kind === 'link') return <LinkIcon className="w-5 h-5 text-[#C9A227]" />

    const ext = fileName?.split('.').pop()?.toLowerCase() || ''
    if (ext === 'mp3') return <Music className="w-5 h-5 text-[#5B3E96]" />
    if (ext === 'mp4') return <Video className="w-5 h-5 text-[#5B3E96]" />
    if (['zip', 'rar'].includes(ext)) return <FileBox className="w-5 h-5 text-[#F08A24]" />
    return <FileText className="w-5 h-5 text-[#2E2A5C]" />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-[70vh] bg-[#FBF7EE] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#EFEAF8] border-t-[#2E2A5C] animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase text-[#2E2A5C]/70">
          Loading Seeker Portal...
        </p>
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
                  <Sparkles className="w-3 h-3" />
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
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-[#5B3E96]/10">
            <button
              onClick={() => {
                setActiveTab('courses')
                setSelectedCourse(null)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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
                setActiveTab('profile')
                setSelectedCourse(null)
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
                  : 'bg-[#FBF7EE] text-[#2B2A3D]/70 hover:bg-[#EFEAF8]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MY COURSES */}
        {activeTab === 'courses' && (
          <div>
            {/* If a course is selected -> Show Materials View */}
            {selectedCourse ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#5B3E96]/15 shadow-sm animate-fade-in">
                {/* Back button and header */}
                <div className="flex items-center justify-between pb-6 border-b border-[#5B3E96]/10 mb-6">
                  <div>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B3E96] hover:text-[#2E2A5C] mb-2 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to All Enrolled Courses</span>
                    </button>
                    <h2 className="font-heading text-2xl font-bold text-[#2E2A5C]">
                      {selectedCourse.title}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-[#2B2A3D]/70 mt-1">
                      <span>Level: {selectedCourse.level}</span>
                      <span>•</span>
                      <span>Duration: {selectedCourse.duration}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectCourse(selectedCourse)}
                    disabled={loadingMaterials}
                    className="p-2 rounded-xl border border-[#5B3E96]/20 text-[#2E2A5C] hover:bg-[#EFEAF8] transition-colors"
                    title="Refresh materials"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMaterials ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Privacy Notice Note (Required by specification) */}
                <div className="mb-6 p-3.5 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center gap-2.5 text-xs text-[#2E2A5C]">
                  <ShieldAlert className="w-4 h-4 text-[#5B3E96] shrink-0" />
                  <span className="font-medium">
                    Your course access and downloads are recorded for security.
                  </span>
                </div>

                {/* Error handling */}
                {materialsError && (
                  <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs text-[#2E2A5C] mb-6">
                    {materialsError}
                  </div>
                )}

                {/* Materials List */}
                {loadingMaterials ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-[#FBF7EE] rounded-2xl animate-pulse border border-[#5B3E96]/10"
                      />
                    ))}
                  </div>
                ) : materials.length === 0 ? (
                  <div className="py-12 text-center text-[#2B2A3D]/60 text-sm">
                    No learning materials published for this course yet. Please check back soon.
                  </div>
                ) : (
                  <div className="divide-y divide-[#5B3E96]/10">
                    {materials.map((item, idx) => (
                      <div
                        key={item.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FBF7EE]/40 px-3 rounded-2xl transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-[#EFEAF8] shrink-0 mt-0.5 sm:mt-0">
                            {getMaterialIcon(item.kind, item.file_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#5B3E96]">
                                #{idx + 1}
                              </span>
                              <h3 className="text-sm font-semibold text-[#2E2A5C] truncate">
                                {item.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#2B2A3D]/60 mt-0.5">
                              <span className="uppercase tracking-wider font-medium">
                                {item.kind === 'file' ? 'Study Document' : item.kind.replace('_', ' ')}
                              </span>
                              {item.size_bytes && (
                                <>
                                  <span>•</span>
                                  <span>{formatFileSize(item.size_bytes)}</span>
                                </>
                              )}
                              {item.file_name && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-xs">{item.file_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleAccessMaterial(item, 'view')}
                            disabled={accessingMaterialId === item.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-sm transition-colors disabled:opacity-60"
                          >
                            {accessingMaterialId === item.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <ExternalLink className="w-3.5 h-3.5" />
                            )}
                            <span>Open</span>
                          </button>

                          {item.kind === 'file' && (
                            <button
                              onClick={() => handleAccessMaterial(item, 'download')}
                              disabled={accessingMaterialId === item.id}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#5B3E96]/20 bg-white hover:bg-[#EFEAF8] text-[#2E2A5C] text-xs font-semibold transition-colors disabled:opacity-60"
                              title="Download to device"
                            >
                              <Download className="w-3.5 h-3.5 text-[#5B3E96]" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Enrolled Courses Grid */
              <div>
                {/* Privacy Notice Note in My Courses */}
                <div className="mb-6 p-3.5 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/20 flex items-center gap-2.5 text-xs text-[#2E2A5C]">
                  <ShieldAlert className="w-4 h-4 text-[#5B3E96] shrink-0" />
                  <span className="font-medium">
                    Your course access and downloads are recorded for security.
                  </span>
                </div>

                {coursesError && (
                  <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs text-[#2E2A5C] mb-6">
                    {coursesError}
                  </div>
                )}

                {loadingCourses ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-64 bg-white rounded-3xl border border-[#5B3E96]/15 animate-pulse p-6"
                      />
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  /* Empty state required by prompt */
                  <div className="bg-white rounded-3xl p-12 text-center border border-[#5B3E96]/15 shadow-sm max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-[#EFEAF8] text-[#5B3E96] flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-[#2E2A5C] mb-2">
                      You haven't enrolled in any course yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mb-6 leading-relaxed">
                      Explore our sacred astrological wisdom and certified Vedic numerology courses
                      to begin your transformative journey.
                    </p>
                    <Link
                      to="/courses"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold bg-[#F08A24] text-[#FBF7EE] text-sm shadow-md hover:opacity-95 transition-all"
                    >
                      Browse Courses
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => handleSelectCourse(course)}
                        className="bg-white rounded-3xl border border-[#5B3E96]/15 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3 text-xs">
                            <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] bg-[#5B3E96]/15 text-[#5B3E96] border border-[#5B3E96]/30">
                              Active Access
                            </span>
                            <span className="text-[#2B2A3D]/60 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#5B3E96]" />
                              {course.duration}
                            </span>
                          </div>

                          <h3 className="font-heading text-xl font-bold text-[#2E2A5C] group-hover:text-[#5B3E96] transition-colors mb-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-[#2B2A3D]/70 line-clamp-2 mb-4 leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-[#5B3E96]/10 flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#2B2A3D]/70">
                            <Layers className="w-3.5 h-3.5 text-[#5B3E96]" />
                            {course.materials_count} Lesson Materials
                          </span>
                          <span className="font-semibold text-[#5B3E96] group-hover:underline">
                            View Materials →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE */}
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
              {user.phone && (
                <div className="p-4 rounded-xl bg-[#FBF7EE] border border-[#5B3E96]/10">
                  <span className="text-[#2B2A3D]/60 block text-xs">Phone Number</span>
                  <span className="font-semibold text-[#2E2A5C] text-sm">{user.phone}</span>
                </div>
              )}
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
