import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"

type RouteContext = {
  params: Promise<{ id: string }>
}

function sanitizeCommunityId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value)
  return null
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  if (value === "true") return true
  if (value === "false") return false
  return null
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const rowId = sanitizeCommunityId(id)
    if (!rowId) {
      return NextResponse.json({ error: "Invalid connection id" }, { status: 400 })
    }

    const body: unknown = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const raw = body as Record<string, unknown>
    const nextValues: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if ("communityName" in raw) {
      const communityName =
        typeof raw.communityName === "string" && raw.communityName.trim()
          ? raw.communityName.trim()
          : null
      nextValues.community_name = communityName
    }

    if ("accessToken" in raw) {
      if (typeof raw.accessToken !== "string" || !raw.accessToken.trim()) {
        return NextResponse.json({ error: "accessToken must be a non-empty string" }, { status: 400 })
      }
      nextValues.access_token = raw.accessToken.trim()
    }

    if ("userAccessToken" in raw) {
      if (typeof raw.userAccessToken !== "string" || !raw.userAccessToken.trim()) {
        return NextResponse.json(
          { error: "userAccessToken must be a non-empty string" },
          { status: 400 },
        )
      }
      nextValues.user_access_token = raw.userAccessToken.trim()
    }

    if ("isActive" in raw) {
      const isActive = parseBoolean(raw.isActive)
      if (isActive === null) {
        return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 })
      }
      nextValues.is_active = isActive
    }

    if (Object.keys(nextValues).length === 1) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from("vk_communities")
      .update(nextValues)
      .eq("id", rowId)
      .eq("user_id", userId)
      .select("id")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to update connection" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data.id })
  } catch (error) {
    console.error("Unexpected error in PATCH /api/social/connections/[id]:", error)
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const rowId = sanitizeCommunityId(id)
    if (!rowId) {
      return NextResponse.json({ error: "Invalid connection id" }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { error } = await supabase
      .from("vk_communities")
      .delete()
      .eq("id", rowId)
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Unexpected error in DELETE /api/social/connections/[id]:", error)
    return NextResponse.json({ error: "Failed to delete connection" }, { status: 500 })
  }
}
