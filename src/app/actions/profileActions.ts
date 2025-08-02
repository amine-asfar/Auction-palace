"use server";

import { createClient } from "@/utils/supabase/server";

export interface UserProfileData {
  id: string;
  name: string;
  family_name: string;
  phone?: string;
  address?: string;
  email: string;
  created_at: string;
  identity_status?: "pending" | "verified" | "rejected";
}

export interface PurchaseHistoryItem {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  purchase_price: number;
  purchase_date: string;
  status: "won" | "paid" | "delivered";
  end_time: string;
}

interface ProductData {
  id: string;
  title: string;
  image: string;
  current_price: number;
  end_time: string;
  status: string;
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfileData | null> {
  try {
    const supabase = createClient();

    const { data: profile, error: profileError } = await (await supabase)
      .from("UserProfiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      const {
        data: { user },
      } = await (await supabase).auth.getUser();
      if (!user) return null;

      const { data: verification } = await (await supabase)
        .from("identityverifications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let identityStatus: "pending" | "verified" | "rejected" = "pending";
      if (verification?.status === "approved") {
        identityStatus = "verified";
      } else if (verification?.status === "rejected") {
        identityStatus = "rejected";
      }

      return {
        id: user.id,
        name: user.user_metadata?.name || "",
        family_name: user.user_metadata?.family_name || "",
        email: user.email || "",
        created_at: user.created_at || new Date().toISOString(),
        identity_status: identityStatus,
      };
    }

    const {
      data: { user },
    } = await (await supabase).auth.getUser();

    const { data: verification } = await (await supabase)
      .from("identityverifications")
      .select("status")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let identityStatus: "pending" | "verified" | "rejected" = "pending";
    if (verification?.status === "approved") {
      identityStatus = "verified";
    } else if (verification?.status === "rejected") {
      identityStatus = "rejected";
    }

    return {
      id: profile.user_id,
      name: profile.name || "",
      family_name: profile.family_name || "",
      phone: profile.phone || "",
      address: profile.address || "",
      email: user?.email || profile.email || "",
      created_at:
        user?.created_at || profile.created_at || new Date().toISOString(),
      identity_status: identityStatus,
    };
  } catch {
    return null;
  }
}

export async function getUserPurchaseHistory(
  userId: string,
): Promise<PurchaseHistoryItem[]> {
  try {
    const supabase = createClient();

    const { data: wonAuctions, error } = await (
      await supabase
    )
      .from("Bids")
      .select(
        `
        id,
        bid_amount,
        created_at,
        product_id,
        Products!inner (
          id,
          title,
          image,
          current_price,
          end_time,
          status
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    if (!wonAuctions || wonAuctions.length === 0) {
      return [];
    }

    const purchaseHistory: PurchaseHistoryItem[] = wonAuctions
      .filter((bid) => {
        const product = bid.Products as unknown as ProductData;

        const auctionEnded =
          new Date(product.end_time) < new Date() ||
          product.status === "completed";
        const isWinningBid = bid.bid_amount === product.current_price;
        return auctionEnded && isWinningBid;
      })
      .map((bid) => {
        const product = bid.Products as unknown as ProductData;
        return {
          id: bid.id,
          product_id: product.id,
          product_title: product.title,
          product_image: product.image,
          purchase_price: bid.bid_amount,
          purchase_date: bid.created_at,
          status: "won" as const,
          end_time: product.end_time,
        };
      });

    return purchaseHistory;
  } catch {
    return [];
  }
}

export async function getUserStats(userId: string) {
  try {
    const supabase = createClient();

    const { data: totalBids } = await (await supabase)
      .from("Bids")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    const purchaseHistory = await getUserPurchaseHistory(userId);
    const totalWon = purchaseHistory.length;

    const totalSpent = purchaseHistory.reduce(
      (sum, purchase) => sum + purchase.purchase_price,
      0,
    );

    const { data: createdAuctions } = await (await supabase)
      .from("Products")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    return {
      totalBids: totalBids?.length || 0,
      totalWon,
      totalSpent,
      totalCreated: createdAuctions?.length || 0,
    };
  } catch {
    return {
      totalBids: 0,
      totalWon: 0,
      totalSpent: 0,
      totalCreated: 0,
    };
  }
}
