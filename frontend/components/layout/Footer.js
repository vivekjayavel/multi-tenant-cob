import Link from 'next/link';

export default function Footer({ tenant, settings }) {
  const year    = new Date().getFullYear();
  const footer  = settings?.footer || {};
  const tagline = footer.tagline || 'Fresh baked goods crafted with love and the finest ingredients.';
  const links   = footer.links?.length
    ? footer.links
    : [['/', 'Home'], ['/products', 'Menu'], ['/cart', 'Cart'], ['/login', 'Account']].map(([href,label])=>({href,label}));

  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-8 pb-10 border-b border-gray-800">
          <div>
            {/* Logo + shop name together */}
            <div className="flex items-center gap-3 mb-3">
              {tenant?.logo_url && (
                <img
                  src={tenant.logo_url}
                  alt={tenant?.name || 'Bakery'}
                  className="h-10 w-auto object-contain max-w-[40px] flex-shrink-0"
                  style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
                />
              )}
              <p className="font-display text-xl font-bold" style={{ color: 'var(--tenant-primary)' }}>
                {tenant?.name || 'Bakery'}
              </p>
            </div>
            <p className="text-sm leading-relaxed">{tagline}</p>
            {footer.address && <p className="text-sm mt-2 leading-relaxed">📍 {footer.address}</p>}
            {footer.hours   && <p className="text-sm mt-1">🕐 {footer.hours}</p>}
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">Quick Links</p>
            <nav className="space-y-2">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm hover:text-white transition-colors">{l.label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">Contact</p>
            {footer.email && <p className="text-sm mb-2">✉️ <a href={`mailto:${footer.email}`} className="hover:text-white transition-colors">{footer.email}</a></p>}
            {footer.phone && <p className="text-sm mb-2">📞 {footer.phone}</p>}
            {tenant?.whatsapp_number && (
              <a href={`https://wa.me/${tenant.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm hover:text-green-400 transition-colors">
                💬 Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
        <p className="text-xs text-center text-gray-600 pt-8">© {year} <span style={{ color: 'var(--tenant-primary)', fontWeight: 600 }}>{tenant?.name}</span>. All rights reserved.</p>
      </div>
    </footer>
  );
}
