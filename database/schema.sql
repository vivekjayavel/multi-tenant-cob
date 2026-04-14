CREATE DATABASE IF NOT EXISTS bakery_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bakery_platform;

CREATE TABLE tenants (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(150)  NOT NULL,
  domain               VARCHAR(255)  NOT NULL,
  logo_url             VARCHAR(500)  DEFAULT NULL,
  theme_color          VARCHAR(7)    NOT NULL DEFAULT '#D97706',
  whatsapp_number      VARCHAR(20)   DEFAULT NULL,
  razorpay_key_id      VARCHAR(100)  DEFAULT NULL,
  razorpay_key_secret  VARCHAR(500)  DEFAULT NULL,
  is_active            TINYINT(1)    NOT NULL DEFAULT 1,
  created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenants_domain (domain),
  KEY idx_tenants_domain_active (domain, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id      INT UNSIGNED NOT NULL,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  password       VARCHAR(255) NOT NULL,
  role           ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  token_version  INT UNSIGNED NOT NULL DEFAULT 0,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_tenant_email (tenant_id, email),
  KEY idx_users_tenant_id (tenant_id),
  KEY idx_users_tenant_role_active (tenant_id, role, is_active),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id            INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT UNSIGNED   NOT NULL,
  name          VARCHAR(200)   NOT NULL,
  description   TEXT           DEFAULT NULL,
  price         DECIMAL(10,2)  NOT NULL,
  image_url     VARCHAR(500)   DEFAULT NULL,
  category      VARCHAR(100)   DEFAULT NULL,
  slug          VARCHAR(220)   NOT NULL,
  is_active     TINYINT(1)     NOT NULL DEFAULT 1,
  stock_qty     INT UNSIGNED   NOT NULL DEFAULT 0,
  reserved_qty  INT UNSIGNED   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_tenant_slug (tenant_id, slug),
  KEY idx_products_tenant_active_date (tenant_id, is_active, created_at DESC),
  KEY idx_products_tenant_category (tenant_id, category, is_active),
  CONSTRAINT fk_products_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_reserved_lte_stock CHECK (reserved_qty <= stock_qty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id                  INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  tenant_id           INT UNSIGNED   NOT NULL,
  user_id             INT UNSIGNED   NOT NULL,
  total_price         DECIMAL(10,2)  NOT NULL,
  status              ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  payment_id          VARCHAR(100)   DEFAULT NULL,
  razorpay_order_id   VARCHAR(100)   DEFAULT NULL,
  payment_signature   VARCHAR(255)   DEFAULT NULL,
  delivery_address    TEXT           DEFAULT NULL,
  notes               TEXT           DEFAULT NULL,
  created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_orders_tenant_status_date (tenant_id, status, created_at DESC),
  KEY idx_orders_tenant_user_date (tenant_id, user_id, created_at DESC),
  KEY idx_orders_razorpay_order_id (razorpay_order_id),
  CONSTRAINT fk_orders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orders_user   FOREIGN KEY (user_id)   REFERENCES users   (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id            INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  order_id      INT UNSIGNED   NOT NULL,
  product_id    INT UNSIGNED   NOT NULL,
  quantity      INT UNSIGNED   NOT NULL DEFAULT 1,
  price         DECIMAL(10,2)  NOT NULL,
  product_name  VARCHAR(200)   NOT NULL,
  KEY idx_order_items_order_id   (order_id),
  KEY idx_order_items_product_id (product_id),
  CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders   (id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: first tenant for local development
INSERT INTO tenants (name, domain, theme_color, whatsapp_number)
VALUES ('Sweet Cakes', 'localhost', '#D97706', '919876543210');

-- Seed: admin user (password: Admin@123)
INSERT INTO users (tenant_id, name, email, password, role)
VALUES (1, 'Admin User', 'admin@sweetcakes.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2Xk4oZ5GIy', 'admin');

-- Seed: sample products
INSERT INTO products (tenant_id, name, description, price, category, slug, stock_qty) VALUES
  (1, 'Chocolate Truffle Cake', 'Rich dark chocolate layers with ganache topping.', 799.00, 'Cakes', 'chocolate-truffle-cake', 50),
  (1, 'Red Velvet Cupcakes',    'Classic red velvet with cream cheese frosting — set of 6.', 349.00, 'Cupcakes', 'red-velvet-cupcakes', 100),
  (1, 'Butter Croissant',       'Flaky, buttery croissants baked fresh every morning.', 85.00, 'Breads', 'butter-croissant', 200),
  (1, 'Mango Cheesecake',       'No-bake mango cheesecake with alphonso mango compote.', 649.00, 'Cakes', 'mango-cheesecake', 30);
