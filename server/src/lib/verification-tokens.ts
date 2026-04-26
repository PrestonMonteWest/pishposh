import crypto from 'node:crypto'

export const EMAIL_VERIFICATION_TOKEN_BYTES = 32
export const EMAIL_VERIFICATION_TOKEN_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000 // 2 days

export function generateVerificationToken() {
  const rawToken = crypto
    .randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES)
    .toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_MS)
  return { rawToken, tokenHash, expiresAt }
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export function isExpired(expiresAt: Date | undefined): boolean {
  if (!expiresAt) return true
  return expiresAt.getTime() < Date.now()
}
