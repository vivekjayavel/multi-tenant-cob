'use strict';
const path = require('path');
const os   = require('os');

const envPath = process.env.NODE_ENV === 'production'
  ? path.join(os.homedir(), 'app-config', '.env')
  : path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

const { validateEnv } = require('./backend/config/validateEnv');
validateEnv();

const express      = require('express');
const next         = require('next');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const compression  = require('compression');
const { logger }   = require('./backend/config/logger');

const authRoutes       = require('./backend/routes/authRoutes');
const productRoutes    = require('./backend/routes/productRoutes');
const orderRoutes      = require('./backend/routes/orderRoutes');
const uploadRoutes     = require('./backend/routes/uploadRoutes');
const paymentRoutes    = require('./backend/routes/paymentRoutes');
const settingsRoutes   = require('./backend/routes/settingsRoutes');
const seoRoutes        = require('./backend/routes/seoRoutes');
const superadminRoutes = require('./backend/routes/superadminRoutes');

const tenantMiddleware      = require('./backend/middleware/tenantMiddleware');
const errorHandler          = require('./backend/middleware/errorHandler');
const { generalApiLimiter } = require('./backend/middleware/rateLimiter');
const { fileLogger, winstonLogger, slowRequestDetector } = require('./backend/middleware/requestLogger');
const requestId             = require('./backend/middleware/requestId');

const dev    = process.env.NODE_ENV !== 'production';
const app    = next({ dev, dir: './frontend' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.set('trust proxy', 1);

  server.use(compression({ level: 6, threshold: 1024,
    filter: (req, res) => { if (req.headers.accept?.includes('text/event-stream')) return false; return compression.filter(req, res); },
  }));

  server.use(requestId);
  server.use(fileLogger);
  server.use(winstonLogger);
  server.use(slowRequestDetector);
  // CORS — allow all origins in dev, restrict in production
  server.use(cors({
    origin:      (origin, cb) => cb(null, true),
    credentials: true,
    methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Request-Id'],
    exposedHeaders: ['X-Request-Id','X-Cache'],
  }));

  // Cross-Origin-Resource-Policy — tells browser our API responses
  // are intentionally readable cross-origin (prevents CORB blocking)
  server.use('/api', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });

  server.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
  server.use('/api', express.json({ limit: '50kb' }));
  server.use(express.urlencoded({ extended: true, limit: '50kb' }));
  server.use(cookieParser());

  if (process.env.NODE_ENV === 'production') {
    server.use((req, res, next) => {
      const host  = req.headers.host || '';
      const proto = req.headers['x-forwarded-proto'] || 'http';
      if (proto === 'http') return res.redirect(301, `https://${host}${req.originalUrl}`);
      if (host.startsWith('www.')) return res.redirect(301, `https://${host.slice(4)}${req.originalUrl}`);
      next();
    });
  }

  const BLOCKED = [/^\/\.env/, /^\/backend\//, /^\/scripts\//, /^\/database\//, /^\/node_modules\//, /^\/logs\//, /^\/backups\//, /.*\.(sql|log|bak|gz)$/];
  server.use((req, res, next) => {
    const p = req.path.toLowerCase();
    for (const pat of BLOCKED) { if (pat.test(p)) return res.status(403).json({ success: false, message: 'Forbidden' }); }
    next();
  });

  server.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now(), env: process.env.NODE_ENV }));

  const uploadsPath = path.join(__dirname, 'uploads');
  server.use('/uploads', (req, res, next) => {
    // Use forward-slash split (not path.normalize which uses backslashes on Windows)
    const urlPath = req.path.replace(/\\/g, '/');
    // Block path traversal
    if (urlPath.includes('..')) return res.status(403).json({ success: false, message: 'Forbidden' });
    const ext = urlPath.slice(urlPath.lastIndexOf('.')).toLowerCase();
    if (!['.jpg','.jpeg','.png','.webp','.avif'].includes(ext)) return res.status(403).json({ success: false, message: 'Forbidden' });
    const parts = urlPath.split('/').filter(Boolean);
    // Expected: ['1', 'products', 'filename.jpg']
    if (parts.length < 3 || !/^\d+$/.test(parts[0])) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (!['products','logo','hero','banner'].includes(parts[1])) return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  }, express.static(uploadsPath, { maxAge: '7d', etag: true, index: false,
    setHeaders(res) { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Content-Security-Policy', "default-src 'none'"); },
  }));

  server.use('/api/superadmin', superadminRoutes);
  server.use('/', seoRoutes);
  server.use('/api', generalApiLimiter);
  server.use('/api', tenantMiddleware);
  server.use('/api/auth',     authRoutes);
  server.use('/api/products', productRoutes);
  server.use('/api/orders',   orderRoutes);
  server.use('/api/upload',   uploadRoutes);
  server.use('/api/payment',  paymentRoutes);
  server.use('/api/settings', settingsRoutes);
  server.use(errorHandler);
  // In dev API-only mode, redirect page requests to Next.js dev server
  if (process.env.API_ONLY === 'true') {
    const nextPort = parseInt(process.env.PORT || 3001) - 1;
    server.all('*', (req, res) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        return res.redirect(`http://localhost:${nextPort}${req.originalUrl}`);
      }
      res.status(404).json({ success: false, message: 'Not found' });
    });
  } else {
    server.all('*', (req, res) => handle(req, res));
  }

  const PORT = parseInt(process.env.PORT) || 3000;
  const httpServer = server.listen(PORT, () =>
    logger.info('Server started', { port: PORT, env: process.env.NODE_ENV, pid: process.pid })
  );

  // ── Forward WebSocket upgrades to Next.js HMR ──────────────
  // Express handles HTTP only. Without this, /_next/webpack-hmr
  // WebSocket never connects → HMR 404s → Fast Refresh full-reloads forever.
  if (dev) {
    const upgradeHandler = typeof app.getUpgradeHandler === 'function'
      ? app.getUpgradeHandler()
      : null;

    if (upgradeHandler) {
      httpServer.on('upgrade', (req, socket, head) => {
        if (req.url && req.url.startsWith('/_next/webpack-hmr')) {
          upgradeHandler(req, socket, head);
        }
      });
      logger.info('HMR WebSocket proxy enabled for development');
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const cron = require('node-cron');
    const { reconcilePendingOrders } = require('./backend/utils/queryOptimizer');
    const { releaseAbandonedOrders } = require('./scripts/release-abandoned-orders');
    setTimeout(() => reconcilePendingOrders(60).catch(err => logger.error('Reconciler failed', { error: err.message })), 10_000);
    cron.schedule('*/15 * * * *', () => releaseAbandonedOrders().catch(() => {}));
    cron.schedule('*/10 * * * *', () => reconcilePendingOrders(60).catch(() => {}));
  }
}).catch(err => { console.error('Failed to start:', err); process.exit(1); });
