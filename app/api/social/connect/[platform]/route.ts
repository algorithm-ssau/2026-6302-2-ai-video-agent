import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { buildOauthUrl, parsePlatform } from "@/lib/social/oauth"

function buildState(userId: string, platform: string): string {
  const raw = JSON.stringify({ userId, platform, ts: Date.now() })
  return Buffer.from(raw, "utf8").toString("base64url")
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { platform: rawPlatform } = await context.params
    const platform = parsePlatform(rawPlatform)
    if (!platform) {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })
    }

    const state = buildState(userId, platform)
    return NextResponse.redirect(buildOauthUrl(platform, state))
  } catch (error) {
    console.error("Failed to start social connect:", error)
    return NextResponse.json(
      { error: "Failed to start social connect" },
      { status: 500 },
    )
  }
}
