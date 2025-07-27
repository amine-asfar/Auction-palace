import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable React Strict Mode to prevent double mounting in development
  images: {
    domains: ["images.unsplash.com","images.pexels.com","plus.unsplash.com"],
  },
};

export default nextConfig;
