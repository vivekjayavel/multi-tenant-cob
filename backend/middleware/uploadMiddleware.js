'use strict';
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg','image/jpg','image/png','image/webp']);
const MAGIC_BYTES = [
  { mime: 'image/jpeg', offset: 0, bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
];

function detectMime(buffer) {
  for (const sig of MAGIC_BYTES) {
    const slice = [...buffer.slice(sig.offset, sig.offset + sig.bytes.length)];
    if (sig.bytes.every((b, i) => b === slice[i])) return sig.mime;
  }
  return null;
}

const createdDirs = new Set();
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '../../uploads', String(req.tenant.id), req.uploadType || 'products');
    if (!createdDirs.has(dir)) { fs.mkdirSync(dir, { recursive: true }); createdDirs.add(dir); }
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = ({ 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' })[file.mimetype] || '.jpg';
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) { const err = new Error('Invalid file type'); err.code = 'INVALID_FILE_TYPE'; return cb(err, false); }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE_BYTES, files: 1 } });

async function validateMagicBytes(req, res, next) {
  if (!req.file) return next();
  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(req.file.path, 'r');
  fs.readSync(fd, buffer, 0, 12, 0); fs.closeSync(fd);
  const detected = detectMime(buffer);
  if (!detected) {
    fs.unlink(req.file.path, () => {});
    const err = new Error('File content does not match declared type'); err.code = 'INVALID_FILE_TYPE';
    return next(err);
  }
  req.file.detectedMime = detected;
  next();
}

module.exports = { upload, validateMagicBytes };
