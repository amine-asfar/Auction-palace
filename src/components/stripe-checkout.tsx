'use client'

import { useState, useEffect } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { getStripe } from '@/lib/stripe'
import { Lock, CreditCard } from 'lucide-react'

interface StripeCheckoutFormProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

function CheckoutForm({ clientSecret, amount, onSuccess, onError }: StripeCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        console.error('Payment failed:', error)
        onError(error.message || 'Le paiement a échoué')
        toast({
          title: "Erreur de paiement",
          description: error.message || "Une erreur est survenue lors du paiement",
          variant: "destructive"
        })
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent)
        
        // Notify our backend that the payment succeeded
        try {
          const response = await fetch('/api/payments/stripe-success', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          })
          
          if (response.ok) {
            console.log('✅ Backend notified of successful payment')
          } else {
            console.warn('⚠️ Failed to notify backend, but payment succeeded')
          }
        } catch (notifyError) {
          console.warn('⚠️ Backend notification failed:', notifyError)
          // Don't fail the whole flow if backend notification fails
        }
        
        toast({
          title: "🎉 Paiement réussi !",
          description: `Votre paiement de ${formatCurrency(amount)} a été traité avec succès.`,
        })
        onSuccess()
      }
    } catch (err) {
      console.error('Payment error:', err)
      onError('Une erreur inattendue est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-800">Informations de paiement</span>
        </div>
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'paypal']
          }}
        />
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 text-lg font-semibold shadow-lg disabled:opacity-50"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Traitement en cours...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Payer {formatCurrency(amount)}
          </>
        )}
      </Button>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Lock className="h-4 w-4" />
          <span>Paiement sécurisé par Stripe</span>
        </div>
      </div>
    </form>
  )
}

interface StripeCheckoutProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

export function StripeCheckout({ clientSecret, amount, onSuccess, onError }: StripeCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripe = await getStripe()
        if (stripe) {
          setStripePromise(Promise.resolve(stripe))
        } else {
          onError('Stripe n\'est pas configuré correctement')
        }
      } catch (error) {
        console.error('Failed to initialize Stripe:', error)
        onError('Impossible d\'initialiser Stripe')
      }
    }

    initializeStripe()
  }, [onError])

  if (!stripePromise) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation du paiement...</p>
        </div>
      </Card>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#4f46e5',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        borderRadius: '8px',
        fontFamily: 'system-ui, sans-serif',
      },
    },
  }

  return (
    <Card className="p-6">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm 
          clientSecret={clientSecret}
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </Card>
  )
} 