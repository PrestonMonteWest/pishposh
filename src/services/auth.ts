import type {
  AuthResponse,
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN_STORAGE_KEY = 'pishposh_tokens'

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, message: string, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function getStoredTokens(): AuthTokens | null {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as AuthTokens
  } catch {
    return null
  }
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function isAccessTokenExpired(): boolean {
  const token = getStoredTokens()?.accessToken
  if (!token) return true
  const payload = parseJwt(token)
  if (!payload?.exp) return true
  return Date.now() >= payload.exp * 1000
}

export function getAuthHeaderFromStorage(): Record<string, string> {
  const tokens = getStoredTokens()
  if (!tokens) return {}
  return { Authorization: `${tokens.tokenType} ${tokens.accessToken}` }
}

// Decodes without verifying — only safe for client-side expiry checks.
function parseJwt(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(payload)
  } catch {
    return null
  }
}

async function jsonFetch<T = void>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(
      res.status,
      body.message ?? 'Request failed',
      body.code ?? 'REQUEST_FAILED',
    )
  }

  return res.json()
}

export async function login(
  credentials: LoginCredentials,
  signal?: AbortSignal,
): Promise<AuthResponse> {
  const res = await jsonFetch<AuthResponse>('/auth/token', {
    signal,
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'password',
      email: credentials.email,
      password: credentials.password,
    }),
  })

  storeTokens(res.tokens)
  return res
}

export async function signup(
  credentials: SignupCredentials,
  signal?: AbortSignal,
): Promise<AuthResponse> {
  const res = await jsonFetch<AuthResponse>('/auth/register', {
    signal,
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  storeTokens(res.tokens)
  return res
}

export async function refreshAccessToken(
  signal?: AbortSignal,
): Promise<AuthTokens> {
  try {
    const token = getStoredTokens()?.refreshToken
    if (!token) {
      throw new Error('Refresh token not found')
    }
    const res = await jsonFetch<{ tokens: AuthTokens }>('/auth/token', {
      signal,
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: token,
      }),
    })

    storeTokens(res.tokens)
    return res.tokens
  } catch (err) {
    // Refresh token is dead — clear local state so the app re-auths.
    // Network errors shouldn't clear; only auth failures.
    if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
      clearTokens()
    }
    throw err
  }
}

export async function logout(signal?: AbortSignal): Promise<void> {
  if (!getStoredTokens()) return

  try {
    await jsonFetch('/auth/revoke', {
      signal,
      method: 'POST',
      headers: getAuthHeaderFromStorage(),
    })
  } finally {
    clearTokens()
  }
}

export async function getCurrentUser(
  signal?: AbortSignal,
): Promise<AuthResponse['user']> {
  return jsonFetch('/users/me', {
    signal,
    headers: getAuthHeaderFromStorage(),
  })
}

export async function verifyEmail(emailToken: string, signal?: AbortSignal) {
  await jsonFetch<{ message: string; code: string }>('/auth/verify-email', {
    signal,
    method: 'POST',
    body: JSON.stringify({ token: emailToken }),
  })
}

export async function resendEmailVerification(signal?: AbortSignal) {
  await jsonFetch('/auth/resend-email-verification', {
    signal,
    method: 'POST',
    headers: getAuthHeaderFromStorage(),
  })
}
