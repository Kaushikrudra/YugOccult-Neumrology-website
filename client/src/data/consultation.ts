export interface ConsultationService {
  id: string
  title: string
  description: string
  deliverables: string[]
  badge?: string
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
      title: 'Comprehensive Kundali Reading',
      description:
        'In-depth examination of your Lagna chart, Moon sign, planetary conjunctions, and current Mahadasha/Antardasha cycles.',
      deliverables: [
        'Detailed analysis of all 12 houses and planetary placements',
        'Vimshottari Dasha roadmap for upcoming years',
        'Identification of key strengths and dormant potentials',
        'Non-fear-based Vedic remedial recommendations',
      ],
      badge: 'Most Popular',
    },
    {
      id: 'numerology-report',
      title: 'Vedic Numerology & Name Correction',
      description:
        'Comprehensive assessment of your Driver (Mulank), Conductor (Bhagyank), and full name vibration harmony.',
      deliverables: [
        'Evaluation of name spelling vibration and sound frequency',
        'Analysis of missing and repeating numbers in your grid',
        'Harmonious name spelling adjustment suggestions',
        'Lucky numbers, favorable colors, and auspicious days',
      ],
      badge: 'Transformation',
    },
    {
      id: 'career-marriage',
      title: 'Career, Wealth & Marriage Guidance',
      description:
        'Targeted guidance addressing specific life dilemmas regarding job switches, business ventures, marriage timing, or marital compatibility.',
      deliverables: [
        'Dashamsha (D10) evaluation for profession and status',
        'Navamsha (D9) and 7th house analysis for relationship timing',
        'Auspicious Muhurata windows for life milestones',
        'Personalized practical remedies for overcoming delays',
      ],
    },
    {
      id: 'vastu-consultation',
      title: 'Vastu Consultation & Harmonization',
      description:
        'Energetic analysis of your residential or commercial floor plan to balance the five primordial elements (Pancha Tattva).',
      deliverables: [
        'Zonal energy alignment (North, Northeast, South, West)',
        'Remedies without requiring structural demolition',
        'Identification of geopathic stress and entrance flow',
        'Enhancement of prosperity and peaceful family dynamics',
      ],
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
        'Receive actionable Vedic remedies—gemstone guidance, mantra chanting, donations, or lifestyle modifications—tailored specifically to your karma.',
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
