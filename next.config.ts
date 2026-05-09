import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["viaduct.proxy.rlwy.net"],
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "esbuild", "@esbuild/win32-x64"],
};

export default nextConfig;
