'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { checkIfUserWonAuction } from '@/app/actions/auctionHelpers'
import { getProductById } from '@/app/actions/productActions'

interface ProductData {
  id: string
  title: string
  description: string
  current_price: number
  image: string
  end_time: string
  status: string
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [isWinner, setIsWinner] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prevent multiple server action calls
  const checkedPaymentRef = useRef<string | null>(null)
  const isCheckingRef = useRef(false)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  useEffect(() => {
    const productId = params.id as string
    
    // Prevent multiple checks for the same product
    if (!productId || checkedPaymentRef.current === productId || isCheckingRef.current) {
      return
    }

    const checkAccess = async () => {
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
          setIsLoading(false)
          return
        }

        setProduct(productData)

        // Check if current user won the auction
        const userWon = await checkIfUserWonAuction(productId, user.id)
        setIsWinner(userWon)

        if (!userWon) {
          // User didn't win - redirect after a delay to show the message
          setTimeout(() => {
            router.push(`/auctions/${productId}`)
          }, 3000)
        }

        checkedPaymentRef.current = productId

      } catch {
        setError('Erreur lors de la vérification des droits d\'accès')
      } finally {
        setIsLoading(false)
        isCheckingRef.current = false
      }
    }

    checkAccess()
  }, [params.id, user, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification des droits d&apos;accès...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <Card className="p-6 text-center">
            <div className="text-red-600 mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/auctions')} variant="outline">
              Retour aux enchères
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (isWinner === false) {
    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <Card className="p-6 text-center">
            <div className="text-yellow-600 mb-4 text-4xl">🚫</div>
            <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-4">
              Vous n&apos;êtes pas le gagnant de cette enchère. Seul le gagnant peut accéder à la page de paiement.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirection en cours...
            </p>
            <Button onClick={() => router.push(`/auctions/${params.id}`)} variant="outline">
              Retour à l&apos;enchère
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Félicitations!</h1>
            <p className="text-gray-600">Vous avez remporté cette enchère</p>
          </div>

          <div className="border rounded-lg p-4 mb-6">
            <div className="flex gap-4">
              <img 
                src={product.image} 
                alt={product.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(product.current_price)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Prochaines étapes:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Procédez au paiement via Stripe</li>
                <li>Recevez la confirmation de paiement</li>
                <li>Le vendeur sera notifié</li>
                <li>Organisez la livraison/récupération</li>
              </ol>
            </div>

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg"
              size="lg"
            >
              💳 Procéder au paiement Stripe
            </Button>

            <Button 
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/auctions/${params.id}`)}
            >
              Retour à l&apos;enchère
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 