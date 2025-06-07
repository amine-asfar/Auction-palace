"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Clock, Heart, MessageSquare, Share2, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getProductById } from "@/app/actions/productActions"
import { getBids, placeBid as placeBidAction } from "@/app/actions/bidActions"

// Types
interface Bid {
  id: string
  user_id: string
  bid_amount: number
  created_at: string
}

interface Seller {
  id: string
  name: string
  rating: number
  sales: number
  joined: string
  image: string
}

interface Specification {
  name: string
  value: string
}

interface SimilarItem {
  id: string
  title: string
  image: string
  price: number
}

interface AuctionData {
  id: string
  title: string
  description: string
  images: string[]
  current_price: number
  starting_price: number
  min_bid_increment: number
  end_time: Date
  seller: Seller
  specifications: Specification[]
  similarItems: SimilarItem[]
}

export default function AuctionDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [bidAmount, setBidAmount] = useState<string>("")
  const [auctionEnded, setAuctionEnded] = useState<boolean>(false)
  const [auction, setAuction] = useState<AuctionData | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAuctionData = async () => {
      try {
        const auctionData = await getProductById(params.id as string)
        const bidsData = await getBids(params.id as string)
        
        if (!auctionData) {
          setError("Enchère introuvable")
          setIsLoading(false)
          return
        }
        
        setAuction({
          ...auctionData,
          images: [auctionData.image], // For now, we only have one image
          min_bid_increment: auctionData.min_bid_increment || Math.ceil(auctionData.starting_price * 0.1), // Use DB value or calculate
          seller: {
            id: auctionData.user_id,
            name: "Vendeur", // This should come from the user table
            rating: 4.9,
            sales: 156,
            joined: "Mars 2018",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop",
          },
          specifications: [], // This should come from a specifications table
          similarItems: [], // This should come from a recommendation system
        })
        setBids(bidsData || [])
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading auction:", err)
        setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'enchère")
        setIsLoading(false)
      }
    }
    
    loadAuctionData()
  }, [params.id])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const updateTimeLeft = () => {
    if (!auction) return
    
    const now = new Date()
    const endTime = new Date(auction.end_time)
    const diff = endTime.getTime() - now.getTime()
    
    if (diff <= 0) {
      setTimeLeft("Enchère terminée")
      setAuctionEnded(true)
      return
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    let timeString = ""
    if (days > 0) timeString += `${days}j `
    if (hours > 0) timeString += `${hours}h `
    if (minutes > 0) timeString += `${minutes}m `
    timeString += `${seconds}s`
    
    setTimeLeft(timeString)
  }

  useEffect(() => {
    const timer = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [auction])

  const handleBid = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour enchérir",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!auction || !bidAmount) return

    const amount = parseFloat(bidAmount)
    if (isNaN(amount)) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive",
      })
      return
    }

    if (amount <= auction.current_price) {
      toast({
        title: "Montant trop bas",
        description: `L&apos;enchère doit être supérieure à ${formatCurrency(auction.current_price)}`,
        variant: "destructive",
      })
      return
    }

    if (amount < auction.current_price + auction.min_bid_increment) {
      toast({
        title: "Montant trop bas",
        description: `L&apos;enchère minimum est de ${formatCurrency(auction.current_price + auction.min_bid_increment)}`,
        variant: "destructive",
      })
      return
    }

    try {
      await placeBidAction(auction.id, user.id, amount)
      
      // Update local state
      const newBid = {
        id: Date.now().toString(),
        user_id: user.id,
        bid_amount: amount,
        created_at: new Date().toISOString(),
      }
      
      setBids([newBid, ...bids])
      setAuction(prev => prev ? { ...prev, current_price: amount } : null)
      setBidAmount("")
      
      toast({
        title: "Enchère placée !",
        description: `Votre enchère de ${formatCurrency(amount)} a été placée avec succès.`,
      })
    } catch (err) {
      console.error("Error placing bid:", err)
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Une erreur est survenue lors de l&apos;enchère. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="container py-8">Chargement...</div>
  }

  if (error || !auction) {
    return <div className="container py-8">Une erreur est survenue lors du chargement de l'enchère.</div>
  }

  return (
    <div className="container py-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne gauche - Images */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4">
            <div className="relative aspect-square overflow-hidden rounded-xl border shadow-sm bg-white">
              <Image
                src={auction.images[selectedImage]}
                alt={auction.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex space-x-2 overflow-auto pb-2">
              {auction.images.map((image, index) => (
                <button
                  key={index}
                  className={cn(
                    "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border shadow-sm transition-all duration-200 hover:scale-105",
                    selectedImage === index && "ring-2 ring-indigo-500 border-indigo-300",
                  )}
                  onClick={() => setSelectedImage(index)}
                >
                  <Image
                    src={image}
                    alt={`Image du produit ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite - Détails de l'enchère */}
        <div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">{auction.title}</h1>
            <div className="flex items-center mt-2 space-x-4">
              <Button variant="outline" size="sm" className="gap-1 border-indigo-200 hover:bg-indigo-50 transition-colors">
                <Share2 className="h-4 w-4 text-indigo-500" />
                Partager
              </Button>
              <Button variant="outline" size="sm" className="gap-1 border-pink-200 hover:bg-pink-50 transition-colors">
                <Heart className="h-4 w-4 text-pink-500" />
                Surveiller
              </Button>
            </div>
          </div>

          <Card className="p-4 mt-4 bg-white border-indigo-100 shadow-md rounded-xl overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-indigo-600">Enchère actuelle</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(auction.current_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-indigo-600">Enchères</p>
                <p className="font-medium text-gray-900">{bids.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-violet-600 bg-violet-50 p-2 rounded-lg">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{timeLeft}</span>
            </div>

            {/* Activité récente */}
            {bids.length > 0 && (
              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1 text-xs text-indigo-700">Activité récente:</p>
                {bids.slice(0, 5).map((bid) => (
                  <div key={bid.id} className="text-xs py-1 border-b last:border-0">
                    <span className="font-semibold">{bid.user_id}</span>: {formatCurrency(bid.bid_amount)}
                  </div>
                ))}
              </div>
            )}

            {auctionEnded ? (
              <Button onClick={() => router.push(`/payment/${params.id}`)} className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg">
                Acheter Maintenant
              </Button>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={`${auction.current_price + auction.min_bid_increment}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={auction.current_price + auction.min_bid_increment}
                    step={auction.min_bid_increment}
                    className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300"
                  />
                  <Button onClick={handleBid} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg">
                    Enchérir
                  </Button>
                </div>
                <p className="text-xs text-indigo-600">Entrez {formatCurrency(auction.current_price + auction.min_bid_increment)} ou plus</p>
              </div>
            )}
          </Card>

          <div className="mt-10">
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-3 bg-indigo-50 p-1">
                <TabsTrigger value="description" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">Description</TabsTrigger>
                <TabsTrigger value="bids" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">Historique des Enchères</TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">Détails</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6 bg-white p-6 rounded-xl shadow-sm">
                <div className="prose max-w-none">
                  <p className="text-gray-700">{auction.description}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="bids" className="mt-6">
                <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                  <div className="grid grid-cols-3 border-b p-3 font-medium bg-indigo-50 text-indigo-700">
                    <div>Enchérisseur</div>
                    <div>Montant</div>
                    <div>Temps</div>
                  </div>
                  <div className="divide-y divide-indigo-100">
                    {bids.length > 0 ? (
                      bids.map((bid) => (
                        <div key={bid.id} className="grid grid-cols-3 p-3 hover:bg-indigo-50 transition-colors">
                          <div className="text-indigo-700 font-medium">{bid.user_id}</div>
                          <div className="text-gray-900">{formatCurrency(bid.bid_amount)}</div>
                          <div className="text-gray-500">
                            {new Date(bid.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        Aucune enchère pour le moment
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="mt-6 bg-white p-6 rounded-xl shadow-sm">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Vendeur</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={auction.seller.image}
                          alt={auction.seller.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-indigo-700">{auction.seller.name}</p>
                        <p className="text-sm text-gray-500">Membre depuis {auction.seller.joined}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Détails de l'enchère</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Prix de départ</dt>
                        <dd className="font-medium text-gray-900">{formatCurrency(auction.starting_price)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Incrément minimum</dt>
                        <dd className="font-medium text-gray-900">{formatCurrency(auction.min_bid_increment)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 