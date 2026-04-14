// All requires are LAZY (inside functions) to prevent db.js from
// loading at import time during Next.js build phase.

function extractToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

async function verifyAdminToken(token, domain) {
  const jwt = require('jsonwebtoken');
  const db  = require('../../backend/config/db');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'bakery-platform' });
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      throw Object.assign(new Error('Session expired'), { reason: 'expired' });
    throw Object.assign(new Error('Invalid token'), { reason: 'invalid' });
  }

  if (decoded.role !== 'admin')
    throw Object.assign(new Error('Admin access required'), { reason: 'unauthorized' });

  const [[tenant]] = await db.execute(
    'SELECT id, name, domain, logo_url, theme_color, whatsapp_number, is_active FROM tenants WHERE domain = ? AND is_active = 1 LIMIT 1',
    [domain]
  );
  if (!tenant)
    throw Object.assign(new Error('Tenant not found'), { reason: 'invalid' });

  if (decoded.tenantId !== tenant.id)
    throw Object.assign(
      new Error(`Token tenant mismatch: token=${decoded.tenantId}, domain=${tenant.id}`),
      { reason: 'unauthorized', securityEvent: true }
    );

  const [[dbUser]] = await db.execute(
    'SELECT id, name, email, role, is_active, token_version FROM users WHERE id = ? AND tenant_id = ? AND is_active = 1 LIMIT 1',
    [decoded.userId, tenant.id]
  );
  if (!dbUser)
    throw Object.assign(new Error('User not found or deactivated'), { reason: 'unauthorized' });
  if (dbUser.role !== 'admin')
    throw Object.assign(new Error('User role is not admin'), { reason: 'unauthorized' });

  const tokenVersion = decoded.tokenVersion ?? 0;
  if (decoded.tokenVersion !== undefined &&
      dbUser.token_version !== undefined &&
      tokenVersion !== dbUser.token_version)
    throw Object.assign(new Error('Token has been revoked'), { reason: 'expired' });

  return {
    adminUser: { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role },
    tenant,
  };
}

function withAdminAuth(gssp) {
  return async (context) => {
    const { req } = context;
    const domain  = (req.headers.host || '').split(':')[0].toLowerCase();
    const token   = extractToken(req);

    if (!token) {
      return { redirect: { destination: '/login?reason=unauthenticated', permanent: false } };
    }

    try {
      const { adminUser, tenant } = await verifyAdminToken(token, domain);
      context.adminUser = adminUser;
      context.tenant    = tenant;

      const result = await gssp(context);
      if (result.notFound || result.redirect) return result;

      return {
        ...result,
        props: {
          ...result.props,
          adminUser,
          tenant: result.props?.tenant || tenant,
        },
      };
    } catch (err) {
      try {
        const { logger } = require('../../backend/config/logger');
        if (err.securityEvent) {
          logger.warn('Admin auth security event', {
            domain,
            ip:      req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
            reason:  err.reason,
            message: err.message,
          });
        }
      } catch { /* logger not available during build */ }

      return {
        redirect: {
          destination: `/login?reason=${err.reason || 'invalid'}`,
          permanent:   false,
        },
      };
    }
  };
}

module.exports = { withAdminAuth };
