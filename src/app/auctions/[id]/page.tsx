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

// Types
interface Bid {
  id: string
  user: string
  amount: number
  time: string
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
  currentBid: number
  startingBid: number
  minBidIncrement: number
  bids: Bid[]
  endTime: Date
  seller: Seller
  specifications: Specification[]
  similarItems: SimilarItem[]
}

// Mock auction data - à remplacer par des données réelles de Supabase
const auctionData: AuctionData = {
  id: "1",
  title: "Montre Rolex Submariner Vintage",
  description:
    "Une Rolex Submariner classique de 1985 en excellent état. Cette montre présente un cadran noir avec des marqueurs d'heures lumineux et une fonction date à 3 heures. La montre est livrée avec sa boîte et ses papiers d'origine, ce qui en fait un ensemble complet pour les collectionneurs.",
  images: [
    "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1548171632-c27e4ddd2d45?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=1000&auto=format&fit=crop",
  ],
  currentBid: 4250,
  startingBid: 3000,
  minBidIncrement: 50,
  bids: [
    { id: "b1", user: "Alex Johnson", amount: 4250, time: "il y a 2 heures" },
    { id: "b2", user: "Sarah Miller", amount: 4200, time: "il y a 3 heures" },
    { id: "b3", user: "David Chen", amount: 4100, time: "il y a 5 heures" },
    { id: "b4", user: "Emma Wilson", amount: 4000, time: "il y a 6 heures" },
    { id: "b5", user: "Michael Brown", amount: 3800, time: "il y a 8 heures" },
    { id: "b6", user: "Jessica Lee", amount: 3500, time: "il y a 10 heures" },
    { id: "b7", user: "Robert Taylor", amount: 3200, time: "il y a 12 heures" },
    { id: "b8", user: "Lisa Garcia", amount: 3000, time: "il y a 1 jour" },
  ],
  endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 jours à partir de maintenant
  seller: {
    id: "s1",
    name: "Collectionneurs de Montres de Luxe",
    rating: 4.9,
    sales: 156,
    joined: "Mars 2018",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop",
  },
  specifications: [
    { name: "Marque", value: "Rolex" },
    { name: "Modèle", value: "Submariner" },
    { name: "Année", value: "1985" },
    { name: "Matériau du Boîtier", value: "Acier Inoxydable" },
    { name: "Couleur du Cadran", value: "Noir" },
    { name: "Mouvement", value: "Automatique" },
    { name: "Diamètre", value: "40mm" },
    { name: "Bracelet", value: "Acier Inoxydable" },
    { name: "Boîte & Papiers", value: "Oui" },
    { name: "État", value: "Excellent" },
  ],
  similarItems: [
    { id: "si1", title: "Rolex Datejust", image: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=400&auto=format&fit=crop", price: 3800 },
    { id: "si2", title: "Omega Seamaster", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=400&auto=format&fit=crop", price: 2900 },
    { id: "si3", title: "Tudor Black Bay", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400&auto=format&fit=crop", price: 2200 },
    { id: "si4", title: "TAG Heuer Carrera", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=400&auto=format&fit=crop", price: 1800 },
  ],
}

export default function AuctionDetailPage() {
  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [bidAmount, setBidAmount] = useState<string>("")
  const [auctionEnded, setAuctionEnded] = useState<boolean>(false)
  const [currentBid, setCurrentBid] = useState<number>(auctionData.currentBid)
  const [bidHistory, setBidHistory] = useState<Array<{
    username: string,
    amount: number,
    timestamp: string
  }>>([])
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [messages, setMessages] = useState<Array<{
    username: string,
    message: string
  }>>([])
  const [error, setError] = useState<string | null>(null)
  
  const [userIdentity] = useState<{ userId: string; username: string }>(() => {
    const randomId = Math.random().toString(36).substring(2, 9);
    return {
      userId: randomId,
      username: `Utilisateur ${randomId.substring(0, 4)}`
    }
  })

  // Remplacer useAuctionSocket en attendant l'implémentation réelle
  const placeBid = async (amount: number): Promise<boolean> => {
    try {
      // Simule une enchère réussie
      const newBid = {
        username: userIdentity.username,
        amount: amount,
        timestamp: new Date().toISOString()
      };
      
      setBidHistory(prev => [newBid, ...prev]);
      setCurrentBid(amount);
      
      // Ajouter un message dans l'activité
      setMessages(prev => [
        ...prev, 
        { username: userIdentity.username, message: `a enchéri ${formatCurrency(amount)}` }
      ]);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'enchère:", error);
      setError("Échec de l'enchère. Veuillez réessayer.");
      return false;
    }
  };

  const simulateOtherBidder = () => {
    // Simuler une autre enchère avec un montant légèrement supérieur
    const newAmount = currentBid + auctionData.minBidIncrement + Math.floor(Math.random() * 50);
    const otherUser = `Enchérisseur${Math.floor(Math.random() * 1000)}`;
    
    const newBid = {
      username: otherUser,
      amount: newAmount,
      timestamp: new Date().toISOString()
    };
    
    setBidHistory(prev => [newBid, ...prev]);
    setCurrentBid(newAmount);
    
    // Ajouter un message
    setMessages(prev => [
      ...prev, 
      { username: otherUser, message: `a enchéri ${formatCurrency(newAmount)}` }
    ]);
  };

  // Simuler une connexion après un délai
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true);
      setMessages(prev => [
        ...prev, 
        { username: "Système", message: "Connexion aux enchères en direct établie" }
      ]);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string || "1" // Valeur par défaut en cas de params null

  // Calcul de l'enchère minimale
  const minBid = currentBid + auctionData.minBidIncrement

  // Formater la devise
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Mise à jour du compte à rebours
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date()
      const diff = auctionData.endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Enchère terminée")
        setAuctionEnded(true)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${days}j ${hours}h ${minutes}m ${seconds}s`)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [])

  // Affiche les erreurs de WebSocket dans un toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleBid = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour placer une enchère",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    const bidValue = Number.parseFloat(bidAmount)

    if (isNaN(bidValue) || bidValue < minBid) {
      toast({
        title: "Montant d'enchère invalide",
        description: `L'enchère minimale est de ${formatCurrency(minBid)}`,
        variant: "destructive",
      })
      return
    }

    try {
      // Attendre la résolution de la promesse
      const success = await placeBid(bidValue)

      if (success) {
        toast({
          title: "Enchère placée avec succès",
          description: `Vous avez placé une enchère de ${formatCurrency(bidValue)}`,
        })

        // Réinitialiser l'input d'enchère
        setBidAmount("")
      }
    } catch (err) {
      console.error("Erreur d'enchère:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la tentative d'enchère",
        variant: "destructive",
      })
    }
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour finaliser cet achat",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    router.push(`/payment/${id}`)
  }

  // Pour la démo seulement - transformer les messages en chaînes lisibles
  const getRecentActivity = () => {
    return messages.slice(-5).reverse().map((msg, index) => (
      <div key={index} className="text-xs py-1 border-b">
        <span className="font-semibold">{msg.username}</span>: {msg.message}
      </div>
    ))
  }

  return (
    <div className="container py-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne gauche - Images */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4">
            <div className="relative aspect-square overflow-hidden rounded-xl border shadow-sm bg-white">
              <Image
                src={auctionData.images[selectedImage]}
                alt={auctionData.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex space-x-2 overflow-auto pb-2">
              {auctionData.images.map((image, index) => (
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
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">{auctionData.title}</h1>
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

          <Card className="p-4 bg-white border-indigo-100 shadow-md rounded-xl overflow-hidden">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-indigo-600">Enchère actuelle</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentBid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-indigo-600">Enchères</p>
                  <p className="font-medium text-gray-900">{bidHistory.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-violet-600 bg-violet-50 p-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{timeLeft}</span>
              </div>

              {/* Activité récente */}
              {messages.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1 text-xs text-indigo-700">Activité récente:</p>
                  {getRecentActivity()}
                </div>
              )}

              {auctionEnded ? (
                <Button onClick={handleBuyNow} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg">
                  Acheter Maintenant
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`${minBid}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={minBid}
                      step={auctionData.minBidIncrement}
                      className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300"
                    />
                    <Button onClick={handleBid} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg">
                      Enchérir
                    </Button>
                  </div>
                  <p className="text-xs text-indigo-600">Entrez {formatCurrency(minBid)} ou plus</p>
                  
                  {/* Ajouter un bouton pour simuler une autre enchère (pour la démo) */}
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => simulateOtherBidder()}
                    >
                      Simuler une autre enchère
                    </Button>
                  </div>
                  
                  {isConnected ? (
                    <p className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 p-1.5 rounded-full pl-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Enchères en direct actives
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 p-1.5 rounded-full pl-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Connexion aux enchères en direct...
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-white border-indigo-100 shadow-md rounded-xl overflow-hidden">
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-indigo-100">
                <Image
                  src={auctionData.seller.image}
                  alt={auctionData.seller.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">{auctionData.seller.name}</p>
                <div className="flex items-center text-sm text-indigo-600">
                  <span className="flex items-center text-amber-500">★★★★★ <span className="text-gray-700 ml-1">{auctionData.seller.rating}</span></span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-gray-700">{auctionData.seller.sales} ventes</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-between">
              <Button variant="outline" size="sm" className="gap-1 border-indigo-200 hover:bg-indigo-50 text-indigo-700 transition-colors">
                <User className="h-4 w-4" />
                Voir le Profil
              </Button>
              <Button variant="outline" size="sm" className="gap-1 border-indigo-200 hover:bg-indigo-50 text-indigo-700 transition-colors">
                <MessageSquare className="h-4 w-4" />
                Contacter
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Section des onglets */}
      <div className="mt-10">
        <Tabs defaultValue="description">
          <TabsList className="grid w-full grid-cols-3 bg-indigo-50 p-1">
            <TabsTrigger value="description" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">Description</TabsTrigger>
            <TabsTrigger value="bids" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">Historique des Enchères</TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">Détails</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6 bg-white p-6 rounded-xl shadow-sm">
            <div className="prose max-w-none">
              <p className="text-gray-700">{auctionData.description}</p>
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
                {bidHistory.length > 0 ? 
                  bidHistory.map((bid, index) => (
                    <div key={index} className="grid grid-cols-3 p-3 hover:bg-indigo-50 transition-colors">
                      <div className="text-indigo-700 font-medium">{bid.username}</div>
                      <div className="text-gray-900">{formatCurrency(bid.amount)}</div>
                      <div className="text-gray-500">
                        {new Date(bid.timestamp).toLocaleString()}
                      </div>
                    </div>
                  )) : 
                  auctionData.bids.map((bid) => (
                    <div key={bid.id} className="grid grid-cols-3 p-3 hover:bg-indigo-50 transition-colors">
                      <div className="text-indigo-700 font-medium">{bid.user}</div>
                      <div className="text-gray-900">{formatCurrency(bid.amount)}</div>
                      <div className="text-gray-500">{bid.time}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </TabsContent>
          <TabsContent value="details" className="mt-6">
            <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-indigo-100">
                {auctionData.specifications.map((spec, index) => (
                  <div key={index} className="p-3 grid grid-cols-2 hover:bg-indigo-50 transition-colors">
                    <div className="font-medium text-indigo-700">{spec.name}</div>
                    <div className="text-gray-700">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Articles similaires */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">Articles Similaires</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {auctionData.similarItems.map((item) => (
            <Link key={item.id} href={`/auctions/${item.id}`}>
              <div className="group rounded-xl border border-indigo-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-square">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate text-gray-800 group-hover:text-indigo-700 transition-colors">{item.title}</h3>
                  <p className="text-indigo-600 font-bold">{formatCurrency(item.price)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 