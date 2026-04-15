'use strict';
const transport  = require('../config/mailer');
const { logger } = require('../config/logger');
const { orderConfirmationTemplate } = require('../templates/orderConfirmation');
const { newOrderAlertTemplate }     = require('../templates/newOrderAlert');

async function sendMail({ to, subject, html, text, tenantId }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) { logger.warn('Email skipped — SMTP not configured', { tenantId, to }); return; }
  const from = `"${process.env.SMTP_FROM_NAME || 'Bakery'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;
  try {
    const info = await transport.sendMail({ from, to, subject, html, text });
    logger.info('Email sent', { tenantId, to, subject, messageId: info.messageId });
    return info;
  } catch (err) { logger.error('Email send failed', { tenantId, to, subject, error: err.message }); }
}

async function sendOrderConfirmation({ tenant, order, items, user }) {
  const template = orderConfirmationTemplate({ tenant, order, items, user });
  await sendMail({ to: user.email, subject: template.subject, html: template.html, text: template.text, tenantId: tenant.id });
}

async function sendNewOrderAlert({ db, tenant, order, items, customer }) {
  const [admins] = await db.query("SELECT email FROM users WHERE tenant_id = ? AND role = 'admin' AND is_active = 1", [tenant.id]);
  let adminEmails = admins.map(a => a.email);
  if (!adminEmails.length) {
    if (process.env.DEFAULT_ADMIN_EMAIL) adminEmails = [process.env.DEFAULT_ADMIN_EMAIL];
    else { logger.warn('No admin email for order alert', { tenantId: tenant.id, orderId: order.id }); return; }
  }
  const template = newOrderAlertTemplate({ tenant, order, items, customer });
  await Promise.all(adminEmails.map(email => sendMail({ to: email, subject: template.subject, html: template.html, text: template.text, tenantId: tenant.id })));
}

module.exports = { sendOrderConfirmation, sendNewOrderAlert };
