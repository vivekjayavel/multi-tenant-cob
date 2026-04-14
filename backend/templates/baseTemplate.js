'use strict';
function baseTemplate({ tenant, title, preheader, bodyHtml }) {
  const primaryColor = tenant.theme_color || '#D97706';
  const tenantName   = tenant.name         || 'Bakery';
  const year         = new Date().getFullYear();
  const preheaderHtml = preheader ? `<div style="display:none;font-size:0;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f0;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="background-color:${primaryColor};padding:28px 40px;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">${tenantName}</h1></td></tr>
        <tr><td style="padding:36px 40px 28px;">${bodyHtml}</td></tr>
        <tr><td style="background-color:#f9f9f7;padding:20px 40px;border-top:1px solid #eeede8;"><p style="margin:0;font-size:12px;color:#999896;text-align:center;">© ${year} ${tenantName}. All rights reserved.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
module.exports = { baseTemplate };
