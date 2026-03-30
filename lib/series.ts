export type SeriesPayload = {
  nicheType: "available" | "custom"
  selectedNiche: string | null
  customNiche: string
  language: string | null
  languageModel: string | null
  voice: string | null
  selectedBG: string[]
  selectedBGMeta?: Array<{ id: string; title: string; url: string }>
  selectedStyle: string | null
  selectedCaptionStyle: string | null
  seriesName: string
  duration: string
  selectedPlatforms: string[]
  publishTime: string
}

export function isValidSeriesPayload(payload: unknown): payload is SeriesPayload {
  if (!payload || typeof payload !== "object") return false

  const data = payload as Record<string, unknown>

  return (
    (data.nicheType === "available" || data.nicheType === "custom") &&
    (data.selectedNiche === null || typeof data.selectedNiche === "string") &&
    typeof data.customNiche === "string" &&
    (data.language === null || typeof data.language === "string") &&
    (data.languageModel === null || typeof data.languageModel === "string") &&
    (data.voice === null || typeof data.voice === "string") &&
    Array.isArray(data.selectedBG) &&
    Array.isArray(data.selectedPlatforms) &&
    (data.selectedStyle === null || typeof data.selectedStyle === "string") &&
    (data.selectedCaptionStyle === null ||
      typeof data.selectedCaptionStyle === "string") &&
    typeof data.seriesName === "string" &&
    typeof data.duration === "string" &&
    typeof data.publishTime === "string"
  )
}

export function getSeriesStyleThumbnail(style: string | null) {
  return style ? `/video-style/${style}.png` : "/logo.png"
}
