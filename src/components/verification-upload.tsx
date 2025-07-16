"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { uploadVerificationFile } from "@/app/actions/verificationActions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface VerificationUploadProps {
  onVerificationSubmitted?: () => void
  isRequired?: boolean
}

export function VerificationUpload({ onVerificationSubmitted, isRequired = true }: VerificationUploadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Type de fichier non supporté",
          description: "Veuillez sélectionner un fichier PDF, JPG, JPEG ou PNG.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille du fichier ne doit pas dépasser 5MB.",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier et vous assurer d'être connecté.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      await uploadVerificationFile(user.id, selectedFile)
      
      setVerificationStatus('pending')
      setSelectedFile(null)
      
      toast({
        title: "Document soumis avec succès",
        description: "Votre document d'identité a été soumis et sera vérifié sous 24-48h.",
      })

      onVerificationSubmitted?.()
    } catch (error) {
      console.error('Error uploading verification file:', error)
      toast({
        title: "Erreur lors du téléchargement",
        description: "Une erreur est survenue lors du téléchargement du document.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approuvé',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'rejected':
        return {
          label: 'Rejeté',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          label: 'En attente',
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
    }
  }

  return (
    <Card className="p-6 border-2 border-dashed border-indigo-200">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-medium">
            Vérification d'identité {isRequired && <span className="text-red-500">*</span>}
          </h3>
        </div>

        <p className="text-sm text-gray-600">
          Pour des raisons de sécurité, nous devons vérifier votre identité. 
          Veuillez télécharger une pièce d&apos;identité valide (carte d&apos;identité, passeport, permis de conduire).
        </p>

        {verificationStatus ? (
          <div className="p-4 rounded-lg border">
            {(() => {
              const statusConfig = getStatusConfig(verificationStatus)
              const StatusIcon = statusConfig.icon
              return (
                <div className={`flex items-center space-x-3 p-3 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                  <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                  <div>
                    <p className={`text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </p>
                    <p className="text-xs text-gray-600">
                      {verificationStatus === 'approved' 
                        ? "Votre identité a été vérifiée avec succès"
                        : verificationStatus === 'rejected'
                        ? "Veuillez soumettre à nouveau vos documents"
                        : "Vos documents sont en cours de vérification (24-48h)"
                      }
                    </p>
                  </div>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Cliquez pour sélectionner un fichier ou glissez-déposez
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="verification-file"
              />
              <label
                htmlFor="verification-file"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Sélectionner un fichier
              </label>
            </div>

            {selectedFile && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Fichier sélectionné:</strong> {selectedFile.name}
                </p>
                <p className="text-xs text-green-600">
                  Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              {isUploading ? "Téléchargement..." : "Soumettre pour vérification"}
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>Formats acceptés:</strong> PDF, JPG, JPEG, PNG</p>
          <p><strong>Taille maximale:</strong> 5MB</p>
          <p><strong>Délai de vérification:</strong> 24-48 heures</p>
        </div>
      </div>
    </Card>
  )
} 