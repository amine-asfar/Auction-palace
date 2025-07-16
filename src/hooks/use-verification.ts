"use client"

import { useAuth } from "@/hooks/use-auth"
import { getVerificationStatus } from "@/app/actions/verificationActions"
import { useEffect, useState } from "react"

export function useVerification() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [isLoadingVerification, setIsLoadingVerification] = useState(true)

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!isAuthenticated || !user) {
        setVerificationStatus(null)
        setIsLoadingVerification(false)
        return
      }

      try {
        const status = await getVerificationStatus(user.id)
        setVerificationStatus(status?.status || null)
      } catch (error) {
        console.error('Error checking verification status:', error)
        setVerificationStatus(null)
      } finally {
        setIsLoadingVerification(false)
      }
    }

    checkVerificationStatus()
  }, [user, isAuthenticated])

  const isVerified = verificationStatus === 'approved'
  const isPending = verificationStatus === 'pending'
  const isRejected = verificationStatus === 'rejected'
  const needsVerification = !verificationStatus || isRejected

  return {
    verificationStatus,
    isVerified,
    isPending,
    isRejected,
    needsVerification,
    isLoadingVerification: isLoading || isLoadingVerification
  }
} 