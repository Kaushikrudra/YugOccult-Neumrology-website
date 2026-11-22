import { useEffect } from 'react'
import { useSiteSettings } from '../context/SiteSettingsContext'

export interface PageMetaOptions {
  title?: string
  description?: string
  canonicalPath?: string
  noindex?: boolean
  ogType?: string
}

const DEFAULT_BRAND = 'YugOccult Learning Academy'
const DEFAULT_DESCRIPTION =
  'Empowering your journey with authentic Vedic astrology readings, numerology blueprints, and certified spiritual courses in Astrology, Numerology & Tarot.'

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attrName, attrValue)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
  return element
}

function setCanonicalTag(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
  return link
}

export function usePageMeta(options: PageMetaOptions = {}) {
  const { settings } = useSiteSettings()

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yugoccult.in'
    const brand = DEFAULT_BRAND

    // 1. Title Resolution
    const isHome = !options.title || options.canonicalPath === '/' || options.canonicalPath === ''
    let resolvedTitle = ''
    if (isHome && settings.meta_title) {
      resolvedTitle = settings.meta_title
    } else if (options.title) {
      resolvedTitle = `${options.title} | ${brand}`
    } else {
      resolvedTitle = brand
    }

    const previousTitle = document.title
    document.title = resolvedTitle

    // 2. Description Resolution
    let resolvedDescription = options.description
    if (!resolvedDescription) {
      resolvedDescription = isHome && settings.meta_description ? settings.meta_description : DEFAULT_DESCRIPTION
    }
    setMetaTag('name', 'description', resolvedDescription)

    // 3. Canonical URL
    const canonicalPath = options.canonicalPath !== undefined ? options.canonicalPath : window.location.pathname
    const canonicalUrl = `${origin}${canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath}`
    setCanonicalTag(canonicalUrl)

    // 4. Open Graph Tags
    setMetaTag('property', 'og:title', resolvedTitle)
    setMetaTag('property', 'og:description', resolvedDescription)
    setMetaTag('property', 'og:url', canonicalUrl)
    setMetaTag('property', 'og:type', options.ogType || 'website')

    // 5. Robots tag handling
    const allowIndexing = import.meta.env.VITE_ALLOW_INDEXING === 'true'
    let robotsContent = 'noindex, nofollow'
    if (options.noindex) {
      robotsContent = 'noindex, nofollow'
    } else if (allowIndexing) {
      robotsContent = 'index, follow'
    } else {
      robotsContent = 'noindex, nofollow'
    }
    setMetaTag('name', 'robots', robotsContent)

    return () => {
      // Revert title on unmount if changing
      document.title = previousTitle
    }
  }, [
    options.title,
    options.description,
    options.canonicalPath,
    options.noindex,
    options.ogType,
    settings.meta_title,
    settings.meta_description,
  ])
}
