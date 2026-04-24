import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { resendEmailVerification } from '../services/auth'

export function VerificationBanner() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!user || user.emailVerified) return null

  async function resend() {
    setSending(true)
    await resendEmailVerification()
    setSending(false)
    setSent(true)
  }

  return (
    <div className="flex justify-center gap-2 m-4">
      Verify your email to vote and post.
      {sent ? (
        <> Check your inbox.</>
      ) : (
        <button
          className="px-2 py-1 text-sm bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded transition-colors"
          onClick={resend}
          disabled={sending}
        >
          {sending ? 'Sending…' : 'Resend email'}
        </button>
      )}
    </div>
  )
}
