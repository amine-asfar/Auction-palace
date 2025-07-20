'use server'
import { createClient } from "@/utils/supabase/server"

export async function placeBid(productId: string, userId: string, bid_amount: number) {
  if (bid_amount > 99999999.99) {
    throw new Error('Le montant de l\'enchère ne peut pas dépasser 99,999,999.99€')
  }

  const supabase = createClient()
  
  // Get the latest product data to check current price
  const productRes = await (await supabase)
    .from('Products')
    .select('current_price, starting_price')
    .eq('id', productId)
    .single()
    
  if (productRes.error) throw productRes.error
  
  const currentPrice = productRes.data.current_price
  const startingPrice = productRes.data.starting_price
  
  // Validate bid amount
  if (bid_amount <= currentPrice) {
    throw new Error(`L'enchère doit être supérieure à ${currentPrice}€`)
  }
  
  // Check if this is the first bid (should be at least starting price)
  if (currentPrice === startingPrice && bid_amount < startingPrice) {
    throw new Error(`La première enchère doit être au moins égale au prix de départ (${startingPrice}€)`)
  }
  
  // Insert the bid
  const { data: bid, error: bidError } = await (await supabase)
    .from('Bids')
    .insert([{ 
      product_id: productId, 
      user_id: userId, 
      bid_amount 
    }])
    .select()
    
  if (bidError) throw bidError
  
  // Update the product's current price
  const { data: updatedProduct, error: updateError } = await (await supabase)
    .from('Products')
    .update({ current_price: bid_amount })
    .eq('id', productId)
    .select()
    
  if (updateError) throw updateError
  
  return { bid: bid[0], updatedProduct: updatedProduct[0] }
}

export async function getBids(productId: string) {
  const supabase = createClient()
  
  // First, let's try a simpler approach and fetch the data separately
  const { data: bids, error: bidError } = await (await supabase)
    .from('Bids')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  
  if (bidError) throw bidError
  
  if (!bids || bids.length === 0) return []
  
  // Get all unique user IDs
  const userIds = [...new Set(bids.map(bid => bid.user_id))]
  
  // Fetch user profiles separately
  const { data: profiles, error: profileError } = await (await supabase)
    .from('UserProfiles')
    .select('user_id, name, family_name')
    .in('user_id', userIds)
  
  if (profileError) {
    // Return bids without profiles if profile fetch fails
    return bids.map(bid => ({ ...bid, UserProfiles: null }))
  }
  
  // Combine bids with their user profiles
  const bidsWithProfiles = bids.map(bid => {
    const userProfile = profiles?.find(profile => profile.user_id === bid.user_id)
    return {
      ...bid,
      UserProfiles: userProfile ? [userProfile] : null
    }
  })
  
  return bidsWithProfiles
}

export async function GetHistoriqueAchats(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await (await supabase)
    .from('Bids')
    .select(`
      *,
      products:product_id (
        id,
        title,
        description,
        image,
        starting_price,
        current_price,
        end_time,
        status,
        user_id,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  const purchaseHistory = data?.filter(bid => {
    const product = bid.products
    const isAuctionEnded = new Date(product.end_time) < new Date()
    const isWinningBid = bid.bid_amount === product.current_price
    const isAuctionCompleted = product.status === 'completed' || isAuctionEnded
    
    return isAuctionCompleted && isWinningBid
  }) || []
  
  // Get review information for each purchase
  const purchaseHistoryWithReviews = await Promise.all(
    purchaseHistory.map(async (bid) => {
      // Check if user has already reviewed this product
      const { data: review } = await (await supabase)
        .from('Reviews')
        .select('id, rating, comment, created_at')
        .eq('product_id', bid.product_id)
        .eq('user_id', userId)
        .single()
      
      return {
        id: bid.id,
        product_id: bid.product_id,
        product_title: bid.products.title,
        product_description: bid.products.description,
        product_image: bid.products.image,
        purchase_price: bid.bid_amount,
        purchase_date: bid.created_at,
        auction_end_date: bid.products.end_time,
        product_status: bid.products.status,
        seller_id: bid.products.user_id,
        payment_status: 'pending',
        delivery_status: 'pending',
        has_reviewed: !!review,
        review: review || null
      }
    })
  )
  
  return purchaseHistoryWithReviews
}
  