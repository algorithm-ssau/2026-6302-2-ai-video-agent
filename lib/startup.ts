type EnvCheck = {
  name: string;
  service: string;
  required?: boolean;
};

const ENV_CHECKS: EnvCheck[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", service: "supabase", required: true },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", service: "supabase", required: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", service: "supabase", required: true },
  { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", service: "clerk", required: true },
  { name: "CLERK_SECRET_KEY", service: "clerk", required: true },
  { name: "GROQ_API_KEY", service: "script-generation" },
  { name: "DEEPGRAM_API_KEY", service: "captions/tts" },
  { name: "FONADALABS_API_KEY", service: "tts" },
  { name: "HUGGING_FACE_API_KEY", service: "image-generation" },
  { name: "PLUNK_SECRET_KEY", service: "plunk" },
  { name: "PLUNK_FROM_EMAIL", service: "plunk" },
  { name: "NEXT_PUBLIC_APP_URL", service: "app-links" },
];

declare global {
  var __aiVideoAgentStartupLogged: boolean | undefined;
  var __aiVideoAgentEnvValidated: boolean | undefined;
  var __aiVideoAgentServicesLogged: Record<string, boolean> | undefined;
}

export function logAppStartup() {
  if (globalThis.__aiVideoAgentStartupLogged) return;
  globalThis.__aiVideoAgentStartupLogged = true;

  console.info("[startup] AI Video Agent app started", {
    nodeEnv: process.env.NODE_ENV || "unknown",
    nextRuntime: process.env.NEXT_RUNTIME || "nodejs",
  });
}

export function validateEnvironment() {
  if (globalThis.__aiVideoAgentEnvValidated) return;
  globalThis.__aiVideoAgentEnvValidated = true;

  const missing = ENV_CHECKS.filter((item) => !process.env[item.name]);
  if (missing.length === 0) {
    console.info("[startup] Environment validation passed");
    return;
  }

  for (const item of missing) {
    const level = item.required ? "required" : "optional";
    console.warn(
      `[startup] Missing ${level} environment variable ${item.name} for ${item.service}`,
    );
  }
}

export function logServiceInitialized(service: string, details?: Record<string, unknown>) {
  globalThis.__aiVideoAgentServicesLogged ??= {};
  if (globalThis.__aiVideoAgentServicesLogged[service]) return;
  globalThis.__aiVideoAgentServicesLogged[service] = true;

  console.info(`[startup] ${service} initialized`, details ?? {});
}
