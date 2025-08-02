import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type CookieOptions } from "@supabase/ssr";

export async function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error("Erreur lors de la définition du cookie:", error);
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.delete({ name, ...options });
          } catch (error) {
            console.error("Erreur lors de la suppression du cookie:", error);
          }
        },
      },
    },
  );
}
