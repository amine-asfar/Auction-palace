"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export function MainNav() {
  const pathname = usePathname() || "/"

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Auction Palace</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-indigo-600",
            pathname === "/" ? "text-indigo-600 font-semibold" : "text-gray-600",
          )}
        >
          Accueil
        </Link>
        <Link
          href="/auctions"
          className={cn(
            "transition-colors hover:text-indigo-600",
            pathname === "/auctions" || pathname.startsWith("/auctions/") ? "text-indigo-600 font-semibold" : "text-gray-600",
          )}
        >
          Enchères
        </Link>
        <Link
          href="/sell"
          className={cn(
            "transition-colors hover:text-indigo-600",
            pathname === "/sell" ? "text-indigo-600 font-semibold" : "text-gray-600",
          )}
        >
          Vendre
        </Link>
        <Link
          href="/about"
          className={cn(
            "transition-colors hover:text-indigo-600",
            pathname === "/about" ? "text-indigo-600 font-semibold" : "text-gray-600",
          )}
        >
          À propos
        </Link>
      </nav>
    </div>
  )
} 