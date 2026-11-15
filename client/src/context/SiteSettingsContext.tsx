import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export interface SiteStatItem {
  label: string
  value: string
}

export interface SiteSocialLinks {
  instagram?: string
  youtube?: string
  facebook?: string
  linkedin?: string
}

export interface WhyChoosePoint {
  title: string
  description: string
}

export interface SiteSettings {
  id?: string
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
  why_choose_points: WhyChoosePoint[]
  updated_at?: string
}

const defaultSettings: SiteSettings = {
  phone: '+91 89229 46307',
  whatsapp_number: '918922946307',
  email: 'anushkayadava37@gmail.com',
  address: 'Indira Nagar, Lucknow',
  timings: 'Monday – Saturday: 10:00 AM – 7:00 PM IST',
  social_links: {
    instagram: 'https://instagram.com/yugoccult',
    youtube: 'https://youtube.com/@yugoccult',
    facebook: 'https://facebook.com/yugoccult',
  },
  show_stats: true,
  stats: [
    { label: 'Years of Experience', value: '6+' },
    { label: 'Seekers Guided', value: '10,000+' },
    { label: 'Courses Offered', value: '29+' },
    { label: 'Authentic Shastra', value: '100%' },
  ],
  about_name: 'Anushka Yadav',
  about_title: 'Occult Master Astrologer, Numerologist & Tarot Guide',
  about_bio:
    "Welcome to YugOccult Learning Academy. My mission is to demystify Indian astrology and numerological science from superstitious exploitation. Astrology is an illuminating lantern—a divine science ('Jyotir-Isha') designed to illuminate the path ahead, identify planetary timings, and empower conscious free will.\n\nHaving studied under traditional Gurukul lineages and verified thousands of real-life horoscopes, every reading combines rigorous mathematical accuracy (Parashari, Jaimini, and Chaldean grids) with compassionate, ethical life advice.",
  about_expertise: [
    'Vedic Astrology',
    'Chaldean Numerology',
    'Tarot Guidance',
    'Vastu Shastra',
    'Prashna Kundali',
  ],
  about_credentials: [
    'Certified Jyotish Acharya & Vastu Shastra Consultant',
    'Member of Recognized Indian Vedic Astrology Councils',
    'Zero Fear-Mongering, Guilt, or Costly Superstitions',
    'Strict Client Privacy & Lifelong Confidentiality',
  ],
  about_photo_url: null,
  hero_badge: 'ASTROLOGY • NUMEROLOGY • TAROT',
  hero_headline: "Illuminate Your Soul's Path with Sacred Vedic Guidance",
  hero_subtitle:
    'Experience non-fear-based authentic horoscope readings and clinical numerological alignment. Discover clarity for your career, relationships, and spiritual dharma.',
  meta_title: 'YugOccult Learning Academy | Astrology, Numerology & Tarot',
  meta_description:
    'Empowering your journey with authentic Vedic astrology readings, numerology blueprints, and certified spiritual courses in Astrology, Numerology & Tarot.',
  why_choose_points: [],
}

interface SiteSettingsContextType {
  settings: SiteSettings
  loading: boolean
  refreshSettings: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
})

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState<boolean>(true)

  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.get<SiteSettings>('/api/site-settings')
      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          social_links: data.social_links || {},
          stats: Array.isArray(data.stats) ? data.stats : [],
          about_expertise: Array.isArray(data.about_expertise) ? data.about_expertise : [],
          about_credentials: Array.isArray(data.about_credentials) ? data.about_credentials : [],
          why_choose_points: Array.isArray(data.why_choose_points) ? data.why_choose_points : [],
        })
      }
    } catch (err) {
      console.warn('[SiteSettings] Failed to fetch settings, using safe defaults:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  // Dynamic meta title and description updater
  useEffect(() => {
    if (settings.meta_title && settings.meta_title.trim() !== '') {
      document.title = settings.meta_title.trim()
    }
    if (settings.meta_description && settings.meta_description.trim() !== '') {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', settings.meta_description.trim())
    }
  }, [settings.meta_title, settings.meta_description])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
