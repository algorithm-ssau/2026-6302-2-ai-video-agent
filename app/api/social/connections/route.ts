import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from("social_connections")
      .select("platform,username,status,updated_at,last_synced_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Failed to get social connections:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ connections: data ?? [] })
  } catch (error) {
    console.error("Unexpected error in /api/social/connections:", error)
    return NextResponse.json({ error: "Failed to load connections" }, { status: 500 })
  }
}
