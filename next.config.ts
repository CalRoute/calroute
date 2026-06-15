import type { NextConfig } from "next";

const ADMIN_SUBDOMAIN = process.env.ADMIN_SUBDOMAIN_URL ?? 'https://admin.calroute.me'

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
  // When ADMIN_CUTOVER=true, redirect /dashboard/admin/* to the subdomain.
  // Leave unset during transition so both paths work.
  ...(process.env.ADMIN_CUTOVER === 'true' ? {
    redirects: async () => [
      {
        source: '/dashboard/admin',
        destination: ADMIN_SUBDOMAIN,
        permanent: false,
      },
      {
        source: '/dashboard/admin/:path*',
        destination: `${ADMIN_SUBDOMAIN}/dashboard/:path*`,
        permanent: false,
      },
    ],
  } : {}),
};

export default nextConfig;
