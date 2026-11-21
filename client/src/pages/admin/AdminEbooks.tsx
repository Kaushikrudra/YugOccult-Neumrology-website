import React, { useEffect, useState, useCallback } from 'react'
import {
  BookOpen,
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
  Download,
  FileText,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
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
import { AdminEbook, EbookDownloadLog } from '../../types/ebook'

// =============================================================================
// SORTABLE EBOOK ITEM COMPONENT
// =============================================================================

interface SortableEbookItemProps {
  item: AdminEbook
  index: number
  onToggleVisibility: (item: AdminEbook) => void
  onEdit: (item: AdminEbook) => void
  onDelete: (item: AdminEbook) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

const SortableEbookItem: React.FC<SortableEbookItemProps> = ({
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

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0.0 MB'
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg text-[#2B2A3D]/40 hover:text-[#2E2A5C] cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Cover thumbnail / placeholder */}
        <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg bg-gradient-to-br from-[#1E1B4B] to-[#3B2A70] border border-[#C9A227]/30 flex items-center justify-center shrink-0 overflow-hidden relative">
          {item.cover_image_url ? (
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <BookOpen className="w-6 h-6 text-[#C9A227]" />
          )}
        </div>

        {/* Ebook Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-[#5B3E96] bg-[#EFEAF8] px-2 py-0.5 rounded-md border border-[#5B3E96]/20">
              #{index + 1}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#2E2A5C] truncate max-w-[280px] sm:max-w-md">
              {item.title}
            </span>
            {!item.is_visible && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#2B2A3D]/10 text-[#2B2A3D]/70 font-semibold uppercase">
                Hidden
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                item.price && item.price > 0
                  ? 'bg-[#C9A227] text-[#1E1B4B]'
                  : 'bg-[#EFEAF8] text-[#5B3E96] border border-[#5B3E96]/20'
              }`}
            >
              {item.price && item.price > 0 ? `₹${item.price.toLocaleString('en-IN')}` : 'Free'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#2B2A3D]/65">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <FileText className="w-3 h-3 text-[#5B3E96]" />
              {item.file_name}
            </span>
            <span>•</span>
            <span className="text-[11px] font-medium">{formatFileSize(item.size_bytes)}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5B3E96] bg-[#EFEAF8] px-2 py-0.5 rounded-full">
              <Download className="w-3 h-3" />
              {item.download_count || 0} Downloads
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Reorder arrows, visibility toggle, edit & delete actions */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#5B3E96]/10">
        {/* Accessible move buttons for touch/keyboard */}
        <div className="flex items-center gap-0.5 mr-1 bg-[#FBF7EE] p-0.5 rounded-lg border border-[#5B3E96]/15">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-1.5 rounded text-[#2B2A3D]/60 hover:text-[#2E2A5C] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Move Up"
            aria-label="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-1.5 rounded text-[#2B2A3D]/60 hover:text-[#2E2A5C] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Move Down"
            aria-label="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visibility Toggle Button (Royal Violet) */}
        <button
          type="button"
          onClick={() => onToggleVisibility(item)}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
            item.is_visible
              ? 'bg-[#EFEAF8] text-[#5B3E96] border-[#5B3E96]/30 hover:bg-[#E2D9F3]'
              : 'bg-white text-[#2B2A3D]/60 border-[#2B2A3D]/20 hover:text-[#2E2A5C]'
          }`}
          title={item.is_visible ? 'Visible on Courses page' : 'Hidden from public'}
        >
          {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="hidden sm:inline text-[11px]">
            {item.is_visible ? 'Visible' : 'Hidden'}
          </span>
        </button>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="p-2 rounded-xl bg-white hover:bg-[#EFEAF8] text-[#2E2A5C] border border-[#5B3E96]/20 transition-colors"
          title="Edit Ebook"
          aria-label="Edit Ebook"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Delete Button (Deep Indigo - No Red) */}
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="p-2 rounded-xl bg-white hover:bg-[#2E2A5C] text-[#2E2A5C] hover:text-[#FBF7EE] border border-[#2E2A5C]/20 transition-colors"
          title="Delete Ebook"
          aria-label="Delete Ebook"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN ADMIN EBOOKS VIEW
// =============================================================================

export const AdminEbooks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ebooks' | 'downloads'>('ebooks')

  // --- EBOOKS TAB STATE ---
  const [ebooks, setEbooks] = useState<AdminEbook[]>([])
  const [loadingEbooks, setLoadingEbooks] = useState(true)
  const [ebookError, setEbookError] = useState<string | null>(null)

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingEbook, setEditingEbook] = useState<AdminEbook | null>(null)
  const [deletingEbook, setDeletingEbook] = useState<AdminEbook | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state (used for Add and Edit)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCoverUrl, setFormCoverUrl] = useState('')
  const [formIsVisible, setFormIsVisible] = useState(true)
  const [formPrice, setFormPrice] = useState<number>(0)
  const [formPdfFile, setFormPdfFile] = useState<File | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [savingEbook, setSavingEbook] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [storageUnavailable, setStorageUnavailable] = useState(false)

  // --- DOWNLOADS TAB STATE ---
  const [downloads, setDownloads] = useState<EbookDownloadLog[]>([])
  const [loadingDownloads, setLoadingDownloads] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadPage, setDownloadPage] = useState(1)
  const [downloadTotalPages, setDownloadTotalPages] = useState(1)
  const [downloadTotal, setDownloadTotal] = useState(0)
  const [filterEbookId, setFilterEbookId] = useState<string>('')
  const [searchDownloads, setSearchDownloads] = useState<string>('')

  // Dnd-Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 1. Fetch Ebooks
  const loadEbooks = useCallback(async () => {
    try {
      setLoadingEbooks(true)
      setEbookError(null)
      const res = await api.get<{ ebooks: AdminEbook[] }>('/api/admin/ebooks')
      setEbooks(res.ebooks || [])
    } catch (err: any) {
      console.error('[AdminEbooks:List] Error:', err)
      setEbookError(err?.message || 'Failed to retrieve ebooks')
    } finally {
      setLoadingEbooks(false)
    }
  }, [])

  // 2. Fetch Downloads Log
  const loadDownloads = useCallback(async () => {
    try {
      setLoadingDownloads(true)
      setDownloadError(null)
      const params: Record<string, any> = {
        page: downloadPage,
        limit: 15,
      }
      if (filterEbookId) params.ebook_id = filterEbookId
      if (searchDownloads.trim()) params.search = searchDownloads.trim()

      const res = await api.get<{
        downloads: EbookDownloadLog[]
        pagination: { total: number; totalPages: number }
      }>('/api/admin/ebook-downloads', { params })

      setDownloads(res.downloads || [])
      setDownloadTotalPages(res.pagination?.totalPages || 1)
      setDownloadTotal(res.pagination?.total || 0)
    } catch (err: any) {
      console.error('[AdminEbooks:Downloads] Error:', err)
      setDownloadError(err?.message || 'Failed to retrieve download logs')
    } finally {
      setLoadingDownloads(false)
    }
  }, [downloadPage, filterEbookId, searchDownloads])

  useEffect(() => {
    loadEbooks()
  }, [loadEbooks])

  useEffect(() => {
    if (activeTab === 'downloads') {
      loadDownloads()
    }
  }, [activeTab, loadDownloads])

  // --- DND-KIT REORDER HANDLER ---
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ebooks.findIndex((e) => e.id === active.id)
    const newIndex = ebooks.findIndex((e) => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(ebooks, oldIndex, newIndex)
    setEbooks(newOrder)

    try {
      await api.put('/api/admin/ebooks/reorder', {
        ids: newOrder.map((e) => e.id),
      })
    } catch (err) {
      console.error('[AdminEbooks:Reorder] Failed to save order:', err)
      loadEbooks()
    }
  }

  const handleMove = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= ebooks.length) return
    const newOrder = arrayMove(ebooks, fromIndex, toIndex)
    setEbooks(newOrder)

    try {
      await api.put('/api/admin/ebooks/reorder', {
        ids: newOrder.map((e) => e.id),
      })
    } catch (err) {
      console.error('[AdminEbooks:Move] Failed to save order:', err)
      loadEbooks()
    }
  }

  // --- TOGGLE VISIBILITY ---
  const handleToggleVisibility = async (ebook: AdminEbook) => {
    const newStatus = !ebook.is_visible
    // Optimistic update
    setEbooks((prev) =>
      prev.map((e) => (e.id === ebook.id ? { ...e, is_visible: newStatus } : e))
    )

    try {
      await api.patch(`/api/admin/ebooks/${ebook.id}/visibility`, {
        is_visible: newStatus,
      })
    } catch (err) {
      console.error('[AdminEbooks:Visibility] Error:', err)
      loadEbooks()
    }
  }

  // --- DELETE EBOOK ---
  const handleConfirmDelete = async () => {
    if (!deletingEbook) return

    try {
      setIsDeleting(true)
      await api.delete(`/api/admin/ebooks/${deletingEbook.id}`)
      setEbooks((prev) => prev.filter((e) => e.id !== deletingEbook.id))
      setDeletingEbook(null)
    } catch (err: any) {
      console.error('[AdminEbooks:Delete] Error:', err)
      alert(err?.message || 'Failed to delete ebook')
    } finally {
      setIsDeleting(false)
    }
  }

  // --- OPEN ADD MODAL ---
  const handleOpenAddModal = () => {
    setFormTitle('')
    setFormDescription('')
    setFormCoverUrl('')
    setFormIsVisible(true)
    setFormPrice(0)
    setFormPdfFile(null)
    setFormError(null)
    setStorageUnavailable(false)
    setAddModalOpen(true)
  }

  // --- OPEN EDIT MODAL ---
  const handleOpenEditModal = (ebook: AdminEbook) => {
    setEditingEbook(ebook)
    setFormTitle(ebook.title)
    setFormDescription(ebook.description || '')
    setFormCoverUrl(ebook.cover_image_url || '')
    setFormIsVisible(ebook.is_visible)
    setFormPrice(ebook.price || 0)
    setFormPdfFile(null)
    setFormError(null)
    setStorageUnavailable(false)
  }

  // --- COVER IMAGE UPLOAD ---
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPEG, PNG, WEBP)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError('Cover image exceeds maximum allowed size of 2MB')
      return
    }

    try {
      setUploadingCover(true)
      setFormError(null)

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/uploads/site-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to upload cover image')
      }

      if (data?.url) {
        setFormCoverUrl(data.url)
      }
    } catch (err: any) {
      console.error('[AdminEbooks:CoverUpload] Error:', err)
      setFormError(err?.message || 'Image upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  // --- PDF FILE PICKER HANDLER ---
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFormPdfFile(null)
      return
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setFormError('Only PDF (.pdf) documents are accepted')
      setFormPdfFile(null)
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      setFormError('PDF file exceeds maximum allowed size of 25MB')
      setFormPdfFile(null)
      return
    }

    setFormError(null)
    setFormPdfFile(file)
  }

  // --- SAVE EBOOK (CREATE OR UPDATE) ---
  const handleSaveEbook = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setStorageUnavailable(false)

    if (!formTitle.trim()) {
      setFormError('Please provide an ebook title (up to 150 characters)')
      return
    }

    if (formTitle.trim().length > 150) {
      setFormError('Title must not exceed 150 characters')
      return
    }

    // Creating requires a PDF
    if (!editingEbook && !formPdfFile) {
      setFormError('Please select a PDF file to upload')
      return
    }

    try {
      setSavingEbook(true)

      const formData = new FormData()
      formData.append('title', formTitle.trim())
      if (formDescription.trim()) {
        formData.append('description', formDescription.trim())
      }
      if (formCoverUrl.trim()) {
        formData.append('cover_image_url', formCoverUrl.trim())
      }
      formData.append('is_visible', String(formIsVisible))
      formData.append('price', String(formPrice || 0))

      if (formPdfFile) {
        formData.append('file', formPdfFile)
      }

      const endpoint = editingEbook
        ? `/api/admin/ebooks/${editingEbook.id}`
        : '/api/admin/ebooks'
      const method = editingEbook ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 501) {
          setStorageUnavailable(true)
          throw new Error('File storage is not configured yet. Uploads are currently disabled.')
        }
        throw new Error(data?.error || 'Failed to save ebook')
      }

      // Success
      await loadEbooks()
      setAddModalOpen(false)
      setEditingEbook(null)
    } catch (err: any) {
      console.error('[AdminEbooks:Save] Error:', err)
      setFormError(err?.message || 'Failed to save ebook')
    } finally {
      setSavingEbook(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Digital Assets & Guides</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C] mt-1">
            Ebooks CMS
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-0.5">
            Manage downloadable PDF guides and monitor seeker download engagement.
          </p>
        </div>

        {activeTab === 'ebooks' && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            <span>Add Ebook</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#5B3E96]/15 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('ebooks')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all relative min-h-[44px] flex items-center ${
            activeTab === 'ebooks'
              ? 'text-[#2E2A5C]'
              : 'text-[#2B2A3D]/50 hover:text-[#2E2A5C]'
          }`}
        >
          <span>Ebooks ({ebooks.length})</span>
          {activeTab === 'ebooks' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A227] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('downloads')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all relative min-h-[44px] flex items-center ${
            activeTab === 'downloads'
              ? 'text-[#2E2A5C]'
              : 'text-[#2B2A3D]/50 hover:text-[#2E2A5C]'
          }`}
        >
          <span>Downloads {downloadTotal > 0 ? `(${downloadTotal})` : ''}</span>
          {activeTab === 'downloads' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A227] rounded-full" />
          )}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: EBOOKS MANAGEMENT LIST (DND-KIT SORTABLE) */}
      {/* ===================================================================== */}
      {activeTab === 'ebooks' && (
        <div className="space-y-4">
          {ebookError && (
            <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#5B3E96] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ebookError}</span>
            </div>
          )}

          {loadingEbooks ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white/70 rounded-2xl animate-pulse border border-[#5B3E96]/10"
                />
              ))}
            </div>
          ) : ebooks.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#5B3E96]/20 p-8 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#EFEAF8] text-[#5B3E96] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[#2E2A5C] mb-1">
                No Ebooks Added Yet
              </h3>
              <p className="text-xs sm:text-sm text-[#2B2A3D]/70 max-w-md mx-auto mb-5 leading-relaxed">
                Upload your first Vedic astrology or spiritual guide in PDF format. Free ebooks will instantly appear in the Ebooks section on the Courses page.
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold transition-all shadow-sm min-h-[44px]"
              >
                <Plus className="w-4 h-4 text-[#C9A227]" />
                <span>Add Your First Ebook</span>
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={ebooks.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {ebooks.map((item, idx) => (
                    <SortableEbookItem
                      key={item.id}
                      item={item}
                      index={idx}
                      onToggleVisibility={handleToggleVisibility}
                      onEdit={handleOpenEditModal}
                      onDelete={setDeletingEbook}
                      onMoveUp={(from) => handleMove(from, from - 1)}
                      onMoveDown={(from) => handleMove(from, from + 1)}
                      isFirst={idx === 0}
                      isLast={idx === ebooks.length - 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: DOWNLOAD AUDIT LOGS */}
      {/* ===================================================================== */}
      {activeTab === 'downloads' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#5B3E96]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Ebook Filter Dropdown */}
              <div className="sm:w-64">
                <select
                  value={filterEbookId}
                  onChange={(e) => {
                    setFilterEbookId(e.target.value)
                    setDownloadPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 text-[#2E2A5C] font-medium focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 min-h-[44px]"
                >
                  <option value="">All Ebooks ({ebooks.length})</option>
                  {ebooks.map((eb) => (
                    <option key={eb.id} value={eb.id}>
                      {eb.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search user by Name or Email */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchDownloads}
                  onChange={(e) => {
                    setSearchDownloads(e.target.value)
                    setDownloadPage(1)
                  }}
                  placeholder="Search seeker name, email, or ebook..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 text-[#2B2A3D] placeholder-[#2B2A3D]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 min-h-[44px]"
                />
                {searchDownloads && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDownloads('')
                      setDownloadPage(1)
                    }}
                    className="absolute right-3 top-3 text-[#2B2A3D]/40 hover:text-[#2E2A5C]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={loadDownloads}
              disabled={loadingDownloads}
              className="px-3.5 py-2.5 rounded-xl border border-[#5B3E96]/20 bg-white hover:bg-[#EFEAF8] text-[#5B3E96] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] shrink-0"
              title="Refresh download logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDownloads ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {downloadError && (
            <div className="p-4 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#5B3E96] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Downloads Table (Desktop) / Cards (Mobile) */}
          {loadingDownloads ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-white/70 rounded-xl animate-pulse border border-[#5B3E96]/10"
                />
              ))}
            </div>
          ) : downloads.length === 0 ? (
            <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-[#5B3E96]/20 p-8">
              <Download className="w-8 h-8 text-[#5B3E96]/50 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-[#2E2A5C]">
                No download activity recorded yet.
              </p>
              <p className="text-xs text-[#2B2A3D]/60 mt-1">
                When registered seekers download free ebooks from the Courses page, each entry will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-[#5B3E96]/15 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EFEAF8] text-[#2E2A5C] font-bold uppercase tracking-wider text-[11px] border-b border-[#5B3E96]/15">
                    <tr>
                      <th className="py-3.5 px-4">Seeker</th>
                      <th className="py-3.5 px-4">Ebook Guide</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5B3E96]/10">
                    {downloads.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FBF7EE]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#2E2A5C]">{row.user_name}</div>
                          <div className="text-[11px] text-[#2B2A3D]/60 font-mono">
                            {row.user_email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#5B3E96] flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            <span>{row.ebook_title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#2B2A3D]/70 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4 text-[#2B2A3D]/60 font-mono text-[11px]">
                          {row.ip || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden space-y-3">
                {downloads.map((row) => (
                  <div
                    key={row.id}
                    className="p-4 rounded-xl bg-white border border-[#5B3E96]/15 space-y-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-[#2E2A5C]">{row.user_name}</h4>
                        <p className="text-[11px] text-[#2B2A3D]/60 font-mono">{row.user_email}</p>
                      </div>
                      <span className="text-[10px] text-[#2B2A3D]/60 font-medium whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#5B3E96]/10 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#5B3E96] truncate mr-2">
                        {row.ebook_title}
                      </span>
                      <span className="font-mono text-[#2B2A3D]/50 text-[10px] shrink-0">
                        {row.ip || ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {downloadTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3 text-xs text-[#2B2A3D]/70">
                  <span>
                    Showing {downloads.length} of {downloadTotal} logs
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDownloadPage((p) => Math.max(1, p - 1))}
                      disabled={downloadPage <= 1}
                      className="px-3.5 py-2 rounded-xl border border-[#5B3E96]/20 bg-white hover:bg-[#EFEAF8] disabled:opacity-30 disabled:cursor-not-allowed font-medium min-h-[44px] flex items-center"
                    >
                      Previous
                    </button>
                    <span className="px-2 font-bold text-[#2E2A5C]">
                      Page {downloadPage} of {downloadTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDownloadPage((p) => Math.min(downloadTotalPages, p + 1))}
                      disabled={downloadPage >= downloadTotalPages}
                      className="px-3.5 py-2 rounded-xl border border-[#5B3E96]/20 bg-white hover:bg-[#EFEAF8] disabled:opacity-30 disabled:cursor-not-allowed font-medium min-h-[44px] flex items-center"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT EBOOK */}
      {/* ===================================================================== */}
      {(addModalOpen || editingEbook) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#2E2A5C]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#5B3E96]/20 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-[#5B3E96]/15 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFEAF8] text-[#5B3E96]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
                  {editingEbook ? 'Edit Ebook Guide' : 'Add New Ebook Guide'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false)
                  setEditingEbook(null)
                }}
                className="p-2 rounded-xl hover:bg-[#FBF7EE] text-[#2B2A3D]/60 hover:text-[#2E2A5C] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-[#EFEAF8] border border-[#5B3E96]/30 text-[#5B3E96] text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEbook} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1.5">
                  Ebook Title * (Max 150 chars)
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Fundamentals of Vedic Horoscope Interpretation"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 min-h-[44px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1.5">
                  Description (Max 1000 chars)
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="A concise summary of what seekers will learn from this sacred guide..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 leading-relaxed"
                />
              </div>

              {/* Price in INR */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C] mb-1.5">
                  Price in INR (₹) — Set to 0 for Free
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5B3E96]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step={1}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="0 for free"
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 min-h-[44px]"
                  />
                </div>
                <span className="text-[11px] text-[#2B2A3D]/65 mt-1 block">
                  {formPrice > 0
                    ? `Paid Ebook (Seekers will pay ₹${formPrice.toLocaleString('en-IN')} via Cashfree)`
                    : 'Free Ebook (Instant download for seekers without payment)'}
                </span>
              </div>

              {/* Cover Image URL / Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C]">
                  Cover Image (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formCoverUrl}
                    onChange={(e) => setFormCoverUrl(e.target.value)}
                    placeholder="https://... (Cover Image URL)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 min-h-[44px]"
                  />
                  <label className="px-3 py-2 rounded-xl bg-[#EFEAF8] hover:bg-[#E2D9F3] text-[#5B3E96] text-xs font-semibold cursor-pointer border border-[#5B3E96]/30 flex items-center gap-1.5 shrink-0 transition-colors min-h-[44px]">
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
                {formCoverUrl && (
                  <div className="flex items-center gap-2 text-xs text-[#5B3E96] font-medium pt-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="truncate max-w-xs">{formCoverUrl}</span>
                    <button
                      type="button"
                      onClick={() => setFormCoverUrl('')}
                      className="text-[#2B2A3D]/50 hover:text-[#2E2A5C] ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* PDF File Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2E2A5C]">
                  {editingEbook ? 'Replace PDF Document (Optional)' : 'PDF Document * (Max 25MB)'}
                </label>
                <div className="p-3.5 rounded-2xl border border-dashed border-[#5B3E96]/30 bg-[#FBF7EE]/30">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfChange}
                    id="ebook-file-picker"
                    disabled={storageUnavailable}
                    className="hidden"
                  />
                  <label
                    htmlFor="ebook-file-picker"
                    className="cursor-pointer flex flex-col items-center justify-center p-2 text-center"
                  >
                    <Upload className="w-6 h-6 text-[#5B3E96] mb-1.5" />
                    <span className="text-xs font-semibold text-[#2E2A5C]">
                      {formPdfFile
                        ? formPdfFile.name
                        : editingEbook
                        ? `Current: ${editingEbook.file_name} (Click to replace)`
                        : 'Click to select PDF document'}
                    </span>
                    <span className="text-[11px] text-[#2B2A3D]/60 mt-0.5">
                      {formPdfFile
                        ? `${(formPdfFile.size / (1024 * 1024)).toFixed(1)} MB`
                        : 'Only .pdf files up to 25MB'}
                    </span>
                  </label>
                </div>
                {storageUnavailable && (
                  <p className="text-xs text-[#5B3E96] font-medium">
                    File storage is not configured yet. Uploads are currently disabled.
                  </p>
                )}
              </div>

              {/* Price Field (Disabled: Free for Phase 1-4) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2B2A3D]/60 mb-1">
                  Price (INR)
                </label>
                <input
                  type="text"
                  disabled
                  value="₹0 — Free Ebook (Paid ebooks coming soon in Phase 5)"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#5B3E96]/15 bg-[#FBF7EE]/50 text-[#2B2A3D]/60 cursor-not-allowed"
                />
              </div>

              {/* Visibility Toggle */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#2E2A5C] block">
                    Public Visibility
                  </span>
                  <span className="text-[11px] text-[#2B2A3D]/60">
                    Visible immediately on Courses page
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsVisible(!formIsVisible)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    formIsVisible ? 'bg-[#5B3E96]' : 'bg-[#2B2A3D]/20'
                  }`}
                  role="switch"
                  aria-checked={formIsVisible}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      formIsVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#5B3E96]/15 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false)
                    setEditingEbook(null)
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 bg-white hover:bg-[#FBF7EE] text-[#2B2A3D] text-xs font-semibold transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEbook || storageUnavailable}
                  className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 min-h-[44px]"
                >
                  {savingEbook && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A227]" />}
                  <span>{editingEbook ? 'Update Ebook' : 'Create Ebook'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ===================================================================== */}
      {deletingEbook && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#2E2A5C]/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#5B3E96]/20 shadow-2xl p-6 sm:p-7 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-[#EFEAF8] text-[#5B3E96] flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Delete Ebook Guide?
            </h3>

            <p className="text-xs sm:text-sm text-[#2B2A3D]/80 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#2E2A5C]">"{deletingEbook.title}"</strong>?
              The PDF file will also be permanently deleted from secure storage.
            </p>

            <div className="pt-3 border-t border-[#5B3E96]/15 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingEbook(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-[#5B3E96]/20 bg-white hover:bg-[#FBF7EE] text-[#2B2A3D] text-xs font-semibold transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#3C3775] text-[#FBF7EE] text-xs font-semibold flex items-center gap-2 transition-all shadow-sm min-h-[44px]"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A227]" />}
                <span>Delete Ebook</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminEbooks
