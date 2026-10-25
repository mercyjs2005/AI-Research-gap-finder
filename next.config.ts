import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingRoot: process.cwd(),
};

export default withWorkflow(nextConfig);
