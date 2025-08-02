import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

const protectedRoutes = [
  "/profile",
  "/sell",
  "/payment",
  "/auctions",
  "/auctions/create",
  "/create-auction",
  "/admin/verifications",
];

const verificationExemptRoutes = [
  "/auth/login",
  "/auth/register",
  "/verification-required",
  "/create-admin",
];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(route + "/"),
  );

  const isVerificationExemptRoute = verificationExemptRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(route + "/"),
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isProtectedRoute && !isVerificationExemptRoute) {
    try {
      const { data: verification } = await supabase
        .from("identityverifications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!verification || verification.status !== "approved") {
        return NextResponse.redirect(
          new URL("/verification-required", request.url),
        );
      }
    } catch (error) {
      console.error("Error checking verification status:", error);

      return NextResponse.redirect(
        new URL("/verification-required", request.url),
      );
    }
  }

  if (
    user &&
    (request.nextUrl.pathname.startsWith("/auth/login") ||
      request.nextUrl.pathname.startsWith("/auth/register"))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return res;
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
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
