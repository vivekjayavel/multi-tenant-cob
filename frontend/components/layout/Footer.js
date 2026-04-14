import Link from 'next/link';
export default function Footer({ tenant }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-8 pb-10 border-b border-gray-800">
          <div>
            <p className="font-display text-white text-lg font-semibold mb-3">{tenant?.name || 'Bakery'}</p>
            <p className="text-sm leading-relaxed">Fresh baked goods crafted with love and the finest ingredients.</p>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">Quick Links</p>
            <nav className="space-y-2">
              {[['/', 'Home'], ['/products', 'Menu'], ['/cart', 'Cart'], ['/login', 'Account']].map(([href, label]) => (
                <Link key={href} href={href} className="block text-sm hover:text-white transition-colors">{label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">Contact</p>
            {tenant?.whatsapp_number && (
              <a href={`https://wa.me/${tenant.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm hover:text-green-400 transition-colors">
                💬 Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
        <p className="text-xs text-center text-gray-600 pt-8">© {year} {tenant?.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
