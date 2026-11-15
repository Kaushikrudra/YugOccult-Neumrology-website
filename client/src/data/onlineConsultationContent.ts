export interface BulletWithLead {
  lead: string
  text: string
}

export interface OnlineConsultationContent {
  section1: {
    heading: string
    paragraphs: string[]
  }
  section2: {
    heading: string
    paragraphs: string[]
    bullets: BulletWithLead[]
  }
  section3: {
    headingTemplate: string
    introTemplate: string
    bullets: BulletWithLead[]
    closingLine: string
  }
  section4: {
    headingTemplate: string
  }
  section5: {
    heading: string
    bullets: string[]
  }
  tarotSection: {
    headingTemplate: string
    paragraphsTemplate: string[]
    bullets: BulletWithLead[]
  }
}

export const onlineConsultationContent: OnlineConsultationContent = {
  section1: {
    heading: 'Why Choose an Online Astrologer?',
    paragraphs: [
      'Not everyone has an experienced astrologer nearby, and not everyone has the time to travel for an appointment. An online consultation removes both problems. You can speak with an astrologer from your home, your workplace or while travelling, at a time that fits your day.',
      'Because the session happens over a call, you can sit somewhere quiet, keep your birth details and notes ready, and speak freely about the questions that matter to you, whether they concern career, relationships, family, finances or an important decision you are facing.',
      'A good online consultation is not a rushed, one-line prediction. It is a conversation. Your birth details are looked at carefully, the main planetary periods and influences are explained in plain language, and you leave with a clearer picture of your situation and the options in front of you.',
    ],
  },
  section2: {
    heading: 'Why Are More People Turning to Online Consultations?',
    paragraphs: [
      'People today book services, learn new skills and seek expert advice online, and astrology is no different. Many people want guidance but feel hesitant about visiting someone in person, especially when the questions are personal or sensitive. An online session offers a private and comfortable alternative.',
      'Online consultations also make it possible to reach an astrologer you trust no matter where either of you lives. Families spread across different cities or countries can book a session without arranging travel, and follow-up questions can be arranged with much less effort.',
    ],
    bullets: [
      {
        lead: 'Flexible timing:',
        text: 'choose a slot that works around your job, family and daily routine.',
      },
      {
        lead: 'No travel:',
        text: 'save the time and cost of visiting in person.',
      },
      {
        lead: 'Comfort and privacy:',
        text: 'speak openly from a place where you feel at ease.',
      },
      {
        lead: 'Clear explanations:',
        text: 'ask questions as they come up and receive answers in simple, everyday language.',
      },
      {
        lead: 'Wider access:',
        text: 'consult an astrologer of your choice, wherever you are.',
      },
    ],
  },
  section3: {
    headingTemplate: 'Benefits of an Online Consultation with {name}',
    introTemplate:
      'A consultation with {name} is meant to bring clarity, not fear. The focus is on understanding your birth details, explaining what they may indicate, and discussing practical ways to approach the questions on your mind.',
    bullets: [
      {
        lead: 'Personal attention:',
        text: 'the session is built around your own birth details and your own questions, not a generic reading.',
      },
      {
        lead: 'Calm, fear-free guidance:',
        text: 'planetary influences are explained honestly and without exaggeration, so you can make decisions with a steady mind.',
      },
      {
        lead: 'Simple language:',
        text: 'technical terms are explained, so you understand the reasoning behind what you hear.',
      },
      {
        lead: 'Practical direction:',
        text: 'where relevant, simple remedies and suggestions are discussed, and you are free to ask what they involve.',
      },
      {
        lead: 'Respect for your privacy:',
        text: 'your personal details and questions are handled with care.',
      },
      {
        lead: 'Room for questions:',
        text: 'you are encouraged to bring a list of questions and take the time you need.',
      },
    ],
    closingLine:
      'Astrology offers perspective and guidance. The decisions in your life always remain yours.',
  },
  section4: {
    headingTemplate: 'Why Choose {name}?',
  },
  section5: {
    heading: 'How to Prepare for Your Consultation',
    bullets: [
      'Keep your date, time and place of birth ready.',
      'If you are not sure of your birth time, mention it. The session can still go ahead.',
      'Write down the three to five questions that matter most to you.',
      'Choose a quiet place with a stable phone or internet connection.',
    ],
  },
  tarotSection: {
    headingTemplate: 'Intuitive Tarot Card Guidance with {name}',
    paragraphsTemplate: [
      'Tarot serves as a reflective mirror that reveals the underlying energetic currents influencing your current life circumstances. While Vedic astrology maps your life blueprint and long-term planetary timelines, Tarot readings with {name} focus on the present moment—providing intuitive clarity, immediate guidance, and perspective on the choices unfolding before you.',
      'Whether you are navigating relationship crossroads, career choices, emotional dilemmas, or personal transitions, {name} combines classical Tarot symbolism with deep intuitive wisdom to interpret card spreads with honesty and compassion. The reading helps you uncover hidden dynamics, understand personal blind spots, and move forward with clarity and confidence.',
    ],
    bullets: [
      {
        lead: 'Present-Moment Clarity:',
        text: 'gain direct insight into urgent questions and current life dynamics.',
      },
      {
        lead: 'Intuitive Symbolism:',
        text: 'traditional Tarot archetypes interpreted with depth and grounded wisdom.',
      },
      {
        lead: 'Relationship & Career Focus:',
        text: 'understand interpersonal connections, career crossroads, and hidden possibilities.',
      },
      {
        lead: 'Constructive Perspective:',
        text: 'empowering insights that help you make conscious, informed life decisions.',
      },
    ],
  },
}
