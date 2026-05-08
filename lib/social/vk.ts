const VK_API_BASE = "https://api.vk.ru/method"
const VK_API_VERSION = "5.199"

type VkApiError = {
  error_code?: number
  error_msg?: string
  request_params?: Array<{ key: string; value: string }>
}

type VkApiEnvelope<T> = {
  response?: T
  error?: VkApiError
}

type VkVideoSaveResponse = {
  upload_url: string
  video_id: number
  owner_id: number
  access_key?: string
}

export type VkVideoPublishResult = {
  ownerId: number
  videoId: number
  accessKey: string | null
  uploadResponse: Record<string, unknown>
}

function trimText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value
  return value.slice(0, Math.max(0, maxLen))
}

function normalizeParam(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "1" : "0"
  return String(value)
}

function buildParams(params: Record<string, string | number | boolean | undefined | null>) {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    body.set(key, normalizeParam(value))
  }
  return body
}

async function callVkApi<T>(
  method: string,
  accessToken: string,
  params: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const body = buildParams({
    ...params,
    access_token: accessToken,
    v: VK_API_VERSION,
  })

  const res = await fetch(`${VK_API_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  const data = (await res.json()) as VkApiEnvelope<T>
  if (!res.ok || data.error) {
    const message = data.error?.error_msg || `VK API ${method} failed`
    throw new Error(message)
  }

  if (!data.response) {
    throw new Error(`VK API ${method} returned no response`)
  }

  return data.response
}

async function createVkVideoUpload(options: {
  accessToken: string
  title: string
  description: string
}): Promise<VkVideoSaveResponse> {
  const safeTitle = trimText(options.title, 128)
  const safeDescription = trimText(options.description, 5000)

  return await callVkApi<VkVideoSaveResponse>("video.save", options.accessToken, {
    name: safeTitle,
    description: safeDescription,
    wallpost: false,
    is_private: false,
  })
}

async function uploadVkVideoFromUrl(options: {
  uploadUrl: string
  videoUrl: string
}): Promise<Record<string, unknown>> {
  const videoRes = await fetch(options.videoUrl)
  if (!videoRes.ok) {
    throw new Error(`Failed to download video for VK upload (${videoRes.status})`)
  }

  const buffer = await videoRes.arrayBuffer()
  const contentType = videoRes.headers.get("content-type") || "video/mp4"
  const formData = new FormData()
  formData.append("video_file", new Blob([buffer], { type: contentType }), "video.mp4")

  const uploadRes = await fetch(options.uploadUrl, {
    method: "POST",
    body: formData,
  })

  const text = await uploadRes.text()
  let json: Record<string, unknown> = {}
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>
    } catch {
      json = { raw: text }
    }
  }

  if (!uploadRes.ok) {
    throw new Error(`VK upload failed (${uploadRes.status})`)
  }

  return json
}

export async function publishVkClip(options: {
  accessToken: string
  title: string
  description: string
  videoUrl: string
}): Promise<VkVideoPublishResult> {
  const upload = await createVkVideoUpload({
    accessToken: options.accessToken,
    title: options.title,
    description: options.description,
  })

  const uploadResponse = await uploadVkVideoFromUrl({
    uploadUrl: upload.upload_url,
    videoUrl: options.videoUrl,
  })

  return {
    ownerId: upload.owner_id,
    videoId: upload.video_id,
    accessKey: upload.access_key ?? null,
    uploadResponse,
  }
}
