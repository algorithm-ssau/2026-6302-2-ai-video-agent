import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseAnonKey, getSupabaseUrl } from "./env"

let browserClient: SupabaseClient | null = null

export function supabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient

  browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())
  return browserClient
}
