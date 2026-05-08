import { getAppBaseUrl } from "@/lib/env"

export type SocialPlatform = "vk"

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
  vk: {
    label: "VK",
    authUrl: "https://oauth.vk.com/authorize",
    tokenUrl: "https://oauth.vk.com/access_token",
    clientIdEnv: "VK_CLIENT_ID",
    clientSecretEnv: "VK_CLIENT_SECRET",
    scopes: ["video", "offline"],
  },
}

const VK_API_VERSION = "5.199"

export function parsePlatform(value: string): SocialPlatform | null {
  return value === "vk" ? value : null
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

  params.set("scope", config.scopes.join(","))

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

  const params = new URLSearchParams({
    client_id: getClientId(platform),
    client_secret: getClientSecret(platform),
    redirect_uri: redirectUri,
    code,
  })

  const res = await fetch(`${CONFIG[platform].tokenUrl}?${params.toString()}`)
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok || typeof data.access_token !== "string") {
    throw new Error("VK token exchange failed")
  }

  return {
    accessToken: data.access_token,
    refreshToken: null,
    expiresIn: typeof data.expires_in === "number" ? data.expires_in : null,
    scopeText: typeof data.scope === "string" ? data.scope : null,
  }
}

export async function loadConnectedProfile(
  platform: SocialPlatform,
  accessToken: string,
): Promise<ConnectedProfile> {
  const params = new URLSearchParams({
    access_token: accessToken,
    v: VK_API_VERSION,
    fields: "screen_name",
  })
  const res = await fetch(`https://api.vk.ru/method/users.get?${params.toString()}`)
  const data = (await res.json()) as {
    response?: Array<{ id?: number; first_name?: string; last_name?: string; screen_name?: string }>
    error?: { error_code?: number; error_msg?: string }
  }
  const first = data.response?.[0]
  if (!res.ok || data.error || !first?.id) {
    throw new Error("Cannot load VK profile")
  }

  const nameParts = [first.first_name, first.last_name].filter(Boolean)
  return {
    platformUserId: String(first.id),
    username: first.screen_name ?? (nameParts.length ? nameParts.join(" ") : null),
    metadata: {
      firstName: first.first_name ?? null,
      lastName: first.last_name ?? null,
      screenName: first.screen_name ?? null,
    },
  }
}
