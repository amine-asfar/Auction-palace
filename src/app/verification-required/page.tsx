"use client"

import { useAuth } from "@/hooks/use-auth"
import { useVerification } from "@/hooks/use-verification"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import { VerificationUpload } from "@/components/verification-upload"
import { useToast } from "@/components/ui/use-toast"
import { Shield, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"

export default function VerificationRequiredPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { verificationStatus, isVerified, needsVerification, isLoadingVerification } = useVerification()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/verification-required")
      return
    }

    if (!isLoadingVerification && isVerified) {
      router.push("/")
      return
    }
  }, [isAuthenticated, isLoading, isVerified, isLoadingVerification, router])

  const handleVerificationSubmitted = () => {
    toast({
      title: "Vérification soumise",
      description: "Votre document a été soumis avec succès. Vous recevrez une notification une fois vérifié.",
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Vérification approuvée',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          message: 'Votre identité a été vérifiée avec succès. Vous pouvez maintenant accéder au site.'
        }
      case 'rejected':
        return {
          label: 'Vérification rejetée',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          message: 'Votre document a été rejeté. Veuillez soumettre un nouveau document.'
        }
      default:
        return {
          label: 'Vérification en cours',
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          message: 'Votre document est en cours de vérification. Cela peut prendre 24-48 heures.'
        }
    }
  }

  if (isLoading || isLoadingVerification) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-md w-64 mb-6"></div>
            <Card className="p-8">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded-md w-full"></div>
                <div className="h-4 bg-muted rounded-md w-3/4"></div>
                <div className="h-4 bg-muted rounded-md w-1/2"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (isVerified) {
    return null // Will redirect to home
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent mb-2">
            Vérification d&apos;identité requise
          </h1>
          <p className="text-gray-600">
            Pour accéder à Auction Palace, nous devons vérifier votre identité
          </p>
        </div>

        {/* Status Card */}
        {verificationStatus && (
          <Card className="p-6">
            {(() => {
              const statusConfig = getStatusConfig(verificationStatus)
              const StatusIcon = statusConfig.icon
              return (
                <div className={`flex items-start space-x-4 p-4 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                  <StatusIcon className={`h-6 w-6 ${statusConfig.color} mt-0.5`} />
                  <div>
                    <h3 className={`font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {statusConfig.message}
                    </p>
                  </div>
                </div>
              )
            })()}
          </Card>
        )}

        {/* Verification Upload */}
        {needsVerification && (
          <VerificationUpload 
            onVerificationSubmitted={handleVerificationSubmitted}
            isRequired={true}
          />
        )}

        {/* Information Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">
                Pourquoi cette vérification est-elle nécessaire ?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sécurité et prévention de la fraude</li>
                <li>• Conformité aux réglementations</li>
                <li>• Protection des utilisateurs</li>
                <li>• Création d&apos;un environnement de confiance</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Help Card */}
        <Card className="p-6">
          <h3 className="font-medium text-gray-900 mb-3">Besoin d&apos;aide ?</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Assurez-vous que votre document est lisible et complet</p>
            <p>• Les formats acceptés : PDF, JPG, JPEG, PNG</p>
            <p>• Taille maximale : 5MB</p>
            <p>• Délai de vérification : 24-48 heures</p>
          </div>
        </Card>
      </div>
    </div>
  )
} 