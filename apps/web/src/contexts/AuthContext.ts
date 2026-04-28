import { createContext } from 'react'
import type {
  AuthState,
  LoginCredentials,
  SignupCredentials,
} from '../types/auth'

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
