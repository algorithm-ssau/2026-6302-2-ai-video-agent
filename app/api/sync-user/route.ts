import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress

  if (!email) {
    return NextResponse.json(
      { error: "No primary email address found for this user" },
      { status: 400 },
    )
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null

  const supabase = supabaseAdmin()

  const { error } = await supabase
    .from("users")
    .upsert(
      {
        email,
        name,
        user_id: userId,
      },
      { onConflict: "user_id" },
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

