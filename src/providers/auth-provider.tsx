"use client"

import type React from "react"
import { createContext, useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import { User } from "@supabase/supabase-js"
import { useRouter, usePathname } from "next/navigation"

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  refreshSession: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const pathname = usePathname()

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setIsAuthenticated(!!session?.user)
      // Remove router.refresh() as it causes unnecessary page refreshes
    } catch {
      // Session refresh failed silently
    }
  }, [supabase])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshSession()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [refreshSession])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        setIsAuthenticated(!!session?.user)
        
        if (event === 'SIGNED_IN') {
          // Remove router.refresh() to prevent cascading re-renders
          if (pathname.startsWith('/auth/')) {
            router.push('/')
          }
        } else if (event === 'SIGNED_OUT') {
          // Remove router.refresh() to prevent cascading re-renders
          router.push('/auth/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  const signOut = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setIsAuthenticated(false)
    } catch {
      // Sign out failed silently
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, refreshSession, signOut }}>
      {children}
    </AuthContext.Provider>
  )
} 