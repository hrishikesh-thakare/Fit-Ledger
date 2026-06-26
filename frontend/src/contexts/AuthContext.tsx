import React, { createContext, useContext, useState, useEffect } from 'react'
import { getToken, loginWithToken, removeToken } from '../auth'
import { DeviceEventEmitter } from 'react-native'

export interface UserType {
  id: string
  email: string
  displayName?: string
  preferredUnit?: 'kg' | 'lb'
  targetWeight?: number
  createdAt?: string
  updatedAt?: string
}

interface AuthContextType {
  signedIn: boolean | null
  user: UserType | null
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [user, setUser] = useState<UserType | null>(null)

  const fetchMe = async (token: string): Promise<{ user: UserType | null, status: number }> => {
    try {
      const meResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'}/users/me`, {
        headers: {
          'Authorization': `JWT ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (meResponse.ok) {
        const meData = await meResponse.json()
        return { user: meData.user, status: meResponse.status }
      }
      return { user: null, status: meResponse.status }
    } catch (e: unknown) {
      console.error('Failed to fetch user details', e)
      return { user: null, status: 0 } // 0 indicates network error
    }
  }

  const loadSession = async () => {
    const t = await getToken()
    if (t) {
      const { user: userData, status } = await fetchMe(t)
      if (userData) {
        setUser(userData)
        setSignedIn(true)
      } else if (status === 401) {
        // Only log out on explicit 401 Unauthorized
        await removeToken()
        setUser(null)
        setSignedIn(false)
      } else {
        // Network error or server down: keep the user logged in locally
        setSignedIn(true)
      }
    } else {
      setUser(null)
      setSignedIn(false)
    }
  }


  useEffect(() => {
    loadSession()
    
    const subscription = DeviceEventEmitter.addListener('force_logout', async () => {
      setUser(null)
      setSignedIn(false)
    })
    
    return () => {
      subscription.remove()
    }
  }, [])

  const login = async (token: string) => {
    await loginWithToken(token)
    const { user: userData } = await fetchMe(token)
    setUser(userData)
    setSignedIn(true)
  }

  const logout = async () => {
    await removeToken()
    setUser(null)
    setSignedIn(false)
  }

  const refreshUser = async () => {
    const t = await getToken()
    if (t) {
      const { user: userData } = await fetchMe(t)
      if (userData) {
        setUser(userData)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ signedIn, user, login, logout, refreshUser }}>
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
