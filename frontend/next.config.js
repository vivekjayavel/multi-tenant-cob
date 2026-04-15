const path = require('path');
const fs   = require('fs');

// Load .env from project root (parent of frontend/)
// This ensures env vars are available when running 'next dev frontend'
const rootEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
  // Tell Next.js these packages are only used server-side (in getServerSideProps)
  // and should never be bundled for the client
  serverComponentsExternalPackages: [
    'mysql2', 'bcryptjs', 'jsonwebtoken', 'winston', 'winston-daily-rotate-file',
    'lru-cache', 'nodemailer', 'razorpay', 'slugify', 'sharp', 'archiver',
    'node-cron', 'morgan', 'express',
    ],
  },
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 60,
    deviceSizes: [375, 640, 750, 828, 1080, 1200],
    imageSizes:  [16, 32, 64, 96, 128, 256, 384],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['warn', 'error'] } : false,
  },


  async rewrites() {
    // In development, proxy /api and /uploads to Express on port 3001
    // In production, Express serves everything on one port (no proxy needed)
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_API_URL) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return [
        { source: '/api/:path*',     destination: `${apiBase}/api/:path*`     },
        { source: '/uploads/:path*', destination: `${apiBase}/uploads/:path*` },
        { source: '/health',         destination: `${apiBase}/health`         },
      ];
    }
    return [];
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';

    // In development, Next.js needs 'unsafe-eval' for hot module replacement
    // In production, we keep it strict
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://*.razorpay.com"
      : "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com https://*.razorpay.com";

    // In development, allow webpack HMR websocket connections
    const connectSrc = isDev
      ? "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://cdn.razorpay.com https://*.razorpay.com ws://localhost:* http://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com"
      : "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://cdn.razorpay.com https://*.razorpay.com https://fonts.googleapis.com";

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',  value: 'nosniff'   },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          {
            key:   'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              connectSrc,
              "frame-src https://api.razorpay.com https://checkout.razorpay.com https://cdn.razorpay.com https://*.razorpay.com",
            ].join('; '),
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/uploads/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }],
      },
    ];
  },

  webpack(config, { isServer, webpack }) {
    // ── Server-side: mark all backend Node modules as external ──────────
    // This prevents Next.js from trying to bundle mysql2, bcryptjs, etc.
    // These are only used in getServerSideProps which runs on the server.
    if (isServer) {
      // Keep existing externals and add backend packages
      const existingExternals = Array.isArray(config.externals)
        ? config.externals : [config.externals].filter(Boolean);

      config.externals = [
        ...existingExternals,
        // Database & auth
        'mysql2', 'mysql2/promise',
        'bcryptjs', 'jsonwebtoken',
        // Logging
        'winston', 'winston-daily-rotate-file',
        // Cache
        'lru-cache',
        // Email
        'nodemailer',
        // Payment
        'razorpay',
        // Utilities
        'slugify', 'sharp', 'archiver', 'node-cron',
        // Node built-ins that might be resolved oddly
        'fs', 'path', 'crypto', 'os', 'dns', 'net', 'tls',
      ];
    }

    // ── Client-side: provide browser-safe fallbacks ──────────────────────
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:     false,
        path:   false,
        crypto: false,
        os:     false,
        net:    false,
        tls:    false,
        dns:    false,
      };
    }

    // Suppress dynamic require warnings from backend modules in pages
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;
