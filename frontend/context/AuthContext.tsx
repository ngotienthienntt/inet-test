'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import {
  getToken,
  setToken,
  removeToken,
} from '@/lib/auth'

export interface SanitizedUser {
  id: number | string
  email: string
  fullName?: string
  name?: string
  role?: string
  [key: string]: unknown
}

export interface RegisterData {
  email: string
  password: string
  fullName?: string
  name?: string
  phone?: string
  [key: string]: unknown
}

interface AuthContextValue {
  user: SanitizedUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<SanitizedUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount: if token exists, fetch /auth/me to hydrate user
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data?.user ?? res.data ?? null)
      })
      .catch(() => {
        removeToken()
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password })
      const userData = res.data?.user ?? res.data ?? null
      if (userData?.role === 'admin') {
        throw new Error('ADMIN_ACCOUNT')
      }
      const token: string = res.data?.token ?? res.data?.accessToken ?? ''
      if (token) {
        setToken(token)
      }
      setUser(userData)
      router.push('/')
    },
    [router]
  )

  const register = useCallback(
    async (data: RegisterData) => {
      await authApi.register(data)
    },
    []
  )

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
    router.push('/')
  }, [router])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
