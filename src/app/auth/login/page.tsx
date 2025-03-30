"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { login } from "@/app/actions/auth"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

// Composant pour le bouton de soumission avec état de chargement
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg" 
      disabled={pending}
    >
      {pending ? "Connexion en cours..." : "Se connecter"}
    </Button>
  )
}

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const registered = searchParams?.get('registered')
  
  // État initial du formulaire
  const initialState = { errors: {} }
  const [state, formAction] = useActionState(login, initialState)
  
  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
      router.refresh()
    }
  }, [isAuthenticated, router])
  
  // Afficher un toast si l'utilisateur vient de s'inscrire
  useEffect(() => {
    if (registered === 'true') {
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé. Vous pouvez maintenant vous connecter.",
      })
    }
  }, [registered, toast])
  
  // Afficher un toast en cas d'erreur
  useEffect(() => {
    if (state.errors?._form) {
      toast({
        variant: "destructive",
        title: "Échec de la connexion",
        description: state.errors._form[0],
      })
    }
  }, [state.errors, toast])

  // Gérer la redirection après une connexion réussie
  useEffect(() => {
    if (state.redirect) {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Auction Palace !",
        className: "bg-green-50 border-green-200",
        duration: 2000,
      })
      router.push(state.redirect)
      router.refresh()
    }
  }, [state.redirect, router, toast])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-lg border-indigo-100 rounded-xl overflow-hidden">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Bienvenue
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Connectez-vous à votre compte
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base text-gray-700">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  className="h-12 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300"
                />
                {state.errors?.email && (
                  <p className="text-sm text-destructive">{state.errors.email[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base text-gray-700">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-12 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300"
                />
                {state.errors?.password && (
                  <p className="text-sm text-destructive">{state.errors.password[0]}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <SubmitButton />
              <div className="text-center text-sm">
                Vous n&apos;avez pas de compte?{" "}
                <Link 
                  href="/auth/register" 
                  className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200 font-medium"
                >
                  S&apos;inscrire
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

