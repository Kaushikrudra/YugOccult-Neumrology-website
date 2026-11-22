export interface HomeAboutData {
  eyebrow: string
  heading: string
  aboutParagraph: string
  photoUrl: string
  photoAlt: string
  cards: {
    card1: {
      heading: string
      text: string
    }
    card2: {
      heading: string
      missionLabel: string
      missionText: string
      visionLabel: string
      visionText: string
    }
    card3: {
      heading: string
      text: string
    }
  }
  closingQuote: string
  primaryCtaText: string
  primaryCtaLink: string
  secondaryCtaText: string
  secondaryCtaLink: string
}

export const homeAboutData: HomeAboutData = {
  eyebrow: 'ABOUT US',
  heading: 'Meet Anushka Yadav',
  aboutParagraph:
    'Anushkaa Yadav is a multi-disciplinary spiritual guide and transformational coach dedicated to helping individuals realign their energy, purpose, and life direction. With years of experience in astrology, numerology, tarot, Vedic principles, mindset coaching, and the law of attraction, she blends ancient wisdom with modern psychological insight to bring clarity, healing, and empowerment to thousands of clients worldwide.',
  photoUrl: '/images/anushka-about.jpeg',
  photoAlt: 'Anushka Yadav at her consultation table',
  cards: {
    card1: {
      heading: 'A Voice of Knowledge & Inspiration',
      text:
        'Alongside her consulting practice, Anushka is a passionate writer and content creator, sharing transformational ideas, spiritual insights, and self-growth tools that inspire thousands. Her writing is loved for its clarity, depth, and ability to make complex spiritual concepts easy and practical.',
    },
    card2: {
      heading: 'Mission & Vision',
      missionLabel: 'Mission',
      missionText:
        "Anushkaa's mission is simple yet profound: To guide people toward emotional balance, spiritual awakening, and empowered decision-making so they can build the life they truly desire.",
      visionLabel: 'Vision',
      visionText:
        'Her vision is to create a world where individuals understand their inner power, connect with their intuition, and lead fulfilling, purpose-driven lives.',
    },
    card3: {
      heading: 'Your Journey Starts Here',
      text:
        'Whether you are seeking clarity in your career, healing in relationships, emotional peace, or guidance for your spiritual evolution, Anushka provides a safe, supportive space to transform your life.',
    },
  },
  closingQuote:
    'Your destiny is a sacred harmony of planetary rhythms, numerical vibrations, and intuitive wisdom. Through Vedic astrology, numerology, tarot, and vastu, you awaken the inner power to consciously shape the life you truly desire.',
  primaryCtaText: 'Book Consultation',
  primaryCtaLink: '/consultation',
  secondaryCtaText: 'Explore Courses',
  secondaryCtaLink: '/courses',
}

export default homeAboutData
