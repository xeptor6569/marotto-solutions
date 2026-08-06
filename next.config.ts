import type { NextConfig } from "next";

// APP_ENV, not NODE_ENV: the dev instance runs a production build so that it
// behaves like prod, and only APP_ENV distinguishes the two.
const isProductionEnv = (process.env.APP_ENV ?? "production").toLowerCase() === "production";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  // Readable client stack traces on non-production instances. Left off in prod
  // so the maps are not published alongside the bundles.
  productionBrowserSourceMaps: !isProductionEnv,
};

export default nextConfig;
