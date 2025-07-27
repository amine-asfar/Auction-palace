'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { checkIfUserWonAuction } from '@/app/actions/auctionHelpers'
import { getProductById } from '@/app/actions/productActions'
import { processPayment, getPaymentStatus, createPaymentRecord } from '@/app/actions/paymentActions'
import { useToast } from '@/components/ui/use-toast'
import { StripeCheckout } from '@/components/stripe-checkout'
import { 
  CreditCard, 
  Lock, 
  MapPin, 
  Package, 
  CheckCircle, 
  Clock, 
  Truck, 
  Shield,
  ArrowLeft,
  Info
} from 'lucide-react'
import Image from 'next/image'

interface ProductData {
  id: string
  title: string
  description: string
  current_price: number
  starting_price: number
  image: string
  end_time: string
  status: string
}

interface PaymentData {
  id: string
  amount: number
  status: string
  stripe_intent_id?: string
  created_at: string
  updated_at: string
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  
  // Main state
  const [product, setProduct] = useState<ProductData | null>(null)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [isWinner, setIsWinner] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Payment processing state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  
  // Form state
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card'>('card')
  
  // Stripe state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [useStripe, setUseStripe] = useState(false)

  // Prevent multiple server action calls
  const checkedPaymentRef = useRef<string | null>(null)
  const isCheckingRef = useRef(false)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate costs
  const calculateCosts = () => {
    if (!product) return { subtotal: 0, deliveryFee: 0, serviceFee: 0, total: 0 }
    
    const subtotal = product.current_price
    const deliveryFee = deliveryMethod === 'delivery' ? 15.99 : 0 // Frais de livraison
    const serviceFee = Math.round(subtotal * 0.05 * 100) / 100 // 5% de frais de service
    const total = subtotal + deliveryFee + serviceFee
    
    return { subtotal, deliveryFee, serviceFee, total }
  }

  const { subtotal, deliveryFee, serviceFee, total } = calculateCosts()

  const handlePayment = async () => {
    const productId = params.id as string
    
    if (!productId || isProcessingPayment || !product) return

    // Validation
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      toast({
        title: "Adresse requise",
        description: "Veuillez entrer une adresse de livraison",
        variant: "destructive"
      })
      return
    }

        try {
      setIsProcessingPayment(true)

      toast({
        title: "Initialisation du paiement...",
        description: "Préparation de votre paiement",
      })

      // Process the payment
      const result = await processPayment(productId, deliveryFee, serviceFee)

      if (result.success) {
        // Check if we have a Stripe client secret (real Stripe payment)
        if (result.stripe_client_secret) {
          setStripeClientSecret(result.stripe_client_secret)
          setUseStripe(true)
          toast({
            title: "💳 Paiement Stripe prêt",
            description: "Veuillez compléter votre paiement avec Stripe",
          })
        } else {
          // Test mode payment completed immediately
          setPaymentCompleted(true)
          setPayment(result.payment)
          
          toast({
            title: "🎉 Paiement test réussi !",
            description: `Votre paiement de ${formatCurrency(total)} a été traité avec succès.`,
          })
        }
      }

    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du paiement",
        variant: "destructive"
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  useEffect(() => {
    const productId = params.id as string
    
    if (!productId || checkedPaymentRef.current === productId || isCheckingRef.current) {
      return
    }

    const initializePayment = async () => {
      if (!isAuthenticated || !user) {
        router.push('/auth/login')
        return
      }

      try {
        isCheckingRef.current = true
        setIsLoading(true)

        // Get product details
        const productData = await getProductById(productId)
        if (!productData) {
          setError('Produit introuvable')
          return
        }
        setProduct(productData)

        // Check if current user won the auction
        const userWon = await checkIfUserWonAuction(productId, user.id)
        setIsWinner(userWon)

        if (!userWon) {
          setError('Vous n\'êtes pas le gagnant de cette enchère')
          return
        }

        // Create payment record if it doesn't exist
        try {
          await createPaymentRecord(productId, user.id)
        } catch (err) {
          console.log('Payment record creation failed or already exists:', err)
        }

        // Get payment status
        try {
          const paymentData = await getPaymentStatus(productId)
          if (paymentData) {
            setPayment(paymentData)
            if (paymentData.status === 'completed') {
              setPaymentCompleted(true)
            }
          }
        } catch (err) {
          console.log('No payment found, this is normal for new payments')
        }

        checkedPaymentRef.current = productId

      } catch (err) {
        setError('Erreur lors de l\'initialisation du paiement')
        console.error('Payment initialization error:', err)
      } finally {
        setIsLoading(false)
        isCheckingRef.current = false
      }
    }

    initializePayment()
  }, [params.id, user, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Préparation de votre paiement...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product || isWinner === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              <div className="text-red-500 mb-4 text-5xl">❌</div>
              <h2 className="text-2xl font-bold mb-4">Accès refusé</h2>
              <p className="text-gray-600 mb-6">
                {error || 'Vous n\'avez pas accès à cette page de paiement.'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/auctions')} variant="outline">
                  Retour aux enchères
                </Button>
                <Button onClick={() => router.push(`/auctions/${params.id}`)} className="bg-indigo-600 hover:bg-indigo-700">
                  Voir l'enchère
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              <div className="text-green-500 mb-6 text-6xl">🎉</div>
              <h1 className="text-3xl font-bold text-green-800 mb-4">Paiement réussi !</h1>
              <p className="text-gray-600 mb-6">
                Votre paiement de <span className="font-bold text-green-600">{formatCurrency(total)}</span> a été traité avec succès.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-green-800 mb-2">Prochaines étapes :</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Vous recevrez un email de confirmation</li>
                  <li>• Le vendeur sera notifié de votre paiement</li>
                  <li>• Vous serez contacté pour organiser la {deliveryMethod === 'delivery' ? 'livraison' : 'récupération'}</li>
                  <li>• Vous pourrez laisser un avis après réception</li>
                </ul>
              </div>

              {payment && (
                <div className="text-sm text-gray-500 mb-6">
                  <p>Référence de paiement : <code className="bg-gray-100 px-2 py-1 rounded">{payment.id}</code></p>
                  <p>Date : {formatDate(payment.updated_at)}</p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/auctions')} variant="outline">
                  Retour aux enchères
                </Button>
                <Button onClick={() => router.push('/profile')} className="bg-indigo-600 hover:bg-indigo-700">
                  Mon profil
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/auctions/${params.id}`)}
              className="mb-4 text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'enchère
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Finaliser votre achat
              </h1>
              <p className="text-gray-600">Félicitations ! Vous avez remporté cette enchère</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche - Détails et options */}
            <div className="lg:col-span-2 space-y-6">
              {/* Produit gagné */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h2 className="text-xl font-semibold">Enchère remportée</h2>
                </div>
                
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-4">
                      <Badge variant="success" className="bg-green-100 text-green-800">
                        Enchère gagnée
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Terminée le {formatDate(product.end_time)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(product.current_price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Prix final
                    </div>
                  </div>
                </div>
              </Card>

              {/* Options de livraison */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-xl font-semibold">Livraison</h2>
                </div>

                <Tabs value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as 'pickup' | 'delivery')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pickup">Récupération</TabsTrigger>
                    <TabsTrigger value="delivery">Livraison</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pickup" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Récupération gratuite</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Récupérez votre article directement auprès du vendeur. 
                        Vous serez contacté pour convenir d'un rendez-vous.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="delivery" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address">Adresse de livraison *</Label>
                        <Textarea
                          id="address"
                          placeholder="Entrez votre adresse complète..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Instructions de livraison (optionnel)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Étage, code d'accès, créneaux préférés..."
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            Livraison sous 3-5 jours ouvrés - {formatCurrency(deliveryFee)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Méthode de paiement */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-xl font-semibold">Paiement</h2>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-indigo-800">Paiement sécurisé par Stripe</span>
                  </div>
                  <p className="text-sm text-indigo-700">
                    Vos données bancaires sont protégées par le chiffrement SSL de niveau bancaire. 
                    Stripe est utilisé par des millions d'entreprises dans le monde.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs text-indigo-600 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      <span>Visa, Mastercard, Amex acceptées</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Colonne droite - Résumé */}
            <div className="space-y-6">
              <Card className="p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-4">Résumé de la commande</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Prix de l'enchère</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Frais de service</span>
                    <span className="font-medium">{formatCurrency(serviceFee)}</span>
                  </div>
                  
                  {deliveryMethod === 'delivery' && (
                    <div className="flex justify-between">
                      <span>Frais de livraison</span>
                      <span className="font-medium">{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-indigo-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                {useStripe && stripeClientSecret ? (
                  // Stripe payment component
                  <StripeCheckout
                    clientSecret={stripeClientSecret}
                    amount={total}
                    onSuccess={() => {
                      setPaymentCompleted(true)
                      toast({
                        title: "🎉 Paiement Stripe réussi !",
                        description: `Votre paiement de ${formatCurrency(total)} a été traité avec succès.`,
                      })
                    }}
                                         onError={(error: string) => {
                       toast({
                         title: "Erreur de paiement",
                         description: error,
                         variant: "destructive"
                       })
                       setUseStripe(false)
                       setStripeClientSecret(null)
                     }}
                  />
                ) : (
                  // Standard payment button
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 text-lg font-semibold shadow-lg disabled:opacity-50"
                    size="lg"
                    onClick={handlePayment}
                    disabled={isProcessingPayment || (deliveryMethod === 'delivery' && !deliveryAddress.trim())}
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        {useStripe ? 'Initialiser le paiement Stripe' : `Payer ${formatCurrency(total)}`}
                      </>
                    )}
                  </Button>
                )}

                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>Paiement 100% sécurisé</span>
                  </div>
                </div>
              </Card>

              {/* Informations supplémentaires */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Informations
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Paiement à effectuer sous 48h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <span>Article réservé pendant 48h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Garantie de remboursement</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 