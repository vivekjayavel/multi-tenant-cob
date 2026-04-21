import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import OrderTable from '../../components/admin/OrderTable';
import api from '../../lib/api';
const { withAdminAuth } = require('../../lib/withAdminAuth');

const FILTERS = ['all','pending','cod_pending','paid','processing','shipped','delivered','cancelled'];

export default function AdminOrders({ tenant, adminUser }) {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [updating, setUpdating] = useState(null);
  const [error,    setError]    = useState(null);

  const load = async (status) => {
    setLoading(true);
    try { const q = status && status !== 'all' ? `?status=${status}` : ''; const { data } = await api.get(`/orders${q}`); setOrders(data.orders || []); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to load orders.'); } finally { setLoading(false); }
  };
  useEffect(() => { load(filter); }, [filter]);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try { await api.patch(`/orders/${orderId}/status`, { status }); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o)); }
    catch (err) { alert(err?.response?.data?.message || 'Update failed.'); } finally { setUpdating(null); }
  };

  return (
    <>
      <Head><title>{`Orders — ${tenant.name}`}</title></Head>
      <AdminLayout tenant={tenant} active="orders" adminUser={adminUser}>
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-2xl text-gray-900">Orders</h1><p className="text-sm text-gray-500 mt-0.5">{orders.length} results</p></div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all ${filter === f ? 'text-white shadow-sm' : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-200'}`} style={filter === f ? { backgroundColor: 'var(--tenant-primary)' } : {}}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600 mb-6">{error}</p>}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : (
          <OrderTable orders={orders} onStatusChange={handleStatusChange} updating={updating} />
        )}
      </AdminLayout>
    </>
  );
}

export const getServerSideProps = withAdminAuth(async ({ tenant }) => ({ props: { tenant } }));
