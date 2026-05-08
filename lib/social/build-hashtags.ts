export function buildHashtags(values: Array<string | null | undefined>) {
  const tags = new Set<string>()
  for (const value of values) {
    if (!value) continue
    const cleaned = value.trim()
    if (!cleaned) continue
    const normalized = cleaned.replace(/[^\p{L}\p{N}]+/gu, "")
    if (!normalized) continue
    tags.add(`#${normalized}`)
  }
  return Array.from(tags).join(" ")
}
