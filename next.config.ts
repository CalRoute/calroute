import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy Firebase's auth handler through calroute.me so signInWithPopup
  // works. When authDomain is set to calroute.me, the OAuth popup returns
  // to calroute.me/__/auth/handler (same origin) instead of
  // calroute-65ffe.firebaseapp.com (cross-origin), eliminating all COOP
  // and third-party storage issues.
  rewrites: async () => [
    {
      source: '/__/auth/:path*',
      destination: 'https://calroute-65ffe.firebaseapp.com/__/auth/:path*',
    },
    {
      source: '/__/firebase/:path*',
      destination: 'https://calroute-65ffe.firebaseapp.com/__/firebase/:path*',
    },
  ],
};

export default nextConfig;
