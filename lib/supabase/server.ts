import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseAnonKey, getSupabaseUrl } from "./env"

export async function supabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // If called from a Server Component (not a Route Handler / Server Action),
          // Next.js will throw. That's ok; middleware can refresh sessions instead.
        }
      },
    },
  })
}
