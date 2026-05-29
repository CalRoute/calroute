import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      // Allow popups on the login page so Firebase signInWithPopup works.
      // Next.js sets COOP: same-origin by default which blocks cross-origin
      // window messaging. same-origin-allow-popups lets the Google auth
      // popup close and pass the credential back.
      source: '/login',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      ],
    },
  ],
};

export default nextConfig;
