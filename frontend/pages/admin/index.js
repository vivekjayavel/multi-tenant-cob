import { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
const { withAdminAuth } = require('../../lib/withAdminAuth');

export default function AdminDashboard({ tenant, adminUser }) {
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders?limit=5').then(({ data }) => {
      const raw = data.orders || [];
      setOrders(raw);
      setStats({
        totalOrders:   raw.length,
        totalRevenue:  raw.reduce((s, o) => s + parseFloat(o.total_price), 0),
        pendingOrders: raw.filter(o => o.status === 'pending').length,
        paidOrders:    raw.filter(o => o.status === 'paid').length,
      });
    }).finally(() => setLoading(false));
  }, []);

  const statusColor = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', processing: 'bg-blue-100 text-blue-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-teal-100 text-teal-800', cancelled: 'bg-red-100 text-red-600' };

  return (
    <>
      <Head><title>{`Dashboard — ${tenant.name}`}</title></Head>
      <AdminLayout tenant={tenant} active="dashboard" adminUser={adminUser}>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-2xl text-gray-900">Welcome back, {adminUser?.name?.split(' ')[0] || 'Admin'} 👋</h1>
            <p className="text-sm text-gray-500 mt-1">{tenant.name} — Admin Panel</p>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total orders', value: stats.totalOrders,                   icon: '📦', color: 'bg-blue-50   text-blue-700'   },
                { label: 'Revenue',      value: `₹${stats.totalRevenue.toFixed(0)}`, icon: '💰', color: 'bg-green-50  text-green-700'  },
                { label: 'Pending',      value: stats.pendingOrders,                 icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
                { label: 'Paid',         value: stats.paidOrders,                    icon: '✅', color: 'bg-teal-50   text-teal-700'   },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center text-xl mb-3 ${s.color}`}>{s.icon}</div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">Recent orders</h2>
              <a href="/admin/orders" className="text-xs hover:underline" style={{ color: 'var(--tenant-primary)' }}>View all</a>
            </div>
            {orders.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Order','Customer','Amount','Status','Date'].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-gray-50 last:border-0 hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-gray-800">#{o.id}</td>
                        <td className="px-6 py-3.5 text-gray-600">{o.customer_name}</td>
                        <td className="px-6 py-3.5 font-semibold text-gray-800">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span></td>
                        <td className="px-6 py-3.5 text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

export const getServerSideProps = withAdminAuth(async ({ tenant }) => ({ props: { tenant } }));
