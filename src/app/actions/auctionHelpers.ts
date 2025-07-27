'use server'

import { createClient } from "@/utils/supabase/server"

export async function checkIfUserWonAuction(productId: string, userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Get the auction details
    const { data: product, error: productError } = await (await supabase)
      .from('Products')
      .select('id, end_time, current_price, status')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return false
    }

    // Check if auction has ended
    const isEnded = new Date(product.end_time) < new Date() || product.status === 'completed'
    if (!isEnded) {
      return false
    }

    // Get the winning bid (highest bid that matches current price)
    const { data: winningBid, error: bidError } = await (await supabase)
      .from('Bids')
      .select('user_id, bid_amount')
      .eq('product_id', productId)
      .eq('bid_amount', product.current_price)
      .order('created_at', { ascending: true }) // First bid at that price wins
      .limit(1)
      .single()

    if (bidError || !winningBid) {
      return false
    }

    return winningBid.user_id === userId
  } catch {
    return false
  }
}

export async function getAuctionWinner(productId: string): Promise<string | null> {
  const supabase = createClient()

  try {
    // Get the auction details
    const { data: product, error: productError } = await (await supabase)
      .from('Products')
      .select('id, end_time, current_price, status')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return null
    }

    // Check if auction has ended
    const isEnded = new Date(product.end_time) < new Date() || product.status === 'completed'
    if (!isEnded) {
      return null
    }

    // Get the winning bid
    const { data: winningBid, error: bidError } = await (await supabase)
      .from('Bids')
      .select('user_id')
      .eq('product_id', productId)
      .eq('bid_amount', product.current_price)
      .order('created_at', { ascending: true }) // First bid at that price wins
      .limit(1)
      .single()

    if (bidError || !winningBid) {
      return null
    }

    return winningBid.user_id
  } catch {
    return null
  }
}

// Automatically create payment record when auction ends
export async function processAuctionEnd(productId: string): Promise<void> {
  const supabase = createClient()

  try {
    // Get auction details
    const { data: product, error: productError } = await (await supabase)
      .from('Products')
      .select('id, end_time, current_price, status')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.log(`❌ Product not found: ${productId}`)
      return
    }

    // Check if auction has actually ended
    const isEnded = new Date(product.end_time) < new Date() || product.status === 'completed'
    if (!isEnded) {
      console.log(`ℹ️ Auction ${productId} has not ended yet`)
      return
    }

    // Find the winning bid
    const { data: winningBid, error: bidError } = await (await supabase)
      .from('Bids')
      .select('user_id, bid_amount')
      .eq('product_id', productId)
      .eq('bid_amount', product.current_price)
      .order('created_at', { ascending: true }) // First bid at that price wins
      .limit(1)
      .single()

    if (bidError || !winningBid) {
      console.log(`ℹ️ No winning bid found for auction ${productId}`)
      return
    }

    // Check if payment record already exists
    const { data: existingPayment } = await (await supabase)
      .from('Payments')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', winningBid.user_id)
      .single()

    if (existingPayment) {
      console.log(`ℹ️ Payment record already exists for auction ${productId}`)
      return
    }

    // Create payment record for the winner
    const { data: payment, error: paymentError } = await (await supabase)
      .from('Payments')
      .insert([{
        user_id: winningBid.user_id,
        product_id: productId,
        amount: winningBid.bid_amount,
        status: 'pending',
        stripe_intent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (paymentError) {
      console.error(`❌ Failed to create payment record for auction ${productId}:`, paymentError)
      return
    }

    console.log(`✅ Payment record created for auction ${productId}, winner ${winningBid.user_id}, amount ${winningBid.bid_amount}`)

  } catch (error) {
    console.error(`❌ Error processing auction end for ${productId}:`, error)
  }
} 