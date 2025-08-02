"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Search, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface Auction {
  id: string;
  title: string;
  description: string;
  current_price: number;
  starting_price: number;
  image: string;
  end_time: Date;
  featured?: boolean;
  bids_count?: number;
  bidders_count?: number;
}

interface AuctionsListProps {
  initialAuctions: Auction[];
}

export function AuctionsList({ initialAuctions }: AuctionsListProps) {
  const [auctions] = useState<Auction[]>(initialAuctions);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [sortOption, setSortOption] = useState("ending-soon");

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeLeft = (endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return "Terminé";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}j ${hours}h restants`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m restants`;
    }
  };

  const filteredAuctions = auctions
    .filter((auction) => {
      if (
        searchTerm &&
        !auction.title.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (category !== "all" && category === "featured" && !auction.featured) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "ending-soon":
          return (
            new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
          );
        case "price-high":
          return b.current_price - a.current_price;
        case "price-low":
          return a.current_price - b.current_price;
        case "most-bids":
          return (b.bids_count || 0) - (a.bids_count || 0);
        default:
          return 0;
      }
    });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut" as const,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-8 text-sm">
          <Link
            href="/"
            className="text-gray-600 hover:text-violet-600 transition-colors"
          >
            Accueil
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-violet-600 font-medium">Enchères</span>
        </div>

        {/* Hero Section */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Découvrez des Enchères Uniques
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explorez notre sélection d&apos;objets rares et précieux.
            Enchérissez, suivez les offres en direct, et remportez des pièces
            exceptionnelles.
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher une enchère..."
              className="pl-10 border-violet-200 focus:border-violet-500 focus:ring-violet-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-violet-200 hover:bg-violet-50 text-gray-700"
                >
                  <Filter className="h-4 w-4 mr-2 text-violet-500" />
                  Filtrer
                  <ChevronDown className="h-4 w-4 ml-2 text-violet-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-violet-100">
                <DropdownMenuItem
                  onClick={() => setCategory("all")}
                  className="hover:bg-violet-50 cursor-pointer"
                >
                  Toutes les enchères
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCategory("featured")}
                  className="hover:bg-violet-50 cursor-pointer"
                >
                  Enchères en vedette
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select
              value={sortOption}
              onValueChange={(value) => setSortOption(value)}
            >
              <SelectTrigger className="w-[180px] border-violet-200 hover:bg-violet-50 text-gray-700">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent className="border-violet-100">
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
            <TabsList className="bg-violet-50 p-1">
              <TabsTrigger
                value="grid"
                className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
              >
                Grille
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-white data-[state=active]:text-violet-700"
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
                    <Card className="overflow-hidden group h-full border-violet-100 hover:border-violet-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 rounded-xl bg-white/80 backdrop-blur-sm">
                      <div className="relative aspect-square">
                        <Image
                          src={auction.image}
                          alt={auction.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
                          <p className="font-medium text-sm flex items-center gap-1 text-white">
                            <Clock className="h-4 w-4" />{" "}
                            {formatTimeLeft(new Date(auction.end_time))}
                          </p>
                        </div>
                        {auction.featured && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-lg">
                            ⭐ En vedette
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-violet-700 transition-colors mb-2">
                          {auction.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 mb-4">
                          {auction.description}
                        </p>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-violet-600 font-medium">
                                Enchère actuelle
                              </p>
                              <p className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                {formatCurrency(auction.current_price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                Prix de départ
                              </p>
                              <p className="text-sm font-medium text-gray-600">
                                {formatCurrency(auction.starting_price)}
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
                    <Card className="overflow-hidden group border-violet-100 hover:border-violet-300 transition-all duration-300 hover:shadow-xl rounded-xl bg-white/80 backdrop-blur-sm">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative h-48 md:h-auto md:w-48 lg:w-64">
                          <Image
                            src={auction.image}
                            alt={auction.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {auction.featured && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-lg">
                              ⭐ En vedette
                            </div>
                          )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800 group-hover:text-violet-700 transition-colors text-lg mb-2">
                              {auction.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {auction.description}
                            </p>
                          </div>
                          <div className="mt-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-violet-600 font-medium">
                                  Enchère actuelle
                                </p>
                                <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                  {formatCurrency(auction.current_price)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium flex items-center gap-1 text-violet-600">
                                  <Clock className="h-4 w-4" />{" "}
                                  {formatTimeLeft(new Date(auction.end_time))}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Prix de départ:{" "}
                                  {formatCurrency(auction.starting_price)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-violet-100">
                              <div className="text-sm text-gray-500">
                                <span className="font-medium">
                                  {auction.bids_count || 0} enchères
                                </span>
                              </div>
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
    </div>
  );
}
