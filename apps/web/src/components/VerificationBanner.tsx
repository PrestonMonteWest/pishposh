import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ApiError, resendEmailVerification } from '../services/auth'

export function VerificationBanner() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errMessage, setErrMessage] = useState('')

  if (!user || user.emailVerified) return null

  async function resend() {
    setSending(true)
    try {
      await resendEmailVerification()
      setSent(true)
    } catch (err) {
      setErrMessage(
        err instanceof ApiError
          ? err.message
          : 'Failed to resend email verification',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {errMessage && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
          {errMessage}
        </div>
      )}
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
    </>
  )
}
