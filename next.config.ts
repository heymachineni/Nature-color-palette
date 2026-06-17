import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  /** Static export only for Firebase deploy — dev stays dynamic for 10k+ bird pages. */
  ...(isStaticExport ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "inaturalist-open-data.s3.amazonaws.com" },
      { protocol: "https", hostname: "static.inaturalist.org" },
      { protocol: "https", hostname: "cdn.download.ams.birds.cornell.edu" },
      { protocol: "https", hostname: "birdnet.cornell.edu" },
    ],
  },
};

export default nextConfig;
