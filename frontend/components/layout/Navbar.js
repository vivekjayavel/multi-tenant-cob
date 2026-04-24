import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../ui/CartDrawer';
import { useTenant, useSettings } from '../../context/TenantContext';
import api from '../../lib/api';

export default function Navbar({ tenant: tenantProp }) {
  const tenant   = useTenant() || tenantProp || {};
  const settings = useSettings();
  const [scrolled,    setScrolled]    = useState(false);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);   // categories dropdown
  const [categories,  setCategories]  = useState([]);
  const menuRef  = useRef(null);
  const { itemCount, hydrated } = useCart();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setMenuOpen(false); }, [router.pathname]);

  // Fetch categories from API
  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const heroHasImage  = !!(settings?.hero?.image_url);
  const isHomePage    = router.pathname === '/';
  const isTransparent = isHomePage && !scrolled && heroHasImage;
  const textCol  = isTransparent ? 'text-white'      : 'text-gray-700';
  const hoverBg  = isTransparent ? 'hover:bg-white/10' : 'hover:bg-gray-100';
  const borderCol = isTransparent ? 'border-white/20'  : 'border-gray-100';

  const shopTagline = (() => {
    try {
      const ts = typeof tenant?.tenant_settings === 'string'
        ? JSON.parse(tenant?.tenant_settings)
        : tenant?.tenant_settings;
      return ts?.branding?.shop_tagline || '';
    } catch { return ''; }
  })();

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isTransparent ? 'bg-transparent' : 'bg-white'} ${scrolled ? 'shadow-md' : ''}`}>

        {/* ── Row 1: Shop name | Logo | Cart ── */}
        <div className={`border-b ${borderCol}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20 sm:h-24">

            {/* Left: Shop name */}
            <Link href="/" className="flex flex-col group min-w-0 flex-1">
              <motion.span className="font-display text-lg sm:text-xl font-bold leading-tight truncate"
                style={{ color: isTransparent ? '#fff' : 'var(--tenant-primary)' }}
                whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                {tenant?.name || 'Bakery'}
              </motion.span>
              {shopTagline && (
                <span className="text-[10px] font-medium tracking-widest uppercase mt-0.5"
                  style={{ color: isTransparent ? 'rgba(255,255,255,0.6)' : 'color-mix(in srgb, var(--tenant-primary) 70%, gray)' }}>
                  {shopTagline}
                </span>
              )}
            </Link>

            {/* Centre: Logo */}
            {tenant?.logo_url && (
              <Link href="/" className="flex-shrink-0 mx-4">
                <motion.img src={tenant.logo_url} alt={tenant.name || 'Logo'}
                  className="object-contain" style={{ width: 80, height: 80 }}
                  whileHover={{ scale: 1.06 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onError={e => { e.target.style.display = 'none'; }} />
              </Link>
            )}

            {/* Right: Cart + hamburger */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <button onClick={() => setCartOpen(true)}
                className={`relative p-2.5 rounded-full transition-colors ${textCol} ${hoverBg}`} aria-label="Open cart">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                </svg>
                {hydrated && itemCount > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--tenant-primary)' }}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </button>
              <button onClick={() => setMobileOpen(o => !o)}
                className={`md:hidden p-2.5 rounded-full transition-colors ${textCol} ${hoverBg}`} aria-label="Toggle menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 2: Nav + Categories (desktop) ── */}
        <div className={`hidden md:block ${isTransparent ? '' : 'bg-white border-b border-gray-100'}`}>
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-8 h-10">

            {/* Home */}
            <NavLink href="/" label="Home" active={router.pathname === '/'} transparent={isTransparent} />

            {/* Menu with categories dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className={`flex items-center gap-1 text-sm font-semibold tracking-wide transition-colors relative pb-0.5 ${
                  router.pathname.startsWith('/products')
                    ? ''
                    : isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
                style={router.pathname.startsWith('/products') ? { color: isTransparent ? '#fff' : 'var(--tenant-primary)' } : {}}
              >
                Menu
                <motion.svg className="w-3.5 h-3.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </motion.svg>
                {router.pathname.startsWith('/products') && (
                  <motion.div layoutId="navUnderline"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: isTransparent ? '#fff' : 'var(--tenant-primary)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                )}
              </button>

              {/* Categories dropdown */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{    opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[180px]"
                  >
                    {/* All products */}
                    <Link href="/products"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold hover:bg-stone-50 transition-colors border-b border-gray-100"
                      style={{ color: 'var(--tenant-primary)' }}
                      onClick={() => setMenuOpen(false)}>
                      <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                      </svg>
                      View All
                    </Link>

                    {/* Category links */}
                    {categories.map((cat) => (
                      <Link key={cat}
                        href={`/products?category=${encodeURIComponent(cat)}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-stone-50 hover:text-gray-900 transition-colors"
                        onClick={() => setMenuOpen(false)}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--tenant-primary)', opacity: 0.6 }} />
                        {cat}
                      </Link>
                    ))}

                    {categories.length === 0 && (
                      <div className="px-4 py-3 text-xs text-gray-400">No categories yet</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-100">
              <nav className="px-4 py-3 flex flex-col gap-1">
                <Link href="/" className="flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  style={router.pathname === '/' ? { color: 'var(--tenant-primary)', backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 8%, transparent)' } : {}}>
                  Home
                </Link>
                <Link href="/products" className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ color: 'var(--tenant-primary)' }}>
                  All Products
                </Link>
                {categories.map(cat => (
                  <Link key={cat} href={`/products?category=${encodeURIComponent(cat)}`}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--tenant-primary)', opacity: 0.6 }} />
                    {cat}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function NavLink({ href, label, active, transparent }) {
  return (
    <Link href={href}
      className={`relative text-sm font-semibold tracking-wide transition-colors pb-0.5 ${
        active ? '' : transparent ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'
      }`}
      style={active ? { color: transparent ? '#fff' : 'var(--tenant-primary)' } : {}}>
      {label}
      {active && (
        <motion.div layoutId="navUnderline"
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
          style={{ backgroundColor: transparent ? '#fff' : 'var(--tenant-primary)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
      )}
    </Link>
  );
}
