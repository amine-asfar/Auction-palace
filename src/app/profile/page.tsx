"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit3, 
  Camera,
  Settings,
  Award,
  TrendingUp,
  MapPin,
  CreditCard,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

// Types pour les données statiques
interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  identity_status: 'pending' | 'verified' | 'rejected'
  identity_document_url?: string
  created_at: string
  updated_at: string
}

interface PurchaseHistory {
  id: string
  product_id: string
  product_title: string
  product_image: string
  purchase_price: number
  purchase_date: string
  status: 'won' | 'paid' | 'delivered'
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Données statiques pour le design
  const userProfile: UserProfile = {
    id: user?.id || '1',
    email: user?.email || 'john.doe@example.com',
    first_name: 'Jean',
    last_name: 'Dupont',
    address: '123 Rue de la Paix',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    identity_status: 'verified', // Peut être 'pending', 'verified', ou 'rejected'
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }

  const purchaseHistory: PurchaseHistory[] = [
    {
      id: '1',
      product_id: '1',
      product_title: 'Montre Rolex Submariner Vintage',
      product_image: 'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=400',
      purchase_price: 8500,
      purchase_date: '2024-01-10T14:30:00Z',
      status: 'delivered'
    },
    {
      id: '2',
      product_id: '2',
      product_title: 'Tableau Impressionniste Original',
      product_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      purchase_price: 3200,
      purchase_date: '2024-01-08T16:45:00Z',
      status: 'paid'
    }
  ]

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirectTo=/profile")
    }
  }, [isAuthenticated, isLoading, router])

  const getIdentityStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Identité validée',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'rejected':
        return {
          label: 'Identité rejetée',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          label: 'Identité en cours de validation',
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-md w-48 mb-6"></div>
            <Card className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-32 w-32 bg-muted rounded-full"></div>
                  <div className="h-4 bg-muted rounded-md w-24"></div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="h-4 bg-muted rounded-md w-full"></div>
                  <div className="h-4 bg-muted rounded-md w-3/4"></div>
                  <div className="h-4 bg-muted rounded-md w-1/2"></div>
                </div>
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

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <Button variant="outline" className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
            <Edit3 className="h-4 w-4 mr-2" />
            Modifier le profil
          </Button>
        </div>

        {/* Main Profile Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-indigo-100 shadow-lg">
                    <AvatarImage 
                      src={user?.user_metadata?.avatar_url || ""} 
                      alt={user?.user_metadata?.name || "Utilisateur"} 
                    />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-400 to-violet-400 text-white text-2xl">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Compte vérifié
                </Badge>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {userProfile?.first_name && userProfile?.last_name 
                      ? `${userProfile.first_name} ${userProfile.last_name}`
                      : user?.user_metadata?.name || "Utilisateur"
                    }
                  </h2>
                  <p className="text-gray-600">
                    Membre depuis {new Date(user?.created_at || "").toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long"
                    })}
                  </p>
                </div>

                <Separator className="bg-indigo-100" />

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Informations personnelles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <Mail className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{userProfile?.email || user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <User className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Nom complet</p>
                        <p className="text-sm text-gray-600">
                          {userProfile?.first_name && userProfile?.last_name 
                            ? `${userProfile.first_name} ${userProfile.last_name}`
                            : "Non renseigné"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Address Section */}
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                    <MapPin className="h-5 w-5 text-indigo-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Adresse</p>
                      {userProfile?.address ? (
                        <div className="text-sm text-gray-600">
                          <p>{userProfile.address}</p>
                          {userProfile.city && userProfile.postal_code && (
                            <p>{userProfile.postal_code} {userProfile.city}</p>
                          )}
                          {userProfile.country && (
                            <p>{userProfile.country}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Non renseignée</p>
                      )}
                    </div>
                  </div>

                  {/* Identity Status */}
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900">Statut de vérification</h4>
                    {(() => {
                      const statusConfig = getIdentityStatusConfig(userProfile?.identity_status || 'pending')
                      const StatusIcon = statusConfig.icon
                      return (
                        <div className={`flex items-center space-x-3 p-3 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                          <div>
                            <p className={`text-sm font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </p>
                            <p className="text-xs text-gray-600">
                              {userProfile?.identity_status === 'verified' 
                                ? "Votre identité a été vérifiée avec succès"
                                : userProfile?.identity_status === 'rejected'
                                ? "Veuillez soumettre à nouveau vos documents"
                                : "Vos documents sont en cours de vérification"
                              }
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <Separator className="bg-indigo-100" />

                {/* Account Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Statistiques du compte</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-8 w-8 text-indigo-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{purchaseHistory.length}</p>
                          <p className="text-sm text-gray-600">Enchères gagnées</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100">
                      <div className="flex items-center space-x-3">
                        <Award className="h-8 w-8 text-violet-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">0</p>
                          <p className="text-sm text-gray-600">Enchères créées</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-8 w-8 text-indigo-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {purchaseHistory.reduce((total: number, purchase: PurchaseHistory) => total + purchase.purchase_price, 0).toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}
                          </p>
                          <p className="text-sm text-gray-600">Total des achats</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Purchase History Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Package className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">Historique d'achat</h3>
            </div>
            
            {purchaseHistory.length > 0 ? (
                             <div className="space-y-4">
                 {purchaseHistory.map((purchase: PurchaseHistory) => (
                  <div key={purchase.id} className="p-4 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={purchase.product_image || '/placeholder-image.jpg'}
                          alt={purchase.product_title}
                          className="w-16 h-16 rounded-lg object-cover border border-indigo-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-image.jpg'
                          }}
                        />
                      </div>
                                             <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-medium text-gray-900 truncate">
                           {purchase.product_title}
                         </h4>
                         <p className="text-sm text-gray-600">
                           Acheté le {new Date(purchase.purchase_date).toLocaleDateString("fr-FR")}
                         </p>
                         <p className="text-sm font-semibold text-indigo-600">
                           {purchase.purchase_price.toLocaleString("fr-FR", {
                             style: "currency",
                             currency: "EUR"
                           })}
                         </p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucun achat pour le moment</p>
                <p className="text-sm text-gray-500">
                  Vos enchères gagnées apparaîtront ici
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Account Settings Card */}
        <Card className="border-indigo-100 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">Paramètres du compte</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">Compte créé le</p>
                    <p className="text-sm text-gray-600">
                      {new Date(user?.created_at || "").toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Statut de vérification</p>
                    <p className="text-sm text-green-600">Email vérifié</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 