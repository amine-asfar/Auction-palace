"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold text-xl">Auction Palace</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Accueil
        </Link>
        <Link
          href="/auctions"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/auctions" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Enchères
        </Link>
        <Link
          href="/sell"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/sell" ? "text-primary" : "text-muted-foreground",
          )}
        >
          Vendre
        </Link>
        <Link
          href="/about"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/about" ? "text-primary" : "text-muted-foreground",
          )}
        >
          À propos
        </Link>
      </nav>
    </div>
  )
} 