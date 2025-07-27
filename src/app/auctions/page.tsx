"use client"

import { useEffect, useState } from "react"
import { getProducts } from "@/app/actions/productActions"
import { AuctionsList } from "./components/AuctionsList"
import { createClient } from "@/utils/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { motion } from "framer-motion"

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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
            <div className="relative mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Chargement des enchères
              </h2>
              <p className="text-gray-600">Découvrez les meilleures offres du moment...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <AuctionsList initialAuctions={auctions} />
} 