"use client"

import { useAuth } from "@/hooks/use-auth"
import { checkAdminStatus } from "@/app/actions/userProfileActions"
import { useEffect, useState } from "react"

export function useAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setIsLoadingAdmin(false)
        return
      }

      try {
        const isUserAdmin = await checkAdminStatus(user.id)
        setIsAdmin(isUserAdmin)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setIsLoadingAdmin(false)
      }
    }

    checkAdmin()
  }, [user, isAuthenticated])

  return {
    isAdmin,
    isLoadingAdmin: isLoading || isLoadingAdmin
  }
} 