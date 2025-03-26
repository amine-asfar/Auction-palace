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
  const redirectTo = searchParams.get('redirectTo')
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>Entrez vos informations pour créer un compte</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Création du compte..." : "Créer un compte"}
            </Button>
            <div className="text-center text-sm">
              Vous avez déjà un compte?{" "}
              <Link href={redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login"} className="text-primary underline">
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

