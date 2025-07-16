'use server'

import { createClient } from "@/utils/supabase/server"
import { z } from 'zod'

// Schema for review validation
const reviewSchema = z.object({
  product_id: z.string().min(1, "Product ID is required"),
  user_id: z.string().min(1, "User ID is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().min(1, "Review comment is required").max(1000, "Review comment cannot exceed 1000 characters"),
  seller_id: z.string().min(1, "Seller ID is required")
})

export type ReviewData = z.infer<typeof reviewSchema>

export async function createReview(reviewData: ReviewData) {
  const supabase = createClient()
  
  // Validate the data using the schema
  const validatedData = reviewSchema.parse(reviewData)
  
  // Check if user has already reviewed this product
  const { data: existingReview, error: checkError } = await (await supabase)
    .from('Reviews')
    .select('id')
    .eq('product_id', validatedData.product_id)
    .eq('user_id', validatedData.user_id)
    .single()
  
  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw checkError
  }
  
  if (existingReview) {
    throw new Error('You have already reviewed this product')
  }
  
  // Create the review
  const { data, error } = await (await supabase)
    .from('Reviews')
    .insert([validatedData])
    .select()
  
  if (error) throw error
  return data
}

export async function updateReview(reviewId: string, reviewData: Partial<ReviewData>) {
  const supabase = createClient()
  
  const { data, error } = await (await supabase)
    .from('Reviews')
    .update(reviewData)
    .eq('id', reviewId)
    .select()
  
  if (error) throw error
  return data
}

export async function deleteReview(reviewId: string, userId: string) {
  const supabase = createClient()
  
  // Only allow users to delete their own reviews
  const { data, error } = await (await supabase)
    .from('Reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId)
    .select()
  
  if (error) throw error
  return data
}

export async function getProductReviews(productId: string) {
  const supabase = createClient()
  
  const { data, error } = await (await supabase)
    .from('Reviews')
    .select(`
      *,
      users:user_id (
        id,
        email,
        name,
        family_name
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getUserReview(productId: string, userId: string) {
  const supabase = createClient()
  
  const { data, error } = await (await supabase)
    .from('Reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getSellerReviews(sellerId: string) {
  const supabase = createClient()
  
  const { data, error } = await (await supabase)
    .from('Reviews')
    .select(`
      *,
      products:product_id (
        id,
        title,
        image
      ),
      users:user_id (
        id,
        name,
        family_name
      )
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function canUserReview(productId: string, userId: string) {
  const supabase = createClient()
  
  // Check if user has purchased this product (won the auction)
  const { data: purchase, error: purchaseError } = await (await supabase)
    .from('Bids')
    .select(`
      *,
      products:product_id (
        id,
        end_time,
        current_price,
        status
      )
    `)
    .eq('product_id', productId)
    .eq('user_id', userId)
    .order('bid_amount', { ascending: false })
    .limit(1)
    .single()
  
  if (purchaseError && purchaseError.code !== 'PGRST116') throw purchaseError
  
  if (!purchase) return false
  
  const product = purchase.products
  const isAuctionEnded = new Date(product.end_time) < new Date()
  const isWinningBid = purchase.bid_amount === product.current_price
  const isAuctionCompleted = product.status === 'completed' || isAuctionEnded
  
  // Check if user has already reviewed
  const { data: existingReview, error: reviewError } = await (await supabase)
    .from('Reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .single()
  
  if (reviewError && reviewError.code !== 'PGRST116') throw reviewError
  
  return isAuctionCompleted && isWinningBid && !existingReview
} 