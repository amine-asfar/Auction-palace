"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { register, type RegisterFormState } from "@/app/actions/auth"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

// Composant pour le bouton de soumission avec état de chargement
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg" 
      disabled={pending}
    >
      {pending ? "Création du compte..." : "Créer un compte"}
    </Button>
  )
}

export default function RegisterPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirectTo')
  
  // État initial du formulaire
  const initialState: RegisterFormState = { errors: {} }
  const [state, formAction] = useActionState(register, initialState)
  
  // Afficher un toast en cas d'erreur
  useEffect(() => {
    if (state.errors?._form) {
      toast({
        variant: "destructive",
        title: "Échec de l'inscription",
        description: state.errors._form[0],
      })
    }
  }, [state.errors, toast])

  // Gérer la redirection après une inscription réussie
  useEffect(() => {
    if (state.redirect) {
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé. Vous pouvez maintenant vous connecter.",
        className: "bg-green-50 border-green-200",
        duration: 3000,
      })
      router.push(state.redirect)
      router.refresh()
    }
  }, [state.redirect, router, toast])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <Card className="w-full max-w-md shadow-lg border-indigo-100 rounded-xl overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Créer un compte</CardTitle>
          <CardDescription className="text-gray-600">Entrez vos informations pour créer un compte</CardDescription>
        </CardHeader>
        <form action={formAction}>
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 h-12"
              />
              {state.errors?.email && (
                <p className="text-sm text-destructive">{state.errors.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Mot de passe *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 8 caractères"
                required
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 h-12"
              />
              {state.errors?.password && (
                <p className="text-sm text-destructive">{state.errors.password[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">Prénom *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Oussama (prénom uniquement)"
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 h-12"
              />
              <p className="text-xs text-gray-500">Entrez seulement votre prénom, pas votre nom complet</p>
              {state.errors?.name && (
                <p className="text-sm text-destructive">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="family_name" className="text-gray-700">Nom de famille *</Label>
              <Input
                id="family_name"
                name="family_name"
                type="text"
                placeholder="Fatnassi (nom de famille uniquement)"
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 h-12"
              />
              <p className="text-xs text-gray-500">Entrez seulement votre nom de famille</p>
              {state.errors?.family_name && (
                <p className="text-sm text-destructive">{state.errors.family_name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 h-12"
              />
              {state.errors?.phone && (
                <p className="text-sm text-destructive">{state.errors.phone[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700">Adresse</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="123 Rue de la Paix, 75001 Paris, France"
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 min-h-[60px]"
              />
              {state.errors?.address && (
                <p className="text-sm text-destructive">{state.errors.address[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing_file" className="text-gray-700">Justificatif de domicile</Label>
              <Input
                id="billing_file"
                name="billing_file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-300 h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="text-xs text-gray-500">Formats acceptés: PDF, JPG, JPEG, PNG</p>
              {state.errors?.billing_file && (
                <p className="text-sm text-destructive">{state.errors.billing_file[0]}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <SubmitButton />
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

