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

export function getPlunkSecretKey(): string {
  const key = process.env.PLUNK_SECRET_KEY || process.env.PLUNK_API_KEY;
  if (!key) throw new Error("Missing env: PLUNK_SECRET_KEY");
  return key;
}

export function getPlunkApiUrl(): string {
  return process.env.PLUNK_API_URL || "https://next-api.useplunk.com";
}

export function getPlunkFromEmail(): string | undefined {
  return process.env.PLUNK_FROM_EMAIL || undefined;
}

export function getPlunkFromName(): string {
  return process.env.PLUNK_FROM_NAME || "AI Video Agent";
}

export function getPlunkVideoReadyTemplateId(): string | undefined {
  return process.env.PLUNK_VIDEO_READY_TEMPLATE_ID || undefined;
}

export function getAppBaseUrl(): string | undefined {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL;

  if (!configured) return undefined;
  return configured.startsWith("http") ? configured : `https://${configured}`;
}
