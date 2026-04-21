import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = {
  pending:       'bg-yellow-100 text-yellow-800',
  cod_pending:   'bg-orange-100 text-orange-700',
  paid:          'bg-green-100 text-green-700',
  processing:    'bg-blue-100 text-blue-700',
  shipped:       'bg-purple-100 text-purple-700',
  delivered:     'bg-teal-100 text-teal-700',
  cancelled:     'bg-red-100 text-red-600',
  refunded:      'bg-gray-100 text-gray-500',
  cod_confirmed: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  pending:       'Pending',
  cod_pending:   'COD – Pending',
  paid:          'Paid',
  processing:    'Processing',
  shipped:       'Shipped',
  delivered:     'Delivered',
  cancelled:     'Cancelled',
  refunded:      'Refunded',
  cod_confirmed: 'COD – Confirmed',
};

// Next statuses available per current status
const NEXT_STATUSES = {
  pending:       ['processing', 'cancelled'],
  cod_pending:   ['cod_confirmed', 'processing', 'cancelled'],
  cod_confirmed: ['processing', 'shipped', 'delivered', 'cancelled'],
  paid:          ['processing', 'shipped', 'delivered', 'cancelled'],
  processing:    ['shipped', 'delivered', 'cancelled'],
  shipped:       ['delivered', 'cancelled'],
  delivered:     [],
  cancelled:     [],
  refunded:      [],
};

function CustomizationChips({ data }) {
  if (!data) return null;
  const entries = Object.entries(data).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
          <span className="font-semibold capitalize">{k}:</span>
          <span className="max-w-[100px] truncate">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

function OrderRow({ o, onStatusChange, updating }) {
  const [expanded, setExpanded] = useState(false);
  const isCod     = o.payment_method === 'cod';
  const nextStats = NEXT_STATUSES[o.status] || [];
  const isLocked  = ['delivered', 'cancelled', 'refunded'].includes(o.status);

  const parseCustomization = (raw) => {
    if (!raw) return null;
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { return null; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* ── Main row ── */}
      <div className="p-5 flex flex-wrap gap-4 items-start">

        {/* Left: ID + status + customer */}
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-gray-800">#{o.id}</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>
              {STATUS_LABELS[o.status] || o.status}
            </span>
            {isCod && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                💵 COD
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-700">{o.customer_name}</p>
          <p className="text-xs text-gray-400">{o.customer_email}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(o.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Centre: total + expand */}
        <div className="flex flex-col items-end gap-2">
          <p className="font-bold text-lg text-gray-900">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</p>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Hide details ▲' : `${o.items?.length || 0} item(s) ▼`}
          </button>
        </div>

        {/* Right: status updater */}
        {!isLocked && nextStats.length > 0 && (
          <select
            value=""
            disabled={updating === o.id}
            onChange={e => e.target.value && onStatusChange(o.id, e.target.value)}
            className="text-xs font-medium border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 disabled:opacity-50 cursor-pointer"
          >
            <option value="">Update status…</option>
            {nextStats.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
            ))}
          </select>
        )}
        {isLocked && (
          <span className="text-xs text-gray-400 italic self-center">Finalised</span>
        )}
      </div>

      {/* ── Expanded: items + address ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-5 grid sm:grid-cols-2 gap-6 bg-stone-50">

              {/* Order items */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Items ordered</p>
                <div className="space-y-3">
                  {(o.items || []).map((item, idx) => {
                    const cust = parseCustomization(item.customization_details || item.customization);
                    return (
                      <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{item.product_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Qty: {item.quantity} × ₹{parseFloat(item.price).toLocaleString('en-IN')}
                              <span className="ml-2 font-semibold text-gray-700">
                                = ₹{(item.quantity * parseFloat(item.price)).toLocaleString('en-IN')}
                              </span>
                            </p>
                          </div>
                        </div>
                        {/* Customization details */}
                        {cust && Object.keys(cust).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Customisation</p>
                            <CustomizationChips data={cust} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery + notes */}
              <div className="space-y-4">
                {o.delivery_address && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Delivery address</p>
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{o.delivery_address}</p>
                    </div>
                  </div>
                )}
                {o.notes && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-sm text-gray-600 italic">"{o.notes}"</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment</p>
                  <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-2">
                    <span className="text-lg">{isCod ? '💵' : '💳'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{isCod ? 'Cash on Delivery' : 'Online Payment'}</p>
                      {o.payment_id && <p className="text-xs text-gray-400 font-mono mt-0.5">{o.payment_id}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function OrderTable({ orders, onStatusChange, updating }) {
  if (!orders.length) return (
    <div className="text-center py-20 text-gray-400 text-sm">No orders found.</div>
  );
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <OrderRow key={o.id} o={o} onStatusChange={onStatusChange} updating={updating} />
      ))}
    </div>
  );
}
