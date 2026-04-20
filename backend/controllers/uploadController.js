'use strict';
const path = require('path');
const fs   = require('fs');
const db   = require('../config/db');
const { ok, fail }   = require('../utils/responseUtils');
const { logger }     = require('../config/logger');

// Try to resize large images with sharp if available
// Falls back to serving original if sharp fails or is not installed
async function optimizeImage(filePath) {
  const MAX_WIDTH  = 1200;
  const MAX_HEIGHT = 1200;

  try {
    const sharp = require('sharp');
    const meta  = await sharp(filePath).metadata();

    // Only process if image is larger than max dimensions
    const needsResize = (meta.width > MAX_WIDTH) || (meta.height > MAX_HEIGHT);

    const outPath = filePath.replace(/\.[^.]+$/, '.webp');

    await sharp(filePath)
      .resize(
        needsResize ? MAX_WIDTH  : meta.width,
        needsResize ? MAX_HEIGHT : meta.height,
        { fit: 'inside', withoutEnlargement: true }
      )
      .webp({ quality: 85 })
      .toFile(outPath);

    // Delete original only if it's a different file
    if (outPath !== filePath) {
      fs.unlink(filePath, () => {});
    }

    return {
      path:     outPath,
      filename: path.basename(outPath),
    };
  } catch (err) {
    // sharp not installed or failed — serve original file as-is
    logger.warn('Image optimization skipped, serving original', {
      file:  path.basename(filePath),
      error: err.message,
    });
    return {
      path:     filePath,
      filename: path.basename(filePath),
    };
  }
}

// ── Product image ──────────────────────────────────────────────────
exports.productImage = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);

    const tenantId = req.tenant.id;
    const optimized = await optimizeImage(req.file.path);
    const relativePath = [String(tenantId), 'products', optimized.filename]
      .join('/');
    const publicUrl = `/uploads/${relativePath}`;

    // If product_id given, update existing product's image
    if (req.body.product_id) {
      const productId = parseInt(req.body.product_id, 10);
      const [rows] = await db.query(
        'SELECT image_url FROM products WHERE id = ? AND tenant_id = ? LIMIT 1',
        [productId, tenantId]
      );
      if (rows[0]?.image_url) _deleteOldFile(rows[0].image_url);
      await db.query(
        'UPDATE products SET image_url = ? WHERE id = ? AND tenant_id = ?',
        [publicUrl, productId, tenantId]
      );
    }

    const sizeKB = Math.round(fs.statSync(optimized.path).size / 1024);
    logger.info('Product image uploaded', { tenantId, url: publicUrl, sizeKB });
    ok(res, { url: publicUrl, filename: optimized.filename, size: sizeKB * 1024 }, 'Image uploaded', 201);
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// ── Logo ───────────────────────────────────────────────────────────
exports.logo = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);

    const tenantId  = req.tenant.id;
    const optimized = await optimizeImage(req.file.path);
    const relativePath = [String(tenantId), 'logo', optimized.filename]
      .join('/');
    const publicUrl = `/uploads/${relativePath}`;

    // Delete previous logo
    const [rows] = await db.query(
      'SELECT logo_url FROM tenants WHERE id = ? LIMIT 1',
      [tenantId]
    );
    if (rows[0]?.logo_url) _deleteOldFile(rows[0].logo_url);

    // Persist new logo URL
    await db.query(
      'UPDATE tenants SET logo_url = ? WHERE id = ?',
      [publicUrl, tenantId]
    );

    const sizeKB = Math.round(fs.statSync(optimized.path).size / 1024);
    logger.info('Logo uploaded', { tenantId, url: publicUrl, sizeKB });
    ok(res, { url: publicUrl }, 'Logo uploaded', 201);
  } catch (err) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// ── Helpers ────────────────────────────────────────────────────────
function _deleteOldFile(publicUrl) {
  if (!publicUrl) return;
  const rel = publicUrl.replace(/^\/uploads\//, '');
  const abs = path.join(__dirname, '../../uploads', rel);
  fs.unlink(abs, err => {
    if (err && err.code !== 'ENOENT') {
      logger.warn('Could not delete old upload', { path: abs, error: err.message });
    }
  });
}
