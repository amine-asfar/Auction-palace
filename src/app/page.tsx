"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <main>
      {/* Redirect to /auctions */}
      <RedirectToAuctions />
    </main>
  );
}

// Client-side redirect component
function RedirectToAuctions() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/auctions");
  }, [router]);
  
  return null;
}
