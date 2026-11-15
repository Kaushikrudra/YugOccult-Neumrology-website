import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string | null
  role: 'admin' | 'user'
}

interface AuthContextType {
  user: AuthUser | null
  admin: AuthUser | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  signup: (data: { name: string; email: string; phone?: string; password: string }) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const checkSession = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser }>('/api/auth/me')
      if (data && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await api.post<{ success: boolean; user: AuthUser }>('/api/auth/login', {
      email,
      password,
    })
    if (data?.user) {
      setUser(data.user)
      return data.user
    }
    throw new Error('Authentication failed')
  }

  const signup = async (data: {
    name: string
    email: string
    phone?: string
    password: string
  }): Promise<AuthUser> => {
    const res = await api.post<{ success: boolean; user: AuthUser }>('/api/auth/signup', data)
    if (res?.user) {
      setUser(res.user)
      return res.user
    }
    throw new Error('Account creation failed')
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
    }
  }

  const admin = user?.role === 'admin' ? user : null
  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isAdmin,
        isLoading,
        login,
        signup,
        logout,
        refreshSession: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
