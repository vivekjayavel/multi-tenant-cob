import { createContext, useContext, useState, useCallback } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback(({ message, type = 'success', duration = 3000 }) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => remove(t.id)}
              className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium cursor-pointer select-none max-w-sm"
              style={{
                backgroundColor: t.type === 'success' ? '#18181b'
                               : t.type === 'error'   ? '#dc2626'
                               : t.type === 'info'    ? '#0284c7'
                               : '#18181b',
                color: '#fff',
              }}
            >
              <span className="text-base flex-shrink-0">
                {t.type === 'success' ? '✅'
               : t.type === 'error'   ? '❌'
               : t.type === 'info'    ? 'ℹ️'
               : '✅'}
              </span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx.show;
}
