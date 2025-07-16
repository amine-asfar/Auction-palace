"use client"

import { useEffect, useState } from "react"
import { getProducts } from "@/app/actions/productActions"
import { AuctionsList } from "./components/AuctionsList"
import { createClient } from "@/utils/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"

interface Auction {
  id: string
  title: string
  description: string
  current_price: number
  starting_price: number
  image: string
  end_time: Date
  featured?: boolean
  bids_count?: number
}

interface ProductUpdate {
  id: string
  current_price: number
  title?: string
  description?: string
  image?: string
  starting_price?: number
  end_time?: string
  featured?: boolean
  bids_count?: number
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Load initial data
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setIsLoading(true)
        const initialAuctions = await getProducts()
        setAuctions(initialAuctions || [])
      } catch (error) {
        console.error('Error loading auctions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAuctions()
  }, [])

  // Set up real-time updates for product changes
  useEffect(() => {
    let productChannel: RealtimeChannel

    const setupRealtime = async () => {
      try {
        // Subscribe to product changes (for current price updates)
        productChannel = supabase
          .channel('products-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'Products'
            },
            (payload) => {
              console.log('Product update received:', payload)
              
              if (payload.eventType === 'UPDATE') {
                const updatedProduct = payload.new as ProductUpdate
                setAuctions(prevAuctions => 
                  prevAuctions.map(auction => 
                    auction.id === updatedProduct.id 
                      ? { ...auction, current_price: updatedProduct.current_price }
                      : auction
                  )
                )
              }
            }
          )

        await productChannel.subscribe((status) => {
          console.log('Products channel status:', status)
        })

      } catch (err) {
        console.error('Error setting up real-time connection:', err)
      }
    }

    setupRealtime()

    // Cleanup function
    return () => {
      if (productChannel) {
        supabase.removeChannel(productChannel)
      }
    }
  }, [supabase])

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des enchères...</p>
          </div>
        </div>
      </div>
    )
  }

  return <AuctionsList initialAuctions={auctions} />
} 