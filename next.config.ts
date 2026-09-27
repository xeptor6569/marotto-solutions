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
  experimental: {
    serverActions: {
      // Uploads go through server actions: logos (2 MB), job attachments
      // (20 MB), and full backup archives on restore. The default is 1 MB.
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
