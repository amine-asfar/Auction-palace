'use server'
import { createClient } from "@/utils/supabase/server"

export async function placeBid(productId: string, userId: string, bid_amount: number) {
  const supabase = createClient()
  const productRes = await (await supabase)
    .from('Products')
    .select('current_price')
    .eq('id', productId)
    .single()
  if (productRes.error) throw productRes.error
  if (bid_amount <= productRes.data.current_price) throw new Error('Bid must be higher than current price')
  const { data: bid, error: bidError } = await (await supabase)
    .from('Bids')
    .insert([{ product_id: productId, user_id: userId, bid_amount }])
  if (bidError) throw bidError
  const { data: updatedProduct, error: updateError } = await (await supabase)
    .from('Products')
    .update({ current_price: bid_amount })
    .eq('id', productId)
  if (updateError) throw updateError
  return { bid, updatedProduct }
}

export async function getBids(productId: string) {
  const supabase = createClient()
  const { data, error } = await (await supabase)
    .from('Bids')
    .select('*')
    .eq('product_id', productId)
  if (error) throw error
  return data
}
