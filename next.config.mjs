/** @type {import('next').NextConfig} */

// Allow CouchDB URL in Content-Security-Policy connect-src when sync is enabled
const couchdbUrl = process.env.NEXT_PUBLIC_COUCHDB_URL || '';
const couchdbConnectSrc = couchdbUrl ? ` ${couchdbUrl}` : '';

const isProd = process.env.NODE_ENV === 'production';

// Next.js requires 'unsafe-eval' in dev (HMR / react-refresh uses eval) and
// 'unsafe-inline' for the bootstrap script injection. In production we drop
// 'unsafe-eval' entirely; inline scripts are still needed by the Next.js
// runtime but we scope them with 'strict-dynamic' so only scripts loaded by
// already-trusted code execute.
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";

const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    // Filter managed paths that don't contain a package.json to avoid noisy
    // webpack cache warnings from empty optional dependency stubs.
    // Suppress noisy webpack cache warnings for platform-specific optional
    // dependency stubs (e.g. @next/swc-linux-x64-gnu on macOS).
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error',
    };

    if (!isServer) {
      // PouchDB needs these Node.js polyfills disabled in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com${couchdbConnectSrc}`,
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
