import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import {
  exchangeCodeForToken,
  loadConnectedProfile,
  parsePlatform,
  type SocialPlatform,
} from "@/lib/social/oauth"
import { supabaseAdmin } from "@/lib/supabase/admin"

function parseState(value: string | null): { userId: string; platform: SocialPlatform } | null {
  if (!value) return null
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8")
    const data = JSON.parse(decoded) as { userId?: string; platform?: string }
    const platform = data.platform ? parsePlatform(data.platform) : null
    if (!data.userId || !platform) return null
    return { userId: data.userId, platform }
  } catch {
    return null
  }
}

function makeRedirect(request: Request, status: "success" | "error", message: string): URL {
  const target = new URL("/dashboard/settings", request.url)
  target.searchParams.set("socialStatus", status)
  target.searchParams.set("socialMessage", message)
  return target
}

export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const reqUrl = new URL(request.url)
  const code = reqUrl.searchParams.get("code")
  const state = reqUrl.searchParams.get("state")
  const callbackError = reqUrl.searchParams.get("error_description")

  if (callbackError) {
    return NextResponse.redirect(makeRedirect(request, "error", callbackError))
  }

  if (!code) {
    return NextResponse.redirect(
      makeRedirect(request, "error", "Missing authorization code"),
    )
  }

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsedState = parseState(state)
    const { platform: rawPlatform } = await context.params
    const routePlatform = parsePlatform(rawPlatform)

    if (!parsedState || !routePlatform) {
      return NextResponse.redirect(makeRedirect(request, "error", "Invalid OAuth state"))
    }

    if (parsedState.userId !== userId || parsedState.platform !== routePlatform) {
      return NextResponse.redirect(makeRedirect(request, "error", "OAuth state mismatch"))
    }

    const token = await exchangeCodeForToken(routePlatform, code)
    const profile = await loadConnectedProfile(routePlatform, token.accessToken)

    const expiresAt =
      token.expiresIn && token.expiresIn > 0
        ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
        : null

    const scopes = token.scopeText
      ? token.scopeText.split(/[,\s]+/).filter(Boolean)
      : []

    const supabase = supabaseAdmin()
    const { error } = await supabase.from("social_connections").upsert(
      {
        user_id: userId,
        platform: routePlatform,
        platform_user_id: profile.platformUserId,
        username: profile.username,
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        token_expires_at: expiresAt,
        scopes,
        metadata: profile.metadata,
        status: "connected",
        updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    )

    if (error) {
      console.error("Failed to save social connection:", error)
      return NextResponse.redirect(makeRedirect(request, "error", "Failed to save connection"))
    }

    return NextResponse.redirect(
      makeRedirect(request, "success", `${routePlatform} connected successfully`),
    )
  } catch (error) {
    console.error("Social callback failed:", error)
    return NextResponse.redirect(makeRedirect(request, "error", "Connection failed"))
  }
}
