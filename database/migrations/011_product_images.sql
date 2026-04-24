-- Migration 011: Add images JSON array to products
-- Stores up to 4 additional product images beyond image_url
ALTER TABLE products
  ADD COLUMN images JSON DEFAULT NULL
  COMMENT 'Additional product images: [{url: "/uploads/..."}] max 4'
  AFTER image_url;
