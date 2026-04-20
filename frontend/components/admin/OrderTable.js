import { m as motion } from 'framer-motion';
const STATUS_COLOR = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', processing: 'bg-blue-100 text-blue-800', shipped: 'bg-purple-100 text-purple-800', delivered: 'bg-teal-100 text-teal-800', cancelled: 'bg-red-100 text-red-600', refunded: 'bg-gray-100 text-gray-600' };
const STATUS_OPTIONS = ['processing','shipped','delivered','cancelled'];

export default function OrderTable({ orders, onStatusChange, updating }) {
  if (!orders.length) return <div className="text-center py-20 text-gray-400 text-sm">No orders found.</div>;
  return (
    <div className="space-y-3">
      {orders.map((o, i) => (
        <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800 text-sm">#{o.id}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{o.customer_name}</p>
            <p className="text-xs text-gray-400">{o.customer_email}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <select value={o.status} disabled={updating === o.id || ['delivered','cancelled','refunded'].includes(o.status)} onChange={(e) => onStatusChange(o.id, e.target.value)} className="text-xs font-medium border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            <option value={o.status}>{o.status}</option>
            {STATUS_OPTIONS.filter(s => s !== o.status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </motion.div>
      ))}
    </div>
  );
}
