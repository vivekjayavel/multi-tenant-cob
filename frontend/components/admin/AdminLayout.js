import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';

const NotificationBell = dynamic(() => import('./NotificationBell'), { ssr: false });

const navItems = [
  { href: '/admin',          label: 'Dashboard', icon: '▤',  key: 'dashboard' },
  { href: '/admin/products', label: 'Products',  icon: '🥐', key: 'products'  },
  { href: '/admin/orders',   label: 'Orders',    icon: '📦', key: 'orders'    },
  { href: '/admin/settings', label: 'Settings',  icon: '⚙️',  key: 'settings'  },
  { href: '/',               label: 'View site', icon: '↗',  key: 'site'      },
];

export default function AdminLayout({ children, tenant, active, adminUser }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.replace('/login?reason=unauthenticated');
  }, []);

  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); }
    finally { localStorage.removeItem('token'); router.push('/login'); }
  };

  const logoutAll = async () => {
    if (!confirm('Log out all devices?')) return;
    try { await fetch('/api/auth/logout-all', { method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); }
    finally { localStorage.removeItem('token'); router.push('/login?reason=logged_out_all'); }
  };

  const Nav = () => (
    <>
      <div className="px-5 py-5 border-b border-gray-50">
        <div className="flex items-center gap-2">
          {tenant?.logo_url && <img src={tenant.logo_url} alt={tenant.name} className="h-7 w-auto object-contain max-w-[28px] flex-shrink-0" />}
          <p className="font-display font-bold text-sm truncate" style={{ color: 'var(--tenant-primary)' }}>{tenant?.name}</p>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">Admin Panel</p>
      </div>
      {adminUser && (
        <div className="px-4 py-3 border-b border-gray-50 bg-stone-50 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-700 truncate">{adminUser.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{adminUser.email}</p>
          </div>
          <NotificationBell />
        </div>
      )}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors font-medium ${
              active === item.key ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            style={active === item.key ? { backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 10%, transparent)', color: 'var(--tenant-primary)' } : {}}>
            <span className="text-base w-5 text-center">{item.icon}</span>{item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-50 space-y-0.5">
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <span className="text-base w-5 text-center">→</span>Logout
        </button>
        <button onClick={logoutAll} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <span className="text-base w-5 text-center">⊗</span>All devices
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      {mobileOpen && (
        <aside className="w-56 bg-white flex flex-col fixed top-0 bottom-0 z-50 md:hidden shadow-xl">
          <Nav />
        </aside>
      )}

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-100 flex items-center px-4 z-30">
        <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <span className="ml-3 font-semibold text-sm text-gray-800">{tenant?.name || 'Admin'}</span>
      </div>

      {/* Desktop sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col fixed top-0 bottom-0 z-30 hidden md:flex">
        <Nav />
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 min-h-screen pt-12 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
