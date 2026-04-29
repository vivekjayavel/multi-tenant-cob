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
            {/* Logo + shop name: logo on top, name below */}
            <div className="mb-4">
              {tenant?.logo_url && (
                <div className="inline-flex items-center justify-center p-1.5 rounded-lg mb-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <img
                    src={tenant.logo_url}
                    alt={tenant?.name || 'Bakery'}
                    className="h-9 w-auto object-contain"
                    style={{ maxWidth: '110px' }}
                  />
                </div>
              )}
              <p className="font-display text-lg font-bold" style={{ color: 'var(--tenant-primary)' }}>
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
              <a href={`https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent("Hi! I would like to place an order at " + (tenant.name || "your store") + ". Please share the menu and availability. Thank you!")}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm hover:text-green-400 transition-colors">
                💬 Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
        {/* Social Media Icons */}
        {(footer.instagram || footer.facebook || footer.twitter || footer.youtube || footer.tiktok || footer.pinterest) && (
          <div className="flex justify-center gap-4 py-6 border-b border-gray-800">
            {footer.instagram && (
              <a href={footer.instagram} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-all duration-200 hover:scale-110 text-lg">
                📸
              </a>
            )}
            {footer.facebook && (
              <a href={footer.facebook} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-all duration-200 hover:scale-110 text-lg">
                📘
              </a>
            )}
            {footer.twitter && (
              <a href={footer.twitter} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-sky-500 flex items-center justify-center transition-all duration-200 hover:scale-110 text-lg">
                🐦
              </a>
            )}
            {footer.youtube && (
              <a href={footer.youtube} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-red-600 flex items-center justify-center transition-all duration-200 hover:scale-110 text-lg">
                ▶️
              </a>
            )}
            {footer.tiktok && (
              <a href={footer.tiktok} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-600 flex items-center justify-center transition-all duration-200 hover:scale-110 text-lg">
                🎵
              </a>
            )}
            {footer.pinterest && (
              <a href={footer.pinterest} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-red-500 flex items-center justify-center transition-all duration-200 hover:scale-110 text-lg">
                📌
              </a>
            )}
          </div>
        )}
        <p className="text-xs text-center text-gray-600 pt-6">© {year} <span style={{ color: 'var(--tenant-primary)', fontWeight: 600 }}>{tenant?.name}</span>. All rights reserved.</p>
      </div>
    </footer>
  );
}
