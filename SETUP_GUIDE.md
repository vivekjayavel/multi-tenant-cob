# 🎂 Multi-Tenant Bakery Platform — Complete Setup Guide

## Table of Contents
1. [Requirements](#1-requirements)
2. [Fresh Server Installation](#2-fresh-server-installation)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Setup](#4-database-setup)
5. [Running in Development](#5-running-in-development)
6. [Production Deployment (Hostinger)](#6-production-deployment-hostinger)
7. [First Tenant Setup](#7-first-tenant-setup)
8. [Branding & Customisation](#8-branding--customisation)
9. [Admin Panel Guide](#9-admin-panel-guide)
10. [Adding More Tenants](#10-adding-more-tenants)
11. [Maintenance & Backups](#11-maintenance--backups)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Requirements

| Software | Version | Check |
|---|---|---|
| Node.js | 18.x (LTS) | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL | 8.0+ | `mysql --version` |
| Git | Any | `git --version` |

> ⚠️ Node.js 20+ is not supported. Install Node.js 18 LTS from https://nodejs.org

---

## 2. Fresh Server Installation

### Windows (Local Development)

```powershell
# Clone the repository
git clone https://github.com/vivekjayavel/multi-tenant-cob.git
cd multi-tenant-cob

# Install dependencies
npm install

# Create upload directories for tenant 1
mkdir uploads\1\products
mkdir uploads\1\logo
mkdir uploads\1\hero
mkdir uploads\1\banner
```

### Linux / Hostinger (Production)

```bash
# Clone repository
git clone https://github.com/vivekjayavel/multi-tenant-cob.git
cd multi-tenant-cob

# Install dependencies (production only)
npm install --production

# Create upload directories
mkdir -p uploads/1/{products,logo,hero,banner}
chmod -R 755 uploads/

# Install PM2 globally for process management
npm install -g pm2
```

---

## 3. Environment Configuration

### Step 1 — Copy the example file

**Windows:**
```powershell
copy .env.example .env
notepad .env
```

**Linux:**
```bash
cp .env.example .env
nano .env
```

### Step 2 — Generate secure secrets

Run these commands and paste the outputs into `.env`:

```bash
# JWT_SECRET (run once)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# SUPERADMIN_JWT_SECRET (run again — must be different)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# SUPERADMIN_SECRET (run again)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_KEY (exactly 64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3 — Fill in .env values

```env
# ── Application ───────────────────────────────────
NODE_ENV=production          # 'development' for local
PORT=3000                    # Port your app runs on

# Development only (remove in production)
NEXT_PUBLIC_API_URL=http://localhost:3001

# ── Database ──────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=bakery_platform

# ── Security (use generated values above) ─────────
JWT_SECRET=<paste 96-char hex here>
JWT_EXPIRES_IN=7d
SUPERADMIN_SECRET=<paste 64-char hex here>
SUPERADMIN_JWT_SECRET=<paste different 96-char hex here>
SUPERADMIN_DOMAIN=manage.yourdomain.com  # subdomain for superadmin

# ── Encryption (for Razorpay keys at rest) ────────
ENCRYPTION_KEY=<paste exactly 64 hex chars here>

# ── Email (Hostinger / any SMTP) ──────────────────
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
SMTP_FROM_NAME=Your Bakery Name
SMTP_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com

# ── Razorpay ──────────────────────────────────────
RAZORPAY_WEBHOOK_SECRET=<from Razorpay dashboard>

# ── File Uploads ──────────────────────────────────
MAX_FILE_SIZE_MB=5
ABANDON_TIMEOUT_MINUTES=60
LOG_LEVEL=info
```

---

## 4. Database Setup

### Create the database

**Windows (PowerShell):**
```powershell
# Open MySQL
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p

# Inside MySQL:
CREATE DATABASE IF NOT EXISTS bakery_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bakery_platform;

# Import schema (inside MySQL shell)
source C:/path/to/multi-tenant-cob/database/schema.sql

# Verify
SHOW TABLES;
SELECT id, name, domain FROM tenants;
exit
```

**Linux:**
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS bakery_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p bakery_platform < database/schema.sql
```

### Default credentials after schema import

| Field | Value |
|---|---|
| URL | http://localhost:3000/login |
| Email | admin@sweetcakes.com |
| Password | Admin@123 |

> ⚠️ Change these immediately after first login via Admin → Settings → Branding

### Update admin password (important!)

```sql
-- Connect to MySQL first, then:
UPDATE users
SET password = '$2a$12$3LmDVrZcoBgLPkTuTuj4QOYtKIEjtNUTgNkt8jpnXpSaVE4snZfVy'
WHERE email = 'admin@sweetcakes.com';
```

> The hash above is for `Admin@123`. Generate your own:
> ```bash
> node -e "require('bcryptjs').hash('YourNewPassword', 12).then(h => console.log(h))"
> ```

---

## 5. Running in Development

Development requires **two terminal windows**:

### Terminal 1 — Express API (port 3001)
```powershell
npm run dev:api
```
Wait for: `Server started {"port":3001}`

### Terminal 2 — Next.js Frontend (port 3000)
```powershell
npm run dev
```
Wait for: `✓ Ready on http://localhost:3000`

### Open in browser
```
http://localhost:3000          → Storefront
http://localhost:3000/login    → Admin login
http://localhost:3000/admin    → Admin panel
```

### Stop both servers
Press `Ctrl+C` in each terminal.

### After pulling updates
```powershell
git pull origin main
# Restart Terminal 1 (dev:api) for backend changes
# Terminal 2 (next dev) auto-reloads frontend changes
```

---

## 6. Production Deployment (Hostinger)

### Step 1 — Upload files via File Manager or SSH

```bash
# SSH into Hostinger
ssh u123456789@your-server.hostinger.com

# Navigate to public_html
cd ~/public_html

# Clone or upload your project
git clone https://github.com/vivekjayavel/multi-tenant-cob.git .
```

### Step 2 — Install dependencies

```bash
npm install --production
```

### Step 3 — Configure environment

```bash
# Store .env outside public_html for security
mkdir ~/app-config
nano ~/app-config/.env
# Paste your production .env values
```

Update `server.js` already handles this:
```js
const envPath = process.env.NODE_ENV === 'production'
  ? path.join(os.homedir(), 'app-config', '.env')
  : path.join(__dirname, '.env');
```

### Step 4 — Build the frontend

```bash
npm run build
```

### Step 5 — Start with PM2

```bash
# Copy ecosystem config
cp ecosystem.config.js ~/public_html/

# Edit it to match your paths
nano ecosystem.config.js

# Start the app
pm2 start ecosystem.config.js --env production

# Save PM2 config to restart on server reboot
pm2 save
pm2 startup
```

### Step 6 — Point domain to your app

In Hostinger hPanel:
- Go to **Domains → Manage → DNS Zone**
- Add A record pointing to your server IP
- Enable SSL from **SSL → Install**
- Set up reverse proxy: port 80/443 → 3000

### Step 7 — Set up cron for backups (optional)

```bash
crontab -e

# Add daily backup at 2am
0 2 * * * cd ~/public_html && node scripts/backup.js >> ~/app-logs/backup.log 2>&1

# Weekly backup on Sunday at 3am
0 3 * * 0 cd ~/public_html && node scripts/backup.js --weekly >> ~/app-logs/backup.log 2>&1
```

---

## 7. First Tenant Setup

After installation, one tenant ("Sweet Cakes") is pre-configured for `localhost`. Here's how to set up your real bakery:

### Via Admin Panel (recommended)

1. Go to `http://yourdomain.com/login`
2. Login with `admin@sweetcakes.com` / `Admin@123`
3. Go to **Settings → Branding** and update everything

### Via Superadmin Panel (for multiple tenants)

```
http://manage.yourdomain.com/api/superadmin/login
```

```json
POST /api/superadmin/login
{ "secret": "your_SUPERADMIN_SECRET_from_env" }
```

Then:
```json
POST /api/superadmin/tenants
{
  "name": "My Bakery",
  "domain": "mybakery.com",
  "theme_color": "#D97706",
  "whatsapp_number": "919876543210",
  "razorpay_key_id": "rzp_live_xxxx",
  "razorpay_key_secret": "your_secret"
}
```

Seed an admin user:
```json
POST /api/superadmin/tenants/1/seed-admin
{
  "name": "Admin",
  "email": "admin@mybakery.com",
  "password": "YourSecurePassword@123"
}
```

---

## 8. Branding & Customisation

### Complete Branding Setup (step by step)

**Go to: `http://localhost:3000/admin/settings`**

---

### 🎨 Tab 1: Branding

| Field | Description | Example |
|---|---|---|
| **Logo** | Upload PNG with transparent bg. Shows in navbar + footer | mybakery-logo.png |
| **Store name** | Displayed when no logo uploaded | Sweet Cakes |
| **WhatsApp** | Digits only, with country code | 919876543210 |
| **Theme color** | Pick from 10 presets or enter hex | #D97706 (amber) |

**Steps:**
1. Click **Upload logo** → select your logo file (PNG transparent background recommended)
2. Preview shows logo on both dark (footer) and light (navbar) backgrounds
3. Enter your **Store name**
4. Enter **WhatsApp** number (e.g. `919876543210` for +91 98765 43210)
5. Pick a **Theme color** — preview updates instantly
6. Click **Save branding** — page reloads with new colors

> ⚠️ Both `npm run dev` and `npm run dev:api` must be running for uploads to work

---

### 🏠 Tab 2: Hero Section

Customise the full-screen homepage banner.

| Field | Description |
|---|---|
| **Hero image** | Full-screen background image (1920×1080 recommended) |
| **Badge text** | Small pill above heading e.g. "Fresh Baked Daily" |
| **Main heading** | Big headline. Use `\n` for new line |
| **Subheading** | Description below headline |
| **Primary button** | Text for main CTA button |
| **WhatsApp button** | Text for WhatsApp CTA button |
| **Stats** | Up to 4 value+label pairs (e.g. "500+", "Happy customers") |

**Steps:**
1. Click **Upload image** → select hero/banner image
2. Fill in all text fields
3. Add/edit stats using the **+ Add stat** button
4. Click **Save changes**

---

### ⭐ Tab 3: Features (Why Choose Us)

Edit the 3 cards below the product grid.

| Field | Description |
|---|---|
| **Icon** | Any emoji e.g. 🌾, ⏰, 🚚 |
| **Title** | Card heading |
| **Description** | Card body text |

**Steps:**
1. Edit each card's icon, title and description
2. Click **+ Add feature** to add more (up to 6)
3. Click × to remove a feature
4. Click **Save changes**

---

### 📄 Tab 4: Footer

| Field | Description |
|---|---|
| **Tagline** | About text shown under logo |
| **Address** | Physical shop address |
| **Phone** | Contact number (display only) |
| **Email** | Contact email |
| **Business hours** | e.g. "Mon–Sat 8am–8pm" |
| **Footer links** | Navigation links in footer |

---

### 🔍 Tab 5: SEO

| Field | Limit |
|---|---|
| **Meta title** | 60 characters |
| **Meta description** | 160 characters |

---

## 9. Admin Panel Guide

Access at: `http://yourdomain.com/admin`

### Dashboard
- Shows last 5 orders with status
- Revenue, pending, paid counters
- Quick status updates inline

### Products (`/admin/products`)
- **Add product**: Click **+ Add product** (top right)
  - Upload image, set name, price, stock, category, slug
  - Description is optional
- **Edit product**: Click **Edit** on any product card
- **Delete product**: Click **Delete** (soft delete — marks inactive)

### Orders (`/admin/orders`)
- Filter by status: All / Pending / Paid / Processing / Shipped / Delivered / Cancelled
- Update order status via dropdown on each order card
- Cancelling a pending order automatically restores reserved stock

### Settings (`/admin/settings`)
- See Section 8 above

---

## 10. Adding More Tenants

Each tenant gets their own domain, products, orders and admin users.

### 1. Add domain to server

Point new domain's DNS A record to your server IP.

### 2. Create tenant via superadmin

```bash
# Get superadmin token
curl -X POST https://manage.yourdomain.com/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SUPERADMIN_SECRET"}'

# Create tenant (use token from above)
curl -X POST https://manage.yourdomain.com/api/superadmin/tenants \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cake World",
    "domain": "cakeworld.com",
    "theme_color": "#E11D48",
    "whatsapp_number": "919876543211"
  }'

# Create admin user for new tenant
curl -X POST https://manage.yourdomain.com/api/superadmin/tenants/2/seed-admin \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cake World Admin",
    "email": "admin@cakeworld.com",
    "password": "SecurePass@123"
  }'
```

### 3. Create upload directories

```bash
mkdir -p uploads/2/{products,logo,hero,banner}
```

### 4. Add Razorpay keys

```bash
curl -X PUT https://manage.yourdomain.com/api/superadmin/tenants/2 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_key_id": "rzp_live_xxxx",
    "razorpay_key_secret": "your_secret"
  }'
```

---

## 11. Maintenance & Backups

### Manual backup
```bash
npm run backup          # Daily backup
npm run backup:weekly   # Weekly backup
npm run backup:verify   # Verify latest backup integrity
```

### Restore from backup
```bash
npm run restore                          # Restore latest daily backup
node scripts/restore.js --latest-weekly  # Restore latest weekly backup
node scripts/restore.js --file backups/daily/bakery_2024-01-15.sql.gz
```

### Verify upload security
```bash
npm run verify:uploads  # Tests file serving + security blocks
```

### Rotate encryption key (when needed)
```bash
OLD_ENCRYPTION_KEY=old_key NEW_ENCRYPTION_KEY=new_key node scripts/rotate-encryption-key.js
```

### Update the app
```bash
git pull origin main

# Production:
npm install --production
npm run build
pm2 restart bakery-platform

# Development:
npm install
# Restart both dev servers
```

---

## 12. Troubleshooting

### Upload fails ("No file uploaded")

**Cause:** Upload going through Next.js proxy which strips multipart body.

**Fix:** Ensure both servers are running AND `.env` has:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Login returns 401

**Fix:** Update password hash in database:
```sql
UPDATE users
SET password = '$2a$12$3LmDVrZcoBgLPkTuTuj4QOYtKIEjtNUTgNkt8jpnXpSaVE4snZfVy'
WHERE email = 'admin@sweetcakes.com';
```

### "Incorrect arguments to mysqld_stmt_execute"

**Cause:** Old code using `db.execute()` with integer LIMIT params.

**Fix:** `git pull origin main` then restart `dev:api`.

### HMR reload loop (Fast Refresh reloading forever)

**Fix:**
```powershell
Remove-Item -Recurse -Force frontend\.next
# Restart npm run dev
# Hard refresh: Ctrl+Shift+R
```

### Images not showing after upload

**Fix:** Check upload directories exist:
```powershell
mkdir uploads\1\products
mkdir uploads\1\logo
mkdir uploads\1\hero
```

### Settings page returns 500

**Cause:** `tenant_settings` column missing from database.

**Fix:** The app auto-creates it on first request. Or run manually:
```sql
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tenant_settings JSON DEFAULT NULL
  AFTER whatsapp_number;
```

### Port 3000 already in use

```powershell
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

---

## Quick Reference

### Dev commands
```powershell
npm run dev:api     # Start Express API (Terminal 1)
npm run dev         # Start Next.js (Terminal 2)
npm run dev:all     # Start both together
npm run build       # Production build
npm run start       # Production server (single process)
npm run clean       # Clear Next.js cache
```

### Useful URLs (development)
```
http://localhost:3000               → Home page
http://localhost:3000/products      → Product catalogue
http://localhost:3000/login         → Admin login
http://localhost:3000/admin         → Dashboard
http://localhost:3000/admin/settings → Branding & content
http://localhost:3001/health        → API health check
```

### Default Credentials
```
Admin email:    admin@sweetcakes.com
Admin password: Admin@123
```

---

*Generated for multi-tenant-cob — github.com/vivekjayavel/multi-tenant-cob*
