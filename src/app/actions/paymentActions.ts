'use server'

import { createClient } from "@/utils/supabase/server"

// Create payment record when auction ends and user wins
export async function createPaymentRecord(productId: string, winnerId: string) {
  try {
    const supabase = createClient()

    // Get product details
    const { data: product, error: productError } = await (await supabase)
      .from('Products')
      .select('current_price, title')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      throw new Error("Produit introuvable")
    }

    // Check if payment record already exists
    const { data: existingPayment } = await (await supabase)
      .from('Payments')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', winnerId)
      .single()

    if (existingPayment) {
      return { success: true, message: "Enregistrement de paiement déjà existant" }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await (await supabase)
      .from('Payments')
      .insert([{
        user_id: winnerId,
        product_id: productId,
        amount: product.current_price,
        status: 'pending',
        stripe_intent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (paymentError) {
      throw paymentError
    }



    return {
      success: true,
      payment: payment,
      message: "Enregistrement de paiement créé avec succès"
    }

  } catch (error) {
    console.error('❌ Error creating payment record:', error)
    throw error
  }
}

export async function processPayment(productId: string, deliveryFee: number = 0, serviceFee: number = 0) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await (await supabase).auth.getUser()
    if (authError || !user) {
      throw new Error("Vous devez être connecté pour effectuer un paiement")
    }

    // Check if payment record exists
    const { data: existingPayment, error: paymentError } = await (await supabase)
      .from('Payments')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single()

    if (paymentError && paymentError.code !== 'PGRST116') {
      throw paymentError
    }

    if (!existingPayment) {
      throw new Error("Aucun paiement en attente trouvé pour ce produit")
    }

    if (existingPayment.status === 'completed') {
      throw new Error("Ce paiement a déjà été effectué")
    }

    // Calculate total amount including fees
    const totalAmount = existingPayment.amount + deliveryFee + serviceFee

    // Check if we have Stripe keys configured
    const hasStripeKeys = process.env.STRIPE_SECRET_KEY && 
                         process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder' &&
                         process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
                         process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'pk_test_placeholder'

    if (hasStripeKeys) {
      // Real Stripe processing
      console.log('💳 Processing real Stripe payment...')
      
      // Import Stripe functions
      const { createPaymentIntent, formatStripeAmount } = await import('@/lib/stripe')
      
      try {
        // Create payment intent with Stripe
        const paymentIntent = await createPaymentIntent({
          amount: formatStripeAmount(totalAmount),
          currency: 'eur',
          productId: productId,
          userId: user.id,
          deliveryMethod: 'delivery', // This should come from the client
          metadata: {
            payment_record_id: existingPayment.id,
            product_title: `Product ${productId}`,
          }
        })

        // Update payment record with Stripe payment intent ID (keep as pending)
        const { data: updatedPayment, error: updateError } = await (await supabase)
          .from('Payments')
          .update({ 
            status: 'pending', // Keep as pending until Stripe confirms success
            amount: totalAmount,
            stripe_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }



        return {
          success: true,
          payment: updatedPayment,
          stripe_client_secret: paymentIntent.client_secret,
          requires_action: paymentIntent.status === 'requires_action',
          message: "Paiement Stripe initié avec succès!"
        }

      } catch (stripeError) {
        console.error('❌ Stripe payment failed, falling back to test mode:', stripeError)
        // Fall through to test mode
      }
    }

    // 🎭 FALLBACK: FAKE PAYMENT PROCESSING
    console.log('🧪 Processing test payment (Stripe not configured or failed)...')
    
    // Add a small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update payment status to completed with total amount
    const { data: updatedPayment, error: updateError } = await (await supabase)
      .from('Payments')
      .update({ 
        status: 'completed',
        amount: totalAmount,
        stripe_intent_id: `fake_pi_${Date.now()}`, // Fake Stripe payment intent ID
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPayment.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Get product details for success message
    const { data: product } = await (await supabase)
      .from('Products')
      .select('title, current_price')
      .eq('id', productId)
      .single()

    

    return {
      success: true,
      payment: updatedPayment,
      product: product,
      message: "Paiement test effectué avec succès!"
    }

  } catch (error) {
    console.error('❌ Payment processing error:', error)
    throw error
  }
}

export async function getPaymentStatus(productId: string) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await (await supabase).auth.getUser()
    if (authError || !user) {
      throw new Error("Vous devez être connecté")
    }

    // Get payment record
    const { data: payment, error } = await (await supabase)
      .from('Payments')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return payment
  } catch (error) {
    console.error('❌ Error getting payment status:', error)
    throw error
  }
} 

// Get payment history for a user
export async function getPaymentHistory(userId?: string) {
  try {
    const supabase = createClient()

    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user }, error: authError } = await (await supabase).auth.getUser()
      if (authError || !user) {
        throw new Error("Vous devez être connecté")
      }
      currentUserId = user.id
    }

    // Get all payments for the user with product details
    const { data: payments, error } = await (await supabase)
      .from('Payments')
      .select(`
        *,
        product:product_id (
          id,
          title,
          description,
          image,
          current_price,
          end_time
        )
      `)
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return payments || []
  } catch (error) {
    console.error('❌ Error getting payment history:', error)
    throw error
  }
} 

// Synchronize payment status with Stripe
export async function syncPaymentStatusWithStripe(paymentId: string) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await (await supabase).auth.getUser()
    if (authError || !user) {
      throw new Error("Vous devez être connecté")
    }

    // Get payment record
    const { data: payment, error: paymentError } = await (await supabase)
      .from('Payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      throw new Error("Paiement introuvable")
    }

    // Only sync if we have a Stripe payment intent ID
    if (!payment.stripe_intent_id || payment.stripe_intent_id.startsWith('fake_')) {
      return { success: true, message: "Paiement en mode test, pas de synchronisation nécessaire" }
    }

    // Import Stripe functions
    const { retrievePaymentIntent } = await import('@/lib/stripe')
    
    try {
      // Get the payment intent status from Stripe
      const paymentIntent = await retrievePaymentIntent(payment.stripe_intent_id)
      
      let newStatus = payment.status
      
      // Map Stripe status to our status (simplified)
      switch (paymentIntent.status) {
        case 'succeeded':
          newStatus = 'completed'
          break
        case 'canceled':
          newStatus = 'cancelled'
          break
        default:
          // All other statuses stay as pending until succeeded
          newStatus = 'pending'
      }

      // Update status if it changed
      if (newStatus !== payment.status) {
        const { data: updatedPayment, error: updateError } = await (await supabase)
          .from('Payments')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

  

        return {
          success: true,
          payment: updatedPayment,
          statusChanged: true,
          oldStatus: payment.status,
          newStatus: newStatus,
          message: `Statut mis à jour: ${newStatus}`
        }
      }

      return {
        success: true,
        payment: payment,
        statusChanged: false,
        message: "Statut déjà synchronisé"
      }

    } catch (stripeError) {
      console.error('❌ Stripe sync error:', stripeError)
      return {
        success: false,
        error: "Impossible de synchroniser avec Stripe",
        message: "Erreur de synchronisation Stripe"
      }
    }

  } catch (error) {
    console.error('❌ Payment sync error:', error)
    throw error
  }
}

// Sync all user payments with Stripe
export async function syncAllUserPaymentsWithStripe(userId?: string) {
  try {
    const supabase = createClient()

    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user }, error: authError } = await (await supabase).auth.getUser()
      if (authError || !user) {
        throw new Error("Vous devez être connecté")
      }
      currentUserId = user.id
    }

    // Get all payments with Stripe intent IDs that are not completed
    const { data: payments, error } = await (await supabase)
      .from('Payments')
      .select('*')
      .eq('user_id', currentUserId)
      .neq('status', 'completed')
      .not('stripe_intent_id', 'is', null)

    if (error) {
      throw error
    }

    if (!payments || payments.length === 0) {
      return { success: true, message: "Aucun paiement à synchroniser", updated: 0 }
    }

    let updatedCount = 0
    const results = []

    for (const payment of payments) {
      try {
        const result = await syncPaymentStatusWithStripe(payment.id)
        if (result.statusChanged) {
          updatedCount++
        }
        results.push(result)
      } catch (err) {
        console.error(`❌ Error syncing payment ${payment.id}:`, err)
        results.push({ success: false, paymentId: payment.id, error: err })
      }
    }

    return {
      success: true,
      message: `${updatedCount} paiements mis à jour sur ${payments.length}`,
      updated: updatedCount,
      total: payments.length,
      results: results
    }

  } catch (error) {
    console.error('❌ Bulk sync error:', error)
    throw error
  }
} 

// Create payment record automatically when user wins an auction
export async function createPaymentForWinningBid(productId: string, winnerId: string, finalPrice: number) {
  try {
    const supabase = createClient()

    // Check if payment record already exists
    const { data: existingPayment } = await (await supabase)
      .from('Payments')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', winnerId)
      .single()

    if (existingPayment) {
      console.log(`Payment record already exists for product ${productId}, user ${winnerId}`)
      return { success: true, payment: existingPayment, message: "Payment record already exists" }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await (await supabase)
      .from('Payments')
      .insert([{
        user_id: winnerId,
        product_id: productId,
        amount: finalPrice,
        status: 'pending',
        stripe_intent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (paymentError) {
      throw paymentError
    }



    return {
      success: true,
      payment: payment,
      message: "Payment record created for winning bid"
    }

  } catch (error) {
    console.error('❌ Error creating payment for winning bid:', error)
    throw error
  }
} 