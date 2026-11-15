export interface SiteStats {
  yearsExperience: string
  clientsGuided: string
  coursesOffered: string
  vedicAccuracy: string
}

export interface SiteConfig {
  brandName: string
  tagline: string
  phone: string
  email: string
  address: string
  whatsappNumber: string
  timings: string
  stats: SiteStats
  socialLinks: {
    instagram: string
    youtube: string
    facebook: string
  }
}

export const siteConfig: SiteConfig = {
  brandName: 'YugSkills Learning Institute',
  tagline: 'ASTROLOGY • NUMEROLOGY • TAROT',
  phone: '+91 89229 46307',
  email: 'anushkayadava37@gmail.com',
  address: 'Indira Nagar, Lucknow',
  whatsappNumber: '918922946307',
  timings: 'Monday – Saturday: 10:00 AM – 7:00 PM IST',
  stats: {
    yearsExperience: '6+',
    clientsGuided: '10,000+',
    coursesOffered: '6+',
    vedicAccuracy: '100%',
  },
  socialLinks: {
    instagram: '#social-instagram',
    youtube: '#social-youtube',
    facebook: '#social-facebook',
  },
}
