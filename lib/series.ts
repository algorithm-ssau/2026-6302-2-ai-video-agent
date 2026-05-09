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
  selectedPlatforms: Array<"vk">
  publishTime: string
}

// Validate the saved wizard payload before treating it as a complete series config.
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
    data.selectedPlatforms.length > 0 &&
    data.selectedPlatforms.every((platform) => platform === "vk") &&
    (data.selectedStyle === null || typeof data.selectedStyle === "string") &&
    (data.selectedCaptionStyle === null ||
      typeof data.selectedCaptionStyle === "string") &&
    typeof data.seriesName === "string" &&
    typeof data.duration === "string" &&
    typeof data.publishTime === "string"
  )
}

// Resolve a selected visual style to its thumbnail, falling back to the app logo.
export function getSeriesStyleThumbnail(style: string | null) {
  return style ? `/video-style/${style}.png` : "/logo.png"
}
