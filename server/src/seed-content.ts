import dotenv from 'dotenv'
import { pool } from './db'

dotenv.config()

interface CourseSeedItem {
  slug: string
  title: string
  category: string
  price: number
  original_price: number | null
  level: 'Basic' | 'Advanced' | 'Basic to Advanced' | null
  is_package: boolean
  is_featured: boolean
  description: string
  position: number
  bundle_item_slugs?: string[]
}

const COURSES_CATALOG: CourseSeedItem[] = [
  // ==========================================
  // PACKAGES (category "Packages", is_package = true, Positions 1-4)
  // ==========================================
  {
    slug: 'diwali-special-bundle-course',
    title: 'Diwali Special Bundle Course',
    category: 'Packages',
    price: 999,
    original_price: 5000,
    level: null,
    is_package: true,
    is_featured: false,
    description: 'Diwali Special Bundle Course includes 2 courses: Dhanvarsha Laxmi Potli and Diwali Special Remedies Advanced Level.',
    position: 1,
    bundle_item_slugs: ['dhanvarsha-laxmi-potli', 'diwali-special-remedies-advanced-level'],
  },
  {
    slug: 'occult-master-package-bundle-courses-3-month-program',
    title: 'Occult Master Package Bundle Courses: 3 Month Program',
    category: 'Packages',
    price: 9999,
    original_price: 49999,
    level: null,
    is_package: true,
    is_featured: true, // Featured #27
    description: 'Occult Master Package Bundle Courses: 3 Month Program includes 4 courses.',
    position: 2,
    bundle_item_slugs: [],
  },
  {
    slug: 'occult-master-package-bundle-courses',
    title: 'Occult Master Package Bundle Courses',
    category: 'Packages',
    price: 39999,
    original_price: 250000,
    level: null,
    is_package: true,
    is_featured: false,
    description: 'Occult Master Package Bundle Courses includes 4 courses.',
    position: 3,
    bundle_item_slugs: [],
  },
  {
    slug: 'tarot-course-package',
    title: 'Tarot Course Package',
    category: 'Packages',
    price: 14499,
    original_price: 60000,
    level: null,
    is_package: true,
    is_featured: false,
    description: 'Tarot Course Package includes 3 courses: Tarot Card Reading Certification Course, Osho Zen Tarot Reading Course, and Angel Oracle Card Reading Certification Course.',
    position: 4,
    bundle_item_slugs: [
      'tarot-card-reading-certification-course',
      'osho-zen-tarot-reading-course',
      'angel-oracle-card-reading-certification-course',
    ],
  },

  // ==========================================
  // TAROT (Positions 5-7)
  // ==========================================
  {
    slug: 'osho-zen-tarot-reading-course',
    title: 'Osho Zen Tarot Reading Course',
    category: 'Tarot',
    price: 2500,
    original_price: 19999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: false,
    description: 'Osho Zen Tarot Reading Course covering Zen tarot philosophy and card interpretation, from basic to advanced.',
    position: 5,
  },
  {
    slug: 'angel-oracle-card-reading-certification-course',
    title: 'Angel Oracle Card Reading Certification Course',
    category: 'Tarot',
    price: 799,
    original_price: 3999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Angel Oracle Card Reading Certification Course for learning divine angelic guidance and card layouts.',
    position: 6,
  },
  {
    slug: 'tarot-card-reading-certification-course',
    title: 'Tarot Card Reading Certification Course',
    category: 'Tarot',
    price: 7500,
    original_price: 34999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: true,
    description: 'Tarot Card Reading Certification Course covering comprehensive Rider-Waite symbolism and spreads, from basic to advanced.',
    position: 7,
  },

  // ==========================================
  // ASTROLOGY (Positions 8-10)
  // ==========================================
  {
    slug: 'balance-the-9-planets-with-food-course',
    title: 'Balance the 9 Planets with Food Course',
    category: 'Astrology',
    price: 499,
    original_price: 2999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Balance the 9 Planets with Food Course exploring astrological dietary harmony and planetary balancing through food.',
    position: 8,
  },
  {
    slug: 'lal-kitab-course',
    title: 'Lal Kitab Course',
    category: 'Astrology',
    price: 14999,
    original_price: 49999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: true,
    description: 'Lal Kitab Course covering authentic grammar, planetary aspects, and classical remedies, from basic to advanced.',
    position: 9,
  },
  {
    slug: 'mohini-vidhya-special-course',
    title: 'Mohini Vidhya Special Course',
    category: 'Astrology',
    price: 999,
    original_price: 4999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: false,
    description: 'Mohini Vidhya Special Course focusing on traditional astrological magnetism and attraction sciences, from basic to advanced.',
    position: 10,
  },
  {
    slug: 'vedic-astrology-course-basic-to-advanced',
    title: 'Vedic Astrology Course Basic to Advanced',
    category: 'Astrology',
    price: 20000,
    original_price: 39999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: true,
    description: 'Master classical Vedic Astrology from foundational planetary grammar to advanced Kundali chart reading, bhavas, yogas, dasha periods, and traditional remedies.',
    position: 30,
  },

  // ==========================================
  // NUMEROLOGY (Positions 11-15)
  // ==========================================
  {
    slug: 'numerology-foundation-course-live',
    title: 'Numerology Foundation Course Live',
    category: 'Numerology',
    price: 599,
    original_price: 4999,
    level: null,
    is_package: false,
    is_featured: true, // Featured #7
    description: 'Numerology Foundation Course Live offering foundational numerological calculations and core number vibrations.',
    position: 11,
  },
  {
    slug: 'name-and-mobile-numerology-program',
    title: 'Name and Mobile Numerology Program',
    category: 'Numerology',
    price: 2799,
    original_price: 14999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: true,
    description: 'Name and Mobile Numerology Program covering name vibration tuning and auspicious mobile number analysis, from basic to advanced.',
    position: 12,
  },
  {
    slug: 'prediction-through-time-numerology',
    title: 'Prediction through Time Numerology',
    category: 'Numerology',
    price: 499,
    original_price: 2999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Prediction through Time Numerology teaching intuitive event timing and clock number interpretations.',
    position: 13,
  },
  {
    slug: 'vedic-numerology-best-course',
    title: 'Vedic Numerology Best Course',
    category: 'Numerology',
    price: 7500,
    original_price: 29999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: true,
    description: 'Vedic Numerology Best Course integrating ancient Indian numerical grids and planetary combinations, from basic to advanced.',
    position: 14,
  },
  {
    slug: 'company-name-correction-report',
    title: 'Company Name Correction Report',
    category: 'Numerology',
    price: 2300,
    original_price: 9999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Company Name Correction Report providing numerological commercial brand alignment and business name optimization.',
    position: 15,
  },
  {
    slug: 'loshu-grid-numerology-basic-to-advanced',
    title: 'Loshu Grid Numerology Basic to Advanced',
    category: 'Numerology',
    price: 15000,
    original_price: 29999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: true,
    description: 'Comprehensive Loshu Grid Numerology program covering the sacred 3x3 grid, plane analysis, missing and repetitive numbers, arrow combinations, and practical remedies.',
    position: 31,
  },

  // ==========================================
  // VASTU (Positions 16-17)
  // ==========================================
  {
    slug: 'vastu-shastra-course-with-practical-remedies',
    title: 'Vastu Shastra Course with Practical Remedies',
    category: 'Vastu',
    price: 2799,
    original_price: 15000,
    level: null,
    is_package: false,
    is_featured: true, // Featured #12
    description: 'Vastu Shastra Course with Practical Remedies offering non-demolition space alignment and environmental harmonization.',
    position: 16,
  },
  {
    slug: 'vastu-course',
    title: 'Vastu Course',
    category: 'Vastu',
    price: 7500,
    original_price: 39999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: false,
    description: 'Vastu Course covering comprehensive residential and commercial directional principles, from basic to advanced.',
    position: 17,
  },

  // ==========================================
  // MANIFESTATION (Positions 18-19)
  // ==========================================
  {
    slug: 'law-of-attraction-with-occult-remedies',
    title: 'Law of Attraction with Occult Remedies for Different Purpose',
    category: 'Manifestation',
    price: 2500,
    original_price: 15000,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Law of Attraction with Occult Remedies for Different Purpose combining focused intention with authentic occult rituals.',
    position: 18,
  },
  {
    slug: '30-days-gratitude-practical-course',
    title: '30 Days Gratitude Practical Course',
    category: 'Manifestation',
    price: 0,
    original_price: null,
    level: null,
    is_package: false,
    is_featured: false,
    description: '30 Days Gratitude Practical Course guiding daily gratitude practices for conscious life transformation.',
    position: 19,
  },

  // ==========================================
  // HEALING (Positions 20-22)
  // ==========================================
  {
    slug: 'reiki-healing-program-level-1-and-2',
    title: 'Reiki Healing Program Level 1 and 2',
    category: 'Healing',
    price: 1999,
    original_price: 14999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Reiki Healing Program Level 1 and 2 covering universal life force channelization and self/distant healing attunements.',
    position: 20,
  },
  {
    slug: 'colour-therapy-expert-course',
    title: 'Colour Therapy Expert Course',
    category: 'Healing',
    price: 2999,
    original_price: 9999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: false,
    description: 'Colour Therapy Expert Course teaching vibrational chromotherapy and energy balance through colors, from basic to advanced.',
    position: 21,
  },
  {
    slug: 'cord-cutting-special-session',
    title: 'Cord Cutting Special Session',
    category: 'Healing',
    price: 1999,
    original_price: 4999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: false,
    description: 'Cord Cutting Special Session demonstrating energetic detachment and emotional aura purification, from basic to advanced.',
    position: 22,
  },

  // ==========================================
  // REMEDIES (Positions 23-26)
  // ==========================================
  {
    slug: 'dhanvarsha-laxmi-potli',
    title: 'Dhanvarsha Laxmi Potli',
    category: 'Remedies',
    price: 499,
    original_price: 2999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Dhanvarsha Laxmi Potli sharing traditional prosperity potli preparation and energization rituals.',
    position: 23,
  },
  {
    slug: 'diwali-special-remedies-advanced-level',
    title: 'Diwali Special Remedies Advanced Level',
    category: 'Remedies',
    price: 599,
    original_price: 2999,
    level: 'Advanced',
    is_package: false,
    is_featured: false,
    description: 'Diwali Special Remedies Advanced Level covering auspicious festive Muhurata rituals and wealth attraction remedies.',
    position: 24,
  },
  {
    slug: 'durga-prashnawali-course',
    title: 'Durga Prashnawali Course',
    category: 'Remedies',
    price: 399,
    original_price: 999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Durga Prashnawali Course teaching divine oracle chakra guidance through sacred Durga Prashnawali charts.',
    position: 25,
  },
  {
    slug: 'gayatri-mantra-sadhana',
    title: 'Gayatri Mantra Sadhana',
    category: 'Remedies',
    price: 0,
    original_price: null,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Gayatri Mantra Sadhana introducing authentic Vedic Gayatri recitation, pronunciation, and spiritual alignment.',
    position: 26,
  },

  // ==========================================
  // SWITCHWORDS (Positions 27-28)
  // ==========================================
  {
    slug: 'italian-switchwords-mastery-course',
    title: 'Italian Switchwords Mastery Course',
    category: 'Switchwords',
    price: 599,
    original_price: 2999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Italian Switchwords Mastery Course exploring modern European vocal frequency words and practical switchword formulas.',
    position: 27,
  },
  {
    slug: 'vedic-switchwords-mastery-course',
    title: 'Vedic Switchwords Mastery Course',
    category: 'Switchwords',
    price: 999,
    original_price: 4999,
    level: 'Basic to Advanced',
    is_package: false,
    is_featured: false,
    description: 'Vedic Switchwords Mastery Course covering 135+ special shastric switchwords and energy circles, from basic to advanced.',
    position: 28,
  },

  // ==========================================
  // OTHER (Position 29)
  // ==========================================
  {
    slug: 'online-coaching-business-program',
    title: 'Online Coaching Business Program',
    category: 'Other',
    price: 14999,
    original_price: 49999,
    level: null,
    is_package: false,
    is_featured: false,
    description: 'Online Coaching Business Program providing actionable blueprints to establish and scale an occult consultation academy.',
    position: 29,
  },
]

async function seedContent() {
  console.log('[Seed:Content] Starting course catalog seeding (safe mode)...')
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Fetch all existing courses from DB to populate slugToIdMap and detect existing courses
    const { rows: existingDbCourses } = await client.query<{ id: string; slug: string }>(
      'SELECT id, slug FROM courses WHERE slug IS NOT NULL;'
    )

    const slugToIdMap = new Map<string, string>()
    for (const row of existingDbCourses) {
      slugToIdMap.set(row.slug, row.id)
    }

    let insertedCoursesCount = 0
    let skippedCoursesCount = 0

    // 2. Insert new catalog courses only if slug does not already exist
    for (const course of COURSES_CATALOG) {
      if (slugToIdMap.has(course.slug)) {
        skippedCoursesCount++
        continue
      }

      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO courses (
          slug, title, category, price, original_price, level, duration,
          instructor, is_package, is_featured, position, is_visible, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, null,
          'Anushka Yadav', $7, $8, $9, true, $10
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id;`,
        [
          course.slug,
          course.title,
          course.category,
          course.price,
          course.original_price,
          course.level,
          course.is_package,
          course.is_featured,
          course.position,
          course.description,
        ]
      )

      if (rows[0]?.id) {
        slugToIdMap.set(course.slug, rows[0].id)
        insertedCoursesCount++
      } else {
        // In case of conflict (e.g. concurrent insert)
        skippedCoursesCount++
      }
    }

    // 3. Link Bundle Items for packages (only if no items already exist for that bundle)
    let bundlesConfiguredCount = 0
    let bundlesSkippedCount = 0

    for (const course of COURSES_CATALOG) {
      if (course.is_package && course.bundle_item_slugs && course.bundle_item_slugs.length > 0) {
        const bundleId = slugToIdMap.get(course.slug)
        if (!bundleId) {
          console.warn(`[Seed:Content] Package course ID not found for slug: ${course.slug}`)
          continue
        }

        // Check if bundle items already exist for this bundle
        const { rows: existingItems } = await client.query(
          'SELECT 1 FROM course_bundle_items WHERE bundle_id = $1 LIMIT 1;',
          [bundleId]
        )

        if (existingItems.length > 0) {
          bundlesSkippedCount++
          continue
        }

        // Insert bundle items only if none exist
        for (let i = 0; i < course.bundle_item_slugs.length; i++) {
          const itemSlug = course.bundle_item_slugs[i]
          const itemId = slugToIdMap.get(itemSlug)
          if (itemId) {
            await client.query(
              `INSERT INTO course_bundle_items (bundle_id, course_id, position)
               VALUES ($1, $2, $3)
               ON CONFLICT (bundle_id, course_id) DO NOTHING;`,
              [bundleId, itemId, i + 1]
            )
          } else {
            console.warn(`[Seed:Content] Bundle item slug not found: ${itemSlug}`)
          }
        }
        bundlesConfiguredCount++
        console.log(
          `[Seed:Content] Linked ${course.bundle_item_slugs.length} bundle items for package: ${course.title}`
        )
      }
    }

    if (bundlesSkippedCount > 0) {
      console.log(
        `[Seed:Content] ${bundlesSkippedCount} package bundle(s) already had items configured (preserved, skipped).`
      )
    }

    // 4. Ensure master consultation setting exists (do not overwrite admin edits if row exists)
    const { rows: existingSettings } = await client.query(
      'SELECT 1 FROM consultation_settings LIMIT 1;'
    )
    if (existingSettings.length === 0) {
      const initialConsultationServices = [
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
      ]

      const initialProcessSteps = [
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
      ]

      const initialFaqs = [
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
      ]

      await client.query(
        `INSERT INTO consultation_settings (fee, duration_minutes, services, process_steps, faqs, is_singleton)
         VALUES ($1, $2, $3, $4, $5, true);`,
        [
          3000,
          45,
          JSON.stringify(initialConsultationServices),
          JSON.stringify(initialProcessSteps),
          JSON.stringify(initialFaqs),
        ]
      )
      console.log('[Seed:Content] Initialized master consultation settings from consultation catalog.')
    } else {
      console.log('[Seed:Content] Consultation settings already exist (preserved, skipped).')
    }

    // -------------------------------------------------------------------------
    // 3. SEED SITE SETTINGS (Safe Insert-Only: ONLY IF EMPTY)
    // -------------------------------------------------------------------------
    const siteSettingsCheck = await client.query('SELECT 1 FROM site_settings LIMIT 1;')
    if (siteSettingsCheck.rowCount === 0) {
      await client.query(
        `INSERT INTO site_settings (
           phone, whatsapp_number, email, address, timings, social_links,
           show_stats, stats, about_name, about_title, about_bio,
           about_expertise, about_credentials, about_photo_url,
           hero_badge, hero_headline, hero_subtitle, meta_title, meta_description,
           is_singleton
         ) VALUES (
           $1, $2, $3, $4, $5, $6::jsonb,
           true, $7::jsonb, $8, $9, $10,
           $11::jsonb, $12::jsonb, NULL,
           $13, $14, $15, $16, $17,
           true
         );`,
        [
          '+91 89229 46307',
          '918922946307',
          'anushkayadava37@gmail.com',
          'Indira Nagar, Lucknow',
          'Monday – Saturday: 10:00 AM – 7:00 PM IST',
          JSON.stringify({
            instagram: 'https://instagram.com/yugoccult',
            youtube: 'https://youtube.com/@yugoccult',
            facebook: 'https://facebook.com/yugoccult',
          }),
          JSON.stringify([
            { label: 'Years of Experience', value: '6+' },
            { label: 'Seekers Guided', value: '10,000+' },
            { label: 'Courses Offered', value: '29+' },
            { label: 'Authentic Shastra', value: '100%' },
          ]),
          'Anushka Yadav',
          'Master Astrologer, Numerologist & Tarot Guide',
          "Welcome to YugSkills Learning Institute. My mission is to demystify Indian astrology and numerological science from superstitious exploitation. Astrology is an illuminating lantern—a divine science ('Jyotir-Isha') designed to illuminate the path ahead, identify planetary timings, and empower conscious free will.\n\nHaving studied under traditional Gurukul lineages and verified thousands of real-life horoscopes, every reading combines rigorous mathematical accuracy (Parashari, Jaimini, and Chaldean grids) with compassionate, ethical life advice.",
          JSON.stringify([
            'Vedic Astrology',
            'Chaldean Numerology',
            'Tarot Guidance',
            'Vastu Shastra',
            'Prashna Kundali',
          ]),
          JSON.stringify([
            'Certified Jyotish Acharya & Vastu Shastra Consultant',
            'Member of Recognized Indian Vedic Astrology Councils',
            'Zero Fear-Mongering, Guilt, or Costly Superstitions',
            'Strict Client Privacy & Lifelong Confidentiality',
          ]),
          'ASTROLOGY • NUMEROLOGY • TAROT',
          "Illuminate Your Soul's Path with Sacred Vedic Guidance",
          'Experience non-fear-based authentic horoscope readings and clinical numerological alignment. Discover clarity for your career, relationships, and spiritual dharma.',
          'YugSkills Learning Institute | Astrology, Numerology & Tarot',
          'Empowering your journey with authentic Vedic astrology readings, numerology blueprints, and certified spiritual courses in Astrology, Numerology & Tarot.',
        ]
      )
      console.log('[Seed:Content] Initialized site_settings with initial institute profile.')
    } else {
      console.log('[Seed:Content] site_settings already exists (preserved, skipped).')
    }

    await client.query('COMMIT')
    console.log(
      `[Seed:Content] Seeding complete: ${insertedCoursesCount} courses inserted, ${skippedCoursesCount} courses already existed (skipped).`
    )
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Seed:Content] Fatal error during seeding:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seedContent().catch(console.error)
