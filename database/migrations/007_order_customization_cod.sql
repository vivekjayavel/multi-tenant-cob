-- Migration 007: Add customization_details to order_items, payment_method to orders

ALTER TABLE order_items
  ADD COLUMN customization_details JSON DEFAULT NULL
  COMMENT 'Customer customization choices: weight, flavour, occasion, message, instructions'
  AFTER product_name;

ALTER TABLE orders
  ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'online'
  COMMENT 'online | cod'
  AFTER notes;

-- Update existing orders to have 'online' payment method
UPDATE orders SET payment_method = 'online' WHERE payment_method = '' OR payment_method IS NULL;
