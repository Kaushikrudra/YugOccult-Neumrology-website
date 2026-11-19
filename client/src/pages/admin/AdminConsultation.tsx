import React, { useEffect, useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  IndianRupee,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ListOrdered,
  Sparkles,
  Save,
} from 'lucide-react'
import { api } from '../../lib/api'

interface ServiceItem {
  id?: string
  title: string
  subtitle?: string
  description: string
  badge?: string
  inclusions_title?: string
  note?: string
  price?: number
  deliverables: string[]
}

interface ProcessStepItem {
  step?: number
  title: string
  subtitle: string
  description: string
}

interface FaqItem {
  id?: string
  question: string
  answer: string
}

interface ConsultationSettingsData {
  fee: number
  duration_minutes: number
  services: ServiceItem[]
  process_steps: ProcessStepItem[]
  faqs: FaqItem[]
}

export const AdminConsultation: React.FC = () => {
  const [fee, setFee] = useState<number>(3000)
  const [durationMinutes, setDurationMinutes] = useState<number>(45)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [processSteps, setProcessSteps] = useState<ProcessStepItem[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])

  const [initialSnapshot, setInitialSnapshot] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null)
  const [deliverableInputs, setDeliverableInputs] = useState<Record<number, string>>({})

  // Current serialized state to detect dirty changes
  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      fee,
      durationMinutes,
      services,
      processSteps,
      faqs,
    })
  }, [fee, durationMinutes, services, processSteps, faqs])

  const isDirty = initialSnapshot !== '' && currentSnapshot !== initialSnapshot

  // Warning when leaving tab if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const showToast = (msg: string) => {
    setSaveSuccessToast(msg)
    setTimeout(() => setSaveSuccessToast(null), 4000)
  }

  // Load existing consultation settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get<{ settings: ConsultationSettingsData }>('/api/admin/consultation')
      if (res.settings) {
        const s = res.settings
        const loadedFee = s.fee ?? 3000
        const loadedDuration = s.duration_minutes ?? 45
        const loadedServices = s.services || []
        const loadedSteps = s.process_steps || []
        const loadedFaqs = s.faqs || []

        setFee(loadedFee)
        setDurationMinutes(loadedDuration)
        setServices(loadedServices)
        setProcessSteps(loadedSteps)
        setFaqs(loadedFaqs)

        setInitialSnapshot(
          JSON.stringify({
            fee: loadedFee,
            durationMinutes: loadedDuration,
            services: loadedServices,
            processSteps: loadedSteps,
            faqs: loadedFaqs,
          })
        )
      }
    } catch (err: any) {
      console.error('Failed to load consultation settings:', err)
      setError(err?.message || 'Failed to retrieve consultation settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Validation
  const validate = (): string | null => {
    if (isNaN(fee) || fee < 0 || fee > 100000) {
      return 'Consultation fee must be an integer between ₹0 and ₹100,000'
    }
    if (isNaN(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
      return 'Duration must be between 5 and 480 minutes'
    }
    if (services.length > 12) {
      return 'Maximum 12 services allowed'
    }
    for (let i = 0; i < services.length; i++) {
      const s = services[i]
      if (!s.title.trim()) return `Service #${i + 1} title is required`
      if (s.title.trim().length > 80) return `Service #${i + 1} title exceeds 80 characters`
      if (s.description.length > 300) return `Service #${i + 1} description exceeds 300 characters`
    }
    if (processSteps.length > 10) {
      return 'Maximum 10 process steps allowed'
    }
    for (let i = 0; i < processSteps.length; i++) {
      const p = processSteps[i]
      if (!p.title.trim()) return `Process Step #${i + 1} title is required`
      if (p.title.trim().length > 100) return `Process Step #${i + 1} title exceeds 100 characters`
      if (p.description.length > 500) return `Process Step #${i + 1} description exceeds 500 characters`
    }
    if (faqs.length > 20) {
      return 'Maximum 20 FAQs allowed'
    }
    for (let i = 0; i < faqs.length; i++) {
      const f = faqs[i]
      if (!f.question.trim()) return `FAQ #${i + 1} question is required`
      if (f.question.trim().length > 200) return `FAQ #${i + 1} question exceeds 200 characters`
      if (!f.answer.trim()) return `FAQ #${i + 1} answer is required`
      if (f.answer.trim().length > 1000) return `FAQ #${i + 1} answer exceeds 1000 characters`
    }
    return null
  }

  // Handle Save
  const handleSave = async () => {
    const valError = validate()
    if (valError) {
      setError(valError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const normalizedSteps = processSteps.map((step, idx) => ({
        ...step,
        step: idx + 1,
        title: step.title.trim(),
        subtitle: step.subtitle?.trim() || '',
        description: step.description.trim(),
      }))

      const payload = {
        fee: Math.round(Number(fee)),
        duration_minutes: Math.round(Number(durationMinutes)),
        services: services.map((s) => ({
          ...s,
          title: s.title.trim(),
          description: s.description.trim(),
          badge: s.badge?.trim() || undefined,
          deliverables: s.deliverables || [],
        })),
        process_steps: normalizedSteps,
        faqs: faqs.map((f) => ({
          ...f,
          question: f.question.trim(),
          answer: f.answer.trim(),
        })),
      }

      const res = await api.put<{ success: boolean; settings: ConsultationSettingsData }>(
        '/api/admin/consultation',
        payload
      )

      if (res.settings) {
        setProcessSteps(res.settings.process_steps || [])
        setInitialSnapshot(
          JSON.stringify({
            fee: res.settings.fee,
            durationMinutes: res.settings.duration_minutes,
            services: res.settings.services,
            processSteps: res.settings.process_steps,
            faqs: res.settings.faqs,
          })
        )
      }

      showToast('Consultation settings updated successfully!')
    } catch (err: any) {
      console.error('Failed to save consultation settings:', err)
      setError(err?.message || 'Failed to update consultation settings')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSaving(false)
    }
  }

  // Service helpers
  const handleAddService = () => {
    if (services.length >= 12) return
    setServices((prev) => [
      ...prev,
      {
        id: `service-${Date.now()}`,
        title: 'New Specialized Service',
        description: 'Provide an overview of the analysis and spiritual methodology.',
        deliverables: [],
      },
    ])
  }

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveService = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === services.length - 1)
    ) {
      return
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const nextList = [...services]
    const temp = nextList[index]
    nextList[index] = nextList[targetIndex]
    nextList[targetIndex] = temp
    setServices(nextList)
  }

  const handleAddDeliverable = (serviceIndex: number) => {
    const text = (deliverableInputs[serviceIndex] || '').trim()
    if (!text) return
    setServices((prev) =>
      prev.map((s, idx) =>
        idx === serviceIndex
          ? { ...s, deliverables: [...(s.deliverables || []), text] }
          : s
      )
    )
    setDeliverableInputs((prev) => ({ ...prev, [serviceIndex]: '' }))
  }

  const handleRemoveDeliverable = (serviceIndex: number, delIndex: number) => {
    setServices((prev) =>
      prev.map((s, idx) =>
        idx === serviceIndex
          ? { ...s, deliverables: s.deliverables.filter((_, dIdx) => dIdx !== delIndex) }
          : s
      )
    )
  }

  // Process Step helpers
  const handleAddStep = () => {
    if (processSteps.length >= 10) return
    setProcessSteps((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        title: 'New Consultation Phase',
        subtitle: 'Key Milestones',
        description: 'Describe what occurs in this phase of the consultation roadmap.',
      },
    ])
  }

  const handleRemoveStep = (index: number) => {
    setProcessSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === processSteps.length - 1)
    ) {
      return
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const nextList = [...processSteps]
    const temp = nextList[index]
    nextList[index] = nextList[targetIndex]
    nextList[targetIndex] = temp
    setProcessSteps(nextList)
  }

  // FAQ helpers
  const handleAddFaq = () => {
    if (faqs.length >= 20) return
    setFaqs((prev) => [
      ...prev,
      {
        id: `faq-${Date.now()}`,
        question: 'Frequently Asked Question',
        answer: 'Provide a transparent, reassuring response for seekers.',
      },
    ])
  }

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === faqs.length - 1)
    ) {
      return
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const nextList = [...faqs]
    const temp = nextList[index]
    nextList[index] = nextList[targetIndex]
    nextList[targetIndex] = temp
    setFaqs(nextList)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Toast Notification */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#2E2A5C] text-[#FBF7EE] px-4 py-3 rounded-2xl shadow-xl border border-[#C9A227]/40 flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />
            <span>{saveSuccessToast}</span>
          </div>
        </div>
      )}

      {/* Header Sticky Action Bar */}
      <div className="sticky top-0 z-30 bg-[#FBF7EE]/95 backdrop-blur-md py-4 border-b border-[#5B3E96]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
            Master Settings
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2E2A5C] flex items-center gap-2.5 mt-0.5">
            <Calendar className="w-7 h-7 text-[#5B3E96]" />
            Consultation CMS
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-0.5">
            Configure consultation fees, duration, offerings, step-by-step roadmap, and seeker FAQs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-[11px] font-semibold text-[#5B3E96] bg-[#EFEAF8] px-2.5 py-1 rounded-full border border-[#5B3E96]/20">
              ● Unsaved changes
            </span>
          )}

          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading || isSaving}
            className="p-2.5 rounded-xl border border-[#5B3E96]/20 bg-white text-[#2E2A5C] hover:bg-[#EFEAF8] disabled:opacity-50 transition-colors"
            title="Reload from server"
            aria-label="Reload from server"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#2E2A5C]/90 font-semibold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 focus:outline-none"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#C9A227]" />
            ) : (
              <Save className="w-4 h-4 text-[#C9A227]" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#EFEAF8] border border-[#5B3E96]/30 flex items-start gap-3 text-xs sm:text-sm text-[#5B3E96]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold hover:text-[#2E2A5C]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#5B3E96]/15 animate-pulse h-40" />
          <div className="p-6 rounded-3xl bg-white border border-[#5B3E96]/15 animate-pulse h-64" />
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {/* SECTION 1: Master Pricing & Duration */}
          <div className="bg-white rounded-3xl border border-[#5B3E96]/15 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#5B3E96]/15 pb-4">
              <h2 className="font-heading text-xl font-bold text-[#2E2A5C] flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-[#5B3E96]" />
                Primary Booking Parameters
              </h2>
              <p className="text-xs text-[#2B2A3D]/70 mt-1">
                These values control the booking fee and duration displayed across the website hero,
                cards, and consultation page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Fee */}
              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] uppercase tracking-wider mb-1.5">
                  Consultation Fee (in ₹ Rupees)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#2E2A5C]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step={50}
                    value={fee}
                    onChange={(e) => setFee(parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#5B3E96]/25 bg-[#FBF7EE]/40 text-sm font-semibold text-[#2E2A5C] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                </div>
                {/* Live Preview Indicator */}
                <div className="mt-2 p-2 rounded-lg bg-[#EFEAF8] border border-[#5B3E96]/20 text-xs text-[#5B3E96] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                  <span>
                    Public site par dikhega:{' '}
                    <strong className="text-[#2E2A5C]">
                      ₹{Number(fee || 0).toLocaleString('en-IN')}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-[#2E2A5C] uppercase tracking-wider mb-1.5">
                  Session Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2E2A5C]/60" />
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#5B3E96]/25 bg-[#FBF7EE]/40 text-sm font-semibold text-[#2E2A5C] focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                </div>
                <div className="mt-2 p-2 rounded-lg bg-[#EFEAF8] border border-[#5B3E96]/20 text-xs text-[#5B3E96] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                  <span>
                    Public site par dikhega:{' '}
                    <strong className="text-[#2E2A5C]">{durationMinutes} Minutes</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Specialized Offerings / Services */}
          <div className="bg-white rounded-3xl border border-[#5B3E96]/15 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5B3E96]/15 pb-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#2E2A5C] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#5B3E96]" />
                  Consultation Offerings & Services ({services.length}/12)
                </h2>
                <p className="text-xs text-[#2B2A3D]/70 mt-0.5">
                  Specialized consultation areas (e.g., Kundali Reading, Numerology, Career/Marriage).
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddService}
                disabled={services.length >= 12}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EFEAF8] text-[#5B3E96] hover:bg-[#5B3E96] hover:text-[#FBF7EE] text-xs font-semibold border border-[#5B3E96]/20 transition-all disabled:opacity-40 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="space-y-4">
              {services.map((service, sIdx) => (
                <div
                  key={sIdx}
                  className="p-5 rounded-2xl border border-[#5B3E96]/20 bg-[#FBF7EE]/30 space-y-4"
                >
                  {/* Top Bar: Title, Badge, Reorder, Delete */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="text-xs font-bold text-[#5B3E96] bg-[#EFEAF8] px-2 py-0.5 rounded-md">
                        #{sIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={service.title}
                        onChange={(e) => {
                          const updated = [...services]
                          updated[sIdx].title = e.target.value
                          setServices(updated)
                        }}
                        maxLength={80}
                        placeholder="Service Title"
                        className="font-heading text-base font-bold text-[#2E2A5C] bg-white px-2.5 py-1 rounded-lg border border-[#5B3E96]/25 flex-1 focus:outline-none focus:ring-1 focus:ring-[#5B3E96]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={service.badge || ''}
                        onChange={(e) => {
                          const updated = [...services]
                          updated[sIdx].badge = e.target.value
                          setServices(updated)
                        }}
                        maxLength={40}
                        placeholder="Badge (e.g. Most Popular)"
                        className="text-xs text-[#5B3E96] bg-white px-2 py-1 rounded-lg border border-[#5B3E96]/25 w-36 focus:outline-none focus:ring-1 focus:ring-[#5B3E96]"
                      />

                      {/* Move Up / Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveService(sIdx, 'up')}
                        disabled={sIdx === 0}
                        className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-white disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveService(sIdx, 'down')}
                        disabled={sIdx === services.length - 1}
                        className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-white disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(sIdx)}
                        className="p-1.5 rounded-lg text-[#2E2A5C] hover:bg-[#2E2A5C] hover:text-[#FBF7EE] border border-[#2E2A5C]/20 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <textarea
                      value={service.description}
                      onChange={(e) => {
                        const updated = [...services]
                        updated[sIdx].description = e.target.value
                        setServices(updated)
                      }}
                      maxLength={300}
                      rows={2}
                      placeholder="Service short description (max 300 characters)..."
                      className="w-full text-xs text-[#2B2A3D] bg-white p-2.5 rounded-xl border border-[#5B3E96]/20 focus:outline-none focus:ring-1 focus:ring-[#5B3E96] resize-none"
                    />
                  </div>

                  {/* Deliverables / Inclusions */}
                  <div className="space-y-2 border-t border-[#5B3E96]/10 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A227] block">
                      Key Inclusions / Deliverables:
                    </span>
                    <div className="space-y-1.5">
                      {(service.deliverables || []).map((del, dIdx) => (
                        <div
                          key={dIdx}
                          className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#5B3E96]/15 text-xs text-[#2B2A3D]"
                        >
                          <span className="truncate flex-1">• {del}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(sIdx, dIdx)}
                            className="text-[#2B2A3D]/40 hover:text-[#2E2A5C] p-0.5"
                            title="Remove item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Deliverable Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={deliverableInputs[sIdx] || ''}
                        onChange={(e) =>
                          setDeliverableInputs({
                            ...deliverableInputs,
                            [sIdx]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddDeliverable(sIdx)
                          }
                        }}
                        maxLength={200}
                        placeholder="Add inclusion bullet point..."
                        className="flex-1 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-[#5B3E96]/20 focus:outline-none focus:ring-1 focus:ring-[#5B3E96]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddDeliverable(sIdx)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EFEAF8] text-[#5B3E96] text-xs font-semibold hover:bg-[#5B3E96] hover:text-[#FBF7EE] transition-colors"
                      >
                        Add Bullet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Process Steps Timeline */}
          <div className="bg-white rounded-3xl border border-[#5B3E96]/15 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5B3E96]/15 pb-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#2E2A5C] flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-[#5B3E96]" />
                  How It Works - Process Steps ({processSteps.length}/10)
                </h2>
                <p className="text-xs text-[#2B2A3D]/70 mt-0.5">
                  The sequential roadmap presented to seekers explaining the booking and consultation flow.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddStep}
                disabled={processSteps.length >= 10}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EFEAF8] text-[#5B3E96] hover:bg-[#5B3E96] hover:text-[#FBF7EE] text-xs font-semibold border border-[#5B3E96]/20 transition-all disabled:opacity-40 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-4">
              {processSteps.map((step, pIdx) => (
                <div
                  key={pIdx}
                  className="p-5 rounded-2xl border border-[#5B3E96]/20 bg-[#FBF7EE]/30 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="w-7 h-7 rounded-full bg-[#5B3E96] text-[#C9A227] text-xs font-bold flex items-center justify-center shrink-0">
                        {pIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const updated = [...processSteps]
                          updated[pIdx].title = e.target.value
                          setProcessSteps(updated)
                        }}
                        maxLength={100}
                        placeholder="Step Title (e.g. Submit Birth Details)"
                        className="font-heading text-sm font-bold text-[#2E2A5C] bg-white px-2.5 py-1 rounded-lg border border-[#5B3E96]/25 flex-1 focus:outline-none focus:ring-1 focus:ring-[#5B3E96]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={step.subtitle || ''}
                        onChange={(e) => {
                          const updated = [...processSteps]
                          updated[pIdx].subtitle = e.target.value
                          setProcessSteps(updated)
                        }}
                        maxLength={100}
                        placeholder="Subtitle (e.g. Date, Time & City)"
                        className="text-xs text-[#5B3E96] bg-white px-2 py-1 rounded-lg border border-[#5B3E96]/25 w-44 focus:outline-none focus:ring-1 focus:ring-[#5B3E96]"
                      />

                      <button
                        type="button"
                        onClick={() => handleMoveStep(pIdx, 'up')}
                        disabled={pIdx === 0}
                        className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-white disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(pIdx, 'down')}
                        disabled={pIdx === processSteps.length - 1}
                        className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-white disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveStep(pIdx)}
                        className="p-1.5 rounded-lg text-[#2E2A5C] hover:bg-[#2E2A5C] hover:text-[#FBF7EE] border border-[#2E2A5C]/20 transition-colors"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={step.description}
                      onChange={(e) => {
                        const updated = [...processSteps]
                        updated[pIdx].description = e.target.value
                        setProcessSteps(updated)
                      }}
                      maxLength={500}
                      rows={2}
                      placeholder="Step detailed description (max 500 characters)..."
                      className="w-full text-xs text-[#2B2A3D] bg-white p-2.5 rounded-xl border border-[#5B3E96]/20 focus:outline-none focus:ring-1 focus:ring-[#5B3E96] resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: FAQs */}
          <div className="bg-white rounded-3xl border border-[#5B3E96]/15 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5B3E96]/15 pb-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#2E2A5C] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#5B3E96]" />
                  Frequently Asked Questions ({faqs.length}/20)
                </h2>
                <p className="text-xs text-[#2B2A3D]/70 mt-0.5">
                  Questions and answers displayed on the consultation page accordion.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddFaq}
                disabled={faqs.length >= 20}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EFEAF8] text-[#5B3E96] hover:bg-[#5B3E96] hover:text-[#FBF7EE] text-xs font-semibold border border-[#5B3E96]/20 transition-all disabled:opacity-40 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, fIdx) => (
                <div
                  key={fIdx}
                  className="p-5 rounded-2xl border border-[#5B3E96]/20 bg-[#FBF7EE]/30 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-bold text-[#5B3E96] bg-[#EFEAF8] px-2 py-0.5 rounded-md">
                        Q{fIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...faqs]
                          updated[fIdx].question = e.target.value
                          setFaqs(updated)
                        }}
                        maxLength={200}
                        placeholder="Question (e.g. What details do I need to provide?)"
                        className="font-heading text-sm font-bold text-[#2E2A5C] bg-white px-2.5 py-1 rounded-lg border border-[#5B3E96]/25 flex-1 focus:outline-none focus:ring-1 focus:ring-[#5B3E96]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMoveFaq(fIdx, 'up')}
                        disabled={fIdx === 0}
                        className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-white disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveFaq(fIdx, 'down')}
                        disabled={fIdx === faqs.length - 1}
                        className="p-1.5 rounded-lg text-[#2B2A3D]/60 hover:text-[#2E2A5C] hover:bg-white disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(fIdx)}
                        className="p-1.5 rounded-lg text-[#2E2A5C] hover:bg-[#2E2A5C] hover:text-[#FBF7EE] border border-[#2E2A5C]/20 transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...faqs]
                        updated[fIdx].answer = e.target.value
                        setFaqs(updated)
                      }}
                      maxLength={1000}
                      rows={3}
                      placeholder="Answer text (max 1000 characters)..."
                      className="w-full text-xs text-[#2B2A3D] bg-white p-2.5 rounded-xl border border-[#5B3E96]/20 focus:outline-none focus:ring-1 focus:ring-[#5B3E96] resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Save Button */}
          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#2E2A5C]/90 font-semibold text-sm shadow-md transition-all disabled:opacity-50 focus:outline-none"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#C9A227]" />
              ) : (
                <Save className="w-4 h-4 text-[#C9A227]" />
              )}
              <span>{isSaving ? 'Saving Changes...' : 'Save All Consultation Settings'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminConsultation
