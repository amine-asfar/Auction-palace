"use client"

import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { manuallyProcessEndedAuctions } from "@/app/actions/debugActions"

export default function DebugReviews() {
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const fetchDebugData = async () => {
    if (!user) return
    
    setLoading(true)
    const supabase = createClient()
    
    try {
      // Get all user bids with products
      const { data: bids, error: bidsError } = await supabase
        .from('Bids')
        .select(`
          id,
          bid_amount,
          created_at,
          product_id,
          Products (
            id,
            title,
            current_price,
            end_time,
            status,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Get all user reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('Reviews')
        .select('*')
        .eq('user_id', user.id)

      // Get all payments for this user
      const { data: payments, error: paymentsError } = await supabase
        .from('Payments')
        .select('*')
        .eq('user_id', user.id)

      setData({
        bids,
        bidsError,
        reviews,
        reviewsError,
        payments,
        paymentsError,
        currentTime: new Date().toISOString()
      })
    } catch (error) {
      console.error('Debug error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [user])

  if (!user) {
    return <div className="p-8">Please log in to view debug info</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Review System Debug</h1>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={fetchDebugData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
        
        <button 
          onClick={async () => {
            setProcessing(true)
            try {
              const result = await manuallyProcessEndedAuctions()
              alert(`Processed ${result.processed} auctions. Check console for details.`)
              console.log('Manual processing result:', result)
              await fetchDebugData() // Refresh after processing
            } catch (error) {
              alert('Error processing auctions: ' + (error instanceof Error ? error.message : 'Unknown error'))
            } finally {
              setProcessing(false)
            }
          }}
          disabled={processing}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Process Ended Auctions'}
        </button>
      </div>

      {data && (
        <div className="space-y-8">
          {/* Current Time */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold">Current Time</h2>
            <p>{data.currentTime}</p>
          </div>

          {/* User Bids */}
          <div className="bg-blue-50 p-4 rounded">
            <h2 className="font-bold text-lg mb-4">Your Bids ({data.bids?.length || 0})</h2>
            {data.bidsError && <p className="text-red-600">Error: {data.bidsError.message}</p>}
            
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.bids?.map((bid: any) => {
              const product = bid.Products
              const auctionEnded = new Date(product.end_time) < new Date() || product.status === 'completed'
              const isWinning = bid.bid_amount === product.current_price
              
              return (
                <div key={bid.id} className="border p-3 mb-3 rounded bg-white">
                  <h3 className="font-semibold">{product.title}</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Your bid:</span> €{bid.bid_amount}</p>
                    <p><span className="font-medium">Current price:</span> €{product.current_price}</p>
                    <p><span className="font-medium">End time:</span> {product.end_time}</p>
                    <p><span className="font-medium">Status:</span> {product.status}</p>
                    <p><span className="font-medium">Auction ended:</span> {auctionEnded ? '✅ Yes' : '❌ No'}</p>
                    <p><span className="font-medium">Winning bid:</span> {isWinning ? '🎉 YES!' : '❌ No'}</p>
                    {auctionEnded && isWinning && (
                      <p className="text-green-600 font-bold">🏆 YOU WON THIS AUCTION!</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* User Reviews */}
          <div className="bg-green-50 p-4 rounded">
            <h2 className="font-bold text-lg mb-4">Your Reviews ({data.reviews?.length || 0})</h2>
            {data.reviewsError && <p className="text-red-600">Error: {data.reviewsError.message}</p>}
            
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.reviews?.map((review: any) => (
              <div key={review.id} className="border p-3 mb-3 rounded bg-white">
                <p><span className="font-medium">Product:</span> {review.product_id}</p>
                <p><span className="font-medium">Seller:</span> {review.seller_id}</p>
                <p><span className="font-medium">Rating:</span> {review.rating}/5</p>
                <p><span className="font-medium">Comment:</span> {review.comment}</p>
                <p><span className="font-medium">Date:</span> {review.created_at}</p>
              </div>
            ))}
          </div>

          {/* User Payments */}
          <div className="bg-yellow-50 p-4 rounded">
            <h2 className="font-bold text-lg mb-4">Your Payments ({data.payments?.length || 0})</h2>
            {data.paymentsError && <p className="text-red-600">Error: {data.paymentsError.message}</p>}
            
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.payments?.map((payment: any) => (
              <div key={payment.id} className="border p-3 mb-3 rounded bg-white">
                <p><span className="font-medium">Product:</span> {payment.product_id}</p>
                <p><span className="font-medium">Amount:</span> €{payment.amount}</p>
                <p><span className="font-medium">Status:</span> {payment.status}</p>
                <p><span className="font-medium">Created:</span> {payment.created_at}</p>
              </div>
            ))}
          </div>

          {/* Raw Data */}
          <details className="bg-gray-50 p-4 rounded">
            <summary className="font-bold cursor-pointer">Raw Data (Click to expand)</summary>
            <pre className="mt-4 text-xs overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
} 