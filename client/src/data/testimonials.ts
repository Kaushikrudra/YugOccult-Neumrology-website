export interface Testimonial {
  id: string
  name: string
  role: string
  location: string
  text: string
  consultationType: string
  position: number
  is_visible: boolean
}

export const testimonialsData: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Ananya Deshmukh',
    role: 'Senior Product Manager',
    location: 'Bengaluru',
    text: 'The Kundali reading with Anushka Yadav was eye-opening. There was no fear-mongering or push for expensive rituals—only profound psychological clarity and practical remedies. Within 4 months of following her guidance, my career transition fell into place seamlessly.',
    consultationType: 'Kundli & Career Guidance',
    position: 1,
    is_visible: true,
  },
  {
    id: 'test-2',
    name: 'Vikramaditya Singhania',
    role: 'Founder & Managing Director',
    location: 'Mumbai',
    text: 'We consulted YugOccult Learning Academy for our brand name correction and corporate registration Muhurata. The numerology alignment changed our team momentum completely. His scientific approach to Chaldean vibrations is unmatched.',
    consultationType: 'Business Numerology & Naming',
    position: 2,
    is_visible: true,
  },
  {
    id: 'test-3',
    name: 'Dr. Meenakshi Sundaram',
    role: 'Professor & Vedic Enthusiast',
    location: 'Chennai',
    text: 'I completed the Vedic Astrology Fundamentals course. The curriculum is deeply grounded in Brihat Parashara Hora Shastra yet presented so lucidly that even modern professionals can master divisional charts without getting overwhelmed.',
    consultationType: 'Astrology Foundation Course',
    position: 3,
    is_visible: true,
  },
  {
    id: 'test-4',
    name: 'Rohit Khandelwal',
    role: 'Chartered Accountant',
    location: 'Jaipur',
    text: 'I was skeptical about astrological consultations until my session. The accuracy regarding my past Saturn transit and health milestones was astonishing. The simple lifestyle and mantra remedies gave me immense peace of mind.',
    consultationType: 'Life & Destiny Consultation',
    position: 4,
    is_visible: true,
  },
  {
    id: 'test-5',
    name: 'Priyanka & Saurabh Sen',
    role: 'Architect & Creative Director',
    location: 'Kolkata',
    text: 'Our marriage compatibility and Vastu consultation helped us resolve lingering household tensions. Anushka ji took the time to explain every planetary angle patiently. We now consult YugOccult Learning Academy for all major family milestones.',
    consultationType: 'Kundali Milan & Vastu',
    position: 5,
    is_visible: true,
  },
]
