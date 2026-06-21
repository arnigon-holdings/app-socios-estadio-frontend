import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import type { User, MeResponse } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  pointsBalance: number
  login: (rut: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [pointsBalance, setPointsBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get<MeResponse>('/api/v1/me')
      setUser(data.user)
      setPointsBalance(data.points_balance)
    } catch {
      setUser(null)
      setPointsBalance(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (rut: string, password: string) => {
    const data = await api.post<{ user: User }>('/api/v1/login', {
      rut,
      password,
    })
    setUser(data.user)
    const meData = await api.get<MeResponse>('/api/v1/me')
    setPointsBalance(meData.points_balance)
  }

  const logout = async () => {
    await api.delete('/api/v1/logout')
    setUser(null)
    setPointsBalance(0)
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        pointsBalance,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}