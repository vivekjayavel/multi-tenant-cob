'use strict';
const path   = require('path');
const fs     = require('fs');
const db     = require('../config/db');
const { ok, fail } = require('../utils/responseUtils');
const { logger }   = require('../config/logger');

// Max dimensions for uploaded images
const MAX_WIDTH  = 1200;
const MAX_HEIGHT = 1200;
const QUALITY    = 85;

async function optimizeImage(filePath) {
  try {
    const sharp = require('sharp');
    const meta  = await sharp(filePath).metadata();
    const needsResize = meta.width > MAX_WIDTH || meta.height > MAX_HEIGHT;

    // Convert to WebP and resize if needed
    const outPath = filePath.replace(/\.[^.]+$/, '.webp');
    await sharp(filePath)
      .resize(needsResize ? MAX_WIDTH : undefined, needsResize ? MAX_HEIGHT : undefined, {
        fit: 'inside', withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toFile(outPath);

    // Remove original if it's different from output
    if (outPath !== filePath) fs.unlink(filePath, () => {});

    return { path: outPath, filename: path.basename(outPath) };
  } catch (err) {
    // sharp not available or failed — serve original
    logger.warn('Image optimization skipped', { error: err.message });
    return { path: filePath, filename: path.basename(filePath) };
  }
}

exports.productImage = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);
    const tenantId = req.tenant.id;

    // Optimize image
    const optimized    = await optimizeImage(req.file.path);
    const relativePath = path.join(String(tenantId), 'products', optimized.filename).replace(/\\/g, '/');
    const publicUrl    = `/uploads/${relativePath}`;

    if (req.body.product_id) {
      const productId = parseInt(req.body.product_id);
      const [rows] = await db.query(
        'SELECT image_url FROM products WHERE id = ? AND tenant_id = ? LIMIT 1',
        [productId, tenantId]
      );
      if (rows.length && rows[0].image_url) _deleteOldFile(rows[0].image_url);
      await db.query(
        'UPDATE products SET image_url = ? WHERE id = ? AND tenant_id = ?',
        [publicUrl, productId, tenantId]
      );
    }

    const stats = fs.statSync(optimized.path);
    logger.info('Product image uploaded', { tenantId, url: publicUrl, sizeKB: Math.round(stats.size / 1024) });
    ok(res, { url: publicUrl, filename: optimized.filename, size: stats.size }, 'Image uploaded', 201);
  } catch (err) { next(err); }
};

exports.logo = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);
    const tenantId = req.tenant.id;

    const optimized    = await optimizeImage(req.file.path);
    const relativePath = path.join(String(tenantId), 'logo', optimized.filename).replace(/\\/g, '/');
    const publicUrl    = `/uploads/${relativePath}`;

    const [rows] = await db.query('SELECT logo_url FROM tenants WHERE id = ? LIMIT 1', [tenantId]);
    if (rows.length && rows[0].logo_url) _deleteOldFile(rows[0].logo_url);
    await db.query('UPDATE tenants SET logo_url = ? WHERE id = ?', [publicUrl, tenantId]);

    logger.info('Logo uploaded', { tenantId, url: publicUrl });
    ok(res, { url: publicUrl }, 'Logo uploaded', 201);
  } catch (err) { next(err); }
};

function _deleteOldFile(publicUrl) {
  if (!publicUrl) return;
  const rel = publicUrl.replace(/^\/uploads\//, '');
  const abs = path.join(__dirname, '../../uploads', rel);
  fs.unlink(abs, (err) => {
    if (err && err.code !== 'ENOENT')
      logger.warn('Could not delete old file', { path: abs, error: err.message });
  });
}
