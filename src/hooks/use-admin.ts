"use client"

import { useAuth } from "@/hooks/use-auth"
import { checkAdminStatus } from "@/app/actions/userProfileActions"
import { useEffect, useState, useRef } from "react"

export function useAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true)
  
  // Prevent multiple server calls for the same user
  const checkedUserRef = useRef<string | null>(null)
  const isCheckingRef = useRef(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setIsLoadingAdmin(false)
        checkedUserRef.current = null
        return
      }

      // Prevent multiple calls for the same user
      if (checkedUserRef.current === user.id || isCheckingRef.current) {
        return
      }

      try {
        isCheckingRef.current = true
        setIsLoadingAdmin(true)
        
        const isUserAdmin = await checkAdminStatus(user.id)
        setIsAdmin(isUserAdmin)
        checkedUserRef.current = user.id
      } catch {
        setIsAdmin(false)
      } finally {
        setIsLoadingAdmin(false)
        isCheckingRef.current = false
      }
    }

    checkAdmin()
  }, [user, isAuthenticated])

  return {
    isAdmin,
    isLoadingAdmin: isLoading || isLoadingAdmin
  }
} 