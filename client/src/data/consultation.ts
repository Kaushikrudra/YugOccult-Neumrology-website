export interface ConsultationService {
  id: string
  title: string
  subtitle?: string
  description: string
  deliverables: string[]
  badge?: string
  inclusions_title?: string
  note?: string
  price?: number
}

export interface ProcessStep {
  step: number
  title: string
  subtitle: string
  description: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface ConsultationConfig {
  fee: number
  duration_minutes: number
  session_mode: string
  services: ConsultationService[]
  processSteps: ProcessStep[]
  faqs: FAQItem[]
}

export const consultationData: ConsultationConfig = {
  fee: 3000,
  duration_minutes: 45,
  session_mode: '1-on-1 Private Audio / Video Call',
  services: [
    {
      id: 'kundli-reading',
      title: 'COMPREHENSIVE VEDIC KUNDALI ANALYSIS',
      subtitle: "Discover Your Life's Path Through Vedic Astrology",
      description:
        'Understand your personality, life patterns, opportunities and challenges through an in-depth analysis of your birth chart.',
      inclusions_title: 'YOUR CONSULTATION INCLUDES',
      deliverables: [
        'Complete analysis of all 12 houses and planetary placements.',
        'Lagna, Moon Sign, Nakshatra and important planetary combinations.',
        'Mahadasha, Antardasha and upcoming planetary period analysis.',
        'Career, wealth, marriage, relationships and personal growth insights.',
        'Identification of important Yogas, Doshas and planetary influences.',
        'Personalised Vedic remedies and favourable timing guidance.',
      ],
      note: 'Gain deeper insights into your life journey and make informed decisions with greater clarity.',
      badge: 'Most Popular',
    },
    {
      id: 'numerology-report',
      title: 'VEDIC NUMEROLOGY & NAME ALIGNMENT',
      subtitle: 'Unlock the Power of Your Numbers & Name',
      description:
        'Discover the traditional numerological significance of your birth date and name. Understand your personality, strengths and name vibrations through personalised Vedic numerology.',
      inclusions_title: 'YOUR CONSULTATION INCLUDES',
      deliverables: [
        'Driver Number (Mulank) and Conductor Number (Bhagyank) analysis.',
        'Complete name and spelling numerology.',
        'Lo Shu Grid analysis, including missing and repeating numbers.',
        'Personalised name-alignment recommendations.',
        'Favourable numbers, colours and days.',
        'Business and brand name numerology guidance.',
        'Personal year and upcoming numerological cycle insights.',
      ],
      note: 'Understand your numbers and explore traditional name-alignment possibilities.',
      badge: 'Transformation',
    },
    {
      id: 'career-marriage',
      title: 'CAREER, WEALTH & MARRIAGE ASTROLOGY',
      subtitle: 'Get Clarity on Career, Financial Growth & Relationships',
      description:
        'Explore important areas of your life through personalised Vedic astrology. Gain insights into professional opportunities, business potential, financial patterns and marriage prospects.',
      inclusions_title: 'YOUR CONSULTATION INCLUDES',
      deliverables: [
        'Dashamsha (D10) analysis for career and profession.',
        'Business, entrepreneurship and financial potential.',
        'Dhana Yoga and wealth-related planetary combinations.',
        'Favourable periods for career and business decisions.',
        'Navamsha (D9) and 7th-house marriage analysis.',
        'Marriage timing and compatibility insights.',
        'Mahadasha, Antardasha and transit analysis.',
        'Muhurta guidance for important milestones.',
      ],
      note: 'Make important life decisions with greater awareness and a personalised astrological perspective.',
    },
    {
      id: 'vastu-consultation',
      title: 'VASTU SHASTRA CONSULTATION & SPACE HARMONISATION',
      subtitle: 'Create a Balanced & Harmonious Living Environment',
      description:
        'Discover how traditional Vastu principles can help improve the planning and arrangement of your home, office or commercial property.',
      inclusions_title: 'YOUR CONSULTATION INCLUDES',
      deliverables: [
        'Complete directional and floor-plan analysis.',
        'Assessment of the five elements (Pancha Tattva).',
        'Main entrance and room-placement evaluation.',
        'Bedroom, kitchen, bathroom and office assessment.',
        'Brahmasthan and important directional zones.',
        'Identification of potential Vastu imbalances.',
        'Practical remedies without structural demolition wherever possible.',
        'Guidance for new property, construction and renovation.',
      ],
      note: 'Bring greater balance and harmony to your surroundings through personalised Vastu guidance.',
      price: 5100,
    },
    {
      id: 'tarot-guidance',
      title: 'TAROT CARD READING & PERSONAL GUIDANCE',
      subtitle: 'Find Clarity, Explore Possibilities & Discover Your Next Step',
      description:
        'Get a personalised Tarot reading to explore your current circumstances, emotional patterns, opportunities and possible directions ahead.',
      inclusions_title: 'YOUR CONSULTATION INCLUDES',
      deliverables: [
        'Personalised Tarot reading based on your questions.',
        'Love, marriage and relationship insights.',
        'Career, business and financial guidance.',
        'Exploration of present circumstances and recurring patterns.',
        'Potential opportunities and challenges.',
        'Personal growth and emotional clarity.',
        'Short-term outlook and possible developments.',
        'Action-oriented guidance for important decisions.',
      ],
      note: 'Discover a fresh perspective and approach your next steps with greater confidence.',
      price: 5100,
    },
    {
      id: 'business-consultation',
      title: 'BUSINESS CONSULTATION & ASTROLOGICAL GUIDANCE',
      subtitle: 'Unlock Business Opportunities & Growth Potential',
      description:
        'Get personalised insights into your business potential, partnerships, financial prospects and favourable periods through Vedic astrology and numerology.',
      inclusions_title: 'YOUR CONSULTATION INCLUDES',
      deliverables: [
        'Business potential and entrepreneurship analysis.',
        'Favourable business sectors and opportunities.',
        'Wealth, success and financial growth indicators.',
        'Business partnership compatibility.',
        'Auspicious timing for starting or expanding a business.',
        'Business name numerology and brand alignment.',
        'Muhurta for business launches and important decisions.',
        'Personalised Vedic remedies and guidance.',
      ],
      note: 'Gain clarity on business opportunities and make informed decisions for your entrepreneurial journey.',
      price: 21000,
    },
  ],
  processSteps: [
    {
      step: 1,
      title: 'Submit Birth Details',
      subtitle: 'Date, Time & City',
      description:
        'Share your exact birth date, birth time, and birth city. If you do not have an exact birth time, Prashna Kundali horary methodology will be used.',
    },
    {
      step: 2,
      title: 'Mathematical Chart Preparation',
      subtitle: 'Rigorous Vedic Calculations',
      description:
        'Before the live session, Anushka Yadav manually calculates your divisional Vargas, Mahadashas, and numerological grid to prepare deep insights.',
    },
    {
      step: 3,
      title: 'Private 1-on-1 Consultation',
      subtitle: '45-Minute Focused Call',
      description:
        'Join your scheduled one-on-one call via audio or video. Discuss your life queries openly in a completely confidential, compassionate environment.',
    },
    {
      step: 4,
      title: 'Remedial Roadmap & Support',
      subtitle: 'Clear, Practical Solutions',
      description:
        'Receive actionable Vedic remedies—gemstone guidance, mantra chanting, donations, or lifestyle modifications—tailored specifically to your birth chart.',
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'What details do I need to provide for the consultation?',
      answer:
        'Please provide your full legal name, date of birth (DD/MM/YYYY), exact time of birth (e.g., 04:35 PM), and city/state of birth. You can also mention 2–3 key life questions or focus areas (career, marriage, health, finances).',
    },
    {
      id: 'faq-2',
      question: 'What if I do not have my exact birth time?',
      answer:
        'If your birth time is unknown or approximate within a few hours, we employ ancient Prashna Kundali (Horary Astrology) combined with Chaldean Numerology to address your pressing queries with high precision.',
    },
    {
      id: 'faq-3',
      question: 'Are the remedies expensive or fear-inducing?',
      answer:
        'Never. At YugSkills Learning Institute, our sacred philosophy strictly rejects fear-mongering and commercial ritual exploitation. We prescribe accessible, classical Vedic remedies such as mantra vibrations, dietary alignments, charitable donations (Daana), and optional natural gemstones.',
    },
    {
      id: 'faq-4',
      question: 'How is the 1-on-1 consultation session conducted?',
      answer:
        'The consultation is conducted via a private video call (Google Meet/Zoom) or direct phone call according to your comfort and preference. You will have full opportunity to ask questions during the 45-minute window.',
    },
    {
      id: 'faq-5',
      question: 'Is my personal and birth information kept confidential?',
      answer:
        'Yes, with 100% strict integrity. Your birth chart data, conversations, and contact details are completely confidential and are never shared with any third party.',
    },
  ],
}
