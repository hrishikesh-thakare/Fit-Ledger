'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiFetch from '@/lib/api/client'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (data: any) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiFetch<{ user: User }>('/users/me')
      if (userData?.user) {
        setUser(userData.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      // Identify 401/403 as "not logged in" but don't throw to UI
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (credentials: any) => {
    await apiFetch('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    await refreshUser()
    router.push('/dashboard')
  }

  const logout = async () => {
    await apiFetch('/users/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
