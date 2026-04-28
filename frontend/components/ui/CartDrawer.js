import Link from 'next/link';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';

export default function CartDrawer({ open, onClose }) {
  const { items, total, dispatch, hydrated } = useCart();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <motion.aside key="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-display text-lg font-semibold text-gray-900">Your Cart {items.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({items.length})</span>}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 gap-3">
                    <svg className="w-14 h-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <p className="text-sm text-gray-400">Your cart is empty</p>
                  </motion.div>
                ) : (
                  items.map(item => (
                    <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--tenant-primary)' }}>₹{item.price}</p>
                      {item.customization && (
                        <div className="mt-1 space-y-0.5">
                          {Object.entries(item.customization).map(([k, v]) => v && (
                            <p key={k} className="text-[10px] text-gray-400 leading-tight">
                              <span className="capitalize font-medium text-gray-500">{k}:</span> {k === 'weight' ? String(v).split('|')[0] : v}
                            </p>
                          ))}
                        </div>
                      )}
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => dispatch({ type: 'UPDATE_QTY', key: item._key || String(item.id), quantity: item.quantity - 1 })} className="w-6 h-6 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 text-sm">−</button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button onClick={() => dispatch({ type: 'UPDATE_QTY', key: item._key || String(item.id), quantity: item.quantity + 1 })} className="w-6 h-6 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 text-sm">+</button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-semibold text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <button onClick={() => dispatch({ type: 'REMOVE', key: item._key || String(item.id) })} className="text-gray-300 hover:text-red-400 transition-colors" aria-label="Remove"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold text-gray-900">₹{total.toFixed(2)}</span></div>
                <Link href="/checkout" onClick={onClose} className="block w-full text-white text-sm font-semibold py-3.5 rounded-xl text-center transition-colors duration-200" style={{ backgroundColor: 'var(--tenant-primary)' }}>Proceed to Checkout</Link>
                <button onClick={() => dispatch({ type: 'CLEAR' })} className="block w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">Clear cart</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
