/**
 * Email Notification Service for Admin Alerts
 * Target Admin Email: yanushka655@gmail.com
 */

export interface LeadPurchaseNotification {
  type: 'kundli' | 'ask_question' | 'consultation' | 'course' | 'contact' | 'report'
  name: string
  whatsappNumber: string
  email?: string | null
  amount?: number | null
  reportTitle?: string | null
  questionCount?: number
  questions?: string[] | string | null
  gender?: string | null
  birthDate?: string | null
  birthTime?: string | null
  birthPlace?: string | null
  notes?: string | null
  createdAt?: string
}

const ADMIN_NOTIFICATION_EMAIL = 'yanushka655@gmail.com'

/**
 * Sends an email notification to admin when a purchase or inquiry is made.
 * Uses native fetch with Resend API if RESEND_API_KEY is configured in env,
 * and logs the full structured alert to console.
 */
export async function sendAdminPurchaseNotification(
  data: LeadPurchaseNotification
): Promise<boolean> {
  const timestamp = data.createdAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  
  let itemTitle = 'Consultation Inquiry'
  if (data.type === 'kundli') {
    itemTitle = `Kundli Request (₹${data.amount || 499})`
  } else if (data.type === 'ask_question') {
    const count = data.questionCount || 1
    itemTitle = `Ask Astrologer (${count} Question${count > 1 ? 's' : ''} - ₹${data.amount || (count === 1 ? 699 : count === 2 ? 999 : 1599)})`
  } else if (data.type === 'course') {
    itemTitle = `Course Enrollment (₹${data.amount || 0})`
  } else if (data.type === 'consultation') {
    itemTitle = `1-on-1 Consultation Booking (₹${data.amount || 0})`
  } else if (data.type === 'report') {
    itemTitle = `Personalised Report: ${data.reportTitle || 'Report'} (₹${data.amount || 0})`
  }

  const subject = `[New Purchase Alert] ${data.name} - ${itemTitle}`

  // Format details text
  const textBody = `
========================================
NEW YUGOCCULT PURCHASE / INQUIRY ALERT
========================================

Item / Service: ${itemTitle}
Amount: ₹${data.amount || 'N/A'}
Date & Time: ${timestamp} IST

SEEKER INFORMATION:
------------------
Name: ${data.name}
WhatsApp: ${data.whatsappNumber}
${data.email ? `Email: ${data.email}\n` : ''}

${data.type === 'kundli' || data.birthDate ? `
SACRED BIRTH DETAILS:
--------------------
Gender: ${data.gender || 'Not specified'}
Date of Birth: ${data.birthDate || 'Not specified'}
Time of Birth: ${data.birthTime || 'Not specified'}
Place of Birth: ${data.birthPlace || 'Not specified'}
` : ''}

${data.questions ? `
QUESTIONS SUBMITTED:
-------------------
${Array.isArray(data.questions) ? data.questions.map((q, i) => `Q${i + 1}: ${q}`).join('\n\n') : data.questions}
` : ''}

${data.notes ? `
SPECIAL NOTES / QUESTIONS:
--------------------------
${data.notes}
` : ''}

Direct WhatsApp Reply:
https://wa.me/${data.whatsappNumber.replace(/\D/g, '')}
========================================
`

  // Log to server console
  console.log(`\n================== [ADMIN EMAIL NOTIFICATION] ==================`)
  console.log(`To: ${ADMIN_NOTIFICATION_EMAIL}`)
  console.log(`Subject: ${subject}`)
  console.log(textBody)
  console.log(`================================================================\n`)

  // If RESEND_API_KEY is configured in process.env, dispatch live email via Resend
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'YugSkills Institute <notifications@yugoccult.com>',
          to: [ADMIN_NOTIFICATION_EMAIL],
          subject,
          text: textBody,
        }),
      })

      if (response.ok) {
        console.log(`[EmailService] Live email successfully dispatched to ${ADMIN_NOTIFICATION_EMAIL}`)
        return true
      } else {
        const errText = await response.text()
        console.warn(`[EmailService] Resend API responded with error:`, errText)
      }
    } catch (err) {
      console.error(`[EmailService] Failed to send email via Resend API:`, err)
    }
  }

  return true
}
