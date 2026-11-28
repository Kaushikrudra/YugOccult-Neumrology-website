import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BookOpen,
  RefreshCw,
  Layers,
  Trash2,
  Upload,
  Link as LinkIcon,
  Video,
  FileText,
  Eye,
  EyeOff,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Plus,
  Edit2,
  Download,
  Search,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../../lib/api'

interface CourseItem {
  id: string
  slug?: string
  title: string
  description: string
  price: number
  original_price: number | null
  level: string | null
  duration: string | null
  category: string
  instructor: string
  image_url?: string | null
  is_package: boolean
  is_featured: boolean
  materials_count: number
  is_visible: boolean
  bundle_items?: Array<{ id: string; title: string }>
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
  is_visible: boolean
  created_at: string
}

// Sortable Material Row Component
interface SortableMaterialItemProps {
  item: CourseMaterial
  index: number
  onToggleVisibility: (item: CourseMaterial) => void
  onDelete: (item: CourseMaterial) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

const SortableMaterialItem: React.FC<SortableMaterialItemProps> = ({
  item,
  index,
  onToggleVisibility,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        item.is_visible
          ? 'bg-white border-[#5B3E96]/15 hover:border-[#5B3E96]/30'
          : 'bg-[#FBF7EE]/60 border-dashed border-[#2B2A3D]/20 opacity-70'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg text-[#2B2A3D]/40 hover:text-[#2E2A5C] cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="p-2 rounded-xl bg-[#EFEAF8] text-[#5B3E96] shrink-0">
          {item.kind === 'video_link' ? (
            <Video className="w-4 h-4" />
          ) : item.kind === 'link' ? (
            <LinkIcon className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#5B3E96]">#{index + 1}</span>
            <span className="text-xs font-semibold text-[#2E2A5C] truncate">{item.title}</span>
            {!item.is_visible && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2B2A3D]/10 text-[#2B2A3D]/70 font-semibold uppercase">
                Hidden
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#2B2A3D]/60 mt-0.5">
            <span className="capitalize">{item.kind.replace('_', ' ')}</span>
            {item.file_name && <span>• {item.file_name}</span>}
            {item.size_bytes && <span>• {Math.round(item.size_bytes / 1024)} KB</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
        {/* Precise Position Arrow Buttons */}
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          className="p-1 rounded-lg text-[#2B2A3D]/50 hover:text-[#2E2A5C] disabled:opacity-20"
          title="Move Up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          className="p-1 rounded-lg text-[#2B2A3D]/50 hover:text-[#2E2A5C] disabled:opacity-20"
          title="Move Down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Visibility */}
        <button
          type="button"
          onClick={() => onToggleVisibility(item)}
          className={`p-1.5 rounded-lg border text-xs transition-colors ${
            item.is_visible
              ? 'border-[#5B3E96]/20 text-[#5B3E96] hover:bg-[#EFEAF8]'
              : 'border-[#2B2A3D]/20 text-[#2B2A3D]/60 hover:bg-white'
          }`}
          title={item.is_visible ? 'Hide from clients' : 'Make visible'}
        >
          {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Download / View for file materials */}
        {item.kind === 'file' && (
          <a
            href={`/api/admin/materials/${item.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-[#5B3E96]/20 text-[#5B3E96] hover:bg-[#EFEAF8] text-xs transition-colors"
            title="Download / View Material PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="p-1.5 rounded-lg bg-[#2E2A5C]/10 text-[#2E2A5C] hover:bg-[#2E2A5C] hover:text-[#FBF7EE] transition-colors"
          title="Delete material"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

const STANDARD_COURSE_CATEGORIES = [
  'Tarot',
  'Astrology',
  'Numerology',
  'Vastu',
  'Manifestation',
  'Healing',
  'Remedies',
  'Switchwords',
  'Business',
  'NLP',
  'Packages',
  'Other',
]

export const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and Category Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Categories list derived from courses
  const categories = useMemo(() => {
    const cats = new Set<string>()
    courses.forEach((c) => {
      if (c.category && c.category.trim()) {
        cats.add(c.category.trim())
      }
    })
    return ['all', ...Array.from(cats)]
  }, [courses])

  // Filtered courses based on search query and category
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return courses.filter((c) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        (c.category && c.category.trim().toLowerCase() === selectedCategory.toLowerCase())

      if (!matchesCategory) return false
      if (!q) return true

      const titleMatch = c.title?.toLowerCase().includes(q)
      const catMatch = c.category?.toLowerCase().includes(q)
      const descMatch = c.description?.toLowerCase().includes(q)
      const instrMatch = c.instructor?.toLowerCase().includes(q)
      const levelMatch = c.level?.toLowerCase().includes(q)
      return Boolean(titleMatch || catMatch || descMatch || instrMatch || levelMatch)
    })
  }, [courses, searchQuery, selectedCategory])

  // Drawer / Modal for Course Materials
  const [activeCourse, setActiveCourse] = useState<CourseItem | null>(null)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)

  // Sub-modals for adding materials
  const [showAddLinkModal, setShowAddLinkModal] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkKind, setLinkKind] = useState<'link' | 'video_link'>('link')
  const [linkUrl, setLinkUrl] = useState('')
  const [isSubmittingLink, setIsSubmittingLink] = useState(false)

  // File upload state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Material Deletion State
  const [deletingMaterial, setDeletingMaterial] = useState<CourseMaterial | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Course Create / Edit Modal State
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseSlug, setCourseSlug] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [courseCategory, setCourseCategory] = useState('Tarot')
  const [customCategory, setCustomCategory] = useState('')
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [courseLevel, setCourseLevel] = useState<string>('none')
  const [coursePrice, setCoursePrice] = useState<number>(0)
  const [courseOriginalPrice, setCourseOriginalPrice] = useState<string>('')
  const [courseInstructor, setCourseInstructor] = useState('Anushka Yadav')
  const [courseImageUrl, setCourseImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [courseIsFeatured, setCourseIsFeatured] = useState(false)
  const [courseIsPackage, setCourseIsPackage] = useState(false)
  const [selectedBundleCourseIds, setSelectedBundleCourseIds] = useState<string[]>([])
  const [courseFormError, setCourseFormError] = useState<string | null>(null)
  const [isSavingCourse, setIsSavingCourse] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState<CourseItem | null>(null)
  const [isDeletingCourse, setIsDeletingCourse] = useState(false)

  // Sensors for Dnd-Kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get<{ courses: CourseItem[] }>('/api/admin/courses')
      setCourses(res.courses || [])
    } catch (err: any) {
      console.error('Failed to load courses:', err)
      setError(err?.message || 'Failed to retrieve courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  // Fetch materials for active course
  const loadCourseMaterials = useCallback(async (courseId: string) => {
    try {
      setLoadingMaterials(true)
      setMaterialsError(null)
      const res = await api.get<{ materials: CourseMaterial[] }>(
        `/api/admin/courses/${courseId}/materials`
      )
      setMaterials(res.materials || [])
    } catch (err: any) {
      console.error('Failed to load materials:', err)
      setMaterialsError(err?.message || 'Failed to retrieve course materials')
    } finally {
      setLoadingMaterials(false)
    }
  }, [])

  const handleOpenCourseMaterials = (course: CourseItem) => {
    setActiveCourse(course)
    loadCourseMaterials(course.id)
  }

  const handleOpenAddCourse = () => {
    setEditingCourse(null)
    setCourseTitle('')
    setCourseSlug('')
    setCourseDesc('')
    setCourseCategory('Tarot')
    setCustomCategory('')
    setIsCustomCategory(false)
    setCourseLevel('none')
    setCoursePrice(0)
    setCourseOriginalPrice('')
    setCourseInstructor('Anushka Yadav')
    setCourseImageUrl('')
    setCourseIsFeatured(false)
    setCourseIsPackage(false)
    setSelectedBundleCourseIds([])
    setCourseFormError(null)
    setShowCourseModal(true)
  }

  const handleOpenEditCourse = (course: CourseItem) => {
    setEditingCourse(course)
    setCourseTitle(course.title)
    setCourseSlug(course.slug || '')
    setCourseDesc(course.description)
    setCourseImageUrl(course.image_url || '')
    if (STANDARD_COURSE_CATEGORIES.includes(course.category)) {
      setCourseCategory(course.category)
      setIsCustomCategory(false)
      setCustomCategory('')
    } else {
      setCourseCategory('__custom__')
      setIsCustomCategory(true)
      setCustomCategory(course.category || '')
    }
    setCourseLevel(course.level || 'none')
    setCoursePrice(course.price)
    setCourseOriginalPrice(course.original_price != null ? String(course.original_price) : '')
    setCourseInstructor(course.instructor || 'Anushka Yadav')
    setCourseIsFeatured(Boolean(course.is_featured))
    setCourseIsPackage(Boolean(course.is_package))
    setSelectedBundleCourseIds(course.bundle_items?.map((b) => b.id) || [])
    setCourseFormError(null)
    setShowCourseModal(true)
  }

  const handleCourseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/admin/uploads/site-image', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      const res = await response.json()
      if (!response.ok) {
        throw new Error(res?.error || 'Failed to upload image')
      }
      if (res?.url) {
        setCourseImageUrl(res.url)
      }
    } catch (err: any) {
      console.error('[AdminCourses:ImageUpload] Error:', err)
      setCourseFormError(err?.message || 'Failed to upload course banner image')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setCourseFormError(null)

    const finalCategory = isCustomCategory ? customCategory.trim() : courseCategory
    if (!courseTitle.trim()) {
      setCourseFormError('Course title is required.')
      return
    }
    if (!finalCategory) {
      setCourseFormError('Please select or specify a category.')
      return
    }
    if (coursePrice < 0) {
      setCourseFormError('Course price must be 0 or greater.')
      return
    }

    const origPriceNum = courseOriginalPrice.trim() ? Number(courseOriginalPrice) : null
    if (origPriceNum != null && origPriceNum < coursePrice) {
      setCourseFormError('Original price (MRP) must be greater than or equal to selling price.')
      return
    }

    const payload = {
      title: courseTitle.trim(),
      slug: courseSlug.trim() || undefined,
      description: courseDesc.trim(),
      category: finalCategory,
      level: courseLevel === 'none' ? null : courseLevel,
      price: coursePrice,
      original_price: origPriceNum,
      image_url: courseImageUrl.trim() || null,
      instructor: courseInstructor.trim() || 'Anushka Yadav',
      is_featured: courseIsFeatured,
      is_package: courseIsPackage,
      is_visible: true,
      bundle_course_ids: courseIsPackage ? selectedBundleCourseIds : undefined,
    }

    try {
      setIsSavingCourse(true)
      if (editingCourse) {
        await api.put(`/api/admin/courses/${editingCourse.id}`, payload)
      } else {
        await api.post('/api/admin/courses', payload)
      }
      setShowCourseModal(false)
      fetchCourses()
    } catch (err: any) {
      console.error('Failed to save course:', err)
      setCourseFormError(err?.message || 'Failed to save course.')
    } finally {
      setIsSavingCourse(false)
    }
  }

  const handleConfirmDeleteCourse = async () => {
    if (!deletingCourse) return
    try {
      setIsDeletingCourse(true)
      await api.delete(`/api/admin/courses/${deletingCourse.id}`)
      setDeletingCourse(null)
      setShowCourseModal(false)
      fetchCourses()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete course')
    } finally {
      setIsDeletingCourse(false)
    }
  }

  // Handle Dnd Drag End
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !activeCourse) return

    const oldIndex = materials.findIndex((m) => m.id === active.id)
    const newIndex = materials.findIndex((m) => m.id === over.id)

    const reordered = arrayMove(materials, oldIndex, newIndex)
    setMaterials(reordered)

    // Save order to backend
    try {
      const ids = reordered.map((m) => m.id)
      await api.put(`/api/admin/courses/${activeCourse.id}/materials/reorder`, { ids })
    } catch (err) {
      console.error('Failed to save reorder:', err)
      loadCourseMaterials(activeCourse.id)
    }
  }

  // Move Up / Down
  const handleMove = async (fromIndex: number, toIndex: number) => {
    if (!activeCourse || toIndex < 0 || toIndex >= materials.length) return
    const reordered = arrayMove(materials, fromIndex, toIndex)
    setMaterials(reordered)

    try {
      const ids = reordered.map((m) => m.id)
      await api.put(`/api/admin/courses/${activeCourse.id}/materials/reorder`, { ids })
    } catch (err) {
      console.error('Failed to reorder:', err)
      loadCourseMaterials(activeCourse.id)
    }
  }

  // Toggle Visibility
  const handleToggleVisibility = async (item: CourseMaterial) => {
    const updated = !item.is_visible
    setMaterials((prev) => prev.map((m) => (m.id === item.id ? { ...m, is_visible: updated } : m)))

    try {
      await api.put(`/api/admin/materials/${item.id}`, { is_visible: updated })
    } catch (err) {
      console.error('Failed to toggle visibility:', err)
      if (activeCourse) loadCourseMaterials(activeCourse.id)
    }
  }

  // Add Link Submit
  const handleAddLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCourse || !linkTitle.trim() || !linkUrl.trim()) return

    try {
      setIsSubmittingLink(true)
      await api.post(`/api/admin/courses/${activeCourse.id}/materials`, {
        title: linkTitle.trim(),
        kind: linkKind,
        url: linkUrl.trim(),
      })

      setShowAddLinkModal(false)
      setLinkTitle('')
      setLinkUrl('')
      loadCourseMaterials(activeCourse.id)
      fetchCourses()
    } catch (err: any) {
      alert(err?.message || 'Failed to add link material')
    } finally {
      setIsSubmittingLink(false)
    }
  }

  // Upload File Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCourse || !selectedFile) {
      setUploadError('Please select a file to upload.')
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)

      const formData = new FormData()
      formData.append('title', uploadTitle.trim() || selectedFile.name)
      formData.append('file', selectedFile)

      const res = await fetch(`/api/admin/courses/${activeCourse.id}/materials/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'File upload failed')
      }

      setShowUploadModal(false)
      setUploadTitle('')
      setSelectedFile(null)
      loadCourseMaterials(activeCourse.id)
      fetchCourses()
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload material file')
    } finally {
      setIsUploading(false)
    }
  }

  // Delete Material Confirm
  const handleConfirmDelete = async () => {
    if (!deletingMaterial || !activeCourse) return

    try {
      setIsDeleting(true)
      await api.delete(`/api/admin/materials/${deletingMaterial.id}`)
      setDeletingMaterial(null)
      loadCourseMaterials(activeCourse.id)
      fetchCourses()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete material')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#2B2A3D]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Course Content CMS</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#2E2A5C] mt-1">
            Courses & Study Materials
          </h1>
          <p className="text-sm text-[#2B2A3D]/70 mt-0.5">
            Manage course syllabus, pricing, bundle packages, and lesson materials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#5B3E96]/20 hover:bg-[#EFEAF8] text-[#2E2A5C] transition-colors"
            title="Refresh courses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddCourse}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs text-[#2E2A5C]">
          {error}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#5B3E96]/15 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-[#5B3E96]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by title, category, instructor, or description..."
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#5B3E96]/20 bg-[#FAF7FD]/50 hover:bg-white focus:bg-white text-xs sm:text-sm text-[#2E2A5C] placeholder:text-[#2B2A3D]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#2B2A3D]/40 hover:text-[#2E2A5C] rounded-md transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Filters */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between md:justify-end">
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#2B2A3D]/60 font-medium hidden sm:inline">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#5B3E96]/20 bg-white text-xs text-[#2E2A5C] font-medium focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 cursor-pointer"
              >
                <option value="all">All Categories ({courses.length})</option>
                {categories
                  .filter((cat) => cat !== 'all')
                  .map((cat) => {
                    const count = courses.filter(
                      (c) => c.category?.trim().toLowerCase() === cat.toLowerCase()
                    ).length
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    )
                  })}
              </select>
            </div>
          )}

          <div className="text-xs font-semibold text-[#5B3E96] bg-[#EFEAF8] px-3 py-2 rounded-xl whitespace-nowrap">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'}
            {(searchQuery || selectedCategory !== 'all') && ` (of ${courses.length})`}
          </div>

          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="text-xs text-[#2B2A3D]/60 hover:text-[#5B3E96] underline underline-offset-2 transition-colors whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Courses List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 bg-white rounded-3xl border border-[#5B3E96]/15 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#5B3E96]/15 p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EFEAF8] flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-[#5B3E96]" />
          </div>
          <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-1">
            {courses.length === 0 ? 'No Courses Available' : 'No matching courses found'}
          </h3>
          <p className="text-xs text-[#2B2A3D]/70 max-w-sm mb-4">
            {courses.length === 0
              ? 'Get started by creating your first course syllabus and study materials.'
              : `No courses matched your search "${searchQuery}". Try a different keyword or reset filters.`}
          </p>
          {courses.length === 0 ? (
            <button
              onClick={handleOpenAddCourse}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-[#C9A227]" />
              <span>Add First Course</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="px-4 py-2 rounded-xl bg-[#5B3E96]/10 hover:bg-[#5B3E96]/20 text-[#5B3E96] text-xs font-semibold transition-colors"
            >
              Clear Search &amp; Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-[#5B3E96]/15 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Banner Thumbnail */}
                <div className="relative h-36 w-full -mx-6 -mt-6 mb-4 overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#2E2A5C] to-[#3B2A70] flex items-center justify-center">
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center select-none text-white/50">
                      <Layers className="w-5 h-5 text-[#C9A227]/70 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C9A227]/80">
                        No Banner (Gradient Active)
                      </span>
                    </div>
                  )}
                  {course.is_featured && (
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] bg-[#C9A227] text-[#1E1B4B] shadow-xs">
                      Featured
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-3 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] bg-[#5B3E96]/10 text-[#5B3E96] border border-[#5B3E96]/20">
                      {course.category}
                    </span>
                    {course.level && (
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] bg-[#C9A227]/20 text-[#1E1B4B] border border-[#C9A227]/30">
                        {course.level}
                      </span>
                    )}
                    {course.is_package && (
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/30">
                        Package{course.bundle_items && course.bundle_items.length > 0 ? ` · ${course.bundle_items.length}` : ''}
                      </span>
                    )}
                  </div>

                  <span className="font-heading text-lg font-bold text-[#2E2A5C]">
                    {course.price === 0 ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
                    {course.original_price && course.original_price > course.price && (
                      <span className="ml-1.5 text-xs text-[#2B2A3D]/50 line-through font-normal">
                        ₹{course.original_price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </span>
                </div>

                <h3 className="font-heading text-xl font-bold text-[#2E2A5C] mb-1">
                  {course.title}
                </h3>
                <p className="text-[11px] text-[#5B3E96] font-medium mb-2">
                  Instructor: {course.instructor || 'Anushka Yadav'}
                </p>
                <p className="text-xs text-[#2B2A3D]/70 line-clamp-2 leading-relaxed mb-4">
                  {course.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#5B3E96]/10 flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E2A5C]">
                  <Layers className="w-4 h-4 text-[#C9A227]" />
                  <span>{course.materials_count} Lesson Materials</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditCourse(course)}
                    className="p-2 rounded-xl border border-[#5B3E96]/20 hover:bg-[#EFEAF8] text-[#2E2A5C] text-xs font-semibold transition-colors flex items-center gap-1.5"
                    title="Edit Course Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleOpenCourseMaterials(course)}
                    className="px-3.5 py-2 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-sm transition-colors"
                  >
                    Materials
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: COURSE MATERIALS SECTION */}
      {/* ========================================================================= */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#5B3E96]/20 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setActiveCourse(null)}
              className="absolute top-5 right-5 p-2 text-[#2B2A3D]/40 hover:text-[#2E2A5C] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pb-4 border-b border-[#5B3E96]/10 mb-4 pr-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227]">
                Materials Section
              </span>
              <h2 className="font-heading text-2xl font-bold text-[#2E2A5C]">
                {activeCourse.title}
              </h2>
              <p className="text-xs text-[#2B2A3D]/70 mt-0.5">
                Upload private study files (PDF, audio, video) or add external links. Drag items to
                reorder.
              </p>
            </div>

            {/* Action Bar: Add Link & Upload File */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-xs font-semibold text-[#2E2A5C]">
                {materials.length} Materials Published
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#5B3E96]/20 hover:bg-[#EFEAF8] text-xs font-semibold text-[#2E2A5C] transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Add Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadError(null)
                    setShowUploadModal(true)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-sm transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>

            {materialsError && (
              <div className="p-3 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs text-[#2E2A5C] mb-4">
                {materialsError}
              </div>
            )}

            {/* Sortable Materials List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingMaterials ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 bg-[#FBF7EE] rounded-2xl animate-pulse border border-[#5B3E96]/10"
                    />
                  ))}
                </div>
              ) : materials.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#2B2A3D]/60 border border-dashed border-[#5B3E96]/20 rounded-2xl">
                  No materials added to this course yet. Click "Upload File" or "Add Link" above.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={materials.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {materials.map((item, idx) => (
                      <SortableMaterialItem
                        key={item.id}
                        item={item}
                        index={idx}
                        onToggleVisibility={handleToggleVisibility}
                        onDelete={setDeletingMaterial}
                        onMoveUp={(index) => handleMove(index, index - 1)}
                        onMoveDown={(index) => handleMove(index, index + 1)}
                        isFirst={idx === 0}
                        isLast={idx === materials.length - 1}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-[#5B3E96]/10 flex justify-end">
              <button
                onClick={() => setActiveCourse(null)}
                className="px-5 py-2 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] text-xs font-semibold hover:bg-[#3C3775] transition-colors"
              >
                Close Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: ADD LINK / VIDEO LINK */}
      {/* ========================================================================= */}
      {showAddLinkModal && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#5B3E96]/20 relative">
            <button
              onClick={() => setShowAddLinkModal(false)}
              className="absolute top-4 right-4 p-2 text-[#2B2A3D]/40 hover:text-[#2E2A5C]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-heading text-xl font-bold text-[#2E2A5C] mb-1">
              Add Study Resource Link
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 mb-4">
              Add an external lecture link or video URL for this course.
            </p>

            <form onSubmit={handleAddLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] mb-1 uppercase tracking-wider">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Planetary Transits Video Lecture"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] mb-1 uppercase tracking-wider">
                  Type of Link
                </label>
                <select
                  value={linkKind}
                  onChange={(e) => setLinkKind(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs"
                >
                  <option value="link">General Web Link / Document</option>
                  <option value="video_link">Video Lecture Link (YouTube / Vimeo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] mb-1 uppercase tracking-wider">
                  HTTPS URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#5B3E96]/10">
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2B2A3D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLink}
                  className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-md disabled:opacity-60"
                >
                  {isSubmittingLink ? 'Saving...' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: UPLOAD PRIVATE FILE */}
      {/* ========================================================================= */}
      {showUploadModal && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#5B3E96]/20 relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 text-[#2B2A3D]/40 hover:text-[#2E2A5C]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-heading text-xl font-bold text-[#2E2A5C] mb-1">
              Upload Lesson Material
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 mb-4">
              Upload study notes (PDF, DOCX, ZIP) or audio/video up to 25MB. Files are saved in
              secure private storage.
            </p>

            {uploadError && (
              <div className="p-3 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs text-[#2E2A5C] mb-4">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] mb-1 uppercase tracking-wider">
                  Material Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 1 PDF Handout"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FBF7EE]/60 border border-[#5B3E96]/20 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] mb-1 uppercase tracking-wider">
                  Choose File * (Max 25MB)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.mp3,.mp4,.zip,.jpg,.jpeg,.png,.webp,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setSelectedFile(file)
                    if (file && !uploadTitle) {
                      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
                    }
                  }}
                  className="w-full text-xs text-[#2B2A3D] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#EFEAF8] file:text-[#2E2A5C] hover:file:bg-[#5B3E96]/20"
                />
                <span className="text-[10px] text-[#2B2A3D]/50 mt-1 block">
                  Supported formats: PDF, MP3, MP4, ZIP, JPG, PNG, WEBP, DOCX
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#5B3E96]/10">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2B2A3D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-md disabled:opacity-60 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Uploading to Storage...</span>
                    </>
                  ) : (
                    <span>Upload File</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: DELETE MATERIAL CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#5B3E96]/20 relative">
            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Delete Lesson Material?
            </h3>
            <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-2 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#2E2A5C]">"{deletingMaterial.title}"</strong>? Any enrolled
              clients will immediately lose access to this material.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#5B3E96]/10">
              <button
                onClick={() => setDeletingMaterial(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-[#5B3E96]/20 text-xs font-semibold text-[#2B2A3D]"
              >
                Cancel
              </button>
              {/* Note: Deep Indigo filled button, strictly no red! */}
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-md disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT COURSE FORM */}
      {/* ========================================================================= */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#2E2A5C]/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#5B3E96]/20 relative max-h-[92vh] flex flex-col my-auto">
            <button
              type="button"
              onClick={() => setShowCourseModal(false)}
              className="absolute top-5 right-5 p-2 text-[#2B2A3D]/40 hover:text-[#2E2A5C] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-[#5B3E96]/10 mb-4 pr-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227]">
                {editingCourse ? 'Update Course Details' : 'New Catalog Course'}
              </span>
              <h2 className="font-heading text-2xl font-bold text-[#2E2A5C]">
                {editingCourse ? `Edit: ${editingCourse.title}` : 'Add Course / Bundle Package'}
              </h2>
            </div>

            {courseFormError && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-xs font-medium text-[#2E2A5C]">
                {courseFormError}
              </div>
            )}

            <form onSubmit={handleSaveCourse} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Osho Zen Tarot Reading Course"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                />
              </div>

              {/* Category & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Category *
                  </label>
                  <select
                    value={isCustomCategory ? '__custom__' : courseCategory}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true)
                      } else {
                        setIsCustomCategory(false)
                        setCourseCategory(e.target.value)
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#5B3E96]/20 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  >
                    {STANDARD_COURSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Add new category...</option>
                  </select>

                  {isCustomCategory && (
                    <input
                      type="text"
                      placeholder="Enter new category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2 rounded-xl border border-[#5B3E96]/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Level
                  </label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#5B3E96]/20 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  >
                    <option value="none">None (General)</option>
                    <option value="Basic">Basic</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Basic to Advanced">Basic to Advanced</option>
                  </select>
                </div>
              </div>

              {/* Pricing (Selling Price & Original Price MRP) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                  <span className="text-[10px] text-[#2B2A3D]/60 mt-0.5 block">
                    Set 0 for Free courses
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                    Original Price / MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional (e.g. 4999)"
                    value={courseOriginalPrice}
                    onChange={(e) => setCourseOriginalPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                  <span className="text-[10px] text-[#2B2A3D]/60 mt-0.5 block">
                    Shows strikethrough with discount badge
                  </span>
                </div>
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                  Instructor Name *
                </label>
                <input
                  type="text"
                  required
                  value={courseInstructor}
                  onChange={(e) => setCourseInstructor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="Neutral 1-line description of course content..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                />
              </div>

              {/* Card Banner / Cover Image */}
              <div className="space-y-2 bg-[#FBF7EE]/60 p-4 rounded-2xl border border-[#5B3E96]/15">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                  Card Banner / Cover Image (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={courseImageUrl}
                    onChange={(e) => setCourseImageUrl(e.target.value)}
                    placeholder="/uploads/... or https://..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#5B3E96]/20 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                  <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#5B3E96]/25 bg-white text-xs font-semibold text-[#2E2A5C] hover:bg-mist cursor-pointer shrink-0 shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCourseImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {courseImageUrl && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-white rounded-xl border border-[#5B3E96]/15">
                    <img
                      src={courseImageUrl}
                      alt="Banner Preview"
                      className="w-20 h-12 object-cover rounded-lg border border-[#5B3E96]/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#2E2A5C] font-semibold truncate">{courseImageUrl}</p>
                      <button
                        type="button"
                        onClick={() => setCourseImageUrl('')}
                        className="text-[11px] text-[#5B3E96] hover:underline mt-0.5"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-[#2B2A3D]/60 block">
                  Recommended: 16:9 ratio (e.g. 1200x675). Displayed on course card in catalog and home page.
                </span>
              </div>

              {/* Toggles: Featured & Bundle Package */}
              <div className="p-4 rounded-2xl bg-[#FBF7EE] border border-[#5B3E96]/15 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseIsFeatured}
                    onChange={(e) => setCourseIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2E2A5C] focus:ring-[#5B3E96]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#2E2A5C] block">
                      Feature on Home Page
                    </span>
                    <span className="text-[11px] text-[#2B2A3D]/60 block">
                      Prominently showcases this course in the featured section on the landing page (max 9 courses in a 3-column grid).
                    </span>
                  </div>
                </label>

                <div className="pt-2 border-t border-[#5B3E96]/10">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseIsPackage}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setCourseIsPackage(checked)
                        if (checked) {
                          setCourseCategory('Packages')
                          setIsCustomCategory(false)
                        }
                      }}
                      className="w-4 h-4 rounded text-[#2E2A5C] focus:ring-[#5B3E96]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#2E2A5C] block">
                        This is a Bundle Package Course
                      </span>
                      <span className="text-[11px] text-[#2B2A3D]/60 block">
                        Bundle packages grant access to multiple enrolled courses simultaneously.
                      </span>
                    </div>
                  </label>

                  {courseIsPackage && (
                    <div className="mt-3 pt-3 border-t border-[#5B3E96]/10 space-y-2">
                      <span className="text-xs font-semibold text-[#2E2A5C] block">
                        Select Included Courses ({selectedBundleCourseIds.length} selected):
                      </span>
                      <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-[#5B3E96]/20">
                        {courses
                          .filter((c) => !c.is_package && c.id !== editingCourse?.id)
                          .map((availCourse) => {
                            const isSelected = selectedBundleCourseIds.includes(availCourse.id)
                            return (
                              <label
                                key={availCourse.id}
                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-mist text-xs cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedBundleCourseIds((prev) => [...prev, availCourse.id])
                                    } else {
                                      setSelectedBundleCourseIds((prev) =>
                                        prev.filter((id) => id !== availCourse.id)
                                      )
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-[#2E2A5C]"
                                />
                                <span className="font-medium text-[#2E2A5C]">{availCourse.title}</span>
                                <span className="ml-auto text-[10px] text-[#2B2A3D]/50">
                                  {availCourse.category}
                                </span>
                              </label>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-[#5B3E96]/10">
                {editingCourse ? (
                  <button
                    type="button"
                    onClick={() => setDeletingCourse(editingCourse)}
                    className="px-3.5 py-2 rounded-xl border border-[#5B3E96]/20 text-xs font-semibold text-[#5B3E96] hover:bg-[#EFEAF8] transition-colors"
                  >
                    Delete Course
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2B2A3D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCourse}
                    className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-md disabled:opacity-60 flex items-center gap-2"
                  >
                    {isSavingCourse ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Course...</span>
                      </>
                    ) : (
                      <span>{editingCourse ? 'Save Changes' : 'Create Course'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: DELETE COURSE CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2A5C]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#5B3E96]/20 relative">
            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Delete Course?
            </h3>
            <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#2E2A5C]">"{deletingCourse.title}"</strong>?
              If this course has existing client enrollments or orders, it cannot be deleted to preserve records.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#5B3E96]/10">
              <button
                onClick={() => setDeletingCourse(null)}
                disabled={isDeletingCourse}
                className="px-4 py-2 rounded-xl border border-[#5B3E96]/20 text-xs font-semibold text-[#2B2A3D]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCourse}
                disabled={isDeletingCourse}
                className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold shadow-md disabled:opacity-60"
              >
                {isDeletingCourse ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCourses
