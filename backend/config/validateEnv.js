'use strict';
function validateEnv() {
  const errors = [];
  const required = [
    { key: 'JWT_SECRET',            minLength: 32, label: 'JWT secret'              },
    { key: 'SUPERADMIN_JWT_SECRET', minLength: 32, label: 'Superadmin JWT secret'   },
    { key: 'SUPERADMIN_SECRET',     minLength: 32, label: 'Superadmin login secret' },
    { key: 'ENCRYPTION_KEY',        minLength: 64, label: 'Encryption key',
      pattern: /^[0-9a-fA-F]{64}$/, patternMsg: 'must be exactly 64 hex characters' },
  ];
  for (const { key, minLength, label, pattern, patternMsg } of required) {
    const val = process.env[key];
    if (!val) { errors.push(`${label} (${key}) is not set`); continue; }
    if (val.length < minLength) errors.push(`${label} (${key}) too short — min ${minLength}, got ${val.length}`);
    if (pattern && !pattern.test(val)) errors.push(`${label} (${key}) ${patternMsg}`);
  }
  if (process.env.JWT_SECRET && process.env.SUPERADMIN_JWT_SECRET &&
      process.env.JWT_SECRET === process.env.SUPERADMIN_JWT_SECRET)
    errors.push('JWT_SECRET and SUPERADMIN_JWT_SECRET must be different values');
  ['DB_HOST','DB_USER','DB_PASSWORD','DB_NAME'].forEach(k => { if (!process.env[k]) errors.push(`Database config (${k}) is not set`); });
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) console.warn('[validateEnv] SMTP not configured — emails skipped');
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) console.warn('[validateEnv] RAZORPAY_WEBHOOK_SECRET not set');
  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:\n');
    errors.forEach(e => console.error(`   • ${e}`));
    console.error('\nFix in .env before starting.\n');
    process.exit(1);
  }
  console.log('✅ Environment validation passed');
}
module.exports = { validateEnv };
