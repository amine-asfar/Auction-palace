import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { getBids } from "@/app/actions/bidActions";

export interface RealtimeBid {
  id: string;
  user_id: string;
  bid_amount: number;
  created_at: string;
  product_id: string;
  UserProfiles?:
    | {
        name: string;
        family_name: string;
      }[]
    | null;
}

export interface RealtimeProduct {
  id: string;
  current_price: number;
  status: string;
}

export function useRealtimeBids(productId: string) {
  const [bids, setBids] = useState<RealtimeBid[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const loadedProductRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (
      !productId ||
      loadedProductRef.current === productId ||
      isLoadingRef.current
    )
      return;

    const loadInitialData = async () => {
      try {
        isLoadingRef.current = true;
        setIsLoading(true);

        const { data: product } = await supabase
          .from("Products")
          .select("current_price, starting_price")
          .eq("id", productId)
          .single();

        const initialBids = await getBids(productId);
        if (initialBids) {
          setBids(initialBids);

          if (initialBids.length > 0) {
            const highestBid = Math.max(
              ...initialBids.map((bid) => bid.bid_amount),
            );
            setCurrentPrice(highestBid);
          } else if (product) {
            setCurrentPrice(product.current_price || product.starting_price);
          }
        } else if (product) {
          setCurrentPrice(product.current_price || product.starting_price);
        }
        setError(null);
        loadedProductRef.current = productId;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bids");
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadInitialData();
  }, [productId, supabase]);

  useEffect(() => {
    let bidsChannel: RealtimeChannel;
    let productChannel: RealtimeChannel;
    let reconnectTimer: NodeJS.Timeout;

    const setupRealtime = async () => {
      try {
        bidsChannel = supabase.channel(`bids-${productId}`).on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Bids",
            filter: `product_id=eq.${productId}`,
          },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              const newBidData = payload.new as RealtimeBid;

              const { data: userProfile } = await supabase
                .from("UserProfiles")
                .select("user_id, name, family_name")
                .eq("user_id", newBidData.user_id)
                .single();

              const newBid = {
                ...newBidData,
                UserProfiles: userProfile ? [userProfile] : null,
              };

              setBids((prevBids) => {
                const exists = prevBids.some((bid) => bid.id === newBid.id);
                if (exists) return prevBids;

                const updatedBids = [newBid, ...prevBids].sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                );

                if (updatedBids.length > 0) {
                  const highestBid = Math.max(
                    ...updatedBids.map((bid) => bid.bid_amount),
                  );
                  setCurrentPrice(highestBid);
                }

                return updatedBids;
              });
            } else if (payload.eventType === "DELETE") {
              const deletedBid = payload.old as RealtimeBid;
              setBids((prevBids) => {
                const updatedBids = prevBids.filter(
                  (bid) => bid.id !== deletedBid.id,
                );

                if (updatedBids.length > 0) {
                  const highestBid = Math.max(
                    ...updatedBids.map((bid) => bid.bid_amount),
                  );
                  setCurrentPrice(highestBid);
                } else {
                  supabase
                    .from("Products")
                    .select("starting_price")
                    .eq("id", productId)
                    .single()
                    .then(({ data }) => {
                      if (data) {
                        setCurrentPrice(data.starting_price);
                      }
                    });
                }

                return updatedBids;
              });
            }
          },
        );

        productChannel = supabase.channel(`product-${productId}`).on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "Products",
            filter: `id=eq.${productId}`,
          },
          (payload) => {
            if (payload.eventType === "UPDATE") {
              const updatedProduct = payload.new as RealtimeProduct;
              setCurrentPrice(updatedProduct.current_price);
            }
          },
        );

        await bidsChannel.subscribe((status) => {
          setIsConnected(status === "SUBSCRIBED");

          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            reconnectTimer = setTimeout(() => {
              setupRealtime();
            }, 5000);
          }
        });

        await productChannel.subscribe(() => {});
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to connect to real-time updates",
        );
        setIsConnected(false);
      }
    };

    setupRealtime();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (bidsChannel) {
        supabase.removeChannel(bidsChannel);
      }
      if (productChannel) {
        supabase.removeChannel(productChannel);
      }
    };
  }, [productId]);

  return {
    bids,
    currentPrice,
    isConnected,
    isLoading,
    error,
    setBids,
    setCurrentPrice,
  };
}
