"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Clock, Search, Filter, ChevronDown, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"

// Types pour les enchères
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

interface AuctionsListProps {
  initialAuctions: Auction[]
}

export function AuctionsList({ initialAuctions }: AuctionsListProps) {
  const [auctions] = useState<Auction[]>(initialAuctions)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [sortOption, setSortOption] = useState("ending-soon")

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatTimeLeft = (endTime: Date): string => {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()
    
    if (diff <= 0) return "Terminé"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days}j ${hours}h restants`
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m restants`
    }
  }

  // Filtrer et trier les enchères
  const filteredAuctions = auctions
    .filter(auction => {
      // Filtrer par terme de recherche
      if (searchTerm && !auction.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Filtrer par catégorie
      if (category !== "all" && category === "featured" && !auction.featured) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      // Trier selon l'option sélectionnée
      switch (sortOption) {
        case "ending-soon":
          return new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
        case "price-high":
          return b.current_price - a.current_price
        case "price-low":
          return a.current_price - b.current_price
        case "most-bids":
          return (b.bids_count || 0) - (a.bids_count || 0)
        default:
          return 0
      }
    })

  // Animation pour les cards d'enchères
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="flex items-center mb-8 text-sm">
        <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
          Accueil
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-indigo-600 font-medium">Enchères</span>
      </div>

      {/* Hero Section */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent mb-4">
          Découvrez des Enchères Uniques
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explorez notre sélection d&apos;objets rares et précieux. Enchérissez, suivez les offres en direct, et remportez des pièces exceptionnelles.
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Rechercher une enchère..."
            className="pl-10 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-indigo-200 hover:bg-indigo-50 text-gray-700">
                <Filter className="h-4 w-4 mr-2 text-indigo-500" />
                Filtrer
                <ChevronDown className="h-4 w-4 ml-2 text-indigo-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-indigo-100">
              <DropdownMenuItem onClick={() => setCategory("all")} className="hover:bg-indigo-50 cursor-pointer">
                Toutes les enchères
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory("featured")} className="hover:bg-indigo-50 cursor-pointer">
                Enchères en vedette
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Select value={sortOption} onValueChange={(value) => setSortOption(value)}>
            <SelectTrigger className="w-[180px] border-indigo-200 hover:bg-indigo-50 text-gray-700">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent className="border-indigo-100">
              <SelectItem value="ending-soon">Se termine bientôt</SelectItem>
              <SelectItem value="price-high">Prix ↓</SelectItem>
              <SelectItem value="price-low">Prix ↑</SelectItem>
              <SelectItem value="most-bids">Enchères populaires</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="grid" className="mb-6">
        <div className="flex justify-end">
          <TabsList className="bg-indigo-50 p-1">
            <TabsTrigger 
              value="grid" 
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            >
              Grille
            </TabsTrigger>
            <TabsTrigger 
              value="list"
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            >
              Liste
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Vue en grille */}
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAuctions.map((auction, index) => (
              <motion.div
                key={auction.id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Link href={`/auctions/${auction.id}`}>
                  <Card className="overflow-hidden group h-full border-indigo-100 hover:border-indigo-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1 rounded-xl">
                    <div className="relative aspect-square">
                      <Image
                        src={auction.image}
                        alt={auction.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-white font-medium text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatTimeLeft(new Date(auction.end_time))}
                        </p>
                      </div>
                      <button className="absolute top-3 right-3 bg-white/80 p-1.5 rounded-full hover:bg-white/95 transition-colors">
                        <Heart className="h-4 w-4 text-rose-500" />
                      </button>
                      {auction.featured && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-1 rounded-md text-white text-xs font-semibold">
                          En vedette
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                        {auction.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{auction.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-indigo-600 font-medium">Enchère actuelle</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(auction.current_price)}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {auction.bids_count || 0} enchère{(auction.bids_count || 0) > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Vue en liste */}
        <TabsContent value="list">
          <div className="space-y-4">
            {filteredAuctions.map((auction, index) => (
              <motion.div
                key={auction.id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Link href={`/auctions/${auction.id}`}>
                  <Card className="overflow-hidden group border-indigo-100 hover:border-indigo-300 transition-all duration-300 hover:shadow-md rounded-xl">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative h-48 md:h-auto md:w-48 lg:w-64">
                        <Image
                          src={auction.image}
                          alt={auction.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {auction.featured && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-1 rounded-md text-white text-xs font-semibold">
                            En vedette
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                              {auction.title}
                            </h3>
                            <button className="bg-white p-1 rounded-full hover:bg-indigo-50 transition-colors">
                              <Heart className="h-4 w-4 text-rose-500" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{auction.description}</p>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div>
                            <p className="text-xs text-indigo-600 font-medium">Enchère actuelle</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(auction.current_price)}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-sm font-medium flex items-center gap-1 text-indigo-600">
                              <Clock className="h-3 w-3" /> {formatTimeLeft(new Date(auction.end_time))}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {auction.bids_count || 0} enchère{(auction.bids_count || 0) > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 