// next.config.js
import nextPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const withPWA = nextPWA({
  dest: "public", // onde o service worker vai ser gerado
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // desabilita no dev
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    allowedDevOrigins: [
      "http://10.200.200.10",
      "http://10.200.200.22",
    ], // substitua pelo IP ou domínio necessário
  },
};

export default withPWA(nextConfig);
