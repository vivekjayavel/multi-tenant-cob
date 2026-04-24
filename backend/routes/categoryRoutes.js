'use strict';
const router = require('express').Router();
const db     = require('../config/db');

// Public endpoint — no auth needed (categories shown in nav to all visitors)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT category FROM products
       WHERE tenant_id = ? AND is_active = 1 AND category IS NOT NULL AND category != ''
       ORDER BY category ASC`,
      [req.tenant.id]
    );
    const categories = rows.map(r => r.category).filter(Boolean)
      .sort((a, b) => {
        if (a.toLowerCase().includes('cake') && !b.toLowerCase().includes('cake')) return -1;
        if (!a.toLowerCase().includes('cake') && b.toLowerCase().includes('cake')) return 1;
        return a.localeCompare(b);
      });
    res.json({ success: true, categories });
  } catch (err) { next(err); }
});

module.exports = router;
