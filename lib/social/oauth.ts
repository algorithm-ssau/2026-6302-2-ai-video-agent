import { getAppBaseUrl } from "@/lib/env"

export type SocialPlatform = "youtube" | "instagram" | "tiktok"

type ConnectedProfile = {
  platformUserId: string
  username: string | null
  metadata: Record<string, unknown>
}

type PlatformConfig = {
  label: string
  authUrl: string
  tokenUrl: string
  clientIdEnv: string
  clientSecretEnv: string
  scopes: string[]
}

const CONFIG: Record<SocialPlatform, PlatformConfig> = {
  youtube: {
    label: "YouTube",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "YOUTUBE_CLIENT_ID",
    clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
  },
  instagram: {
    label: "Instagram",
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
    scopes: ["user_profile", "user_media"],
  },
  tiktok: {
    label: "TikTok",
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    clientIdEnv: "TIKTOK_CLIENT_ID",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    scopes: ["user.info.basic", "video.publish"],
  },
}

export function parsePlatform(value: string): SocialPlatform | null {
  return value === "youtube" || value === "instagram" || value === "tiktok"
    ? value
    : null
}

function getClientId(platform: SocialPlatform): string {
  const value = process.env[CONFIG[platform].clientIdEnv]
  if (!value) throw new Error(`Missing env: ${CONFIG[platform].clientIdEnv}`)
  return value
}

function getClientSecret(platform: SocialPlatform): string {
  const value = process.env[CONFIG[platform].clientSecretEnv]
  if (!value) throw new Error(`Missing env: ${CONFIG[platform].clientSecretEnv}`)
  return value
}

function getRedirectUri(platform: SocialPlatform): string {
  const appBaseUrl = getAppBaseUrl()
  if (!appBaseUrl) throw new Error("Missing env: NEXT_PUBLIC_APP_URL (or APP_URL)")
  const normalizedAppBaseUrl = appBaseUrl.replace(/\/+$/, "")
  return `${normalizedAppBaseUrl}/api/social/callback/${platform}`
}

export function buildOauthUrl(platform: SocialPlatform, state: string): string {
  const config = CONFIG[platform]
  const params = new URLSearchParams()
  params.set("client_id", getClientId(platform))
  params.set("redirect_uri", getRedirectUri(platform))
  params.set("response_type", "code")
  params.set("state", state)

  if (platform === "instagram") {
    params.set("scope", config.scopes.join(","))
  } else {
    params.set("scope", config.scopes.join(" "))
  }

  if (platform === "youtube") {
    params.set("access_type", "offline")
    params.set("prompt", "consent")
    params.set("include_granted_scopes", "true")
  }

  return `${config.authUrl}?${params.toString()}`
}

export type TokenResult = {
  accessToken: string
  refreshToken: string | null
  expiresIn: number | null
  scopeText: string | null
}

export async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string,
): Promise<TokenResult> {
  const redirectUri = getRedirectUri(platform)

  if (platform === "instagram") {
    const form = new URLSearchParams({
      client_id: getClientId(platform),
      client_secret: getClientSecret(platform),
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    })

    const res = await fetch(CONFIG[platform].tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    })
    const data = (await res.json()) as Record<string, unknown>
    if (!res.ok || typeof data.access_token !== "string") {
      throw new Error("Instagram token exchange failed")
    }
    return {
      accessToken: data.access_token,
      refreshToken: null,
      expiresIn: typeof data.expires_in === "number" ? data.expires_in : null,
      scopeText: null,
    }
  }

  if (platform === "youtube") {
    const form = new URLSearchParams({
      code,
      client_id: getClientId(platform),
      client_secret: getClientSecret(platform),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    })

    const res = await fetch(CONFIG[platform].tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    })
    const data = (await res.json()) as Record<string, unknown>
    if (!res.ok || typeof data.access_token !== "string") {
      throw new Error("YouTube token exchange failed")
    }
    return {
      accessToken: data.access_token,
      refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : null,
      expiresIn: typeof data.expires_in === "number" ? data.expires_in : null,
      scopeText: typeof data.scope === "string" ? data.scope : null,
    }
  }

  const form = new URLSearchParams({
    client_key: getClientId(platform),
    client_secret: getClientSecret(platform),
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  })

  const res = await fetch(CONFIG[platform].tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok || typeof data.access_token !== "string") {
    throw new Error("TikTok token exchange failed")
  }
  return {
    accessToken: data.access_token,
    refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : null,
    expiresIn: typeof data.expires_in === "number" ? data.expires_in : null,
    scopeText: typeof data.scope === "string" ? data.scope : null,
  }
}

export async function loadConnectedProfile(
  platform: SocialPlatform,
  accessToken: string,
): Promise<ConnectedProfile> {
  if (platform === "youtube") {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const data = (await res.json()) as {
      items?: Array<{ id?: string; snippet?: { title?: string; customUrl?: string } }>
    }
    const first = data.items?.[0]
    if (!res.ok || !first?.id) throw new Error("Cannot load YouTube profile")
    return {
      platformUserId: first.id,
      username: first.snippet?.title ?? null,
      metadata: { customUrl: first.snippet?.customUrl ?? null },
    }
  }

  if (platform === "instagram") {
    const res = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
    )
    const data = (await res.json()) as { id?: string; username?: string }
    if (!res.ok || !data.id) throw new Error("Cannot load Instagram profile")
    return { platformUserId: data.id, username: data.username ?? null, metadata: {} }
  }

  const res = await fetch("https://open.tiktokapis.com/v2/user/info/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: ["open_id", "display_name", "username", "avatar_url"],
    }),
  })
  const data = (await res.json()) as {
    data?: {
      user?: {
        open_id?: string
        display_name?: string
        username?: string
        avatar_url?: string
      }
    }
  }
  const user = data.data?.user
  if (!res.ok || !user?.open_id) throw new Error("Cannot load TikTok profile")
  return {
    platformUserId: user.open_id,
    username: user.username ?? user.display_name ?? null,
    metadata: {
      displayName: user.display_name ?? null,
      avatarUrl: user.avatar_url ?? null,
    },
  }
}
