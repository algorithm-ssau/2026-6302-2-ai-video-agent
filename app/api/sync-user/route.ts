import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as
    | { id?: string; user_id?: string; email?: string; name?: string }
    | null


  const clerkUserId = body?.user_id ?? body?.id

  if (!clerkUserId || !body?.email) {
    return NextResponse.json(
      { error: "Missing required fields: user_id (or id), email" },
      { status: 400 },
    )
  }

  const { email, name } = body

  const supabase = supabaseAdmin()

  const { error } = await supabase
    .from("users")
    .upsert(
      {
        email,
        name: name ?? null,
        user_id: clerkUserId,
      },
      { onConflict: "user_id" },
    )

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}

