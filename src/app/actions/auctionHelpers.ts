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