'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiFetch from '@/lib/api/client'
import { useRouter } from 'next/navigation'

import type { User } from '@/payload-types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (data: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser?: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [loading, setLoading] = useState(initialUser === undefined)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiFetch<{ user: User }>('/users/me')
      if (userData?.user) {
        setUser(userData.user)
      } else {
        setUser(null)
      }
    } catch (_error) {
      // Identify 401/403 as "not logged in" but don't throw to UI
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only fetch if initialUser wasn't provided (undefined)
    // If it was provided (null or User object), we trust the server
    if (initialUser === undefined) {
      refreshUser()
    }
  }, [refreshUser, initialUser])

  const login = async (credentials: { email: string; password: string }) => {
    await apiFetch('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    await refreshUser()
    router.push('/routines')
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
