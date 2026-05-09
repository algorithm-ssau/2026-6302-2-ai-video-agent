import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway proxy origin is allowed for local/dev browser access.
  allowedDevOrigins: ["viaduct.proxy.rlwy.net"],
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "esbuild", "@esbuild/win32-x64"],
};

export default nextConfig;
