import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Increase default 10MB request-body cap for large sales file uploads.
    proxyClientMaxBodySize: "50mb",
  },
  serverExternalPackages: [
    '@react-email/components',
    '@react-email/render'
  ]
};

export default nextConfig;
