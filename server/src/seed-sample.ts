import dotenv from 'dotenv'
import { pool } from './db'

dotenv.config()

async function seedSampleData() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Seed:Sample] Aborted: Refusing to seed sample data in production environment.')
    process.exit(0)
  }

  console.log('[Seed:Sample] Seeding sample enquiries and orders for development...')

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Sample Enquiries (6 enquiries with varied read status)
    const sampleEnquiries = [
      {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phone: '+91 98765 43210',
        subject: 'Kundali Matching & Compatibility for Marriage',
        message: 'Namaste Guruji, I would like to book a complete chart match for my upcoming marriage proposal with detailed gun milan and dosha analysis.',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
      },
      {
        name: 'Priyanka Patel',
        email: 'priyanka.p@example.com',
        phone: '+91 98220 11223',
        subject: 'Career & Business Transit Consultation',
        message: 'Currently facing delays in my software startup funding. Want guidance on Sade Sati phase and Jupiter transit remedies.',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hrs ago
      },
      {
        name: 'Vikram Sengupta',
        email: 'vikram.sen@example.com',
        phone: '+91 97110 55443',
        subject: 'Numerology Name Spelling Correction',
        message: 'Looking for newborn baby name analysis and compound number vibration alignment with Chaldean chart.',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hrs ago
      },
      {
        name: 'Meera Deshmukh',
        email: 'meera.desh@example.com',
        phone: '+91 94230 77889',
        subject: 'Gemstone Recommendation for Health & Focus',
        message: 'Seeking guidance on wearing Yellow Sapphire or Emerald. Have submitted birth details in previous message.',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(), // 1.7 days ago
      },
      {
        name: 'Rajesh Kulkarni',
        email: 'rajesh.k@example.com',
        phone: '+91 98901 23456',
        subject: 'Vedic Astrology Foundation Course Syllabus Query',
        message: 'Wanted to inquire if live weekend doubts sessions are included in the 8-week foundation course batches.',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      },
      {
        name: 'Sunita Raman',
        email: 'sunita.raman@example.com',
        phone: '+91 99400 88990',
        subject: 'Appointment Reschedule Request',
        message: 'Need to postpone my Saturday 4 PM consultation slot to Sunday morning due to urgent travel.',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString(), // 4.5 days ago
      },
    ]

    for (const enq of sampleEnquiries) {
      await client.query(
        `INSERT INTO enquiries (name, email, phone, subject, message, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [enq.name, enq.email, enq.phone, enq.subject, enq.message, enq.is_read, enq.created_at]
      )
    }

    // 2. Sample Orders (6 orders with varied statuses)
    const sampleOrders = [
      {
        type: 'consultation',
        reference_id: 'CONSULT-3000-01',
        amount: 3000.00,
        status: 'PAID',
        cashfree_order_id: 'cf_ord_892301982',
        customer_name: 'Ananya Verma',
        customer_email: 'ananya.v@example.com',
        customer_phone: '+91 98111 22334',
        created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      },
      {
        type: 'course',
        reference_id: 'Vedic Astrology Foundation',
        amount: 4999.00,
        status: 'PAID',
        cashfree_order_id: 'cf_ord_771829031',
        customer_name: 'Karan Mehra',
        customer_email: 'karan.m@example.com',
        customer_phone: '+91 98234 56789',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      },
      {
        type: 'course',
        reference_id: 'Professional Numerology & Name Correction',
        amount: 5999.00,
        status: 'PAID',
        cashfree_order_id: 'cf_ord_662910482',
        customer_name: 'Deepak Saxena',
        customer_email: 'deepak.s@example.com',
        customer_phone: '+91 97123 45678',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        type: 'consultation',
        reference_id: 'CONSULT-3000-02',
        amount: 3000.00,
        status: 'PENDING',
        cashfree_order_id: 'cf_ord_554829102',
        customer_name: 'Nisha Gupta',
        customer_email: 'nisha.g@example.com',
        customer_phone: '+91 99345 67890',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      },
      {
        type: 'course',
        reference_id: 'Advanced Kundali & Prashna Jyotish',
        amount: 9999.00,
        status: 'PENDING',
        cashfree_order_id: 'cf_ord_441920381',
        customer_name: 'Rohit Joshi',
        customer_email: 'rohit.j@example.com',
        customer_phone: '+91 98456 78901',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
      {
        type: 'consultation',
        reference_id: 'CONSULT-3000-03',
        amount: 3000.00,
        status: 'FAILED',
        cashfree_order_id: 'cf_ord_332819047',
        customer_name: 'Siddharth Roy',
        customer_email: 'siddharth.r@example.com',
        customer_phone: '+91 98765 01234',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
      },
    ]

    for (const ord of sampleOrders) {
      await client.query(
        `INSERT INTO orders (type, reference_id, amount, status, cashfree_order_id, customer_name, customer_email, customer_phone, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [
          ord.type,
          ord.reference_id,
          ord.amount,
          ord.status,
          ord.cashfree_order_id,
          ord.customer_name,
          ord.customer_email,
          ord.customer_phone,
          ord.created_at,
        ]
      )
    }

    await client.query('COMMIT')
    console.log('[Seed:Sample] Successfully inserted 6 sample enquiries and 6 sample orders.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[Seed:Sample] Failed to seed sample data:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seedSampleData()
