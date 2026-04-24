import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError, verifyEmail } from '../services/auth'

export function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState<
    'loading' | 'ok' | 'expired' | 'invalid'
  >('loading')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setStatus('invalid')
      return
    }

    const controller = new AbortController()

    verifyEmail(token, controller.signal)
      .then(() => setStatus('ok'))
      .catch((err) => {
        if (err instanceof ApiError) {
          if (err.code === 'EXPIRED_EMAIL_VERIFICATION_TOKEN') {
            setStatus('expired')
          } else {
            setStatus('invalid')
          }
        }
      })

    return () => controller.abort()
  }, [params])

  if (status === 'loading') return <p>Verifying…</p>
  if (status === 'ok')
    return <p>Email verified. You now have full access to PishPosh.</p>
  if (status === 'expired')
    return <p>That link has expired. Sign in and request a new one.</p>
  return <p>Invalid verification link.</p>
}
