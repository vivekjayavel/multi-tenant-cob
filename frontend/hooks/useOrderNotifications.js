import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

const POLL_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY   = 'admin_last_seen_order_id';

export default function useOrderNotifications() {
  const [newCount,  setNewCount]  = useState(0);
  const [newOrders, setNewOrders] = useState([]);
  const [permission, setPermission] = useState('default');
  const lastSeenId  = useRef(0);
  const intervalRef = useRef(null);
  const initialized = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendBrowserNotification = useCallback((order) => {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return;
    const n = new Notification('🛒 New Order!', {
      body: `Order #${order.id} — ${order.customer_name} — ₹${parseFloat(order.total_price).toLocaleString('en-IN')}`,
      icon: '/favicon.ico',
      tag:  `order-${order.id}`,
    });
    n.onclick = () => { window.focus(); window.location.href = '/admin/orders'; n.close(); };
  }, []);

  const checkForNewOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders?limit=10&page=1');
      const orders   = data.orders || [];
      if (!orders.length) return;

      const latestId = orders[0].id;

      if (!initialized.current) {
        // First run: set baseline — no notification
        lastSeenId.current = latestId;
        localStorage.setItem(STORAGE_KEY, String(latestId));
        initialized.current = true;
        return;
      }

      const fresh = orders.filter(o => o.id > lastSeenId.current);
      if (!fresh.length) return;

      setNewCount(c => c + fresh.length);
      setNewOrders(prev => [...fresh, ...prev].slice(0, 20));
      fresh.forEach(o => sendBrowserNotification(o));

      lastSeenId.current = latestId;
      localStorage.setItem(STORAGE_KEY, String(latestId));
    } catch { /* silent */ }
  }, [sendBrowserNotification]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window) setPermission(Notification.permission);

    // Restore last seen from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) lastSeenId.current = parseInt(stored, 10);

    const timeout = setTimeout(checkForNewOrders, 2000);
    intervalRef.current = setInterval(checkForNewOrders, POLL_INTERVAL);
    return () => { clearTimeout(timeout); clearInterval(intervalRef.current); };
  }, [checkForNewOrders]);

  const clearNotifications = useCallback(() => {
    setNewCount(0);
    setNewOrders([]);
  }, []);

  return { newCount, newOrders, clearNotifications, requestPermission, permission };
}
