import { createClient } from "@supabase/supabase-js"

import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env"

export const supabaseAdmin = () =>
  createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
