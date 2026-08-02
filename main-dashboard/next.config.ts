import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@videon/sdk", "@videon/player", "@vidstack/react", "vidstack"],
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    remotePatterns: [
      {
        hostname: "img.clerk.com",
      },
      {
        hostname: "i.pravatar.cc",
      },
      {
        hostname: "ik.imagekit.io",
      },
      {
        hostname: "videon-bucket.s3.ap-south-1.amazonaws.com",
      }
    ],
  },
};

export default nextConfig;
