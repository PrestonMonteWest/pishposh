function hasSuccess(data: unknown): data is { success: boolean } {
  return typeof (data as { success: unknown })?.success === 'boolean'
}

export async function verifyCaptchaToken(token: string): Promise<boolean> {
  const res = await fetch(
    process.env.TURNSTILE_VERIFY_URL ??
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    },
  )

  const data = await res.json()
  if (hasSuccess(data)) return data.success
  return false
}
