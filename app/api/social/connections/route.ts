import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"

function sanitizeCommunityId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value)
  return null
}

function maskToken(token: string): string {
  if (token.length <= 8) return "********"
  return `${token.slice(0, 4)}...${token.slice(-4)}`
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from("vk_communities")
      .select("id,community_id,community_name,is_active,updated_at,created_at,access_token")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Failed to get social connections:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const communities = (data ?? []).map((item) => ({
      id: item.id,
      platform: "vk",
      communityId: item.community_id,
      communityName: item.community_name,
      isActive: item.is_active,
      updatedAt: item.updated_at,
      createdAt: item.created_at,
      tokenMasked: typeof item.access_token === "string" ? maskToken(item.access_token) : null,
    }))

    return NextResponse.json({ connections: communities })
  } catch (error) {
    console.error("Unexpected error in /api/social/connections:", error)
    return NextResponse.json({ error: "Failed to load connections" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: unknown = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const raw = body as Record<string, unknown>
    const communityId = sanitizeCommunityId(raw.communityId)
    const accessToken = typeof raw.accessToken === "string" ? raw.accessToken.trim() : ""
    const communityName =
      typeof raw.communityName === "string" && raw.communityName.trim()
        ? raw.communityName.trim()
        : null

    if (!communityId) {
      return NextResponse.json({ error: "communityId must be a positive integer" }, { status: 400 })
    }
    if (!accessToken) {
      return NextResponse.json({ error: "accessToken is required" }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from("vk_communities")
      .upsert(
        {
          user_id: userId,
          community_id: communityId,
          community_name: communityName,
          access_token: accessToken,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,community_id" },
      )
      .select("id,community_id,community_name,is_active,updated_at,created_at,access_token")
      .single()

    if (error || !data) {
      console.error("Failed to add/update VK community:", error)
      return NextResponse.json({ error: error?.message || "Failed to save community" }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      connection: {
        id: data.id,
        platform: "vk",
        communityId: data.community_id,
        communityName: data.community_name,
        isActive: data.is_active,
        updatedAt: data.updated_at,
        createdAt: data.created_at,
        tokenMasked: maskToken(data.access_token),
      },
    })
  } catch (error) {
    console.error("Unexpected error in POST /api/social/connections:", error)
    return NextResponse.json({ error: "Failed to save community" }, { status: 500 })
  }
}
