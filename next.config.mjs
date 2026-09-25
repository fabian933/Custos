/** @type {import('next').NextConfig} */
const nextConfig = {
  // The circuit artifacts are read from disk at runtime, so they must be traced into the
  // serverless bundle for the API routes that prove and verify.
  experimental: {
    // snarkjs/ffjavascript resolve their workers at runtime; bundling them breaks proving.
    serverComponentsExternalPackages: ["snarkjs"],
    outputFileTracingIncludes: {
      "/api/query": ["./zk/**"],
      "/api/verify": ["./zk/**"],
    },
  },
};

export default nextConfig;
