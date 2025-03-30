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
          <Button variant="ghost" size="sm" className="text-gray-700 hover:text-indigo-700 hover:bg-indigo-50">
            Se connecter
          </Button>
        </Link>
        <Link href={`/auth/register${pathname !== '/' ? `?redirectTo=${pathname}` : ''}`}>
          <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-sm">
            S&apos;inscrire
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" className="relative hover:bg-indigo-50">
        <Bell className="h-5 w-5 text-indigo-600" />
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-rose-500"></span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-indigo-50 p-0">
            <Avatar className="h-8 w-8 border-2 border-indigo-100">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.user_metadata?.name || "Utilisateur"} />
              <AvatarFallback className="bg-gradient-to-r from-indigo-400 to-violet-400 text-white">{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 border-indigo-100" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || "Utilisateur"}</p>
              <p className="text-xs leading-none text-gray-500">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-indigo-100" />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="hover:bg-indigo-50 hover:text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer">
              <Link href="/profile">
                <User className="mr-2 h-4 w-4 text-indigo-600" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-indigo-50 hover:text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer">
              <Link href="/profile?tab=settings">
                <Settings className="mr-2 h-4 w-4 text-indigo-600" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-indigo-100" />
          <DropdownMenuItem onClick={handleLogout} disabled={isPending} className="hover:bg-indigo-50 hover:text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4 text-indigo-600" />
            <span>{isPending ? "Déconnexion..." : "Se déconnecter"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 