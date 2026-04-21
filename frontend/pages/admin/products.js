import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { m as motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import ImageUploader from '../../components/admin/ImageUploader';
import ProductCustomizationEditor from '../../components/admin/ProductCustomizationEditor';
import api from '../../lib/api';
const { withAdminAuth } = require('../../lib/withAdminAuth');

const EMPTY  = { name: '', description: '', price: '', category: '', slug: '', stock_qty: '', image_url: '', customization_options: null };
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AdminProducts({ tenant, adminUser }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [panel,    setPanel]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/products'); setProducts(data.products || []); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditId(null); setForm(EMPTY); setError(null); setPanel(true); };
  const openEdit = p  => { setEditId(p.id); setForm({ name: p.name, description: p.description || '', price: p.price, category: p.category || '', slug: p.slug, stock_qty: p.stock_qty, image_url: p.image_url || '', customization_options: p.customization_options || null }); setError(null); setPanel(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      if (editId) await api.put(`/products/${editId}`, form);
      else await api.post('/products', { ...form, slug: form.slug || slugify(form.name) });
      setPanel(false); load();
    } catch (err) { setError(err?.response?.data?.message || 'Save failed.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); load(); } catch (err) { alert(err?.response?.data?.message || 'Delete failed.'); }
  };

  const f = key => ({ value: form[key], onChange: e => { const val = e.target.value; setForm(prev => ({ ...prev, [key]: val, ...(key === 'name' && !editId ? { slug: slugify(val) } : {}) })); } });

  return (
    <>
      <Head><title>{`Products — ${tenant.name}`}</title></Head>
      <AdminLayout tenant={tenant} active="products" adminUser={adminUser}>
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-2xl text-gray-900">Products</h1><p className="text-sm text-gray-500 mt-0.5">{products.length} items</p></div>
          <button onClick={openNew} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'var(--tenant-primary)' }}>+ Add product</button>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><p className="text-4xl mb-3">🥐</p><p className="text-sm">No products yet.</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                <div className="aspect-video bg-stone-100 overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎂</div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p><p className="text-xs text-gray-400 mt-0.5">{p.category}</p></div>
                    <p className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--tenant-primary)' }}>₹{parseFloat(p.price).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${(p.available_qty || 0) > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{(p.available_qty || 0) > 0 ? `${p.available_qty || p.stock_qty} available` : 'Out of stock'}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs text-gray-500 hover:text-gray-800 transition-colors px-2 py-1">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1">Delete</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <AnimatePresence>
          {panel && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanel(false)} className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
              <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <h2 className="font-display text-lg font-semibold">{editId ? 'Edit product' : 'New product'}</h2>
                  <button onClick={() => setPanel(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={handleSave} className="flex-1 px-6 py-6 space-y-4">
                  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Product image</label>
                    <ImageUploader productId={editId} currentImage={form.image_url} onUpload={data => setForm(f => ({ ...f, image_url: data.url }))} />
                  </div>
                  {[
                    { key: 'name',      label: 'Product name', required: true,  type: 'text'   },
                    { key: 'price',     label: 'Price (₹)',    required: true,  type: 'number', min: '0', step: '0.01' },
                    { key: 'stock_qty', label: 'Stock qty',    required: true,  type: 'number', min: '0' },
                    { key: 'category',  label: 'Category',     required: false, type: 'text',   placeholder: 'Cakes / Breads / Cupcakes' },
                    { key: 'slug',      label: 'URL slug',     required: true,  type: 'text',   pattern: '[a-z0-9]+(-[a-z0-9]+)*' },
                  ].map(({ key, label, ...rest }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
                      <input className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300" {...rest} {...f(key)} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Description</label>
                    <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 transition-all placeholder-gray-300" placeholder="What makes this special…" {...f('description')} />
                  </div>
                  {/* Customisation Options */}
                  <ProductCustomizationEditor
                    value={form.customization_options}
                    onChange={val => setForm(f => ({ ...f, customization_options: val }))}
                  />

                  <button type="submit" disabled={saving} className="w-full text-white font-semibold py-3.5 rounded-xl transition-all duration-200 mt-2 disabled:opacity-60 hover:-translate-y-0.5" style={{ backgroundColor: 'var(--tenant-primary)' }}>
                    {saving ? 'Saving…' : editId ? 'Update product' : 'Create product'}
                  </button>
                </form>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </AdminLayout>
    </>
  );
}

export const getServerSideProps = withAdminAuth(async ({ tenant }) => ({ props: { tenant } }));
