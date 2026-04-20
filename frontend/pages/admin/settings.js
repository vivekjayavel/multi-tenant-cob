import { useState, useEffect } from 'react';
import Head from 'next/head';
import { m as motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
const { withAdminAuth } = require('../../lib/withAdminAuth');

const TABS = [
  { key: 'hero',     label: 'Hero Section',  icon: '🏠' },
  { key: 'features', label: 'Features',      icon: '⭐' },
  { key: 'footer',   label: 'Footer',        icon: '📄' },
  { key: 'seo',      label: 'SEO',           icon: '🔍' },
];

export default function AdminSettings({ tenant, adminUser }) {
  const [tab,      setTab]      = useState('hero');
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSettings(data.settings)).finally(() => setLoading(false));
  }, []);

  const save = async (section, data) => {
    setSaving(true); setError(null); setSaved(false);
    try {
      await api.put('/settings', { section, data });
      setSettings(s => ({ ...s, [section]: data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>{`Settings — ${tenant.name}`}</title></Head>
      <AdminLayout tenant={tenant} active="settings" adminUser={adminUser}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-gray-900">Site Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your homepage, features and footer content</p>
          </div>
          <AnimatePresence>
            {saved && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm font-medium px-4 py-2 rounded-xl">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Saved!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'text-white shadow-sm' : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'}`}
              style={tab === t.key ? { backgroundColor: 'var(--tenant-primary)' } : {}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">{error}</p>}

            {tab === 'hero'     && <HeroSection     data={settings?.hero}     onSave={d => save('hero', d)}     saving={saving} tenant={tenant} />}
            {tab === 'features' && <FeaturesSection data={settings?.features} onSave={d => save('features', d)} saving={saving} />}
            {tab === 'footer'   && <FooterSection   data={settings?.footer}   onSave={d => save('footer', d)}   saving={saving} />}
            {tab === 'seo'      && <SeoSection      data={settings?.seo}      onSave={d => save('seo', d)}      saving={saving} />}
          </div>
        )}
      </AdminLayout>
    </>
  );
}

/* ─── Hero Section ─────────────────────────────────────── */
function HeroSection({ data, onSave, saving, tenant }) {
  const [form, setForm] = useState(data || {});
  const [stats, setStats] = useState(data?.stats || []);
  const [uploading, setUploading] = useState(false);
  useEffect(() => { setForm(data || {}); setStats(data?.stats || []); }, [data]);

  const f = key => ({ value: form[key] || '', onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await api.post('/upload/product-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(p => ({ ...p, image_url: data.url }));
    } catch { alert('Image upload failed'); } finally { setUploading(false); }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-800">Hero Section</h2>

      {/* Hero Image */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Hero / Banner Image</label>
        <div className="flex items-center gap-4">
          {form.image_url ? (
            <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
              <img src={form.image_url} alt="Hero" className="w-full h-full object-cover" />
              <button onClick={() => setForm(p => ({ ...p, image_url: '' }))}
                className="absolute top-1 right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-gray-600 shadow text-xs hover:text-red-500">×</button>
            </div>
          ) : (
            <div className="w-32 h-20 rounded-xl bg-stone-100 flex items-center justify-center text-gray-400 text-xs text-center px-2 flex-shrink-0">No image</div>
          )}
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {uploading ? 'Uploading…' : 'Upload image'}
              <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            <p className="text-xs text-gray-400 mt-1">Recommended: 1200×600px, JPG/PNG/WebP</p>
          </div>
        </div>
      </div>

      <Field label="Badge text" placeholder="Fresh Baked Daily" {...f('badge')} />
      <Field label="Main heading" placeholder="Handcrafted with Love & Butter" {...f('heading')} />
      <Textarea label="Subheading" placeholder="From our oven to your table…" rows={3} value={form.subheading || ''} onChange={e => setForm(p => ({ ...p, subheading: e.target.value }))} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Primary button text"   placeholder="Explore Menu"        {...f('cta_primary')} />
        <Field label="WhatsApp button text"  placeholder="Order via WhatsApp"  {...f('cta_whatsapp')} />
      </div>

      {/* Stats */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Stats (up to 4)</label>
        <div className="space-y-2">
          {stats.map((stat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={stat.value} onChange={e => { const s=[...stats]; s[i]={...s[i],value:e.target.value}; setStats(s); }}
                placeholder="500+" className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
              <input value={stat.label} onChange={e => { const s=[...stats]; s[i]={...s[i],label:e.target.value}; setStats(s); }}
                placeholder="Happy customers" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
              <button onClick={() => setStats(stats.filter((_,j)=>j!==i))} className="text-gray-300 hover:text-red-400 transition-colors p-1">×</button>
            </div>
          ))}
          {stats.length < 4 && (
            <button onClick={() => setStats([...stats, { value: '', label: '' }])}
              className="text-sm font-medium px-4 py-2 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full">
              + Add stat
            </button>
          )}
        </div>
      </div>

      <SaveBtn saving={saving} onClick={() => onSave({ ...form, stats })} />
    </div>
  );
}

/* ─── Features Section ─────────────────────────────────── */
function FeaturesSection({ data, onSave, saving }) {
  const [features, setFeatures] = useState(data || []);
  useEffect(() => { setFeatures(data || []); }, [data]);

  const update = (i, key, val) => {
    const f = [...features]; f[i] = { ...f[i], [key]: val }; setFeatures(f);
  };

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-800">Features / Why Choose Us</h2>
      <div className="space-y-4">
        {features.map((feat, i) => (
          <div key={i} className="flex gap-3 p-4 bg-stone-50 rounded-xl border border-gray-100">
            <div className="space-y-2 flex-1">
              <div className="flex gap-2">
                <input value={feat.icon || ''} onChange={e => update(i,'icon',e.target.value)}
                  placeholder="🌾" className="w-16 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none" />
                <input value={feat.title || ''} onChange={e => update(i,'title',e.target.value)}
                  placeholder="Feature title" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
              </div>
              <input value={feat.desc || ''} onChange={e => update(i,'desc',e.target.value)}
                placeholder="Feature description" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
            </div>
            <button onClick={() => setFeatures(features.filter((_,j)=>j!==i))} className="text-gray-300 hover:text-red-400 transition-colors text-lg self-start mt-1">×</button>
          </div>
        ))}
        {features.length < 6 && (
          <button onClick={() => setFeatures([...features, { icon: '', title: '', desc: '' }])}
            className="text-sm font-medium px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full">
            + Add feature
          </button>
        )}
      </div>
      <SaveBtn saving={saving} onClick={() => onSave(features)} />
    </div>
  );
}

/* ─── Footer Section ───────────────────────────────────── */
function FooterSection({ data, onSave, saving }) {
  const [form,  setForm]  = useState(data || {});
  const [links, setLinks] = useState(data?.links || []);
  useEffect(() => { setForm(data || {}); setLinks(data?.links || []); }, [data]);

  const f = key => ({ value: form[key] || '', onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });
  const updateLink = (i, key, val) => { const l=[...links]; l[i]={...l[i],[key]:val}; setLinks(l); };

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-800">Footer Content</h2>
      <Textarea label="Tagline / About text" placeholder="Fresh baked goods crafted with love…" rows={2} value={form.tagline||''} onChange={e=>setForm(p=>({...p,tagline:e.target.value}))} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Address"        placeholder="123 Baker Street, Chennai" {...f('address')} />
        <Field label="Phone number"   placeholder="+91 98765 43210"           {...f('phone')}   />
        <Field label="Email"          placeholder="hello@yourbakery.com"      {...f('email')}   />
        <Field label="Business hours" placeholder="Mon–Sat 7am – 8pm"        {...f('hours')}   />
      </div>

      {/* Footer Links */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Footer navigation links</label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={link.label||''} onChange={e=>updateLink(i,'label',e.target.value)} placeholder="Label" className="w-32 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
              <input value={link.href||''}  onChange={e=>updateLink(i,'href',e.target.value)}  placeholder="/page"  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
              <button onClick={()=>setLinks(links.filter((_,j)=>j!==i))} className="text-gray-300 hover:text-red-400 transition-colors p-1">×</button>
            </div>
          ))}
          {links.length < 8 && (
            <button onClick={()=>setLinks([...links,{label:'',href:''}])}
              className="text-sm font-medium px-4 py-2 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full">
              + Add link
            </button>
          )}
        </div>
      </div>
      <SaveBtn saving={saving} onClick={() => onSave({ ...form, links })} />
    </div>
  );
}

/* ─── SEO Section ──────────────────────────────────────── */
function SeoSection({ data, onSave, saving }) {
  const [form, setForm] = useState(data || {});
  useEffect(() => { setForm(data || {}); }, [data]);
  const f = key => ({ value: form[key]||'', onChange: e => setForm(p=>({...p,[key]:e.target.value})) });
  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-800">SEO Settings</h2>
      <Field    label="Meta title"       placeholder="Best Cakes in Chennai — Sweet Cakes" {...f('meta_title')} />
      <Textarea label="Meta description" placeholder="Order fresh cakes and pastries from Sweet Cakes…" rows={3} value={form.meta_description||''} onChange={e=>setForm(p=>({...p,meta_description:e.target.value}))} />
      <p className="text-xs text-gray-400">Title: {(form.meta_title||'').length}/60 chars · Description: {(form.meta_description||'').length}/160 chars</p>
      <SaveBtn saving={saving} onClick={() => onSave(form)} />
    </div>
  );
}

/* ─── Shared field components ──────────────────────────── */
function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <input className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300" {...props} />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300 resize-none" {...props} />
    </div>
  );
}

function SaveBtn({ saving, onClick }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="w-full text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-lg mt-2"
      style={{ backgroundColor: 'var(--tenant-primary)' }}>
      {saving ? 'Saving…' : 'Save changes'}
    </button>
  );
}

export const getServerSideProps = withAdminAuth(async ({ tenant }) => ({ props: { tenant } }));
