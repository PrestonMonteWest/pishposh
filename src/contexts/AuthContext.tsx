import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as authService from '../services/auth'
import type {
  AuthState,
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  User,
} from '../types/auth'

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
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
        if (authService.isTokenExpired(storedTokens)) {
          const newTokens = await authService.refreshAccessToken(
            storedTokens.refreshToken,
          )
          setTokens(newTokens)
          const currentUser = await authService.getCurrentUser(
            newTokens.accessToken,
          )
          setUser(currentUser)
        } else {
          setTokens(storedTokens)
          const currentUser = await authService.getCurrentUser(
            storedTokens.accessToken,
          )
          setUser(currentUser)
        }
      } catch (error) {
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
    if (tokens?.accessToken) {
      await authService.logout(tokens.accessToken)
    }
    setUser(null)
    setTokens(null)
  }, [tokens])

  const refreshToken = useCallback(async () => {
    if (!tokens?.refreshToken) return

    try {
      const newTokens = await authService.refreshAccessToken(
        tokens.refreshToken,
      )
      setTokens(newTokens)
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
