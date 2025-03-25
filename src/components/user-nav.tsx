"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { useTransition, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function UserNav() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await signOut()
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error)
      }
    })
  }

  if (!mounted) return null
  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-4">
        <Link href={`/auth/login${pathname !== '/' ? `?redirectTo=${pathname}` : ''}`}>
          <Button variant="ghost" size="sm">
            Se connecter
          </Button>
        </Link>
        <Link href={`/auth/register${pathname !== '/' ? `?redirectTo=${pathname}` : ''}`}>
          <Button size="sm">S&apos;inscrire</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.user_metadata?.name || "Utilisateur"} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || "Utilisateur"}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile?tab=settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isPending ? "Déconnexion..." : "Se déconnecter"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 