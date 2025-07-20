'use server'

import { createClient } from "@/utils/supabase/server"

export async function processPayment(productId: string) {
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

    // 🎭 FAKE PAYMENT PROCESSING
    // In real implementation, this would integrate with Stripe
    // For testing, we just simulate a successful payment

    // Add a small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await (await supabase)
      .from('Payments')
      .update({ 
        status: 'completed',
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

    console.log(`✅ Fake payment completed for product ${productId}`)

    return {
      success: true,
      payment: updatedPayment,
      product: product,
      message: "Paiement effectué avec succès!"
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