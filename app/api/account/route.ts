import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"

export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = supabaseAdmin()
    await supabase.from("social_connections").delete().eq("user_id", userId)
    await supabase.from("video_agent_series").delete().eq("user_id", userId)
    await supabase.from("users").delete().eq("clerk_id", userId)

    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
