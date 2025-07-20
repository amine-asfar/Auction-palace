'use server'

import { createClient } from "@/utils/supabase/server"

export interface Review {
  id: string
  user_id: string
  seller_id: string
  product_id: string
  rating: number
  comment: string
  created_at: string
  reviewer_name: string
  reviewer_family_name: string
  product_title: string
}

export interface ReviewableAuction {
  id: string
  product_id: string
  product_title: string
  product_image: string
  seller_id: string
  seller_name: string
  seller_family_name: string
  purchase_price: number
  end_time: string
  can_review: boolean
  already_reviewed: boolean
}





export async function createReview(
  sellerId: string,
  productId: string,
  rating: number,
  comment: string
) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await (await supabase).auth.getUser()
    if (authError || !user) {
      throw new Error("Vous devez être connecté pour laisser un avis")
    }

    // First check if user can review (won the auction and hasn't reviewed yet)
    const canReview = await canUserReview(productId, user.id)
    if (!canReview) {
      throw new Error("Vous n'êtes pas autorisé à laisser un avis pour cette enchère")
    }

    // Create the review
    const { data: review, error } = await (await supabase)
      .from('Reviews')
      .insert([{
        user_id: user.id,
        seller_id: sellerId,
        product_id: productId,
        rating,
        comment
      }])
      .select()
      .single()

    if (error) throw error

    return review
  } catch (error) {
    throw error
  }
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  try {
    const supabase = createClient()

    // Get reviews without problematic joins first
    const { data: reviews, error } = await (await supabase)
      .from('Reviews')
      .select(`
        id,
        user_id,
        seller_id,
        product_id,
        rating,
        comment,
        created_at
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })

    console.log('🔍 Raw reviews for user:', reviews)
    console.log('🔍 Reviews error:', error)

    if (error) throw error

    if (!reviews || reviews.length === 0) {
      console.log('❌ No reviews found for user:', userId)
      return []
    }

    // Process each review and get additional data
    const processedReviews = await Promise.all(
      reviews.map(async (review) => {
        // Get reviewer information
        const { data: reviewerProfile } = await (await supabase)
          .from('UserProfiles')
          .select('name, family_name')
          .eq('user_id', review.user_id)
          .single()

        // Get product information
        const { data: productInfo } = await (await supabase)
          .from('Products')
          .select('title')
          .eq('id', review.product_id)
          .single()

        console.log(`📝 Review ${review.id}:`, {
          reviewer: reviewerProfile,
          product: productInfo,
          rating: review.rating
        })

        return {
          id: review.id,
          user_id: review.user_id,
          seller_id: review.seller_id,
          product_id: review.product_id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          reviewer_name: reviewerProfile?.name || 'Utilisateur',
          reviewer_family_name: reviewerProfile?.family_name || '',
          product_title: productInfo?.title || 'Produit'
        }
      })
    )

    console.log('🎯 Final processed reviews:', processedReviews)
    return processedReviews

  } catch (error) {
    console.error('❌ Error in getUserReviews:', error)
    return []
  }
}

export async function getReviewableAuctions(userId: string): Promise<ReviewableAuction[]> {
  try {
    const supabase = createClient()

    // Get products where the user won the auction
    const { data: wonAuctions, error } = await (await supabase)
      .from('Bids')
      .select(`
        id,
        bid_amount,
        created_at,
        product_id,
        Products!inner (
          id,
          title,
          image,
          current_price,
          end_time,
          status,
          user_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('🔍 wonAuctions raw data:', wonAuctions)
    console.log('🔍 wonAuctions error:', error)

    if (error || !wonAuctions) {
      console.log('❌ No wonAuctions or error:', error)
      return []
    }

    // Filter to only include won auctions and check review status
    const reviewableAuctions: ReviewableAuction[] = []

    for (const bid of wonAuctions) {
      const product = bid.Products as unknown as {
        id: string
        title: string
        image: string
        current_price: number
        end_time: string
        status: string
        user_id: string
      }
      
      // Check if auction has ended and user's bid matches final price (i.e., they won)
      const auctionEnded = new Date(product.end_time) < new Date() || product.status === 'completed'
      const isWinningBid = bid.bid_amount === product.current_price
      
      console.log(`🔍 AUCTION CHECK: ${product.title}`, {
        endTime: product.end_time,
        now: new Date().toISOString(),
        status: product.status,
        auctionEnded,
        userBid: bid.bid_amount,
        currentPrice: product.current_price,
        isWinningBid,
        sellerId: product.user_id
      })
      
      if (auctionEnded && isWinningBid) {
        console.log(`✅ WINNER: ${product.title} - Adding to reviewable auctions`);
        
        // Get seller information from UserProfiles table
        const { data: sellerProfile } = await (await supabase)
          .from('UserProfiles')
          .select('name, family_name')
          .eq('user_id', product.user_id)
          .single()

        console.log(`👤 Seller profile for ${product.title}:`, sellerProfile)

        // Check if user has already reviewed this seller for this product
        const { data: existingReview } = await (await supabase)
          .from('Reviews')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', product.id)
          .single()

        console.log(`📝 Existing review for ${product.title}:`, existingReview)
        
        reviewableAuctions.push({
          id: bid.id,
          product_id: product.id,
          product_title: product.title,
          product_image: product.image,
          seller_id: product.user_id,
          seller_name: sellerProfile?.name || 'Vendeur',
          seller_family_name: sellerProfile?.family_name || '',
          purchase_price: bid.bid_amount,
          end_time: product.end_time,
          can_review: !existingReview,
          already_reviewed: !!existingReview
        })
        
        console.log(`📋 Added auction to reviewable list: ${product.title}`)
      }
    }

    console.log(`🎯 Final reviewableAuctions:`, reviewableAuctions)
    return reviewableAuctions
  } catch (error) {
    console.error('❌ Error in getReviewableAuctions:', error)
    return []
  }
}

export async function canUserReview(productId: string, userId: string): Promise<boolean> {
  try {
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
    
    const product = purchase.products as unknown as {
      id: string
      end_time: string
      current_price: number
      status: string
    }
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
  } catch {
    return false
  }
}

export async function getUserRating(userId: string): Promise<{ averageRating: number, totalReviews: number }> {
  try {
    const supabase = createClient()

    const { data: reviews, error } = await (await supabase)
      .from('Reviews')
      .select('rating')
      .eq('seller_id', userId)

    if (error || !reviews || reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 }
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviews.length
    }
  } catch {
    return { averageRating: 0, totalReviews: 0 }
  }
} 