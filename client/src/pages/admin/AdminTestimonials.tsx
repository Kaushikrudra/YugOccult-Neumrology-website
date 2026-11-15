import React, { useEffect, useState } from 'react'
import {
  Quote,
  Plus,
  RefreshCw,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  X,
  AlertCircle,
  CheckCircle2,
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

export interface TestimonialItem {
  id: string
  name: string
  text: string
  location: string | null
  rating: number | null
  position: number
  is_visible: boolean
  created_at: string
}

// -----------------------------------------------------------------------------
// Sortable Testimonial Row Component
// -----------------------------------------------------------------------------
interface SortableRowProps {
  item: TestimonialItem
  index: number
  totalCount: number
  onToggleVisibility: (item: TestimonialItem) => void
  onEdit: (item: TestimonialItem) => void
  onDelete: (item: TestimonialItem) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

const SortableTestimonialRow: React.FC<SortableRowProps> = ({
  item,
  index,
  totalCount,
  onToggleVisibility,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDragging
          ? 'bg-[#FBF7EE] border-[#C9A227] shadow-xl ring-2 ring-[#C9A227]/40'
          : item.is_visible
          ? 'bg-white border-[#5B3E96]/15 hover:border-[#5B3E96]/35 shadow-xs'
          : 'bg-[#FBF7EE]/60 border-dashed border-[#2B2A3D]/25 opacity-75'
      }`}
    >
      {/* Left: Drag handle + Details */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 mt-0.5 rounded-lg text-[#2B2A3D]/40 hover:text-[#2E2A5C] hover:bg-[#EFEAF8] cursor-grab active:cursor-grabbing shrink-0 transition-colors"
          title="Drag to reorder"
          aria-label={`Drag to reorder testimonial by ${item.name}`}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          {/* Header Row: Position + Name + Location + Hidden Badge */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-[#5B3E96] bg-[#EFEAF8] px-2 py-0.5 rounded-md">
              #{index + 1}
            </span>
            <h3 className="font-heading text-base font-bold text-[#2E2A5C] truncate">
              {item.name}
            </h3>
            {item.location && (
              <span className="text-xs text-[#2B2A3D]/70 font-medium">
                • {item.location}
              </span>
            )}
            {!item.is_visible && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2B2A3D]/10 text-[#2B2A3D]/75 font-semibold uppercase tracking-wider">
                Hidden
              </span>
            )}
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-1 my-1.5">
            {item.rating && item.rating > 0 ? (
              <>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= (item.rating || 0)
                        ? 'fill-[#C9A227] text-[#C9A227]'
                        : 'text-[#2B2A3D]/20'
                    }`}
                  />
                ))}
                <span className="text-xs font-medium text-[#2B2A3D]/70 ml-1">
                  ({item.rating}/5)
                </span>
              </>
            ) : (
              <span className="text-xs text-[#2B2A3D]/50 italic">No rating given</span>
            )}
          </div>

          {/* Review Text */}
          <p className="text-xs sm:text-sm text-[#2B2A3D]/85 leading-relaxed line-clamp-2 italic">
            &ldquo;{item.text}&rdquo;
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 border-t md:border-t-0 border-[#5B3E96]/10 pt-3 md:pt-0">
        {/* Precise Position Arrow Buttons (Accessibility) */}
        <div className="flex items-center gap-0.5 bg-[#EFEAF8]/60 rounded-xl p-0.5 border border-[#5B3E96]/15">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-white disabled:opacity-20 transition-all"
            title="Move Up"
            aria-label="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === totalCount - 1}
            className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-white disabled:opacity-20 transition-all"
            title="Move Down"
            aria-label="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visible Toggle */}
        <button
          type="button"
          onClick={() => onToggleVisibility(item)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all border ${
            item.is_visible
              ? 'bg-[#5B3E96] text-[#FBF7EE] border-[#5B3E96] hover:bg-[#5B3E96]/90'
              : 'bg-[#FBF7EE] text-[#2B2A3D]/70 border-[#2B2A3D]/25 hover:bg-white'
          }`}
          title={item.is_visible ? 'Visible on site - Click to hide' : 'Hidden - Click to show'}
        >
          {item.is_visible ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hidden</span>
            </>
          )}
        </button>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="p-2 rounded-xl text-[#2E2A5C] hover:bg-[#EFEAF8] border border-[#5B3E96]/15 transition-colors"
          title="Edit Testimonial"
          aria-label="Edit Testimonial"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Delete Button (Deep Indigo Styled) */}
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="p-2 rounded-xl text-[#2E2A5C] hover:bg-[#2E2A5C] hover:text-[#FBF7EE] border border-[#2E2A5C]/20 transition-colors"
          title="Delete Testimonial"
          aria-label="Delete Testimonial"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Main AdminTestimonials Page Component
// -----------------------------------------------------------------------------
export const AdminTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modal State (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null)
  const [formValues, setFormValues] = useState({
    name: '',
    location: '',
    rating: 5 as number | null,
    text: '',
    is_visible: true,
  })
  const [formErrors, setFormErrors] = useState<{
    name?: string
    text?: string
    location?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Confirmation State
  const [deletingItem, setDeletingItem] = useState<TestimonialItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sensors for Dnd-Kit (mouse, touch, keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Fetch all testimonials
  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get<{ testimonials: TestimonialItem[] }>('/api/admin/testimonials')
      setTestimonials(res.testimonials || [])
    } catch (err: any) {
      console.error('Failed to load testimonials:', err)
      setError(err?.message || 'Failed to retrieve testimonials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  // Open modal for new testimonial
  const handleAddNew = () => {
    setEditingItem(null)
    setFormValues({
      name: '',
      location: '',
      rating: 5,
      text: '',
      is_visible: true,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  // Open modal for editing testimonial
  const handleEdit = (item: TestimonialItem) => {
    setEditingItem(item)
    setFormValues({
      name: item.name,
      location: item.location || '',
      rating: item.rating ?? 5,
      text: item.text,
      is_visible: item.is_visible,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  // Form Validation
  const validateForm = () => {
    const errors: { name?: string; text?: string; location?: string } = {}
    const trimmedName = formValues.name.trim()
    const trimmedText = formValues.text.trim()
    const trimmedLocation = formValues.location.trim()

    if (!trimmedName) {
      errors.name = 'Client name is required'
    } else if (trimmedName.length > 80) {
      errors.name = 'Name cannot exceed 80 characters'
    }

    if (!trimmedText) {
      errors.text = 'Review text is required'
    } else if (trimmedText.length > 600) {
      errors.text = 'Review text cannot exceed 600 characters'
    }

    if (trimmedLocation.length > 80) {
      errors.location = 'Location cannot exceed 80 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: formValues.name.trim(),
        location: formValues.location.trim() || null,
        rating: formValues.rating,
        text: formValues.text.trim(),
        is_visible: formValues.is_visible,
      }

      if (editingItem) {
        // PUT update
        const res = await api.put<{ success: boolean; testimonial: TestimonialItem }>(
          `/api/admin/testimonials/${editingItem.id}`,
          payload
        )
        setTestimonials((prev) =>
          prev.map((t) => (t.id === editingItem.id ? res.testimonial : t))
        )
        showToast('Testimonial updated successfully')
      } else {
        // POST create
        const res = await api.post<{ success: boolean; testimonial: TestimonialItem }>(
          '/api/admin/testimonials',
          payload
        )
        setTestimonials((prev) => [...prev, res.testimonial])
        showToast('Testimonial created successfully')
      }

      setModalOpen(false)
    } catch (err: any) {
      console.error('Save testimonial error:', err)
      setFormErrors((prev) => ({
        ...prev,
        text: err?.message || 'Failed to save testimonial',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle Visibility
  const handleToggleVisibility = async (item: TestimonialItem) => {
    const nextVal = !item.is_visible
    // Optimistic UI update
    setTestimonials((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, is_visible: nextVal } : t))
    )

    try {
      await api.patch(`/api/admin/testimonials/${item.id}/visibility`, {
        is_visible: nextVal,
      })
      showToast(nextVal ? 'Testimonial marked visible' : 'Testimonial hidden from public site')
    } catch (err: any) {
      console.error('Visibility update error:', err)
      // Rollback
      setTestimonials((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, is_visible: !nextVal } : t))
      )
      showToast('Failed to update visibility')
    }
  }

  // Delete Testimonial
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      await api.delete(`/api/admin/testimonials/${deletingItem.id}`)
      setTestimonials((prev) => prev.filter((t) => t.id !== deletingItem.id))
      showToast('Testimonial deleted successfully')
      setDeletingItem(null)
    } catch (err: any) {
      console.error('Delete error:', err)
      showToast('Failed to delete testimonial')
    } finally {
      setIsDeleting(false)
    }
  }

  // Persist Reordering
  const persistReorder = async (newOrder: TestimonialItem[]) => {
    setTestimonials(newOrder)
    try {
      await api.put('/api/admin/testimonials/reorder', {
        ids: newOrder.map((t) => t.id),
      })
      showToast('Display order updated')
    } catch (err: any) {
      console.error('Reorder error:', err)
      showToast('Failed to save display order')
      fetchTestimonials()
    }
  }

  // Drag End handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = testimonials.findIndex((t) => t.id === active.id)
    const newIndex = testimonials.findIndex((t) => t.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(testimonials, oldIndex, newIndex)
      persistReorder(newOrder)
    }
  }

  // Accessible Move Up / Down
  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    const newOrder = arrayMove(testimonials, index, index - 1)
    persistReorder(newOrder)
  }

  const handleMoveDown = (index: number) => {
    if (index >= testimonials.length - 1) return
    const newOrder = arrayMove(testimonials, index, index + 1)
    persistReorder(newOrder)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#2E2A5C] text-[#FBF7EE] px-4 py-3 rounded-2xl shadow-xl border border-[#C9A227]/40 flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5B3E96]/15 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
            Social Proof Management
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C] flex items-center gap-2.5 mt-0.5">
            <Quote className="w-7 h-7 text-[#5B3E96]" />
            Testimonials CMS
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-1">
            Manage genuine client reviews. Drag rows to control display sequence on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTestimonials}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#5B3E96]/20 bg-white text-[#2E2A5C] hover:bg-[#EFEAF8] disabled:opacity-50 transition-colors"
            title="Refresh list"
            aria-label="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#2E2A5C]/90 font-semibold text-xs sm:text-sm shadow-sm transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/30 flex items-start gap-3 text-xs sm:text-sm text-[#5B3E96]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchTestimonials}
            className="underline font-semibold hover:text-[#2E2A5C]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-[#5B3E96]/10 animate-pulse space-y-3"
            >
              <div className="h-4 bg-[#EFEAF8] rounded-md w-1/4" />
              <div className="h-3 bg-[#EFEAF8] rounded-md w-3/4" />
              <div className="h-3 bg-[#EFEAF8] rounded-md w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && testimonials.length === 0 && (
        <div className="p-8 sm:p-14 rounded-3xl bg-white border border-[#5B3E96]/15 text-center max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#EFEAF8] text-[#5B3E96] flex items-center justify-center mx-auto mb-4 border border-[#5B3E96]/20">
            <Quote className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#2E2A5C] mb-2">
            No testimonials yet
          </h2>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed mb-6">
            Add real client reviews; this section stays hidden on the website until you add one.
          </p>
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#2E2A5C]/90 font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            <span>Add First Testimonial</span>
          </button>
        </div>
      )}

      {/* Sortable List */}
      {!loading && testimonials.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#2B2A3D]/65 px-2">
            <span>
              Showing {testimonials.length} review{testimonials.length === 1 ? '' : 's'} (
              {testimonials.filter((t) => t.is_visible).length} visible)
            </span>
            <span className="hidden sm:inline italic">
              Tip: Drag handle or use arrows to change website sequence
            </span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={testimonials.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {testimonials.map((item, index) => (
                  <SortableTestimonialRow
                    key={item.id}
                    item={item}
                    index={index}
                    totalCount={testimonials.length}
                    onToggleVisibility={handleToggleVisibility}
                    onEdit={handleEdit}
                    onDelete={(t) => setDeletingItem(t)}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2E2A5C]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#5B3E96]/20 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#5B3E96]/15 pb-4 mb-5">
              <h3 className="font-heading text-xl font-bold text-[#2E2A5C] flex items-center gap-2">
                <Quote className="w-5 h-5 text-[#5B3E96]" />
                {editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-[#EFEAF8]"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] uppercase tracking-wider mb-1">
                  Client Name <span className="text-[#5B3E96]">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(e) => {
                    setFormValues({ ...formValues, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined })
                  }}
                  maxLength={80}
                  placeholder="e.g., Ananya Deshmukh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#5B3E96]/25 bg-[#FBF7EE]/40 text-xs sm:text-sm text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                />
                {formErrors.name && (
                  <p className="text-xs text-[#5B3E96] font-medium mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Location & Rating (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-[#2E2A5C] uppercase tracking-wider mb-1">
                    Location / City (Optional)
                  </label>
                  <input
                    type="text"
                    value={formValues.location}
                    onChange={(e) => {
                      setFormValues({ ...formValues, location: e.target.value })
                      if (formErrors.location) setFormErrors({ ...formErrors, location: undefined })
                    }}
                    maxLength={80}
                    placeholder="e.g., Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#5B3E96]/25 bg-[#FBF7EE]/40 text-xs sm:text-sm text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                  {formErrors.location && (
                    <p className="text-xs text-[#5B3E96] font-medium mt-1">
                      {formErrors.location}
                    </p>
                  )}
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-xs font-semibold text-[#2E2A5C] uppercase tracking-wider mb-1">
                    Rating (1 to 5)
                  </label>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormValues({ ...formValues, rating: star })}
                        className="p-1 rounded-md hover:bg-[#EFEAF8] transition-colors focus:outline-none"
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            formValues.rating && star <= formValues.rating
                              ? 'fill-[#C9A227] text-[#C9A227]'
                              : 'text-[#2B2A3D]/25'
                          }`}
                        />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormValues({ ...formValues, rating: null })}
                      className="text-[11px] text-[#2B2A3D]/60 hover:text-[#5B3E96] ml-2 underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#2E2A5C] uppercase tracking-wider">
                    Review Text <span className="text-[#5B3E96]">*</span>
                  </label>
                  <span className="text-[11px] text-[#2B2A3D]/60">
                    {formValues.text.length} / 600
                  </span>
                </div>
                <textarea
                  value={formValues.text}
                  onChange={(e) => {
                    setFormValues({ ...formValues, text: e.target.value })
                    if (formErrors.text) setFormErrors({ ...formErrors, text: undefined })
                  }}
                  maxLength={600}
                  rows={4}
                  placeholder="Share the client's genuine experience with consultations or courses..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#5B3E96]/25 bg-[#FBF7EE]/40 text-xs sm:text-sm text-[#2B2A3D] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 leading-relaxed resize-none"
                />
                {formErrors.text && (
                  <p className="text-xs text-[#5B3E96] font-medium mt-1">{formErrors.text}</p>
                )}
              </div>

              {/* Visible on Public Site Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#EFEAF8]/60 border border-[#5B3E96]/15">
                <div>
                  <span className="text-xs font-semibold text-[#2E2A5C] block">
                    Visible on Homepage
                  </span>
                  <span className="text-[11px] text-[#2B2A3D]/70 block">
                    Show immediately in the seeker experience slider
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormValues({ ...formValues, is_visible: !formValues.is_visible })
                  }
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                    formValues.is_visible ? 'bg-[#5B3E96]' : 'bg-[#2B2A3D]/25'
                  }`}
                  aria-label="Toggle visible on public site"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      formValues.is_visible ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5B3E96]/15">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-[#5B3E96]/25 text-[#2E2A5C] hover:bg-[#EFEAF8] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#2E2A5C]/90 text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Testimonial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-[#2E2A5C]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#5B3E96]/20 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EFEAF8] text-[#2E2A5C] flex items-center justify-center mx-auto mb-4 border border-[#5B3E96]/20">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="font-heading text-xl font-bold text-[#2E2A5C] mb-2">
              Delete Testimonial?
            </h3>
            <p className="text-xs sm:text-sm text-[#2B2A3D]/75 leading-relaxed mb-6">
              Are you sure you want to permanently remove the review from{' '}
              <strong className="text-[#2E2A5C]">{deletingItem.name}</strong>? This action cannot be
              undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-[#5B3E96]/25 text-[#2E2A5C] hover:bg-[#EFEAF8] text-xs font-semibold transition-colors"
              >
                Keep Testimonial
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#2E2A5C]/90 text-xs font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTestimonials
