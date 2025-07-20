import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'


// Routes qui nécessitent une authentification
const protectedRoutes = [
  '/',
  '/profile',
  '/sell',
  '/payment',
  '/auctions',
  '/auctions/create',
  '/create-auction',
  '/admin/verifications',
]

// Routes qui ne nécessitent pas de vérification
const verificationExemptRoutes = [
  '/auth/login',
  '/auth/register',
  '/verification-required',
  '/create-admin',
]

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  // Créer un client Supabase pour le middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  // Vérifier si l'utilisateur est authentifié
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Vérifier si la route actuelle est protégée
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  // Vérifier si la route est exemptée de vérification
  const isVerificationExemptRoute = verificationExemptRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  // Si la route est protégée et que l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si l'utilisateur est authentifié, vérifier s'il a besoin de vérification
  if (user && isProtectedRoute && !isVerificationExemptRoute) {
    try {
      // Vérifier le statut de vérification
      const { data: verification } = await supabase
        .from('identityverifications')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Si pas de vérification ou statut non approuvé, rediriger vers la page de vérification
      if (!verification || verification.status !== 'approved') {
        return NextResponse.redirect(new URL('/verification-required', request.url))
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      // En cas d'erreur, rediriger vers la page de vérification par sécurité
      return NextResponse.redirect(new URL('/verification-required', request.url))
    }
  }

  // Si l'utilisateur est déjà authentifié et essaie d'accéder aux pages d'authentification, rediriger vers la page d'accueil
  if (user && (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/register'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 