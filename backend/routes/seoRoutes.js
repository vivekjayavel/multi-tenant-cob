'use strict';
const router = require('express').Router();
const db     = require('../config/db');
const { logger } = require('../config/logger');

function escXml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const domain = (req.headers.host || '').split(':')[0].toLowerCase();
    const [[tenant]] = await db.execute('SELECT id FROM tenants WHERE domain = ? AND is_active = 1 LIMIT 1', [domain]);
    if (!tenant) return res.status(404).send('Not found');
    const [products] = await db.execute('SELECT slug, updated_at FROM products WHERE tenant_id = ? AND is_active = 1', [tenant.id]);
    const base = `https://${domain}`;
    const urls = [
      { loc: base,               changefreq: 'daily',  priority: '1.0' },
      { loc: `${base}/products`, changefreq: 'daily',  priority: '0.9' },
      ...products.map(p => ({ loc: `${base}/products/${p.slug}`, changefreq: 'weekly', priority: '0.8', lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : null })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${escXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}\n</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) { next(err); }
});

router.get('/robots.txt', (req, res) => {
  const domain = (req.headers.host || '').split(':')[0].toLowerCase();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /checkout\nDisallow: /cart\nDisallow: /login\n\nSitemap: https://${domain}/sitemap.xml`);
});

module.exports = router;
