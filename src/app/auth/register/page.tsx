"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { register } from "@/app/actions/auth"
import { useSearchParams } from "next/navigation"

export default function RegisterPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirectTo')
  const [isPending, startTransition] = useTransition()
  
  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        console.log('Soumission du formulaire...')
        const result = await register({}, formData)
        
        if (result.redirect) {
          // Rediriger vers la page de connexion
          router.push(result.redirect)
        } else if (result.errors) {
          // Afficher les erreurs s'il y en a
          toast({
            variant: "destructive",
            title: "Échec de l'inscription",
            description: result.errors._form?.[0] || "Une erreur est survenue",
          })
        }
      } catch (error: unknown) {
        console.error('Erreur lors de l\'inscription:', error)
        toast({
          variant: "destructive",
          title: "Échec de l'inscription",
          description: "Une erreur inattendue est survenue",
        })
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <Card className="w-full max-w-md shadow-lg border-indigo-100 rounded-xl overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Créer un compte</CardTitle>
          <CardDescription className="text-gray-600">Entrez vos informations pour créer un compte</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 h-12"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg" disabled={isPending}>
              {isPending ? "Création du compte..." : "Créer un compte"}
            </Button>
            <div className="text-center text-sm">
              Vous avez déjà un compte?{" "}
              <Link href={redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login"} className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200 font-medium">
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

