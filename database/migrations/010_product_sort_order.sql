-- Migration 010: Add sort_order to products for admin-controlled display order
ALTER TABLE products
  ADD COLUMN sort_order INT UNSIGNED NOT NULL DEFAULT 0
  COMMENT 'Display priority within category (0 = default, lower = higher priority)'
  AFTER category;
