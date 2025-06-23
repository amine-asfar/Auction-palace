import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getBids } from '@/app/actions/bidActions'

export interface RealtimeBid {
  id: string
  user_id: string
  bid_amount: number
  created_at: string
  product_id: string
}

export interface RealtimeProduct {
  id: string
  current_price: number
  status: string
}

export function useRealtimeBids(productId: string) {
  const [bids, setBids] = useState<RealtimeBid[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const initialBids = await getBids(productId)
      if (initialBids) {
        setBids(initialBids)
        // Set current price to the highest bid amount
        if (initialBids.length > 0) {
          const highestBid = Math.max(...initialBids.map(bid => bid.bid_amount))
          setCurrentPrice(highestBid)
        }
        // If no bids, the current price will be set by the product channel or remain at 0
      }
    } catch (err) {
      console.error('Error loading initial bids:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bids')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    let bidsChannel: RealtimeChannel
    let productChannel: RealtimeChannel
    let reconnectTimer: NodeJS.Timeout

    const setupRealtime = async () => {
      try {
        console.log('Setting up real-time connection for product:', productId)
        
        // Subscribe to bids changes
        bidsChannel = supabase
          .channel(`bids-${productId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Bids',
              filter: `product_id=eq.${productId}`
            },
            async (payload) => {
              console.log('Bid change received:', payload)
              
              if (payload.eventType === 'INSERT') {
                const newBid = payload.new as RealtimeBid
                setBids(prevBids => {
                  // Check if bid already exists to avoid duplicates
                  const exists = prevBids.some(bid => bid.id === newBid.id)
                  if (exists) return prevBids
                  
                  // Add new bid and sort by creation time (newest first)
                  const updatedBids = [newBid, ...prevBids].sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  
                  // Update current price to the highest bid
                  if (updatedBids.length > 0) {
                    const highestBid = Math.max(...updatedBids.map(bid => bid.bid_amount))
                    setCurrentPrice(highestBid)
                  }
                  
                  return updatedBids
                })
              } else if (payload.eventType === 'DELETE') {
                const deletedBid = payload.old as RealtimeBid
                setBids(prevBids => {
                  const updatedBids = prevBids.filter(bid => bid.id !== deletedBid.id)
                  
                  // Update current price to the highest remaining bid
                  if (updatedBids.length > 0) {
                    const highestBid = Math.max(...updatedBids.map(bid => bid.bid_amount))
                    setCurrentPrice(highestBid)
                  }
                  
                  return updatedBids
                })
              }
            }
          )

        // Subscribe to product changes (for current price updates)
        productChannel = supabase
          .channel(`product-${productId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'Products',
              filter: `id=eq.${productId}`
            },
            (payload) => {
              console.log('Product change received:', payload)
              
              if (payload.eventType === 'UPDATE') {
                const updatedProduct = payload.new as RealtimeProduct
                setCurrentPrice(updatedProduct.current_price)
              }
            }
          )

        // Subscribe to channels
        await bidsChannel.subscribe((status) => {
          console.log('Bids channel status:', status)
          setIsConnected(status === 'SUBSCRIBED')
          
          if (status === 'SUBSCRIBED') {
            console.log('Successfully connected to bids real-time channel')
          }
          
          // If connection is lost, try to reconnect after 5 seconds
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('Connection lost, attempting to reconnect...')
            reconnectTimer = setTimeout(() => {
              setupRealtime()
            }, 5000)
          }
        })

        await productChannel.subscribe((status) => {
          console.log('Product channel status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully connected to product real-time channel')
          }
        })

      } catch (err) {
        console.error('Error setting up real-time connection:', err)
        setError(err instanceof Error ? err.message : 'Failed to connect to real-time updates')
        setIsConnected(false)
      }
    }

    setupRealtime()

    // Cleanup function
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (bidsChannel) {
        supabase.removeChannel(bidsChannel)
      }
      if (productChannel) {
        supabase.removeChannel(productChannel)
      }
    }
  }, [productId, supabase])

  return {
    bids,
    currentPrice,
    isConnected,
    isLoading,
    error,
    setBids, // Allow manual updates when needed
    setCurrentPrice, // Allow manual updates when needed
    refetch: loadInitialData // Allow manual refetch
  }
} 