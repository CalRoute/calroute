import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://admin.calroute.me' : '',
}

export default nextConfig
