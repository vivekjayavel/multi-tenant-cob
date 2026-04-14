/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: 'localhost' }],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 60,
    deviceSizes: [375, 640, 750, 828, 1080, 1200],
    imageSizes:  [16, 32, 64, 96, 128, 256, 384],
  },
  compiler: { removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['warn', 'error'] } : false },
  async headers() {
    return [
      { source: '/(.*)', headers: [
        { key: 'X-Frame-Options',       value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff'   },
        { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        { key: 'Content-Security-Policy', value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://api.razorpay.com",
          "frame-src https://api.razorpay.com",
        ].join('; ') },
      ]},
      { source: '/_next/static/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/uploads/(.*)',       headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }] },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false, os: false };
      config.module = config.module || {};
      config.module.exprContextCritical = false;
    }
    return config;
  },
};
module.exports = nextConfig;
