"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { createProduct } from "@/app/actions/productActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Card } from "@/components/ui/card"

interface Product {
  id: string
  title: string
  description: string
  starting_price: number
  current_price: number
  category_id: string
  status: string
  start_time: string
  end_time: string
  user_id: string
  image: string
}

export default function CreateAuctionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    starting_price: "",
    min_bid_increment: "",
    image: "",
    end_time: "",
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une enchère",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // Validate price
    const price = parseFloat(formData.starting_price)
    if (price > 99999999.99) {
      toast({
        title: "Erreur",
        description: "Le prix de départ ne peut pas dépasser 99,999,999.99€",
        variant: "destructive",
      })
      return
    }

    // Validate minimum bid increment
    if (formData.min_bid_increment) {
      const minBidIncrement = parseFloat(formData.min_bid_increment)
      if (minBidIncrement <= 0) {
        toast({
          title: "Erreur",
          description: "L'incrément minimum de mise doit être supérieur à 0€",
          variant: "destructive",
        })
        return
      }
      
      if (minBidIncrement >= price) {
        toast({
          title: "Erreur",
          description: "L'incrément minimum de mise ne peut pas être supérieur ou égal au prix de départ",
          variant: "destructive",
        })
        return
      }
    }

    try {
      setIsLoading(true)
      
      const productData = {
        title: formData.title,
        description: formData.description,
        starting_price: parseFloat(formData.starting_price),
        category_id: "00000000-0000-0000-0000-000000000000", // Default category for now
        start_time: new Date().toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        user_id: user.id,
        image: formData.image,
        min_bid_increment: formData.min_bid_increment ? parseFloat(formData.min_bid_increment) : undefined,
      }

      const result = await createProduct(productData) as Product[] | null
      
      toast({
        title: "Succès",
        description: "Votre enchère a été créée avec succès",
      })
      
      if (result && result[0]) {
        router.push(`/auctions/${result[0].id}`)
      } else {
        router.push('/auctions')
      }
    } catch (error) {
      console.error("Error creating auction:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'enchère",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
          Créer une nouvelle enchère
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              Titre
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Montre Rolex Submariner Vintage"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Décrivez votre article en détail..."
              className="min-h-[100px]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="starting_price">
              Prix de départ (€)
            </label>
            <Input
              id="starting_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.starting_price}
              onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
              required
              placeholder="Ex: 1000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="min_bid_increment">
              Incrément minimum de mise (€)
            </label>
            <Input
              id="min_bid_increment"
              type="number"
              min="0"
              step="0.01"
              value={formData.min_bid_increment}
              onChange={(e) => setFormData({ ...formData, min_bid_increment: e.target.value })}
              placeholder="Ex: 10 (optionnel - 10% du prix de départ par défaut)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Montant minimum pour chaque nouvelle enchère. Si non spécifié, sera calculé automatiquement (10% du prix de départ).
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="image">
              URL de l&apos;image
            </label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              required
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="end_time">
              Date de fin
            </label>
            <Input
              id="end_time"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            disabled={isLoading}
          >
            {isLoading ? "Création en cours..." : "Créer l'enchère"}
          </Button>
        </form>
      </Card>
    </div>
  )
} 