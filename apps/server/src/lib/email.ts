import { Resend } from 'resend'

let resend: Resend | undefined

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'PishPosh <noreply@pishposh.app>'
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

export async function sendVerificationEmail(to: string, rawToken: string) {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)

  const verifyUrl = `${APP_URL}/verify-email?token=${rawToken}`

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Verify your PishPosh email',
    text: `Welcome to PishPosh.

Click the link below to verify your email address. The link expires in 48 hours.

${verifyUrl}

If you didn't sign up, you can ignore this email.`,
    html: `<p>Welcome to PishPosh.</p>
<p>Click the link below to verify your email address. The link expires in 48 hours.</p>
<p><a href="${verifyUrl}">Verify email</a></p>
<p>If you didn't sign up, you can ignore this email.</p>`,
  })

  if (error) {
    // Surface the error so the caller can decide what to do.
    // Don't throw inside a transaction that creates the user row.
    throw new Error(`Failed to send verification email: ${error.message}`)
  }

  return data // { id: '...' } — useful for logging/debugging
}
