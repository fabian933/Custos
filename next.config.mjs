/** @type {import('next').NextConfig} */
const nextConfig = {
  // The circuit artifacts are read from disk at runtime, so they must be traced into the
  // serverless bundle for the API routes that prove and verify.
  experimental: {
    outputFileTracingIncludes: {
      "/api/query": ["./zk/**"],
      "/api/verify": ["./zk/**"],
    },
  },
};

export default nextConfig;
