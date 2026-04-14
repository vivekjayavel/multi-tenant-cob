# Multi-Tenant Bakery SaaS Platform

A production-ready multi-tenant bakery platform with domain-based tenancy, Next.js SSR, Razorpay payments, WhatsApp integration, and a full admin panel.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env

# 3. Import database schema
mysql -u root -p bakery_platform < database/schema.sql

# 4. Create upload directories
mkdir -p uploads/1/products uploads/1/logo

# 5. Build and start
npm run build && npm run dev
```

## Default credentials
- URL: http://localhost:3000/login
- Email: admin@sweetcakes.com
- Password: Admin@123

## Key features
- Domain-based multi-tenancy
- Razorpay payments with webhook verification
- JWT authentication with token revocation
- AES-256-GCM encrypted secrets at rest
- Server-side admin authentication
- Two-phase stock management
- WhatsApp enquiry integration
- Auto daily/weekly database backups
- Full SEO with JSON-LD structured data

## Documentation
See [Step 4](docs/setup.md) for complete local and Hostinger deployment instructions.

## Security
All eight critical security fixes (C-01 through C-08) are implemented. See the audit trail in the project documentation.
