import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'
import * as authService from '../services/auth'
import type {
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  User,
} from '../types/auth'

interface Props {
  children: ReactNode
}

function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!tokens

  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initAuth = async () => {
      const storedTokens = authService.getStoredTokens()

      if (!storedTokens) {
        setIsLoading(false)
        return
      }

      try {
        if (authService.isAccessTokenExpired()) {
          setTokens(await authService.refreshAccessToken())
        } else {
          setTokens(storedTokens)
        }
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch {
        authService.clearTokens()
        setUser(null)
        setTokens(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      setTokens(response.tokens)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.signup(credentials)
      setUser(response.user)
      setTokens(response.tokens)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setTokens(null)
  }, [])

  const refreshToken = useCallback(async () => {
    if (!tokens?.refreshToken) return

    try {
      setTokens(await authService.refreshAccessToken())
    } catch {
      setUser(null)
      setTokens(null)
      authService.clearTokens()
    }
  }, [tokens])

  const value: AuthContextValue = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
