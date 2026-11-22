/**
 * Branded Mail Templates
 * Palette: Deep Indigo (#2E2A5C), Ivory (#FBF7EE), Soft Gold (#C9A227),
 * Saffron Amber (#F08A24), Neutral Text (#2B2A3D).
 * Strictly NO red, dark green, green, or pure black (#000).
 */

export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface BaseLayoutOptions {
  title: string
  contentHtml: string
  brandName?: string
  supportEmail?: string
  supportPhone?: string
}

function renderEmailLayout({
  title,
  contentHtml,
  brandName = 'YugOccult Learning Academy',
  supportEmail,
  supportPhone,
}: BaseLayoutOptions): string {
  const brand = escapeHtml(brandName)
  const contactLines: string[] = []
  if (supportEmail) {
    contactLines.push(`Email: <a href="mailto:${escapeHtml(supportEmail)}" style="color: #5B3E96; text-decoration: none;">${escapeHtml(supportEmail)}</a>`)
  }
  if (supportPhone) {
    contactLines.push(`Phone: ${escapeHtml(supportPhone)}`)
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF7EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B2A3D; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FBF7EE; width: 100%; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid rgba(91, 62, 150, 0.15); box-shadow: 0 4px 16px rgba(46, 42, 92, 0.05);">
          <!-- Header Band -->
          <tr>
            <td style="background-color: #2E2A5C; padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FBF7EE; letter-spacing: 0.5px;">
                ${brand}
              </h1>
              <div style="height: 2px; width: 48px; background-color: #C9A227; margin: 12px auto 0 auto; border-radius: 2px;"></div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px; line-height: 1.6; font-size: 14px; color: #2B2A3D;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Band -->
          <tr>
            <td style="background-color: #F8F5EE; padding: 20px 28px; border-top: 1px solid rgba(91, 62, 150, 0.1); font-size: 12px; color: #5B586E; line-height: 1.5; text-align: center;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #2E2A5C;">${brand}</p>
              ${contactLines.length > 0 ? `<p style="margin: 0 0 8px 0;">${contactLines.join(' &bull; ')}</p>` : ''}
              <p style="margin: 8px 0 0 0; color: #8F8B9C; font-size: 11px;">This is an automated message.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// -----------------------------------------------------------------------------
// 1. Contact Form Notification (To Admin)
// -----------------------------------------------------------------------------
export interface ContactNotificationData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  brandName?: string
}

export function buildContactNotificationEmail(data: ContactNotificationData) {
  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 17px; color: #2E2A5C; font-weight: 700;">
      New Contact Form Message
    </h2>
    <p style="margin: 0 0 16px 0; font-size: 13px; color: #5B586E;">
      A visitor submitted a message on the contact page:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="background-color: #F8F5EE; border-radius: 8px; font-size: 13px; margin-bottom: 20px;">
      <tr>
        <td style="width: 100px; color: #5B586E; font-weight: 600;">Name:</td>
        <td style="color: #2E2A5C; font-weight: 600;">${escapeHtml(data.name)}</td>
      </tr>
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Email:</td>
        <td><a href="mailto:${escapeHtml(data.email)}" style="color: #5B3E96; text-decoration: none;">${escapeHtml(data.email)}</a></td>
      </tr>
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Phone:</td>
        <td style="color: #2B2A3D;">${escapeHtml(data.phone)}</td>
      </tr>
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Subject:</td>
        <td style="color: #2E2A5C;">${escapeHtml(data.subject)}</td>
      </tr>
    </table>
    <div style="background-color: #FFFFFF; border-left: 3px solid #C9A227; padding: 12px 16px; margin: 16px 0; border-radius: 4px; border: 1px solid rgba(91, 62, 150, 0.1); border-left-width: 3px;">
      <p style="margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: #2B2A3D;">${escapeHtml(data.message)}</p>
    </div>
  `

  const text = `New Contact Form Message

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Subject: ${data.subject}

Message:
${data.message}

--
This is an automated message from ${data.brandName || 'YugOccult Learning Academy'}.`

  return {
    subject: `[Contact Form] ${data.subject} - ${data.name}`,
    html: renderEmailLayout({
      title: `Contact Message: ${data.subject}`,
      contentHtml,
      brandName: data.brandName,
    }),
    text,
  }
}

// -----------------------------------------------------------------------------
// 2. Lead Notification (To Admin)
// -----------------------------------------------------------------------------
export interface LeadNotificationData {
  name: string
  whatsappNumber: string
  type: string
  birthDate?: string | null
  birthTime?: string | null
  birthPlace?: string | null
  question?: string | null
  questionCount?: number
  amount?: number
  brandName?: string
}

export function buildLeadNotificationEmail(data: LeadNotificationData) {
  const isKundli = data.type === 'kundli' || data.type === 'free_kundli'
  const title = isKundli ? 'Kundli Request' : 'Astrology Question'

  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 17px; color: #2E2A5C; font-weight: 700;">
      New ${title} Received
    </h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="background-color: #F8F5EE; border-radius: 8px; font-size: 13px; margin-bottom: 20px;">
      <tr>
        <td style="width: 120px; color: #5B586E; font-weight: 600;">Seeker:</td>
        <td style="color: #2E2A5C; font-weight: 600;">${escapeHtml(data.name)}</td>
      </tr>
      <tr>
        <td style="color: #5B586E; font-weight: 600;">WhatsApp:</td>
        <td style="color: #2B2A3D;">${escapeHtml(data.whatsappNumber)}</td>
      </tr>
      ${data.amount ? `<tr><td style="color: #5B586E; font-weight: 600;">Amount:</td><td style="color: #2E2A5C; font-weight: 600;">&#8377;${data.amount}</td></tr>` : ''}
      ${data.birthDate ? `<tr><td style="color: #5B586E; font-weight: 600;">Birth Date:</td><td>${escapeHtml(data.birthDate)}</td></tr>` : ''}
      ${data.birthTime ? `<tr><td style="color: #5B586E; font-weight: 600;">Birth Time:</td><td>${escapeHtml(data.birthTime)}</td></tr>` : ''}
      ${data.birthPlace ? `<tr><td style="color: #5B586E; font-weight: 600;">Birth Place:</td><td>${escapeHtml(data.birthPlace)}</td></tr>` : ''}
    </table>
    ${data.question ? `
    <div style="background-color: #FFFFFF; border-left: 3px solid #C9A227; padding: 12px 16px; margin: 16px 0; border-radius: 4px; border: 1px solid rgba(91, 62, 150, 0.1); border-left-width: 3px;">
      <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #5B3E96; text-transform: uppercase;">Submitted Query:</p>
      <p style="margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: #2B2A3D;">${escapeHtml(data.question)}</p>
    </div>` : ''}
  `

  const text = `New ${title} Received

Seeker: ${data.name}
WhatsApp: ${data.whatsappNumber}
${data.amount ? `Amount: ₹${data.amount}\n` : ''}${data.birthDate ? `Birth Date: ${data.birthDate}\n` : ''}${data.birthTime ? `Birth Time: ${data.birthTime}\n` : ''}${data.birthPlace ? `Birth Place: ${data.birthPlace}\n` : ''}${data.question ? `\nQuery:\n${data.question}\n` : ''}
--
This is an automated message from ${data.brandName || 'YugOccult Learning Academy'}.`

  return {
    subject: `[${title}] ${data.name} (${data.whatsappNumber})`,
    html: renderEmailLayout({
      title: `New ${title}: ${data.name}`,
      contentHtml,
      brandName: data.brandName,
    }),
    text,
  }
}

// -----------------------------------------------------------------------------
// 3. Password Reset (To User)
// -----------------------------------------------------------------------------
export interface PasswordResetData {
  name?: string
  resetUrl: string
  brandName?: string
  supportEmail?: string
}

export function buildPasswordResetEmail(data: PasswordResetData) {
  const greeting = data.name ? `Namaste ${escapeHtml(data.name)},` : 'Hello,'
  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #2E2A5C; font-weight: 700;">
      Reset Your Password
    </h2>
    <p style="margin: 0 0 12px 0;">${greeting}</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">
      We received a request to reset the password for your account. You can set a new password by clicking the button below:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(data.resetUrl)}" style="background-color: #F08A24; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="margin: 0 0 12px 0; font-size: 12px; color: #5B586E; line-height: 1.5;">
      This link will expire in 1 hour.
    </p>
    <p style="margin: 0 0 16px 0; font-size: 12px; color: #5B586E; line-height: 1.5;">
      If you did not request this, you can ignore this email.
    </p>
    <div style="padding-top: 12px; border-top: 1px solid rgba(91, 62, 150, 0.1); font-size: 11px; color: #8F8B9C; word-break: break-all;">
      Or copy and paste this link into your browser:<br>
      <a href="${escapeHtml(data.resetUrl)}" style="color: #5B3E96;">${escapeHtml(data.resetUrl)}</a>
    </div>
  `

  const text = `${data.name ? `Namaste ${data.name},\n\n` : ''}We received a request to reset your password. Use the link below to set a new password (valid for 1 hour):

${data.resetUrl}

If you did not request this, you can ignore this email.

--
${data.brandName || 'YugOccult Learning Academy'}`

  return {
    subject: `Reset your password - ${data.brandName || 'YugOccult Learning Academy'}`,
    html: renderEmailLayout({
      title: 'Reset Your Password',
      contentHtml,
      brandName: data.brandName,
      supportEmail: data.supportEmail,
    }),
    text,
  }
}

// -----------------------------------------------------------------------------
// 4. Password Changed Notification (To User)
// -----------------------------------------------------------------------------
export interface PasswordChangedData {
  name?: string
  supportEmail?: string
  brandName?: string
}

export function buildPasswordChangedEmail(data: PasswordChangedData) {
  const emailContact = data.supportEmail || 'support@yourdomain.com'
  const greeting = data.name ? `Namaste ${escapeHtml(data.name)},` : 'Hello,'
  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #2E2A5C; font-weight: 700;">
      Password Changed Successfully
    </h2>
    <p style="margin: 0 0 12px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0; line-height: 1.6;">
      Your password was changed. If this was not you, contact us at <a href="mailto:${escapeHtml(emailContact)}" style="color: #5B3E96; text-decoration: none; font-weight: 600;">${escapeHtml(emailContact)}</a>.
    </p>
    <p style="margin: 0; font-size: 13px; color: #5B586E;">
      For your security, keep your login credentials private.
    </p>
  `

  const text = `${data.name ? `Namaste ${data.name},\n\n` : ''}Your password was changed. If this was not you, contact us at ${emailContact}.

--
${data.brandName || 'YugOccult Learning Academy'}`

  return {
    subject: `Your password was changed - ${data.brandName || 'YugOccult Learning Academy'}`,
    html: renderEmailLayout({
      title: 'Password Changed',
      contentHtml,
      brandName: data.brandName,
      supportEmail: data.supportEmail,
    }),
    text,
  }
}

// -----------------------------------------------------------------------------
// 5. Course Access Granted (To User)
// -----------------------------------------------------------------------------
export interface AccessGrantedData {
  name?: string
  courseTitle: string
  isPackage?: boolean
  accountUrl: string
  brandName?: string
  supportEmail?: string
}

export function buildAccessGrantedEmail(data: AccessGrantedData) {
  const greeting = data.name ? `Namaste ${escapeHtml(data.name)},` : 'Hello,'
  const itemType = data.isPackage ? 'course package' : 'course'
  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #2E2A5C; font-weight: 700;">
      Course Access Granted
    </h2>
    <p style="margin: 0 0 12px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0; line-height: 1.6;">
      You have been granted access to <strong>${escapeHtml(data.courseTitle)}</strong>. You can now access your lesson materials and videos in your account dashboard.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(data.accountUrl)}" style="background-color: #F08A24; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
        Go to My Courses
      </a>
    </div>
  `

  const text = `${data.name ? `Namaste ${data.name},\n\n` : ''}You have been granted access to ${data.courseTitle}. You can access your ${itemType} materials at:

${data.accountUrl}

--
${data.brandName || 'YugOccult Learning Academy'}`

  return {
    subject: `Access granted: ${data.courseTitle} - ${data.brandName || 'YugOccult Learning Academy'}`,
    html: renderEmailLayout({
      title: 'Course Access Granted',
      contentHtml,
      brandName: data.brandName,
      supportEmail: data.supportEmail,
    }),
    text,
  }
}

// -----------------------------------------------------------------------------
// 6. Report Delivered (To Buyer)
// -----------------------------------------------------------------------------
export interface ReportDeliveredData {
  name?: string
  reportTitle: string
  accountUrl: string
  brandName?: string
  supportEmail?: string
}

export function buildReportDeliveredEmail(data: ReportDeliveredData) {
  const greeting = data.name ? `Namaste ${escapeHtml(data.name)},` : 'Hello,'
  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #2E2A5C; font-weight: 700;">
      Your Report is Ready
    </h2>
    <p style="margin: 0 0 12px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0; line-height: 1.6;">
      Your personalised report for <strong>${escapeHtml(data.reportTitle)}</strong> has been prepared and is now ready for download in your account dashboard.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${escapeHtml(data.accountUrl)}" style="background-color: #F08A24; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
        View My Reports
      </a>
    </div>
  `

  const text = `${data.name ? `Namaste ${data.name},\n\n` : ''}Your personalised report for ${data.reportTitle} is ready. You can download it from your account dashboard at:

${data.accountUrl}

--
${data.brandName || 'YugOccult Learning Academy'}`

  return {
    subject: `Your report is ready: ${data.reportTitle} - ${data.brandName || 'YugOccult Learning Academy'}`,
    html: renderEmailLayout({
      title: 'Your Report is Ready',
      contentHtml,
      brandName: data.brandName,
      supportEmail: data.supportEmail,
    }),
    text,
  }
}

// -----------------------------------------------------------------------------
// 7. Order Confirmation & Booking Confirmation (Templates for Phase 5 / Export)
// -----------------------------------------------------------------------------
export interface OrderConfirmationData {
  name?: string
  orderId: string
  itemTitle: string
  amount: number
  accountUrl: string
  brandName?: string
  supportEmail?: string
}

export function buildOrderConfirmationEmail(data: OrderConfirmationData) {
  const greeting = data.name ? `Namaste ${escapeHtml(data.name)},` : 'Hello,'
  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #2E2A5C; font-weight: 700;">
      Order Confirmation
    </h2>
    <p style="margin: 0 0 12px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0; line-height: 1.6;">
      Thank you for your order. We have received your payment for <strong>${escapeHtml(data.itemTitle)}</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="background-color: #F8F5EE; border-radius: 8px; font-size: 13px; margin: 16px 0 24px 0;">
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Order Ref:</td>
        <td style="color: #2E2A5C; font-weight: 600;">${escapeHtml(data.orderId)}</td>
      </tr>
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Item:</td>
        <td style="color: #2E2A5C;">${escapeHtml(data.itemTitle)}</td>
      </tr>
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Amount:</td>
        <td style="color: #2E2A5C; font-weight: 600;">&#8377;${data.amount}</td>
      </tr>
    </table>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${escapeHtml(data.accountUrl)}" style="background-color: #F08A24; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
        View My Account
      </a>
    </div>
  `

  const text = `${data.name ? `Namaste ${data.name},\n\n` : ''}Thank you for your order. We have received your payment for ${data.itemTitle}.

Order Ref: ${data.orderId}
Amount: ₹${data.amount}

View your account at: ${data.accountUrl}

--
${data.brandName || 'YugOccult Learning Academy'}`

  return {
    subject: `Order confirmed: ${data.itemTitle} - ${data.brandName || 'YugOccult Learning Academy'}`,
    html: renderEmailLayout({
      title: 'Order Confirmation',
      contentHtml,
      brandName: data.brandName,
      supportEmail: data.supportEmail,
    }),
    text,
  }
}

export interface BookingConfirmationData {
  name?: string
  serviceTitle: string
  preferredDate: string
  preferredSlot: string
  accountUrl: string
  brandName?: string
  supportEmail?: string
}

export function buildBookingConfirmationEmail(data: BookingConfirmationData) {
  const greeting = data.name ? `Namaste ${escapeHtml(data.name)},` : 'Hello,'
  const contentHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #2E2A5C; font-weight: 700;">
      Consultation Booking Received
    </h2>
    <p style="margin: 0 0 12px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0; line-height: 1.6;">
      Your 1-on-1 consultation booking for <strong>${escapeHtml(data.serviceTitle)}</strong> has been registered.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="background-color: #F8F5EE; border-radius: 8px; font-size: 13px; margin: 16px 0 24px 0;">
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Service:</td>
        <td style="color: #2E2A5C;">${escapeHtml(data.serviceTitle)}</td>
      </tr>
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Requested Date:</td>
        <td style="color: #2E2A5C; font-weight: 600;">${escapeHtml(data.preferredDate)}</td>
      </tr>
      <tr>
        <td style="color: #5B586E; font-weight: 600;">Slot:</td>
        <td style="color: #2E2A5C; font-weight: 600;">${escapeHtml(data.preferredSlot)}</td>
      </tr>
    </table>
  `

  const text = `${data.name ? `Namaste ${data.name},\n\n` : ''}Your 1-on-1 consultation booking for ${data.serviceTitle} has been registered for ${data.preferredDate} (${data.preferredSlot}).

--
${data.brandName || 'YugOccult Learning Academy'}`

  return {
    subject: `Consultation Booking: ${data.serviceTitle} - ${data.brandName || 'YugOccult Learning Academy'}`,
    html: renderEmailLayout({
      title: 'Consultation Booking Received',
      contentHtml,
      brandName: data.brandName,
      supportEmail: data.supportEmail,
    }),
    text,
  }
}
