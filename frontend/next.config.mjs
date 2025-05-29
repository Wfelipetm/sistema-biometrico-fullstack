/** @type {import('next').NextConfig} */
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
      'http://10.200.200.10',
      'http://10.200.200.22',
    ], // substitua pelo IP ou domínio necessário
  },
}

export default nextConfig
