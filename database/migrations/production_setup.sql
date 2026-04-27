-- Run this ONCE on the production database after initial schema setup
-- Updates tenant domain and admin credentials for Rainbow Bakes

-- Update tenant domain
UPDATE tenants SET
  name = 'Rainbow Bakes',
  domain = 'rainbowbakes.in'
WHERE id = 1;

-- Update admin email (password stays the same: Admin@123)
UPDATE users SET
  email = 'admin@rainbowbakes.in'
WHERE tenant_id = 1 AND role = 'admin';
