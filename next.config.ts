import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "esbuild", "@esbuild/win32-x64"],
};

export default nextConfig;
