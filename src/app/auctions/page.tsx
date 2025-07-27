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
  end_time?: string // ✅ Important pour le filtrage des enchères expirées
  featured?: boolean
  bids_count?: number
  status?: string // ✅ Ajout du statut pour le filtrage en temps réel
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
        // ✅ Récupérer seulement les enchères actives (exclut automatiquement les "completed")
        const initialAuctions = await getProducts()
        setAuctions(initialAuctions || [])
      } catch {
        // Error loading auctions
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
        // Subscribe to product changes (for current price updates AND new products)
        productChannel = supabase
          .channel('products-updates')
          .on(
            'postgres_changes',
            {
              event: 'INSERT', // ✅ Écouter les nouvelles enchères
              schema: 'public',
              table: 'Products'
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newProduct = payload.new as any
                
                // Vérifier si la nouvelle enchère doit être affichée (pas expirée, pas completed)
                const isActive = newProduct.status !== 'completed' && new Date(newProduct.end_time) > new Date()
                
                if (isActive) {
                  setAuctions(prevAuctions => [newProduct, ...prevAuctions])
                }
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'Products'
            },
            (payload) => {
              if (payload.eventType === 'UPDATE') {
                const updatedProduct = payload.new as ProductUpdate
                
                // ✅ Si l'enchère est devenue "completed" OU si elle a expiré, la retirer de la liste
                const isExpired = updatedProduct.end_time && new Date(updatedProduct.end_time) < new Date()
                const isCompleted = updatedProduct.status === 'completed'
                
                if (isCompleted || isExpired) {
                  setAuctions(prevAuctions => 
                    prevAuctions.filter(auction => auction.id !== updatedProduct.id)
                  )
                } else {
                  // Sinon, mettre à jour le prix
                  setAuctions(prevAuctions => 
                    prevAuctions.map(auction => 
                      auction.id === updatedProduct.id 
                        ? { 
                            ...auction, 
                            current_price: updatedProduct.current_price,
                            end_time: updatedProduct.end_time ? new Date(updatedProduct.end_time) : auction.end_time
                          }
                        : auction
                    )
                  )
                }
              }
            }
          )

        await productChannel.subscribe(() => {
          // Channel subscribed
        })

      } catch {
        // Real-time connection failed
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