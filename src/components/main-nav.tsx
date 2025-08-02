"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { Shield } from "lucide-react";

export function MainNav() {
  const pathname = usePathname() || "/";
  const { isAdmin, isLoadingAdmin } = useAdmin();

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
          Auction Palace
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/auctions"
          className={cn(
            "transition-colors hover:text-indigo-600",
            pathname === "/auctions" || pathname.startsWith("/auctions/")
              ? "text-indigo-600 font-semibold"
              : "text-gray-600",
          )}
        >
          Enchères
        </Link>
        <Link
          href="/create-auction"
          className={cn(
            "transition-colors hover:text-indigo-600",
            pathname === "/create-auction"
              ? "text-indigo-600 font-semibold"
              : "text-gray-600",
          )}
        >
          Vendre
        </Link>
        {!isLoadingAdmin && isAdmin && (
          <Link
            href="/admin/verifications"
            className={cn(
              "transition-colors hover:text-indigo-600 flex items-center space-x-1",
              pathname === "/admin/verifications"
                ? "text-indigo-600 font-semibold"
                : "text-gray-600",
            )}
          >
            <Shield className="h-4 w-4" />
            <span>Vérifications</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
