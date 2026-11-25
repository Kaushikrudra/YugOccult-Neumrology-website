import React, { useEffect, useState, useCallback } from 'react'
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
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
import { AdminReport, ReportBadge, ReportSection } from '../../types/report'
import { invalidateReportsCache } from '../../hooks/useHasReports'

// =============================================================================
// SORTABLE REPORT ITEM COMPONENT
// =============================================================================

interface SortableReportItemProps {
  item: AdminReport
  index: number
  onToggleVisibility: (item: AdminReport) => void
  onEdit: (item: AdminReport) => void
  onDelete: (item: AdminReport) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

const SortableReportItem: React.FC<SortableReportItemProps> = ({
  item,
  index,
  onToggleVisibility,
  onEdit,
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
    opacity: isDragging ? 0.4 : 1,
  }

  const BADGE_CONFIG: Record<ReportBadge, { label: string; bg: string }> = {
    popular: { label: 'Popular', bg: 'bg-[#C9A227] text-white' },
    trending: { label: 'Trending', bg: 'bg-[#5B3E96] text-white' },
    best_seller: { label: 'Best Seller', bg: 'bg-amber-600 text-white' },
    new: { label: 'New', bg: 'bg-[#2E2A5C] text-[#FBF7EE]' },
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        item.is_visible
          ? 'bg-white border-[#5B3E96]/15 hover:border-[#5B3E96]/30 shadow-xs'
          : 'bg-[#FBF7EE]/60 border-dashed border-[#2B2A3D]/20 opacity-75'
      }`}
    >
      {/* Left side: Drag handle, thumbnail, title, meta */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reorder report item"
          className="p-1.5 text-ink/40 hover:text-ink/80 cursor-grab active:cursor-grabbing rounded-lg hover:bg-mist transition-colors shrink-0"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Thumbnail or placeholder */}
        <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-gradient-to-br from-[#1E1B4B] to-[#2E2A5C] overflow-hidden shrink-0 flex items-center justify-center border border-[#C9A227]/30">
          {item.cover_image_url ? (
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <FileText className="w-6 h-6 text-[#C9A227]" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-heading font-bold text-sm sm:text-base text-[#2B2A3D] truncate">
              {item.title}
            </h4>
            {item.badge && BADGE_CONFIG[item.badge] && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  BADGE_CONFIG[item.badge].bg
                }`}
              >
                {BADGE_CONFIG[item.badge].label}
              </span>
            )}
            {!item.is_visible && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Hidden
              </span>
            )}
          </div>

          <p className="text-xs text-ink/70 truncate mt-0.5 italic">
            {item.tagline || 'A personalised report prepared for you.'}
          </p>

          <div className="flex items-center gap-3 text-xs text-ink/75 mt-1 flex-wrap">
            <span className="font-semibold text-[#2E2A5C]">
              {item.price === 0 ? 'Free' : `₹${item.price.toLocaleString('en-IN')}`}
              {item.original_price && item.original_price > item.price && (
                <span className="text-ink/40 line-through ml-1">
                  ₹{item.original_price.toLocaleString('en-IN')}
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-ink/60">
              <ShoppingBag className="w-3.5 h-3.5 text-[#5B3E96]" />
              <span>{item.orders_count || 0} orders</span>
            </span>
            {Array.isArray(item.included) && item.included.length > 0 && (
              <span className="text-ink/60">{item.included.length} topics included</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Actions & Ordering */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-secondary/10">
        {/* Move up / down buttons */}
        <div className="flex items-center bg-mist/60 rounded-xl p-0.5 border border-secondary/15">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            aria-label="Move report up"
            className="p-1 rounded-lg text-ink/70 hover:text-ink disabled:opacity-30 disabled:pointer-events-none hover:bg-white"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            aria-label="Move report down"
            className="p-1 rounded-lg text-ink/70 hover:text-ink disabled:opacity-30 disabled:pointer-events-none hover:bg-white"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Visibility Toggle */}
        <button
          type="button"
          onClick={() => onToggleVisibility(item)}
          aria-label={item.is_visible ? 'Hide report' : 'Show report'}
          title={item.is_visible ? 'Visible on website (click to hide)' : 'Hidden (click to show)'}
          className={`p-2 rounded-xl border transition-colors ${
            item.is_visible
              ? 'border-secondary/20 text-[#2E2A5C] hover:bg-mist'
              : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(item)}
          aria-label="Edit report"
          title="Edit Report"
          className="p-2 rounded-xl border border-secondary/20 text-[#5B3E96] hover:bg-mist transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(item)}
          aria-label="Delete report"
          title="Delete Report"
          className="p-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN ADMIN REPORTS COMPONENT
// =============================================================================

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [savingReorder, setSavingReorder] = useState(false)
  const [search, setSearch] = useState('')

  // Toast / notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<AdminReport | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    badge: '' as ReportBadge | '',
    section: 'personalized' as ReportSection,
    price: 0,
    original_price: '' as string | number,
    cover_image_url: '',
    is_visible: true,
  })
  const [includedList, setIncludedList] = useState<string[]>([])
  const [newIncludedItem, setNewIncludedItem] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<AdminReport | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev))
    }, 5000)
  }

  // 1. Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get<{ reports: AdminReport[] }>('/api/admin/reports')
      if (res?.reports) {
        setReports(res.reports)
      }
    } catch (err: any) {
      console.error('[AdminReports:Fetch] Error:', err)
      showToast('error', 'Failed to load reports catalog')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // 2. Drag & Drop Reorder Handlers for specific section
  const handleSectionDragEnd = async (section: ReportSection, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sectionItems = reports.filter((item) => (item.section || 'personalized') === section)
    const oldIndex = sectionItems.findIndex((item) => item.id === active.id)
    const newIndex = sectionItems.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedSection = arrayMove(sectionItems, oldIndex, newIndex)
    const otherSectionItems = reports.filter((item) => (item.section || 'personalized') !== section)
    const combined =
      section === 'personalized'
        ? [...reorderedSection, ...otherSectionItems]
        : [...otherSectionItems, ...reorderedSection]

    setReports(combined)
    await persistSectionReorder(section, reorderedSection)
  }

  const handleSectionMoveUp = async (section: ReportSection, index: number) => {
    if (index <= 0) return
    const sectionItems = reports.filter((item) => (item.section || 'personalized') === section)
    const reorderedSection = arrayMove(sectionItems, index, index - 1)
    const otherSectionItems = reports.filter((item) => (item.section || 'personalized') !== section)
    const combined =
      section === 'personalized'
        ? [...reorderedSection, ...otherSectionItems]
        : [...otherSectionItems, ...reorderedSection]

    setReports(combined)
    await persistSectionReorder(section, reorderedSection)
  }

  const handleSectionMoveDown = async (section: ReportSection, index: number) => {
    const sectionItems = reports.filter((item) => (item.section || 'personalized') === section)
    if (index >= sectionItems.length - 1) return
    const reorderedSection = arrayMove(sectionItems, index, index + 1)
    const otherSectionItems = reports.filter((item) => (item.section || 'personalized') !== section)
    const combined =
      section === 'personalized'
        ? [...reorderedSection, ...otherSectionItems]
        : [...otherSectionItems, ...reorderedSection]

    setReports(combined)
    await persistSectionReorder(section, reorderedSection)
  }

  const persistSectionReorder = async (section: ReportSection, reorderedList: AdminReport[]) => {
    try {
      setSavingReorder(true)
      const ids = reorderedList.map((item) => item.id)
      await api.put('/api/admin/reports/reorder', { section, ids })
      invalidateReportsCache()
      showToast('success', `${section === 'personalized' ? 'Personalized' : 'Additional'} reports ordering saved`)
    } catch (err: any) {
      console.error('[AdminReports:Reorder] Error:', err)
      showToast('error', 'Failed to save new ordering. Refreshing list...')
      fetchReports()
    } finally {
      setSavingReorder(false)
    }
  }

  // 3. Toggle Visibility
  const handleToggleVisibility = async (report: AdminReport) => {
    try {
      const res = await api.patch<{ success: boolean; report: AdminReport }>(
        `/api/admin/reports/${report.id}/visibility`,
        { is_visible: !report.is_visible }
      )
      if (res?.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, is_visible: !r.is_visible } : r))
        )
        invalidateReportsCache()
        showToast(
          'success',
          `Report "${report.title}" is now ${!report.is_visible ? 'visible' : 'hidden'}`
        )
      }
    } catch (err: any) {
      console.error('[AdminReports:Visibility] Error:', err)
      showToast('error', 'Failed to change report visibility')
    }
  }

  // 4. Modal Open/Close Handlers
  const openCreateModal = () => {
    setEditingReport(null)
    setFormData({
      title: '',
      tagline: '',
      description: '',
      badge: '',
      section: 'personalized',
      price: 0,
      original_price: '',
      cover_image_url: '',
      is_visible: true,
    })
    setIncludedList([])
    setNewIncludedItem('')
    setModalOpen(true)
  }

  const openEditModal = (report: AdminReport) => {
    setEditingReport(report)
    setFormData({
      title: report.title,
      tagline: report.tagline || '',
      description: report.description || '',
      badge: report.badge || '',
      section: report.section || 'personalized',
      price: report.price,
      original_price: report.original_price ?? '',
      cover_image_url: report.cover_image_url || '',
      is_visible: report.is_visible,
    })
    setIncludedList(Array.isArray(report.included) ? [...report.included] : [])
    setNewIncludedItem('')
    setModalOpen(true)
  }

  // Included items management
  const addIncludedItem = () => {
    const trimmed = newIncludedItem.trim()
    if (!trimmed) return
    setIncludedList((prev) => [...prev, trimmed])
    setNewIncludedItem('')
  }

  const removeIncludedItem = (index: number) => {
    setIncludedList((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('error', 'Please choose a JPEG, PNG, or WEBP image')
      return
    }

    try {
      setUploadingCover(true)
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/admin/uploads/site-image', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      const res = await response.json()
      if (!response.ok) {
        throw new Error(res?.error || 'Failed to upload cover image')
      }
      if (res?.url) {
        setFormData((prev) => ({ ...prev, cover_image_url: res.url }))
        showToast('success', 'Cover image uploaded')
      }
    } catch (err: any) {
      console.error('[AdminReports:CoverUpload] Error:', err)
      showToast('error', err?.message || 'Failed to upload cover image')
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  // 5. Submit Create / Update Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showToast('error', 'Report title is required')
      return
    }

    const price = Number(formData.price) || 0
    let originalPrice: number | null = null
    if (formData.original_price !== '' && formData.original_price !== null) {
      originalPrice = Number(formData.original_price)
      if (originalPrice < price) {
        showToast('error', 'Original price cannot be less than selling price')
        return
      }
    }

    try {
      setFormSubmitting(true)
      const payload = {
        title: formData.title.trim(),
        tagline: formData.tagline.trim() || null,
        description: formData.description.trim() || null,
        badge: formData.badge || null,
        section: formData.section,
        price,
        original_price: originalPrice,
        cover_image_url: formData.cover_image_url.trim() || null,
        included: includedList,
        is_visible: formData.is_visible,
      }

      if (editingReport) {
        await api.put(`/api/admin/reports/${editingReport.id}`, payload)
        showToast('success', 'Report updated successfully')
      } else {
        await api.post('/api/admin/reports', payload)
        showToast('success', 'Report created successfully')
      }

      setModalOpen(false)
      invalidateReportsCache()
      fetchReports()
    } catch (err: any) {
      console.error('[AdminReports:Submit] Error:', err)
      showToast('error', err?.message || 'Failed to save report')
    } finally {
      setFormSubmitting(false)
    }
  }

  // 6. Delete Handler
  const handleDeleteClick = (report: AdminReport) => {
    setReportToDelete(report)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!reportToDelete) return
    try {
      setDeleting(true)
      await api.delete(`/api/admin/reports/${reportToDelete.id}`)
      setDeleteModalOpen(false)
      setReportToDelete(null)
      invalidateReportsCache()
      showToast('success', 'Report deleted successfully')
      fetchReports()
    } catch (err: any) {
      console.error('[AdminReports:Delete] Error:', err)
      if (err?.status === 409 || err?.statusCode === 409 || err?.message?.includes('Hide this report')) {
        showToast('error', 'Hide this report instead; it has orders.')
      } else {
        showToast('error', err?.message || 'Failed to delete report')
      }
    } finally {
      setDeleting(false)
    }
  }

  // Filtered reports for search
  const filteredReports = reports.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.tagline && r.tagline.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    )
  })

  const personalizedList = filteredReports.filter((r) => (r.section || 'personalized') === 'personalized')
  const additionalList = filteredReports.filter((r) => r.section === 'additional')

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
              Personalised Reports CMS
            </h1>
            <span className="text-xs bg-[#5B3E96]/10 text-[#5B3E96] font-bold px-2.5 py-0.5 rounded-full">
              {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink/75 mt-1">
            Manage your catalog of client-curated reports divided into 2 sections. Drag items within each section to reorder them on the website.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchReports}
            disabled={loading}
            className="p-2.5 rounded-xl border border-secondary/20 hover:bg-mist text-ink/70 hover:text-ink transition-colors disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] text-sm font-semibold hover:opacity-95 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            <span>Add New Report</span>
          </button>
        </div>
      </div>

      {/* Search & Status bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports across sections..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-secondary/20 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {savingReorder && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#5B3E96] font-medium animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Saving order...
          </span>
        )}
      </div>

      {/* Reports Lists by Section */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#5B3E96] animate-spin mb-3" />
          <p className="text-sm text-ink/70">Loading reports catalog...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-secondary/25 p-6">
          <FileText className="w-12 h-12 text-[#C9A227] mx-auto mb-3" />
          <h3 className="font-heading text-lg font-bold text-[#2B2A3D] mb-1">
            No Reports Created Yet
          </h3>
          <p className="text-xs sm:text-sm text-ink/70 max-w-md mx-auto mb-5">
            You haven't added any personalised reports to your catalog yet. Click the button below to add your first report.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] text-sm font-semibold hover:opacity-95 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            <span>Create First Report</span>
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION 1: PERSONALIZED FORTUNE REPORT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-secondary/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#5B3E96]" />
                <h2 className="font-heading text-lg sm:text-xl font-bold text-[#2E2A5C]">
                  Personalized Fortune Report
                </h2>
                <span className="text-xs bg-[#5B3E96]/10 text-[#5B3E96] font-bold px-2 py-0.5 rounded-full">
                  {personalizedList.length}
                </span>
              </div>
              <span className="text-xs text-ink/60 hidden sm:inline">
                Drag to reorder within this section
              </span>
            </div>

            {personalizedList.length === 0 ? (
              <p className="text-xs text-ink/50 italic py-4 pl-2">
                No reports in this section {search ? 'matching search' : ''}.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleSectionDragEnd('personalized', e)}
              >
                <SortableContext
                  items={personalizedList.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {personalizedList.map((report, index) => (
                      <SortableReportItem
                        key={report.id}
                        item={report}
                        index={index}
                        onToggleVisibility={handleToggleVisibility}
                        onEdit={openEditModal}
                        onDelete={handleDeleteClick}
                        onMoveUp={(idx) => handleSectionMoveUp('personalized', idx)}
                        onMoveDown={(idx) => handleSectionMoveDown('personalized', idx)}
                        isFirst={index === 0}
                        isLast={index === personalizedList.length - 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* SECTION 2: ADDITIONAL ASTROLOGY REPORTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-secondary/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#C9A227]" />
                <h2 className="font-heading text-lg sm:text-xl font-bold text-[#2E2A5C]">
                  Additional Astrology Reports
                </h2>
                <span className="text-xs bg-[#C9A227]/20 text-[#2E2A5C] font-bold px-2 py-0.5 rounded-full">
                  {additionalList.length}
                </span>
              </div>
              <span className="text-xs text-ink/60 hidden sm:inline">
                Drag to reorder within this section
              </span>
            </div>

            {additionalList.length === 0 ? (
              <p className="text-xs text-ink/50 italic py-4 pl-2">
                No reports in this section {search ? 'matching search' : ''}.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleSectionDragEnd('additional', e)}
              >
                <SortableContext
                  items={additionalList.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {additionalList.map((report, index) => (
                      <SortableReportItem
                        key={report.id}
                        item={report}
                        index={index}
                        onToggleVisibility={handleToggleVisibility}
                        onEdit={openEditModal}
                        onDelete={handleDeleteClick}
                        onMoveUp={(idx) => handleSectionMoveUp('additional', idx)}
                        onMoveDown={(idx) => handleSectionMoveDown('additional', idx)}
                        isFirst={index === 0}
                        isLast={index === additionalList.length - 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT REPORT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-2xl rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2E2A5C] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[#FBF7EE]">
                  {editingReport ? 'Edit Personalised Report' : 'Add New Personalised Report'}
                </h3>
                <p className="text-xs text-[#C9A227] mt-0.5">
                  Set up title, section, pricing, included features, and custom cover
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5 text-[#2B2A3D]">
              {/* Section Selector */}
              <div className="bg-white p-3.5 rounded-xl border border-secondary/15 space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B3E96] block">
                  Report Section <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value as ReportSection })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-secondary/25 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                >
                  <option value="personalized">Personalized Fortune Report</option>
                  <option value="additional">Additional Astrology Reports</option>
                </select>
                <p className="text-[11px] text-ink/60">
                  Select which category section this report will appear under on the Reports page.
                </p>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                    Report Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Varshphal Report"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                    Badge
                  </label>
                  <select
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value as ReportBadge | '' })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-secondary/25 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  >
                    <option value="">None</option>
                    <option value="popular">Most Popular</option>
                    <option value="trending">Trending</option>
                    <option value="best_seller">Best Seller</option>
                    <option value="new">New</option>
                  </select>
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                  Tagline / Catchphrase (max 140 chars)
                </label>
                <input
                  type="text"
                  maxLength={140}
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Defaults to 'A personalised report prepared for you.' if left blank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive description of the report's methodology and what insights the buyer will receive..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-secondary/25 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 resize-y"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-secondary/15">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                    Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-secondary/25 bg-white text-sm font-semibold"
                  />
                  <span className="text-[11px] text-ink/50">Enter 0 if free</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                    Original Price (₹) (Optional strikethrough)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="e.g. 1999"
                    className="w-full px-3 py-2 rounded-xl border border-secondary/25 bg-white text-sm"
                  />
                  <span className="text-[11px] text-ink/50">Must be ≥ selling price to show discount</span>
                </div>
              </div>

              {/* What's Included Builder */}
              <div className="bg-white p-4 rounded-xl border border-secondary/15 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B3E96] block">
                  What's Included (Bullet points)
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIncludedItem}
                    onChange={(e) => setNewIncludedItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addIncludedItem()
                      }
                    }}
                    placeholder="e.g. Career & Wealth timing dasha predictions"
                    className="flex-1 px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                  <button
                    type="button"
                    onClick={addIncludedItem}
                    className="px-3.5 py-2 rounded-xl bg-[#5B3E96] text-white text-xs font-semibold hover:opacity-95"
                  >
                    Add Bullet
                  </button>
                </div>

                {includedList.length > 0 ? (
                  <ul className="space-y-1.5 pt-1">
                    {includedList.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-mist/60 text-xs text-ink/90"
                      >
                        <span className="truncate">• {item}</span>
                        <button
                          type="button"
                          onClick={() => removeIncludedItem(idx)}
                          className="text-ink/40 hover:text-rose-600 p-1 shrink-0"
                          title="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-ink/50 italic">No bullets added yet.</p>
                )}
              </div>

              {/* Cover Image */}
              <div className="space-y-2 bg-white p-4 rounded-xl border border-secondary/15">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/80 block">
                  Cover Image URL (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    placeholder="/uploads/... or https://..."
                    className="flex-1 px-3 py-2 rounded-xl border border-secondary/25 text-xs sm:text-sm"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-secondary/25 text-xs font-semibold text-ink/80 hover:bg-mist cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingCover ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.cover_image_url && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={formData.cover_image_url}
                      alt="Preview"
                      className="w-12 h-14 object-cover rounded-lg border border-secondary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                      className="text-xs text-[#5B3E96] hover:text-[#2E2A5C] underline font-medium"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              {/* Visibility Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="report-visible"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                  className="rounded border-secondary/30 text-[#5B3E96] focus:ring-[#5B3E96]"
                />
                <label htmlFor="report-visible" className="text-xs font-semibold text-ink/90 cursor-pointer">
                  Visible on website immediately
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-secondary/15 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-secondary/25 text-xs sm:text-sm font-semibold hover:bg-mist"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B3E96] to-[#2E2A5C] text-[#FBF7EE] text-xs sm:text-sm font-semibold hover:opacity-95 shadow-md disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />}
                  <span>{editingReport ? 'Save Changes' : 'Create Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF7EE] w-full max-w-md rounded-2xl shadow-2xl border border-secondary/20 p-6 text-[#2B2A3D]">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-heading text-lg font-bold text-center mb-2">
              Delete Report?
            </h3>
            <p className="text-xs sm:text-sm text-ink/75 text-center leading-relaxed mb-6">
              Are you sure you want to delete &ldquo;<strong>{reportToDelete.title}</strong>&rdquo;?
              If this report has existing buyer orders, the system will block deletion to preserve records and ask you to hide it instead.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-secondary/25 text-xs sm:text-sm font-semibold hover:bg-mist"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs sm:text-sm font-semibold hover:bg-rose-700 shadow-md disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReports
