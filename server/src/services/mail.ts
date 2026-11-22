import nodemailer from 'nodemailer'
import { pool } from '../db'

export interface SendMailOptions {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
  template: string
}

export interface SendMailResult {
  status: 'sent' | 'skipped' | 'failed'
  messageId?: string
  error?: string
}

/**
 * Mask an email address for safe logging (e.g. "kaushik@gmail.com" -> "k***@gmail.com")
 */
function maskEmail(email: string): string {
  const parts = email.trim().split('@')
  if (parts.length !== 2) return '***'
  const name = parts[0]
  const domain = parts[1]
  const maskedName = name.length > 1 ? name[0] + '***' : '***'
  return `${maskedName}@${domain}`
}

/**
 * Validates header strings against header injection (carriage return, newline, or null characters).
 */
function containsHeaderInjection(str: string): boolean {
  return /[\r\n\0]/.test(str)
}

/**
 * Simple email validation regex (RFC 5322 compatible format check)
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Dispatches an email using nodemailer with SMTP.
 * Never throws an error that could crash or fail user requests.
 */
export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const { to, subject, text, html, replyTo, template } = options

  // 1. Validate inputs for security (reject header injection)
  if (!to || containsHeaderInjection(to) || !isValidEmail(to)) {
    console.warn(`[Mail] Invalid or potentially malicious recipient rejected: ${maskEmail(to || '')}`)
    await recordEmailLog({
      to_email: to ? maskEmail(to) : 'invalid',
      subject: subject.slice(0, 100),
      template,
      status: 'failed',
      error: 'Invalid recipient email or header injection attempt detected.',
    })
    return { status: 'failed', error: 'Invalid recipient email.' }
  }

  if (subject && containsHeaderInjection(subject)) {
    console.warn('[Mail] Header injection attempt in subject line rejected.')
    await recordEmailLog({
      to_email: to,
      subject: 'rejected',
      template,
      status: 'failed',
      error: 'Header injection detected in subject line.',
    })
    return { status: 'failed', error: 'Header injection detected in subject.' }
  }

  if (replyTo && (containsHeaderInjection(replyTo) || !isValidEmail(replyTo))) {
    console.warn(`[Mail] Invalid replyTo address ignored: ${maskEmail(replyTo)}`)
  }

  // 2. Check if mail sending is enabled via environment variables
  const isEnabled = process.env.MAIL_ENABLED === 'true'
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!isEnabled || !smtpHost || !smtpUser || !smtpPass) {
    console.log(`[Mail:Skipped] template="${template}" to="${maskEmail(to)}" (MAIL_ENABLED=${isEnabled})`)
    await recordEmailLog({
      to_email: to,
      subject,
      template,
      status: 'skipped',
      error: !isEnabled ? 'MAIL_ENABLED is false' : 'Incomplete SMTP configuration',
    })
    return { status: 'skipped' }
  }

  // 3. Create SMTP transport
  try {
    const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    const fromAddress = process.env.MAIL_FROM || `YugOccult Learning Academy <${smtpUser}>`

    const info = await transporter.sendMail({
      from: fromAddress,
      to: to.trim(),
      replyTo: replyTo && isValidEmail(replyTo) && !containsHeaderInjection(replyTo) ? replyTo.trim() : undefined,
      subject,
      text,
      html,
    })

    console.log(`[Mail:Sent] template="${template}" to="${maskEmail(to)}" msgId="${info.messageId}"`)
    await recordEmailLog({
      to_email: to,
      subject,
      template,
      status: 'sent',
    })

    return { status: 'sent', messageId: info.messageId }
  } catch (err: any) {
    const errMsg = err?.message || 'Failed to dispatch email'
    console.error(`[Mail:Failed] template="${template}" to="${maskEmail(to)}" error="${errMsg}"`)
    await recordEmailLog({
      to_email: to,
      subject,
      template,
      status: 'failed',
      error: errMsg.slice(0, 300),
    })

    return { status: 'failed', error: errMsg }
  }
}

/**
 * Records an entry in email_logs table safely
 */
async function recordEmailLog(data: {
  to_email: string
  subject: string
  template: string
  status: 'sent' | 'failed' | 'skipped'
  error?: string
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO email_logs (to_email, subject, template, status, error)
       VALUES ($1, $2, $3, $4, $5);`,
      [
        data.to_email,
        data.subject.slice(0, 255),
        data.template,
        data.status,
        data.error ? data.error.slice(0, 300) : null,
      ]
    )
  } catch (dbErr) {
    console.error('[Mail:LogDBError] Could not save email log to database:', dbErr)
  }
}
