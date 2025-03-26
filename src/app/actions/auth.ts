'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Schéma de validation pour la connexion
const loginSchema = z.object({
  email: z.string().email("Veuillez entrer un email valide"),
  password: z.string().min(1, "Le mot de passe est requis"),
  redirectTo: z.string().optional(),
})

// Schéma de validation pour l'inscription
const registerSchema = z.object({
  email: z.string().email("Veuillez entrer un email valide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  redirectTo: z.string().optional().nullable(),
})

export type LoginFormState = {
  errors?: {
    email?: string[]
    password?: string[]
    _form?: string[]
  }
  redirect?: string
}

export type RegisterFormState = {
  errors?: {
    email?: string[]
    password?: string[]
    _form?: string[]
  }
  redirect?: string
}

export async function login(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  try {
    // Validation des données
    const validatedFields = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    // Si la validation échoue, retourner les erreurs
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { email, password } = validatedFields.data
    const supabase = await createClient()

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Erreur de connexion:', error)
      return {
        errors: {
          _form: [error.message],
        },
      }
    }

    if (!data.session) {
      console.error('Pas de session après connexion')
      return {
        errors: {
          _form: ['Erreur lors de la création de la session'],
        },
      }
    }

    console.log('Connexion réussie, session créée:', data.session)
    revalidatePath('/', 'layout')
    
    // Forcer la redirection côté client
    return {
      errors: {},
      redirect: '/'
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la connexion:', error)
    return {
      errors: {
        _form: ['Une erreur inattendue est survenue'],
      },
    }
  }
}

export async function register(prevState: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  console.log('Fonction register appelée côté serveur')

  // Validation des données
  const validatedFields = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: formData.get('redirectTo') || null,
  })

  console.log('Données soumises:', {
    email: formData.get('email'),
    redirectTo: formData.get('redirectTo'),
  })

  console.log('Résultat de la validation:', validatedFields.success)

  // Si la validation échoue, retourner les erreurs
  if (!validatedFields.success) {
    console.error('Erreurs de validation:', validatedFields.error.flatten().fieldErrors)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password, redirectTo } = validatedFields.data
  console.log('Données validées:', { email, redirectTo })

  try {
    const supabase = await createClient()
    console.log('Client Supabase créé')

    // Inscription de l'utilisateur
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log('Réponse de Supabase:', { 
      error: signUpError ? signUpError.message : null,
      userId: data?.user?.id,
      userEmail: data?.user?.email
    })

    if (signUpError) {
      console.error('Erreur d\'inscription:', signUpError)
      
      // Gestion spécifique de l'erreur de limite de taux d'emails
      if (signUpError.message === 'email rate limit exceeded') {
        return {
          errors: {
            _form: ['Trop de tentatives d\'inscription. Veuillez attendre quelques minutes ou utiliser une autre adresse email.'],
          },
        }
      }
      
      return {
        errors: {
          _form: [signUpError.message],
        },
      }
    }

    // Vérifier si l'utilisateur a été créé avec succès
    if (!data?.user) {
      console.error('Utilisateur non créé malgré absence d\'erreur')
      return {
        errors: {
          _form: ['Erreur lors de la création du compte. Veuillez réessayer.'],
        },
      }
    }

    console.log('Inscription réussie, redirection...')
    
    // Construire l'URL de redirection
    const loginUrl = new URL('/auth/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
    loginUrl.searchParams.set('registered', 'true')
    if (redirectTo) {
      loginUrl.searchParams.set('redirectTo', redirectTo)
    }

    // Rediriger vers la page de connexion
    return {
      errors: {},
      redirect: loginUrl.toString(),
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return {
      errors: {
        _form: ['Une erreur inattendue est survenue. Veuillez réessayer.'],
      },
    }
  }
}

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }

  revalidatePath('/', 'layout')
  redirect('/')
} 