"use server";

import { createClient } from "@/utils/supabase/server";

export async function manuallyProcessEndedAuctions() {
  try {
    const supabase = createClient();

    const { data: endedAuctions, error } = await (await supabase)
      .from("Products")
      .select("id, title, end_time, status")
      .lt("end_time", new Date().toISOString())
      .neq("status", "completed");

    if (error) throw error;

    console.log("Found ended auctions:", endedAuctions);

    const results = [];

    for (const auction of endedAuctions || []) {
      try {
        const { data, error: triggerError } = await (
          await supabase
        ).rpc("trigger_process_ended_auction", {
          auction_id: auction.id,
        });

        if (triggerError) {
          console.error(
            `Error processing auction ${auction.id}:`,
            triggerError,
          );
          results.push({
            auction_id: auction.id,
            title: auction.title,
            success: false,
            error: triggerError.message,
          });
        } else {
          console.log(`Successfully processed auction ${auction.id}:`, data);
          results.push({
            auction_id: auction.id,
            title: auction.title,
            success: true,
            data,
          });
        }
      } catch (err) {
        console.error(`Exception processing auction ${auction.id}:`, err);
        results.push({
          auction_id: auction.id,
          title: auction.title,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  } catch (error) {
    console.error("Error in manuallyProcessEndedAuctions:", error);
    throw error;
  }
}
