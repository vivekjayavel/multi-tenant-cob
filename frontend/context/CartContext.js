import { createContext, useContext, useReducer, useEffect, useState } from 'react';

const CartContext = createContext(null);

// Generate a unique key for a cart item based on id + customization choices
function itemKey(item) {
  const base = String(item.id);
  if (!item.customization) return base;
  const c = item.customization;
  const parts = [
    c.weight       || '',
    c.flavour      || '',
    c.occasion     || '',
    c.message      || '',
    c.instructions || '',
  ].join('|');
  return parts ? `${base}::${parts}` : base;
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const key    = itemKey(action.item);
      const exists = state.items.find(i => itemKey(i) === key);
      if (exists) return {
        ...state,
        items: state.items.map(i =>
          itemKey(i) === key
            ? { ...i, quantity: i.quantity + (action.item.quantity || 1) }
            : i
        ),
      };
      return { ...state, items: [...state.items, { ...action.item, quantity: action.item.quantity || 1, _key: key }] };
    }
    case 'REMOVE':     return { ...state, items: state.items.filter(i => i._key !== action.key) };
    case 'UPDATE_QTY': return { ...state, items: state.items.map(i => i._key === action.key ? { ...i, quantity: Math.max(1, action.quantity) } : i) };
    case 'CLEAR':      return { ...state, items: [] };
    case 'HYDRATE':    return { ...state, items: action.items.map(i => ({ ...i, _key: i._key || itemKey(i) })) };
    default:           return state;
  }
}

export function CartProvider({ children }) {
  const [state,    dispatch] = useReducer(cartReducer, { items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) dispatch({ type: 'HYDRATE', items: JSON.parse(saved) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items, hydrated]);

  const total          = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const originalTotal  = state.items.reduce((s, i) => s + (i.original_price || i.price) * i.quantity, 0);
  const totalSavings   = originalTotal - total;
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, total, originalTotal, totalSavings, itemCount, hydrated, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
