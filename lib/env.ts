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

// Replicate removed in favour of Grok; keep legacy env getter removed.

// Google API key (Gemini). Return undefined when not set so callers can fallback to placeholders.
export function getGoogleApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GENAI_API_KEY || undefined
  );
}

// Hugging Face API key for image generation
export function getHuggingFaceKey(): string {
  const key = process.env.HUGGING_FACE_API_KEY;
  if (!key) throw new Error("Missing env: HUGGING_FACE_API_KEY");
  return key;
}
