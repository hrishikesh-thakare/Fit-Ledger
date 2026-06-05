import React, { createContext, useContext, useState, useEffect } from 'react'
import { getToken, loginWithToken, removeToken } from '../auth'

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

  const fetchMe = async (token: string): Promise<UserType | null> => {
    try {
      const meResponse = await fetch('http://192.168.0.108:3000/api/users/me', {
        headers: {
          'Authorization': `JWT ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const meData = await meResponse.json()
      if (meResponse.ok && meData.user) {
        // Fetch full user details to get preferredUnit, targetWeight, etc.
        const userResponse = await fetch(`http://192.168.0.108:3000/api/users/${meData.user.id}`, {
          headers: {
            'Authorization': `JWT ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (userResponse.ok) {
          return await userResponse.json()
        }
        return meData.user
      }
    } catch (e) {
      console.error('Failed to fetch user details', e)
    }
    return null
  }

  const loadSession = async () => {
    const t = await getToken()
    if (t) {
      const userData = await fetchMe(t)
      if (userData) {
        setUser(userData)
        setSignedIn(true)
      } else {
        await removeToken()
        setUser(null)
        setSignedIn(false)
      }
    } else {
      setUser(null)
      setSignedIn(false)
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  const login = async (token: string) => {
    await loginWithToken(token)
    const userData = await fetchMe(token)
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
      const userData = await fetchMe(t)
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
