'use strict';
const path = require('path');
const fs   = require('fs');
const SIZES = { full: { width: 800, height: 800 }, card: { width: 600, height: 400 }, thumb: { width: 400, height: 400 } };
async function processProductImage(filePath) {
  let sharp;
  try { sharp = require('sharp'); } catch { return { full: _toUrl(filePath), card: _toUrl(filePath), thumb: _toUrl(filePath) }; }
  const dir = path.dirname(filePath), base = path.basename(filePath, path.extname(filePath));
  const variants = {};
  for (const [name, dims] of Object.entries(SIZES)) {
    const outPath = path.join(dir, `${base}_${name}.webp`);
    await sharp(filePath).resize(dims.width, dims.height, { fit: 'cover', position: 'centre' }).webp({ quality: 85 }).toFile(outPath);
    variants[name] = _toUrl(outPath);
  }
  fs.unlink(filePath, () => {});
  return variants;
}
function _toUrl(abs) { const rel = abs.split(/[/\\\\]uploads[/\\\\]/)[1]; return rel ? `/uploads/${rel.replace(/\\\\/g, '/')}` : abs; }
module.exports = { processProductImage };
