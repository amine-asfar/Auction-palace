"use server"

import { createClient } from "@/utils/supabase/server"

export interface ProductData {
  title: string
  description: string
  starting_price: number
  category_id: string
  status?: string
  start_time: string
  end_time: string
  user_id: string
  image: string
  min_bid_increment?: number
}

export interface ProductFilters {
  category_id?: string
  status?: string
  priceMin?: number
  priceMax?: number
}

export async function getProducts(filters: ProductFilters = {}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("Products")
    .select("*")
  
  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id)
  }
  if (filters.status) {
    query = query.eq("status", filters.status)
  }
  if (filters.priceMin !== undefined) {
    query = query.gte("current_price", filters.priceMin)
  }
  if (filters.priceMax !== undefined) {
    query = query.lte("current_price", filters.priceMax)
  }
  
  const { data: products, error } = await query.order("created_at", { ascending: false })
  
  if (error) {
    console.error("Error fetching products:", error)
    return null
  }
  
  return products
}

export async function getProductById(id: string) {
  const supabase = await createClient()
  
  const { data: product, error } = await supabase
    .from("Products")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching product:", error)
    return null
  }
  
  return product
}

export async function createProduct(productData: ProductData) {
  const supabase = await createClient()
  
  const { data: product, error } = await supabase
    .from("Products")
    .insert([{
      ...productData,
      current_price: productData.starting_price,
      status: productData.status || "active",
      featured: false,
      min_bid_increment: productData.min_bid_increment || Math.ceil(productData.starting_price * 0.1) // Use custom value or calculate 10% of starting price
    }])
    .select()
  
  if (error) {
    console.error("Error creating product:", error)
    return null
  }
  
  return product
}

export async function updateProduct(productId: string, data: Partial<ProductData>) {
  const supabase = await createClient()
  
  const { data: product, error } = await supabase
    .from("Products")
    .update(data)
    .eq("id", productId)
    .select()
  
  if (error) {
    console.error("Error updating product:", error)
    return null
  }
  
  return product
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("Products")
    .delete()
    .eq("id", productId)
    .select()
  
  if (error) {
    console.error("Error deleting product:", error)
    return null
  }
  
  return data
}
