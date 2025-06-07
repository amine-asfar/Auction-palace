'use server'
import { createClient } from "@/utils/supabase/server"

export type ProductData = {
  title: string
  description: string
  starting_price: number
  category_id: string
  start_time: string
  end_time: string
  user_id: string
}

export async function createProduct(data: ProductData) {
  const supabase = createClient()
  const { data: product, error } = await (await supabase)
    .from('Products')
    .insert([
      {
        title: data.title,
        description: data.description,
        starting_price: data.starting_price,
        current_price: data.starting_price,
        category_id: data.category_id,
        status: 'pending',
        start_time: data.start_time,
        end_time: data.end_time,
        user_id: data.user_id
      }
    ])
  if (error) throw error
  return product
}

export async function updateProduct(productId: string, data: Partial<ProductData>) {
  const supabase = createClient()
  const { data: product, error } = await (await supabase)
    .from('Products')
    .update(data)
    .eq('id', productId)
  if (error) throw error
  return product
}

export async function deleteProduct(productId: string) {
  const supabase = createClient()
  const { data, error } = await (await supabase)
    .from('Products')
    .delete()
    .eq('id', productId)
  if (error) throw error
  return data
}

export async function getProducts(filters?: {
  category_id?: string
  status?: string
  priceMin?: number
  priceMax?: number
}) {
  const supabase = createClient()
  let query = (await supabase).from('Products').select('*')
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priceMin !== undefined) query = query.gte('current_price', filters.priceMin)
  if (filters?.priceMax !== undefined) query = query.lte('current_price', filters.priceMax)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProductById(productId: string) {
  const supabase = createClient()
  const { data, error } = await (await supabase)
    .from('Products')
    .select('*')
    .eq('id', productId)
    .single()
  if (error) throw error
  return data
}
