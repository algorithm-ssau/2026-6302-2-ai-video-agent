import { logAppStartup, validateEnvironment } from "./lib/startup";

export async function register() {
  logAppStartup();
  validateEnvironment();
}

