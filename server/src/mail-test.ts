import dotenv from 'dotenv'
import path from 'path'
import { sendMail } from './services/mail'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function runMailTest() {
  const targetEmail = process.argv[2]

  if (!targetEmail || !targetEmail.includes('@')) {
    console.error('Usage: npm run mail:test <recipient-email>')
    console.error('Example: npm run mail:test seeker@example.com')
    process.exit(1)
  }

  const isEnabled = process.env.MAIL_ENABLED === 'true'
  const smtpHost = process.env.SMTP_HOST || '(not set)'
  const smtpPort = process.env.SMTP_PORT || '(not set)'
  const smtpUser = process.env.SMTP_USER || '(not set)'
  const mailFrom = process.env.MAIL_FROM || '(not set)'

  console.log('--- Mail Configuration Diagnostics ---')
  console.log(`MAIL_ENABLED: ${isEnabled}`)
  console.log(`SMTP_HOST:    ${smtpHost}`)
  console.log(`SMTP_PORT:    ${smtpPort}`)
  console.log(`SMTP_USER:    ${smtpUser}`)
  console.log(`MAIL_FROM:    ${mailFrom}`)
  console.log(`Target Recipient: ${targetEmail}`)
  console.log('--------------------------------------')

  console.log('Dispatching test message...')
  const result = await sendMail({
    to: targetEmail,
    subject: 'YugOccult Learning Academy - Test Email',
    template: 'testEmail',
    text: `Namaste!\n\nThis is a verification email from YugOccult Learning Academy.\nYour SMTP setup is operating correctly.\n\nTimestamp: ${new Date().toISOString()}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; background-color: #FBF7EE; color: #2B2A3D; border-radius: 8px;">
        <h2 style="color: #2E2A5C;">YugOccult Learning Academy</h2>
        <p>Namaste!</p>
        <p>This is a verification email confirming that your SMTP settings are working properly.</p>
        <p style="font-size: 12px; color: #8F8B9C;">Timestamp: ${new Date().toISOString()}</p>
      </div>
    `,
  })

  console.log('\n--- Test Result ---')
  console.log(`Status: ${result.status}`)
  if (result.messageId) {
    console.log(`Message ID: ${result.messageId}`)
    console.log('Test email was accepted by SMTP server successfully!')
  }
  if (result.error) {
    console.log(`Notice / Error: ${result.error}`)
  }
  process.exit(0)
}

runMailTest().catch((err) => {
  console.error('[MailTest] Execution error:', err)
  process.exit(1)
})
