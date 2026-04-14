import { createContext, useContext, useReducer, useEffect } from 'react';
const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const exists = state.items.find(i => i.id === action.item.id);
      if (exists) return { ...state, items: state.items.map(i => i.id === action.item.id ? { ...i, quantity: i.quantity + (action.item.quantity || 1) } : i) };
      return { ...state, items: [...state.items, { ...action.item, quantity: action.item.quantity || 1 }] };
    }
    case 'REMOVE':     return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY': return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, quantity: Math.max(1, action.quantity) } : i) };
    case 'CLEAR':      return { ...state, items: [] };
    case 'HYDRATE':    return { ...state, items: action.items };
    default:           return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  useEffect(() => { try { const saved = localStorage.getItem('cart'); if (saved) dispatch({ type: 'HYDRATE', items: JSON.parse(saved) }); } catch {} }, []);
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(state.items)); }, [state.items]);
  const total     = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0);
  return <CartContext.Provider value={{ ...state, total, itemCount, dispatch }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
