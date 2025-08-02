"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/app/actions/productActions";
import { AuctionsList } from "./components/AuctionsList";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
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
}

interface ProductUpdate {
  id: string;
  current_price: number;
  title?: string;
  description?: string;
  image?: string;
  starting_price?: number;
  end_time?: string;
  featured?: boolean;
  bids_count?: number;
  status?: string;
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setIsLoading(true);

        const initialAuctions = await getProducts();
        setAuctions(initialAuctions || []);
      } catch {
      } finally {
        setIsLoading(false);
      }
    };

    loadAuctions();
  }, []);

  useEffect(() => {
    let productChannel: RealtimeChannel;

    const setupRealtime = async () => {
      try {
        productChannel = supabase
          .channel("products-updates")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "Products",
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                const newProduct = payload.new as any;

                const isActive =
                  newProduct.status !== "completed" &&
                  new Date(newProduct.end_time) > new Date();

                if (isActive) {
                  setAuctions((prevAuctions) => [newProduct, ...prevAuctions]);
                }
              }
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "Products",
            },
            (payload) => {
              if (payload.eventType === "UPDATE") {
                const updatedProduct = payload.new as ProductUpdate;

                const isExpired =
                  updatedProduct.end_time &&
                  new Date(updatedProduct.end_time) < new Date();
                const isCompleted = updatedProduct.status === "completed";

                if (isCompleted || isExpired) {
                  setAuctions((prevAuctions) =>
                    prevAuctions.filter(
                      (auction) => auction.id !== updatedProduct.id,
                    ),
                  );
                } else {
                  setAuctions((prevAuctions) =>
                    prevAuctions.map((auction) =>
                      auction.id === updatedProduct.id
                        ? {
                            ...auction,
                            current_price: updatedProduct.current_price,
                            end_time: updatedProduct.end_time
                              ? new Date(updatedProduct.end_time)
                              : auction.end_time,
                          }
                        : auction,
                    ),
                  );
                }
              }
            },
          );

        await productChannel.subscribe(() => {});
      } catch {}
    };

    setupRealtime();

    return () => {
      if (productChannel) {
        supabase.removeChannel(productChannel);
      }
    };
  }, [supabase]);

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
              <p className="text-gray-600">
                Découvrez les meilleures offres du moment...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AuctionsList initialAuctions={auctions} />;
}
