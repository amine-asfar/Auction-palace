"use server"

import { getProducts } from "@/app/actions/productActions"
import { AuctionsList } from "./components/AuctionsList"

export default async function AuctionsPage() {
  const auctions = await getProducts()
  
  return <AuctionsList initialAuctions={auctions} />
} 