"use server";

import { createClient } from "@/utils/supabase/server";

export async function checkIfUserWonAuction(
  productId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data: product, error: productError } = await (await supabase)
      .from("Products")
      .select("id, end_time, current_price, status")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return false;
    }

    const isEnded =
      new Date(product.end_time) < new Date() || product.status === "completed";
    if (!isEnded) {
      return false;
    }

    const { data: winningBid, error: bidError } = await (await supabase)
      .from("Bids")
      .select("user_id, bid_amount")
      .eq("product_id", productId)
      .eq("bid_amount", product.current_price)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (bidError || !winningBid) {
      return false;
    }

    return winningBid.user_id === userId;
  } catch {
    return false;
  }
}

export async function getAuctionWinner(
  productId: string,
): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data: product, error: productError } = await (await supabase)
      .from("Products")
      .select("id, end_time, current_price, status")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return null;
    }

    const isEnded =
      new Date(product.end_time) < new Date() || product.status === "completed";
    if (!isEnded) {
      return null;
    }

    const { data: winningBid, error: bidError } = await (await supabase)
      .from("Bids")
      .select("user_id")
      .eq("product_id", productId)
      .eq("bid_amount", product.current_price)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (bidError || !winningBid) {
      return null;
    }

    return winningBid.user_id;
  } catch {
    return null;
  }
}

export async function processAuctionEnd(productId: string): Promise<void> {
  const supabase = createClient();

  try {
    const { data: product, error: productError } = await (await supabase)
      .from("Products")
      .select("id, end_time, current_price, status")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return;
    }

    const isEnded =
      new Date(product.end_time) < new Date() || product.status === "completed";
    if (!isEnded) {
      return;
    }

    const { data: winningBid, error: bidError } = await (await supabase)
      .from("Bids")
      .select("user_id, bid_amount")
      .eq("product_id", productId)
      .eq("bid_amount", product.current_price)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (bidError || !winningBid) {
      return;
    }

    const { data: existingPayment } = await (await supabase)
      .from("Payments")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", winningBid.user_id)
      .single();

    if (existingPayment) {
      return;
    }

    const { data: payment, error: paymentError } = await (
      await supabase
    )
      .from("Payments")
      .insert([
        {
          user_id: winningBid.user_id,
          product_id: productId,
          amount: winningBid.bid_amount,
          status: "pending",
          stripe_intent_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error(
        `Failed to create payment record for auction ${productId}:`,
        paymentError,
      );
      return;
    }
  } catch (error) {
    console.error(`❌ Error processing auction end for ${productId}:`, error);
  }
}
