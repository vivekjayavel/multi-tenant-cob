-- Migration 005: Add tenant_settings JSON column for dynamic content management
-- Run this SQL in your MySQL database:

ALTER TABLE tenants
  ADD COLUMN tenant_settings JSON DEFAULT NULL COMMENT 'Dynamic settings: hero, features, footer, etc.'
  AFTER whatsapp_number;

-- Default settings structure (optional seed):
-- UPDATE tenants SET tenant_settings = JSON_OBJECT(
--   'hero', JSON_OBJECT(
--     'badge', 'Fresh Baked Daily',
--     'heading', 'Handcrafted with Love & Butter',
--     'subheading', 'From our oven to your table — every cake, croissant and pastry is baked fresh each morning.',
--     'cta_primary', 'Explore Menu',
--     'cta_whatsapp', 'Order via WhatsApp',
--     'stats', JSON_ARRAY(
--       JSON_OBJECT('value', '500+', 'label', 'Happy customers'),
--       JSON_OBJECT('value', '50+',  'label', 'Menu items'),
--       JSON_OBJECT('value', '100%', 'label', 'Fresh daily')
--     )
--   ),
--   'features', JSON_ARRAY(
--     JSON_OBJECT('icon', '🌾', 'title', 'Real Ingredients',  'desc', 'No preservatives, no shortcuts. Every recipe uses premium, natural ingredients.'),
--     JSON_OBJECT('icon', '⏰', 'title', 'Baked Fresh Daily', 'desc', 'Everything is baked fresh every morning. We never sell day-old products.'),
--     JSON_OBJECT('icon', '🚚', 'title', 'Same-Day Delivery', 'desc', 'Order before noon and get delivery by evening within the city.')
--   ),
--   'footer', JSON_OBJECT(
--     'tagline', 'Fresh baked goods crafted with love and the finest ingredients.',
--     'address', '',
--     'email', '',
--     'hours', '',
--     'links', JSON_ARRAY(
--       JSON_OBJECT('label', 'Home',    'href', '/'),
--       JSON_OBJECT('label', 'Menu',    'href', '/products'),
--       JSON_OBJECT('label', 'Cart',    'href', '/cart'),
--       JSON_OBJECT('label', 'Account', 'href', '/login')
--     )
--   ),
--   'seo', JSON_OBJECT(
--     'meta_title', '',
--     'meta_description', ''
--   )
-- ) WHERE id = 1;
