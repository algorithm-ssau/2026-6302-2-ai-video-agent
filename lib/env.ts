export function getDeepgramKey() {
  const key = process.env.DEEPGRAM_API_KEY
  if (!key) throw new Error("Missing env: DEEPGRAM_API_KEY")
  return key
}

export function getFonadaKey() {
  const key = process.env.FONADALABS_API_KEY
  if (!key) throw new Error("Missing env: FONADALABS_API_KEY")
  return key
}
