import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  devIndicators: false,
  // Local development database (DATABASE_URL=pglite:…) loads its WASM from node_modules at runtime
  serverExternalPackages: ['@electric-sql/pglite'],
  // P1 Security: hide TypeScript source from browser DevTools in production
  productionBrowserSourceMaps: false,
  // Security headers (CSP, HSTS, Permissions-Policy, …) are set in src/proxy.ts only,
  // so there is one policy per route instead of two conflicting ones.
  // API routes are same-origin only: no CORS headers are sent, so browsers block cross-site calls.
  async headers() {
    return [
      {
        // Immutable cache for static animation frames
        source: '/frames/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
