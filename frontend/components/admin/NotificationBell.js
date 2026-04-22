import { useState, useRef, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import useOrderNotifications from '../../hooks/useOrderNotifications';

export default function NotificationBell() {
  const { newCount, newOrders, clearNotifications, requestPermission, permission } =
    useOrderNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!panelRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) clearNotifications();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        title="Order notifications"
      >
        <motion.div
          animate={newCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: newCount > 0 ? Infinity : 0, repeatDelay: 4 }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </motion.div>

        {/* Badge */}
        <AnimatePresence>
          {newCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 text-white text-[10px] font-bold
                         min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
              style={{ backgroundColor: 'var(--tenant-primary)' }}
            >
              {newCount > 9 ? '9+' : newCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-800">Order Notifications</p>
              {permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: 'var(--tenant-primary)' }}
                >
                  Enable alerts
                </button>
              )}
            </div>

            {/* Order list */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {newOrders.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-sm text-gray-400">No new orders</p>
                  <p className="text-xs text-gray-300 mt-1">Checks every 30 seconds</p>
                </div>
              ) : (
                newOrders.map(o => (
                  <a key={o.id} href="/admin/orders"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 15%, transparent)' }}>
                      🛒
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        Order #{o.id}
                        <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                          o.payment_method === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {o.payment_method === 'cod' ? '💵 COD' : '💳 Online'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">{o.customer_name}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--tenant-primary)' }}>
                        ₹{parseFloat(o.total_price).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                      {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </a>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2.5">
              <a href="/admin/orders"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: 'var(--tenant-primary)' }}
              >
                View all orders →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
