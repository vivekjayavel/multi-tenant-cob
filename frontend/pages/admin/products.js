import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { m as motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import uploadApi from '../../lib/uploadApi';
import Pagination from '../../components/admin/Pagination';
import ImageUploader from '../../components/admin/ImageUploader';
import { useToast } from '../../components/ui/Toast';
import ProductCustomizationEditor from '../../components/admin/ProductCustomizationEditor';
import api from '../../lib/api';
const { withAdminAuth } = require('../../lib/withAdminAuth');

const EMPTY  = { name: '', description: '', price: '', sale_price: '', category: '', slug: '', stock_qty: '', image_url: '', images: [], customization_options: null, delivery_time: '', sort_order: '0' };
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AdminProducts({ tenant, adminUser }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,    setError]    = useState(null);
  const [panel,    setPanel]    = useState(false);

  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const LIMIT = 12;
  const [activeCategory, setActiveCategory] = useState('All');
  const handleCategoryChange = (cat) => { setActiveCategory(cat); setPage(1); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products?page=${page}&limit=${LIMIT}`);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }, [page]);

  // Derive sorted categories from products (Cakes first)
  const categories = ['All', ...[...new Set(products.map(p => p.category).filter(Boolean))].sort((a, b) => {
    if (a.toLowerCase().includes('cake') && !b.toLowerCase().includes('cake')) return -1;
    if (!a.toLowerCase().includes('cake') && b.toLowerCase().includes('cake')) return 1;
    return a.localeCompare(b);
  })];

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);
  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditId(null); setForm(EMPTY); setError(null); setPanel(true); };
  const openEdit = p  => { setEditId(p.id); setForm({ name: p.name, description: p.description || '', price: p.price, sale_price: p.sale_price || '', category: p.category || '', slug: p.slug, stock_qty: p.stock_qty, image_url: p.image_url || '', images: (() => { try { if (!p.images) return []; if (typeof p.images === 'string') return JSON.parse(p.images); return Array.isArray(p.images) ? p.images : []; } catch { return []; } })(), customization_options: p.customization_options || null, delivery_time: p.delivery_time || '', sort_order: String(p.sort_order ?? 0) }); setError(null); setPanel(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      if (editId) await api.put(`/products/${editId}`, form);
      else await api.post('/products', { ...form, slug: form.slug || slugify(form.name) });
      setPanel(false); setEditId(null); setForm(EMPTY); load();
      toast({ message: editId ? 'Product updated!' : 'Product created!', type: 'success' });
    } catch (err) { setError(err?.response?.data?.message || 'Save failed.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); load(); toast({ message: 'Product deleted', type: 'info' }); } catch (err) { toast({ message: err?.response?.data?.message || 'Delete failed', type: 'error' }); }
  };

  const f = key => ({ value: form[key], onChange: e => { const val = e.target.value; setForm(prev => ({ ...prev, [key]: val, ...(key === 'name' && !editId ? { slug: slugify(val) } : {}) })); } });

  return (
    <>
      <Head><title>{`Products — ${tenant.name}`}</title></Head>
      <AdminLayout tenant={tenant} active="products" adminUser={adminUser}>
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-2xl text-gray-900">Products</h1><p className="text-sm text-gray-500 mt-0.5">{filteredProducts.length} shown · {total} total</p></div>
          <button onClick={openNew} className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'var(--tenant-primary)' }}>+ Add product</button>
        </div>
        {/* Category filter tabs */}
        {!loading && products.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  activeCategory === cat ? 'text-white shadow-sm' : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-200'
                }`}
                style={activeCategory === cat ? { backgroundColor: 'var(--tenant-primary)' } : {}}
              >
                {cat}
                {cat !== 'All' && (
                  <span className="ml-1.5 opacity-70">
                    {products.filter(p => p.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><p className="text-4xl mb-3">🥐</p><p className="text-sm">{activeCategory === 'All' ? 'No products yet.' : `No products in "${activeCategory}".`}</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(p => (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                <div className="aspect-video bg-stone-100 overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎂</div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">{p.category}</p>
                        {p.sort_order > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                            #{p.sort_order}
                          </span>
                        )}
                        {p.sort_order === 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                            default
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: 'var(--tenant-primary)' }}>₹{parseFloat(p.sale_price || p.price).toLocaleString('en-IN')}</p>
                      {p.sale_price && parseFloat(p.sale_price) < parseFloat(p.price) && (
                        <p className="text-xs text-gray-400 line-through">₹{parseFloat(p.price).toLocaleString('en-IN')}</p>
                      )}
                    </div>
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
                    <ProductImageUploader
                      images={form.image_url ? [form.image_url, ...(form.images||[]).map(i=>i.url||i)] : (form.images||[]).map(i=>i.url||i)}
                      onAdd={(url) => setForm(f => {
                        if (!f.image_url) return { ...f, image_url: url };
                        const imgs = [...(f.images||[])];
                        if (imgs.length < 3) imgs.push({ url });
                        return { ...f, images: imgs };
                      })}
                      onRemove={(idx) => setForm(f => {
                        const all = [f.image_url, ...(f.images||[]).map(i=>i.url||i)].filter(Boolean);
                        all.splice(idx, 1);
                        return { ...f, image_url: all[0]||'', images: all.slice(1).map(u=>({url:u})) };
                      })}
                      uploading={uploading}
                      setUploading={setUploading}
                    />
                  </div>
                  {[
                    { key: 'name',      label: 'Product name', required: true,  type: 'text'   },
                    { key: 'price',     label: 'Price (₹)',    required: true,  type: 'number', min: '0', step: '0.01' },
                    { key: 'sale_price', label: 'Sale Price (₹)', required: false, type: 'number', min: '0', step: '0.01', placeholder: 'Leave empty if no sale' },
                    { key: 'stock_qty', label: 'Stock qty',    required: true,  type: 'number', min: '0' },
                    { key: 'category',  label: 'Category',     required: false, type: 'text',   placeholder: 'Cakes / Breads / Cupcakes' },
                    { key: 'sort_order', label: 'Priority order', required: false, type: 'number', placeholder: '0', min: '0', title: 'Lower number = shown first. 0 is default.' },
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Delivery Time
                      <span className="ml-1 text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="e.g. 2-3 hours, Next day delivery, Order 24hrs in advance"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300"
                        {...f('delivery_time')}
                      />
                    </div>
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

/* ─── Multi-image uploader for products ──────────────────────────── */
function ProductImageUploader({ images, onAdd, onRemove, uploading, setUploading }) {
  const MAX = 4;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || images.length >= MAX) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await uploadApi.post('/upload/product-image', fd);
      onAdd(data.url);
      e.target.value = '';
    } catch { alert('Upload failed'); } finally { setUploading(false); }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
        Product Images
        <span className="ml-1 text-gray-400 font-normal normal-case">(up to {MAX} · first = main)</span>
      </label>

      <div className="grid grid-cols-4 gap-2">
        {/* Existing images */}
        {images.map((url, idx) => url && (
          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-stone-100 border border-gray-200">
            <img src={url} alt={`Product ${idx+1}`} className="w-full h-full object-cover" />
            {/* Main badge */}
            {idx === 0 && (
              <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                Main
              </span>
            )}
            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
            >×</button>
          </div>
        ))}

        {/* Add button */}
        {images.length < MAX && (
          <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            uploading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}>
            {uploading ? (
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--tenant-primary)' }} />
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                <span className="text-[10px] text-gray-400">Add photo</span>
              </>
            )}
            <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
              onChange={handleUpload} disabled={uploading || images.length >= MAX} />
          </label>
        )}

        {/* Empty placeholders */}
        {Array.from({ length: Math.max(0, MAX - images.length - 1) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-xl border border-dashed border-gray-100 bg-gray-50/50" />
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-1.5">{images.length}/{MAX} images · JPG, PNG, WebP</p>
    </div>
  );
}
