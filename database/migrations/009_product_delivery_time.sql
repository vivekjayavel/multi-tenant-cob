-- Migration 009: Add delivery_time to products
ALTER TABLE products
  ADD COLUMN delivery_time VARCHAR(100) DEFAULT NULL
  COMMENT 'e.g. "2-3 hours", "Next day delivery", "Order 24hrs in advance"'
  AFTER description;
