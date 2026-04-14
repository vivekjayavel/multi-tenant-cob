const LIMITS = { title: 60, description: 160, ogTitle: 90, ogDesc: 200 };
function truncate(str, max) { const s = String(str ?? '').trim(); return s.length <= max ? s : s.slice(0, max - 1) + '…'; }
function sanitize(str) { return String(str ?? '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim(); }
function buildCanonical(tenant, pagePath = '/') {
  let p = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return `https://${tenant.domain}${p.split('?')[0].split('#')[0]}`;
}
function buildAbsoluteUrl(tenant, relativeUrl) {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `https://${tenant.domain}${relativeUrl}`;
}
function homeSeo(tenant) {
  const title = truncate(`${tenant.name} — Fresh Baked Cakes & Pastries`, LIMITS.title);
  const description = truncate(sanitize(`Order fresh cakes, pastries, and breads from ${tenant.name}. Baked daily with premium ingredients.`), LIMITS.description);
  return { title, description, canonical: buildCanonical(tenant, '/'), ogTitle: truncate(title, LIMITS.ogTitle), ogDesc: truncate(description, LIMITS.ogDesc), ogImage: buildAbsoluteUrl(tenant, tenant.logo_url), ogType: 'website', noindex: false, jsonLd: { '@context': 'https://schema.org', '@type': 'Bakery', name: tenant.name, url: buildCanonical(tenant, '/'), image: buildAbsoluteUrl(tenant, tenant.logo_url), servesCuisine: 'Bakery', priceRange: '₹₹' } };
}
function productListSeo(tenant) {
  const title = truncate(`Menu — ${tenant.name}`, LIMITS.title);
  const description = truncate(sanitize(`Browse our full menu at ${tenant.name} — cakes, pastries, breads and more.`), LIMITS.description);
  return { title, description, canonical: buildCanonical(tenant, '/products'), ogTitle: truncate(title, LIMITS.ogTitle), ogDesc: truncate(description, LIMITS.ogDesc), ogImage: buildAbsoluteUrl(tenant, tenant.logo_url), ogType: 'website', noindex: false };
}
function productDetailSeo(tenant, product) {
  const title = truncate(`${product.name} — ${tenant.name}`, LIMITS.title);
  const description = truncate(sanitize(product.description ? `${product.description} — Order from ${tenant.name}.` : `Order ${product.name} from ${tenant.name}. ₹${parseFloat(product.price).toLocaleString('en-IN')}.`), LIMITS.description);
  const canonical = buildCanonical(tenant, `/products/${product.slug}`);
  return { title, description, canonical, ogTitle: truncate(title, LIMITS.ogTitle), ogDesc: truncate(description, LIMITS.ogDesc), ogImage: buildAbsoluteUrl(tenant, product.image_url), ogType: 'product', noindex: false, jsonLd: [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: buildCanonical(tenant, '/') }, { '@type': 'ListItem', position: 2, name: 'Menu', item: buildCanonical(tenant, '/products') }, { '@type': 'ListItem', position: 3, name: product.name, item: canonical }] },
    { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: sanitize(product.description || ''), image: buildAbsoluteUrl(tenant, product.image_url), sku: String(product.id), brand: { '@type': 'Brand', name: tenant.name }, offers: { '@type': 'Offer', url: canonical, priceCurrency: 'INR', price: parseFloat(product.price).toFixed(2), availability: (product.available_qty ?? product.stock_qty) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition', seller: { '@type': 'Organization', name: tenant.name } } }
  ] };
}
function noindexSeo(tenant, pageName) { return { title: `${pageName} — ${tenant?.name || 'Bakery'}`, noindex: true, canonical: null }; }
module.exports = { buildCanonical, buildAbsoluteUrl, homeSeo, productListSeo, productDetailSeo, noindexSeo, truncate, sanitize };
