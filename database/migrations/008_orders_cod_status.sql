-- Migration 008: Add COD statuses to orders.status ENUM
ALTER TABLE orders
  MODIFY COLUMN status
  ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded','cod_pending','cod_confirmed')
  NOT NULL DEFAULT 'pending';
