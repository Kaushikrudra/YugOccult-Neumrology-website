import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  BarChart2,
  User,
  Sparkles,
  Globe,
  Save,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { api } from '../../lib/api'
import {
  useSiteSettings,
  SiteStatItem,
  SiteSocialLinks,
  WhyChoosePoint,
} from '../../context/SiteSettingsContext'

type TabKey = 'contact' | 'social' | 'stats' | 'about' | 'hero' | 'seo'

export const AdminSiteSettings: React.FC = () => {
  const { refreshSettings: refreshGlobalSettings } = useSiteSettings()
  const [activeTab, setActiveTab] = useState<TabKey>('contact')

  // Form State
  const [phone, setPhone] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [timings, setTimings] = useState('')

  const [socialLinks, setSocialLinks] = useState<SiteSocialLinks>({
    instagram: '',
    youtube: '',
    facebook: '',
    linkedin: '',
  })

  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState<SiteStatItem[]>([])

  const [aboutName, setAboutName] = useState('')
  const [aboutTitle, setAboutTitle] = useState('')
  const [aboutBio, setAboutBio] = useState('')
  const [aboutExpertise, setAboutExpertise] = useState<string[]>([])
  const [aboutCredentials, setAboutCredentials] = useState<string[]>([])
  const [whyChoosePoints, setWhyChoosePoints] = useState<WhyChoosePoint[]>([])
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState('')

  const [heroBadge, setHeroBadge] = useState('')
  const [heroHeadline, setHeroHeadline] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')

  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // UI state
  const [initialSnapshot, setInitialSnapshot] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Local input helpers for list fields
  const [newExpertiseInput, setNewExpertiseInput] = useState('')
  const [newCredentialInput, setNewCredentialInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Serialized form state to detect changes
  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      phone,
      whatsappNumber,
      email,
      address,
      timings,
      socialLinks,
      showStats,
      stats,
      aboutName,
      aboutTitle,
      aboutBio,
      aboutExpertise,
      aboutCredentials,
      whyChoosePoints,
      aboutPhotoUrl,
      heroBadge,
      heroHeadline,
      heroSubtitle,
      metaTitle,
      metaDescription,
    })
  }, [
    phone,
    whatsappNumber,
    email,
    address,
    timings,
    socialLinks,
    showStats,
    stats,
    aboutName,
    aboutTitle,
    aboutBio,
    aboutExpertise,
    aboutCredentials,
    whyChoosePoints,
    aboutPhotoUrl,
    heroBadge,
    heroHeadline,
    heroSubtitle,
    metaTitle,
    metaDescription,
  ])

  const isDirty = initialSnapshot !== '' && currentSnapshot !== initialSnapshot

  // Prevent accidental navigation when form has unsaved edits
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
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Fetch current site settings from backend
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const res = await api.get<{
        settings: {
          phone: string | null
          whatsapp_number: string | null
          email: string | null
          address: string | null
          timings: string | null
          social_links: SiteSocialLinks
          show_stats: boolean
          stats: SiteStatItem[]
          about_name: string | null
          about_title: string | null
          about_bio: string | null
          about_expertise: string[]
          about_credentials: string[]
          about_photo_url: string | null
          hero_badge: string | null
          hero_headline: string | null
          hero_subtitle: string | null
          meta_title: string | null
          meta_description: string | null
          why_choose_points?: WhyChoosePoint[]
        }
      }>('/api/admin/site-settings')

      const s = res.settings
      setPhone(s.phone || '')
      setWhatsappNumber(s.whatsapp_number || '')
      setEmail(s.email || '')
      setAddress(s.address || '')
      setTimings(s.timings || '')
      setSocialLinks({
        instagram: s.social_links?.instagram || '',
        youtube: s.social_links?.youtube || '',
        facebook: s.social_links?.facebook || '',
        linkedin: s.social_links?.linkedin || '',
      })
      setShowStats(Boolean(s.show_stats))
      setStats(Array.isArray(s.stats) ? s.stats : [])
      setAboutName(s.about_name || '')
      setAboutTitle(s.about_title || '')
      setAboutBio(s.about_bio || '')
      setAboutExpertise(Array.isArray(s.about_expertise) ? s.about_expertise : [])
      setAboutCredentials(Array.isArray(s.about_credentials) ? s.about_credentials : [])
      setWhyChoosePoints(Array.isArray(s.why_choose_points) ? s.why_choose_points : [])
      setAboutPhotoUrl(s.about_photo_url || '')
      setHeroBadge(s.hero_badge || '')
      setHeroHeadline(s.hero_headline || '')
      setHeroSubtitle(s.hero_subtitle || '')
      setMetaTitle(s.meta_title || '')
      setMetaDescription(s.meta_description || '')

      const snapshot = JSON.stringify({
        phone: s.phone || '',
        whatsappNumber: s.whatsapp_number || '',
        email: s.email || '',
        address: s.address || '',
        timings: s.timings || '',
        socialLinks: {
          instagram: s.social_links?.instagram || '',
          youtube: s.social_links?.youtube || '',
          facebook: s.social_links?.facebook || '',
          linkedin: s.social_links?.linkedin || '',
        },
        showStats: Boolean(s.show_stats),
        stats: Array.isArray(s.stats) ? s.stats : [],
        aboutName: s.about_name || '',
        aboutTitle: s.about_title || '',
        aboutBio: s.about_bio || '',
        aboutExpertise: Array.isArray(s.about_expertise) ? s.about_expertise : [],
        aboutCredentials: Array.isArray(s.about_credentials) ? s.about_credentials : [],
        whyChoosePoints: Array.isArray(s.why_choose_points) ? s.why_choose_points : [],
        aboutPhotoUrl: s.about_photo_url || '',
        heroBadge: s.hero_badge || '',
        heroHeadline: s.hero_headline || '',
        heroSubtitle: s.hero_subtitle || '',
        metaTitle: s.meta_title || '',
        metaDescription: s.meta_description || '',
      })
      setInitialSnapshot(snapshot)
    } catch (err: any) {
      console.error('[AdminSiteSettings] Error fetching settings:', err)
      setErrorMessage(err?.message || 'Failed to load site settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Save changes handler
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setErrorMessage(null)

      const payload = {
        phone: phone.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        timings: timings.trim() || null,
        social_links: {
          instagram: socialLinks.instagram?.trim() || undefined,
          youtube: socialLinks.youtube?.trim() || undefined,
          facebook: socialLinks.facebook?.trim() || undefined,
          linkedin: socialLinks.linkedin?.trim() || undefined,
        },
        show_stats: showStats,
        stats: stats.filter((st) => st.label.trim() && st.value.trim()),
        about_name: aboutName.trim() || null,
        about_title: aboutTitle.trim() || null,
        about_bio: aboutBio.trim() || null,
        about_expertise: aboutExpertise.filter((e) => e.trim()),
        about_credentials: aboutCredentials.filter((c) => c.trim()),
        why_choose_points: whyChoosePoints.filter((pt) => pt.title.trim() && pt.description.trim()),
        about_photo_url: aboutPhotoUrl.trim() || null,
        hero_badge: heroBadge.trim() || null,
        hero_headline: heroHeadline.trim() || null,
        hero_subtitle: heroSubtitle.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      }

      await api.put('/api/admin/site-settings', payload)
      setInitialSnapshot(currentSnapshot)
      showToast('Site settings updated successfully!')
      // Refresh global site settings context immediately
      refreshGlobalSettings()
    } catch (err: any) {
      console.error('[AdminSiteSettings] Save error:', err)
      setErrorMessage(err?.message || 'Failed to save site settings. Please check your inputs.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle image file upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Selected image exceeds the 2MB size limit.')
      return
    }

    try {
      setIsUploadingPhoto(true)
      setErrorMessage(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/uploads/site-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to upload image')
      }

      if (result.url) {
        setAboutPhotoUrl(result.url)
        showToast('Photo uploaded successfully!')
      }
    } catch (err: any) {
      console.error('[AdminSiteSettings] Photo upload error:', err)
      setErrorMessage(
        err?.message ||
          'Failed to upload photo. You can also paste an image URL directly into the field below.'
      )
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Stats list handlers
  const handleAddStat = () => {
    if (stats.length >= 6) {
      showToast('Maximum 6 stats allowed')
      return
    }
    setStats([...stats, { label: '', value: '' }])
  }

  const handleUpdateStat = (index: number, field: keyof SiteStatItem, val: string) => {
    setStats((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    )
  }

  const handleRemoveStat = (index: number) => {
    setStats((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveStat = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === stats.length - 1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newStats = [...stats]
    const temp = newStats[index]
    newStats[index] = newStats[targetIndex]
    newStats[targetIndex] = temp
    setStats(newStats)
  }

  // Expertise tags handlers
  const handleAddExpertise = () => {
    const trimmed = newExpertiseInput.trim()
    if (!trimmed) return
    if (aboutExpertise.length >= 12) {
      showToast('Maximum 12 expertise tags allowed')
      return
    }
    if (aboutExpertise.includes(trimmed)) {
      showToast('Expertise tag already exists')
      return
    }
    setAboutExpertise([...aboutExpertise, trimmed])
    setNewExpertiseInput('')
  }

  const handleRemoveExpertise = (index: number) => {
    setAboutExpertise(aboutExpertise.filter((_, i) => i !== index))
  }

  // Credentials list handlers
  const handleAddCredential = () => {
    const trimmed = newCredentialInput.trim()
    if (!trimmed) return
    if (aboutCredentials.length >= 10) {
      showToast('Maximum 10 credentials allowed')
      return
    }
    setAboutCredentials([...aboutCredentials, trimmed])
    setNewCredentialInput('')
  }

  const handleRemoveCredential = (index: number) => {
    setAboutCredentials(aboutCredentials.filter((_, i) => i !== index))
  }

  // Why Choose points handlers
  const handleAddWhyChoosePoint = () => {
    if (whyChoosePoints.length >= 8) {
      showToast('Maximum 8 why choose points allowed')
      return
    }
    setWhyChoosePoints([...whyChoosePoints, { title: '', description: '' }])
  }

  const handleUpdateWhyChoosePoint = (
    index: number,
    field: 'title' | 'description',
    val: string
  ) => {
    setWhyChoosePoints((prev) =>
      prev.map((pt, i) => (i === index ? { ...pt, [field]: val } : pt))
    )
  }

  const handleRemoveWhyChoosePoint = (index: number) => {
    setWhyChoosePoints((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveWhyChoosePoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === whyChoosePoints.length - 1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newPoints = [...whyChoosePoints]
    const temp = newPoints[index]
    newPoints[index] = newPoints[targetIndex]
    newPoints[targetIndex] = temp
    setWhyChoosePoints(newPoints)
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
        <RefreshCw className="w-8 h-8 text-[#5B3E96] animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wider text-[#2E2A5C] uppercase">
          Loading Site Settings...
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#5B3E96]/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5B3E96]">
            <span>Portal</span>
            <span>/</span>
            <span className="text-[#C9A227]">Site Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#2E2A5C] mt-1">
            Site Settings &amp; Content Management
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2A3D]/70 mt-0.5">
            Manage public contact details, social channels, Home hero &amp; stats, and Astrologer profile.
          </p>
        </div>

        {/* Global Save / Status Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {isDirty && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#C9A227]/20 text-[#2E2A5C] border border-[#C9A227]/40">
              Unsaved changes
            </span>
          )}

          <button
            type="button"
            onClick={fetchSettings}
            disabled={isSaving}
            className="p-2.5 rounded-xl border border-[#5B3E96]/20 bg-white text-[#5B3E96] hover:bg-[#EFEAF8] transition-colors disabled:opacity-50"
            title="Reload settings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E2A5C] hover:bg-[#1E1B4B] text-[#FBF7EE] font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#C9A227]" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#C9A227]" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] border border-[#C9A227]/40 shadow-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#C9A227] shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-[#FBF7EE]/60 hover:text-[#FBF7EE] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#5B3E96]/10 border border-[#5B3E96]/30 text-[#2E2A5C] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#5B3E96] shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-semibold text-[#2E2A5C]">Notice</p>
            <p className="mt-0.5 text-[#2B2A3D]/80 leading-relaxed">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-[#2E2A5C]/60 hover:text-[#2E2A5C]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#5B3E96]/15 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'contact'
              ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
              : 'bg-white text-[#2B2A3D]/80 hover:bg-[#EFEAF8] border border-[#5B3E96]/15'
          }`}
        >
          <Phone className="w-4 h-4 text-[#C9A227]" />
          <span>Contact Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'social'
              ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
              : 'bg-white text-[#2B2A3D]/80 hover:bg-[#EFEAF8] border border-[#5B3E96]/15'
          }`}
        >
          <Instagram className="w-4 h-4 text-[#C9A227]" />
          <span>Social Links</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'hero'
              ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
              : 'bg-white text-[#2B2A3D]/80 hover:bg-[#EFEAF8] border border-[#5B3E96]/15'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#C9A227]" />
          <span>Hero Text</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'stats'
              ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
              : 'bg-white text-[#2B2A3D]/80 hover:bg-[#EFEAF8] border border-[#5B3E96]/15'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-[#C9A227]" />
          <span>Home Stats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'about'
              ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
              : 'bg-white text-[#2B2A3D]/80 hover:bg-[#EFEAF8] border border-[#5B3E96]/15'
          }`}
        >
          <User className="w-4 h-4 text-[#C9A227]" />
          <span>About Astrologer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'seo'
              ? 'bg-[#2E2A5C] text-[#FBF7EE] shadow-sm'
              : 'bg-white text-[#2B2A3D]/80 hover:bg-[#EFEAF8] border border-[#5B3E96]/15'
          }`}
        >
          <Globe className="w-4 h-4 text-[#C9A227]" />
          <span>SEO &amp; Meta</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: CONTACT DETAILS */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-2xl border border-[#5B3E96]/20 shadow-sm p-5 sm:p-7 space-y-6">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Direct Contact Information
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 mt-1">
              Important: Any field left empty will automatically be hidden on the public site (Footer, Contact page, etc.).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Helpline / Direct Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 89229 46307"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
                />
              </div>
              <p className="text-[11px] text-[#2B2A3D]/60">Displayed in Footer and Contact page.</p>
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                WhatsApp Guidance Number
              </label>
              <div className="relative">
                <span className="font-bold text-[#5B3E96] absolute left-3.5 top-2.5 text-sm">WA</span>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="918922946307"
                  className="w-full pl-11 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
                />
              </div>
              <p className="text-[11px] text-[#2B2A3D]/60">
                Used for the Floating WhatsApp button and direct chat link. Leave empty to hide the button completely.
              </p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Official Support Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anushkayadava37@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
                />
              </div>
              <p className="text-[11px] text-[#2B2A3D]/60">Official inquiries inbox.</p>
            </div>

            {/* Working Timings */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Consultation &amp; Office Timings
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={timings}
                  onChange={(e) => setTimings(e.target.value)}
                  placeholder="Monday – Saturday: 10:00 AM – 7:00 PM IST"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
                />
              </div>
              <p className="text-[11px] text-[#2B2A3D]/60">Shown on the Contact page.</p>
            </div>
          </div>

          {/* Physical Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
              Center / Ashram Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3 pointer-events-none" />
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Indira Nagar, Lucknow"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 leading-relaxed"
              />
            </div>
            <p className="text-[11px] text-[#2B2A3D]/60">Leave empty if you operate 100% online.</p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: SOCIAL MEDIA LINKS */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-2xl border border-[#5B3E96]/20 shadow-sm p-5 sm:p-7 space-y-6">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Social Media Channels
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 mt-1">
              Provide full URLs starting with https://. Any platform without a URL will not show its icon in the Footer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Instagram */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Instagram URL
              </label>
              <div className="relative">
                <Instagram className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="url"
                  value={socialLinks.instagram || ''}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, instagram: e.target.value })
                  }
                  placeholder="https://instagram.com/yugoccult"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
                />
              </div>
            </div>

            {/* YouTube */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                YouTube Channel URL
              </label>
              <div className="relative">
                <Youtube className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="url"
                  value={socialLinks.youtube || ''}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, youtube: e.target.value })
                  }
                  placeholder="https://youtube.com/@yugoccult"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
                />
              </div>
            </div>

            {/* Facebook */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Facebook Page URL
              </label>
              <div className="relative">
                <Facebook className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="url"
                  value={socialLinks.facebook || ''}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, facebook: e.target.value })
                  }
                  placeholder="https://facebook.com/yugoccult"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                LinkedIn URL
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 text-[#5B3E96] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="url"
                  value={socialLinks.linkedin || ''}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, linkedin: e.target.value })
                  }
                  placeholder="https://linkedin.com/company/yugoccult"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 3: HERO TEXT */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-2xl border border-[#5B3E96]/20 shadow-sm p-5 sm:p-7 space-y-6">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Home Page Hero Section
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 mt-1">
              Customize the sacred greeting pill, main headline, and mission subtitle rendered on the front page.
            </p>
          </div>

          <div className="space-y-4">
            {/* Eyebrow Badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold uppercase tracking-wider text-[#2E2A5C]">
                  Eyebrow Badge
                </label>
                <span className="text-[#2B2A3D]/50 text-[11px]">{heroBadge.length}/100</span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={heroBadge}
                onChange={(e) => setHeroBadge(e.target.value)}
                placeholder="ASTROLOGY • NUMEROLOGY • TAROT"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 font-medium"
              />
            </div>

            {/* Main Headline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold uppercase tracking-wider text-[#2E2A5C]">
                  Main Headline
                </label>
                <span className="text-[#2B2A3D]/50 text-[11px]">{heroHeadline.length}/200</span>
              </div>
              <input
                type="text"
                maxLength={200}
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                placeholder="Illuminate Your Soul's Path with Sacred Vedic Guidance"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 font-heading font-bold text-[#2E2A5C]"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold uppercase tracking-wider text-[#2E2A5C]">
                  Subtitle / Mission Statement
                </label>
                <span className="text-[#2B2A3D]/50 text-[11px]">{heroSubtitle.length}/500</span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Experience non-fear-based authentic horoscope readings and clinical numerological alignment..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 4: HOME STATS */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-2xl border border-[#5B3E96]/20 shadow-sm p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#5B3E96]/15">
            <div>
              <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
                Home Page Stats Strip
              </h3>
              <p className="text-xs text-[#2B2A3D]/70 mt-0.5">
                Display key trust metrics (experience, seekers guided, Vedic accuracy) right beneath the hero section.
              </p>
            </div>

            {/* Toggle Show Stats */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#2E2A5C]">
                Show Stats Strip:
              </span>
              <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  showStats ? 'bg-[#5B3E96]' : 'bg-[#2B2A3D]/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showStats ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {!showStats && (
            <div className="p-4 rounded-xl bg-[#EFEAF8]/60 border border-[#5B3E96]/20 text-xs text-[#2E2A5C] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#5B3E96] shrink-0" />
              <span>
                The stats strip is currently <strong>disabled</strong> and will not render on the home page.
              </span>
            </div>
          )}

          {/* Stat Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Metric Items ({stats.length}/6)
              </label>
              {stats.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddStat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5B3E96]/10 text-[#5B3E96] hover:bg-[#5B3E96]/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Metric</span>
                </button>
              )}
            </div>

            {stats.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-[#5B3E96]/30 text-xs text-[#2B2A3D]/60 space-y-2">
                <p>No metrics added yet.</p>
                <button
                  type="button"
                  onClick={handleAddStat}
                  className="text-[#5B3E96] font-semibold underline underline-offset-2 hover:text-[#2E2A5C]"
                >
                  Click here to add your first metric
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/50"
                  >
                    <div className="flex items-center gap-1 text-[#2B2A3D]/40 text-xs font-bold w-6 shrink-0">
                      #{idx + 1}
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                          Value (e.g. 6+, 10,000+, 100%)
                        </label>
                        <input
                          type="text"
                          maxLength={20}
                          value={st.value}
                          onChange={(e) => handleUpdateStat(idx, 'value', e.target.value)}
                          placeholder="6+"
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#5B3E96]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 font-bold text-[#2E2A5C]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#2E2A5C] mb-1">
                          Label (e.g. Years of Experience)
                        </label>
                        <input
                          type="text"
                          maxLength={40}
                          value={st.label}
                          onChange={(e) => handleUpdateStat(idx, 'label', e.target.value)}
                          placeholder="Years of Experience"
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#5B3E96]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:self-end pt-1 sm:pt-0 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveStat(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded text-[#2B2A3D]/60 hover:text-[#2E2A5C] disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStat(idx, 'down')}
                        disabled={idx === stats.length - 1}
                        className="p-1.5 rounded text-[#2B2A3D]/60 hover:text-[#2E2A5C] disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStat(idx)}
                        className="p-1.5 rounded text-[#5B3E96] hover:bg-[#5B3E96]/10"
                        title="Delete Metric"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 5: ABOUT ASTROLOGER */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl border border-[#5B3E96]/20 shadow-sm p-5 sm:p-7 space-y-6">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              About the Astrologer Profile
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 mt-1">
              Rendered on the Consultation page. Notice: if Bio is left empty, the entire &quot;About the Astrologer&quot; section will be safely hidden on the website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Astrologer Name
              </label>
              <input
                type="text"
                maxLength={100}
                value={aboutName}
                onChange={(e) => setAboutName(e.target.value)}
                placeholder="Anushka Yadav"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 font-bold text-[#2E2A5C]"
              />
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Title / Designation
              </label>
              <input
                type="text"
                maxLength={100}
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                placeholder="Occult Master Astrologer, Numerologist & Tarot Guide"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
              />
            </div>
          </div>

          {/* Photo Management */}
          <div className="p-4 rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
              Astrologer Portrait / Photo
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Photo Preview */}
              <div className="w-24 h-24 rounded-full border-2 border-[#C9A227] overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
                {aboutPhotoUrl ? (
                  <img
                    src={aboutPhotoUrl}
                    alt="Astrologer preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#5B3E96]/50 p-2 text-center">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[9px]">Geometric Avatar</span>
                  </div>
                )}
              </div>

              {/* Upload & Direct URL Controls */}
              <div className="flex-1 w-full space-y-2.5">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload-input"
                  />
                  <label
                    htmlFor="photo-upload-input"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2E2A5C] text-[#FBF7EE] hover:bg-[#1E1B4B] cursor-pointer transition-colors ${
                      isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {isUploadingPhoto ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C9A227]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#C9A227]" />
                    )}
                    <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Image (Max 2MB)'}</span>
                  </label>

                  {aboutPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setAboutPhotoUrl('')}
                      className="text-xs text-[#5B3E96] hover:underline"
                    >
                      Reset to Default Avatar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#2B2A3D]/60 whitespace-nowrap">Or Image URL:</span>
                  <input
                    type="text"
                    value={aboutPhotoUrl}
                    onChange={(e) => setAboutPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#5B3E96]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Astrologer Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold uppercase tracking-wider text-[#2E2A5C]">
                Biography / Philosophy
              </label>
              <span className="text-[#2B2A3D]/50 text-[11px]">{aboutBio.length}/3000</span>
            </div>
            <textarea
              rows={6}
              maxLength={3000}
              value={aboutBio}
              onChange={(e) => setAboutBio(e.target.value)}
              placeholder="Share the Astrologer's Vedic background, lineages studied, ethical approach, and mission..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 leading-relaxed"
            />
            <p className="text-[11px] text-[#2B2A3D]/60">
              Tip: Paragraph breaks will be formatted cleanly on the consultation page.
            </p>
          </div>

          {/* Expertise Chips */}
          <div className="space-y-2.5 pt-2 border-t border-[#5B3E96]/15">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
              Expertise Tags ({aboutExpertise.length}/12)
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {aboutExpertise.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EFEAF8] text-[#2E2A5C] border border-[#5B3E96]/20"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpertise(idx)}
                    className="hover:text-[#5B3E96]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {aboutExpertise.length < 12 && (
              <div className="flex items-center gap-2 max-w-md pt-1">
                <input
                  type="text"
                  maxLength={50}
                  value={newExpertiseInput}
                  onChange={(e) => setNewExpertiseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddExpertise()
                    }
                  }}
                  placeholder="e.g. Chaldean Numerology"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                />
                <button
                  type="button"
                  onClick={handleAddExpertise}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5B3E96]/10 text-[#5B3E96] hover:bg-[#5B3E96]/20"
                >
                  Add Tag
                </button>
              </div>
            )}
          </div>

          {/* Credentials List */}
          <div className="space-y-2.5 pt-2 border-t border-[#5B3E96]/15">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2E2A5C]">
              Lineage &amp; Credentials ({aboutCredentials.length}/10)
            </label>

            <div className="space-y-2">
              {aboutCredentials.map((cred, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[#5B3E96]/15 bg-[#FBF7EE]/30 text-xs text-[#2B2A3D]"
                >
                  <span>{cred}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCredential(idx)}
                    className="text-[#5B3E96] hover:underline ml-3"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {aboutCredentials.length < 10 && (
              <div className="flex items-center gap-2 max-w-lg pt-1">
                <input
                  type="text"
                  maxLength={100}
                  value={newCredentialInput}
                  onChange={(e) => setNewCredentialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCredential()
                    }
                  }}
                  placeholder="e.g. Certified Jyotish Acharya & Vastu Shastra Consultant"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30"
                />
                <button
                  type="button"
                  onClick={handleAddCredential}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5B3E96]/10 text-[#5B3E96] hover:bg-[#5B3E96]/20"
                >
                  Add Credential
                </button>
              </div>
            )}
          </div>

          {/* Why Choose Sub-Section */}
          <div className="space-y-4 pt-5 border-t border-[#5B3E96]/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-heading text-lg font-bold text-[#2E2A5C] flex items-center gap-2">
                  <span>Why Choose {aboutName.trim() || 'Anushka Yadav'}</span>
                  <span className="text-xs font-normal text-[#2B2A3D]/60 font-sans">
                    ({whyChoosePoints.length}/8 points)
                  </span>
                </h4>
                <p className="text-xs text-[#2B2A3D]/70 mt-0.5">
                  Sirf wahi likhein jo sach ho (apna experience, training, kaam karne ka tareeka). Khali chhodne par ye block website par nahi dikhega.
                </p>
              </div>

              {whyChoosePoints.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddWhyChoosePoint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#5B3E96]/10 text-[#5B3E96] hover:bg-[#5B3E96]/20 transition-colors self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Point</span>
                </button>
              )}
            </div>

            {whyChoosePoints.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl border border-dashed border-[#5B3E96]/30 text-xs text-[#2B2A3D]/60 space-y-2 bg-[#FBF7EE]/30">
                <p>No custom &quot;Why Choose&quot; points added yet.</p>
                <p className="text-[11px] text-[#5B3E96]">
                  Leaving this empty will cleanly hide the &quot;Why Choose&quot; block on the Consultation page and center the other two online consultation blocks.
                </p>
                <button
                  type="button"
                  onClick={handleAddWhyChoosePoint}
                  className="text-xs text-[#5B3E96] font-semibold underline underline-offset-2 hover:text-[#2E2A5C] pt-1"
                >
                  + Add first point
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {whyChoosePoints.map((pt, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#5B3E96]/10">
                      <span className="text-xs font-bold text-[#2E2A5C]">
                        Point #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveWhyChoosePoint(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-[#2B2A3D]/60 hover:text-[#2E2A5C] disabled:opacity-25"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveWhyChoosePoint(idx, 'down')}
                          disabled={idx === whyChoosePoints.length - 1}
                          className="p-1 rounded text-[#2B2A3D]/60 hover:text-[#2E2A5C] disabled:opacity-25"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveWhyChoosePoint(idx)}
                          className="p-1 rounded text-[#5B3E96] hover:bg-[#5B3E96]/15 ml-1"
                          title="Remove Point"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <label className="font-semibold uppercase tracking-wider text-[#2E2A5C]">
                            Title
                          </label>
                          <span className="text-[#2B2A3D]/50">{pt.title.length}/80</span>
                        </div>
                        <input
                          type="text"
                          maxLength={80}
                          value={pt.title}
                          onChange={(e) =>
                            handleUpdateWhyChoosePoint(idx, 'title', e.target.value)
                          }
                          placeholder="e.g. Classical Shastric Method"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#5B3E96]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 font-medium text-[#2E2A5C]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <label className="font-semibold uppercase tracking-wider text-[#2E2A5C]">
                            Description
                          </label>
                          <span className="text-[#2B2A3D]/50">{pt.description.length}/300</span>
                        </div>
                        <textarea
                          rows={2}
                          maxLength={300}
                          value={pt.description}
                          onChange={(e) =>
                            handleUpdateWhyChoosePoint(idx, 'description', e.target.value)
                          }
                          placeholder="e.g. All analysis is anchored in Parashara principles and verified astrological texts, with zero superstitious claims."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#5B3E96]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/30 text-[#2B2A3D]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 6: SEO & META */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-2xl border border-[#5B3E96]/20 shadow-sm p-5 sm:p-7 space-y-6">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2E2A5C]">
              Website Basics &amp; Search Engine Optimization (SEO)
            </h3>
            <p className="text-xs text-[#2B2A3D]/70 mt-1">
              Set the browser window title and description tag rendered across the website.
            </p>
          </div>

          <div className="space-y-4">
            {/* Meta Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold uppercase tracking-wider text-[#2E2A5C]">
                  Meta Title (Recommended: 50-60 chars)
                </label>
                <span className="text-[#2B2A3D]/50 text-[11px]">{metaTitle.length}/80</span>
              </div>
              <input
                type="text"
                maxLength={80}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="YugOccult Learning Academy | Astrology, Numerology & Tarot"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
              />
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold uppercase tracking-wider text-[#2E2A5C]">
                  Meta Description (Recommended: 120-160 chars)
                </label>
                <span className="text-[#2B2A3D]/50 text-[11px]">{metaDescription.length}/200</span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Empowering your journey with Vedic astrology, numerological insights, and transformational sacred wisdom..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#5B3E96]/20 bg-[#FBF7EE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40 leading-relaxed"
              />
            </div>

            {/* Google Search Preview */}
            <div className="mt-6 p-4 rounded-xl border border-[#5B3E96]/15 bg-[#FBF7EE]/30 space-y-1.5 max-w-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3E96]">
                Google Search Appearance Preview
              </span>
              <div className="text-xs text-[#5B3E96] truncate">
                https://yugoccult.com
              </div>
              <div className="text-base font-medium text-[#2E2A5C] truncate hover:underline cursor-pointer">
                {metaTitle || 'YugOccult Learning Academy | Astrology, Numerology & Tarot'}
              </div>
              <div className="text-xs text-[#2B2A3D]/70 line-clamp-2 leading-relaxed">
                {metaDescription ||
                  'Empowering your journey with authentic Vedic astrology readings, numerology blueprints, and certified spiritual courses.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSiteSettings
