-- Migration 006: Add customization_options to products
-- Run in MySQL:
ALTER TABLE products
  ADD COLUMN customization_options JSON DEFAULT NULL
  COMMENT 'Configurable options: weight, flavour, occasion dropdowns + special instructions'
  AFTER description;

-- Example value:
-- {
--   "weight":    { "enabled": true,  "label": "Weight",    "options": ["500g","1kg","2kg"] },
--   "flavour":   { "enabled": true,  "label": "Flavour",   "options": ["Chocolate","Vanilla","Strawberry"] },
--   "occasion":  { "enabled": true,  "label": "Occasion",  "options": ["Birthday","Anniversary","Wedding"] },
--   "message":   { "enabled": true,  "label": "Message on cake", "placeholder": "Happy Birthday John!" },
--   "instructions": { "enabled": true, "label": "Special Instructions", "placeholder": "Any allergies or preferences?" }
-- }
