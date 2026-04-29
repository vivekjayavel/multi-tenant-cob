import { useState, useEffect } from 'react';
import Head from 'next/head';
import { m as motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import uploadApi from '../../lib/uploadApi';
const { withAdminAuth } = require('../../lib/withAdminAuth');

const TABS = [
  { key: 'branding', label: 'Branding',      icon: '🎨' },
  { key: 'hero',     label: 'Hero Section',  icon: '🏠' },
  { key: 'features', label: 'Features',      icon: '⭐' },
  { key: 'footer',   label: 'Footer',        icon: '📄' },
  { key: 'seo',      label: 'SEO',           icon: '🔍' },
];

export default function AdminSettings({ tenant, adminUser }) {
  const toast = useToast();
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
    setSaving(true); setError(null);
    try {
      await api.put('/settings', { section, data });
      setSettings(s => ({ ...s, [section]: data }));
      toast({ message: 'Settings saved successfully!', type: 'success' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Save failed';
      setError(msg);
      toast({ message: msg, type: 'error' });
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

            {tab === 'branding' && <BrandingSection tenant={tenant} saving={saving} setSaving={setSaving} setError={setError} setSaved={setSaved} toast={toast} />}
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
  useEffect(() => {
    setForm(data || {});
    setStats(data?.stats || []);
  }, [data]);

  const f = key => ({ value: form[key] || '', onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Count existing images
    const currentImgs = (form.images || []);
    const hasMain = !!form.image_url;
    const totalExisting = currentImgs.length + (hasMain ? 1 : 0);
    if (totalExisting >= 5) { alert('Maximum 5 images allowed'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await uploadApi.post('/settings/hero-image', fd);
      setForm(p => {
        const newUrl = data.url;
        // Always accumulate — store first image as image_url, rest in images[]
        if (!p.image_url) {
          return { ...p, image_url: newUrl };
        }
        const existingImages = p.images || [];
        return { ...p, images: [...existingImages, { url: newUrl }] };
      });
      // Clear the file input so same file can be selected again
      e.target.value = '';
    } catch { alert('Image upload failed'); } finally { setUploading(false); }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-800">Hero Section</h2>

      {/* Hero Images (multiple) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Hero / Banner Images</label>
          <span className="text-xs text-gray-400">{(form.images || []).length + (form.image_url ? 1 : 0)} image(s) — swipe slideshow</span>
        </div>

        {/* Existing images grid */}
        {(() => {
          const imgs = [...(form.images || []).map(i => i.url), ...(form.image_url && !(form.images||[]).find(i=>i.url===form.image_url) ? [form.image_url] : [])];
          return imgs.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {imgs.map((url, idx) => (
                <div key={idx} className="relative w-28 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 group">
                  <img src={url} alt={`Hero ${idx+1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => {
                      const newImgs = imgs.filter((_, i) => i !== idx);
                      // Rebuild: first becomes image_url, rest become images[]
                      setForm(p => ({
                        ...p,
                        image_url: newImgs[0] || '',
                        images: newImgs.slice(1).map(u => ({ url: u })),
                      }));
                    }} className="bg-white rounded-full w-6 h-6 flex items-center justify-center text-red-500 text-sm font-bold shadow">×</button>
                  </div>
                  {idx === 0 && <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">Main</span>}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Upload button */}
        <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium border border-dashed border-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {uploading ? 'Uploading…' : 'Add image'}
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} disabled={uploading} />
        </label>
        <p className="text-xs text-gray-400 mt-1.5">1920×1080px recommended · JPG/PNG/WebP · Add up to 5 images for slideshow</p>
      </div>

      {/* Overlay Toggle + Intensity — only shown when image is uploaded */}
      {form.image_url && (
        <div className="bg-stone-50 border border-gray-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Background Overlay</p>
              <p className="text-xs text-gray-400 mt-0.5">Darkens the hero image so text is readable</p>
            </div>
            <button type="button"
              onClick={() => setForm(p => ({ ...p, overlay_enabled: !p.overlay_enabled }))}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.overlay_enabled !== false ? '' : 'bg-gray-200'}`}
              style={form.overlay_enabled !== false ? { backgroundColor: 'var(--tenant-primary)' } : {}}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.overlay_enabled !== false ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {form.overlay_enabled !== false && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Overlay Intensity</p>
              <div className="grid grid-cols-4 gap-2">
                {['none','light','medium','strong'].map(lvl => (
                  <button key={lvl} type="button"
                    onClick={() => setForm(p => ({ ...p, overlay_intensity: lvl }))}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                      (form.overlay_intensity || 'medium') === lvl ? 'text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                    style={(form.overlay_intensity || 'medium') === lvl ? { backgroundColor: 'var(--tenant-primary)', borderColor: 'var(--tenant-primary)' } : {}}>
                    {lvl}
                  </button>
                ))}
              </div>
              {/* Live preview strip */}
              <div className="mt-3 h-16 rounded-xl overflow-hidden relative">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{
                  background: form.overlay_intensity === 'none'   ? 'none'
                            : form.overlay_intensity === 'light'  ? 'linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0.1))'
                            : form.overlay_intensity === 'strong' ? 'linear-gradient(to right, rgba(0,0,0,0.88), rgba(0,0,0,0.4))'
                            : 'linear-gradient(to right, rgba(0,0,0,0.72), rgba(0,0,0,0.25))', // medium
                }} />
                <p className="absolute left-3 bottom-2 text-white text-xs font-bold drop-shadow">
                  {form.overlay_intensity === 'none' ? 'No overlay — image only' : 'Text will show here'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text content visibility toggle */}
      <div className="bg-stone-50 border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Show text content</p>
            <p className="text-xs text-gray-400 mt-0.5">Badge, heading, subheading, CTAs and stats</p>
          </div>
          <button type="button"
            onClick={() => setForm(p => ({ ...p, show_text_content: p.show_text_content === false ? true : false }))}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.show_text_content !== false ? '' : 'bg-gray-200'}`}
            style={form.show_text_content !== false ? { backgroundColor: 'var(--tenant-primary)' } : {}}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.show_text_content !== false ? 'left-7' : 'left-1'}`} />
          </button>
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
      {/* Social Media */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Social Media Links</label>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <input value={form.instagram||''} onChange={e=>setForm(p=>({...p,instagram:e.target.value}))} placeholder="https://instagram.com/yourbakery" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📘</span>
            <input value={form.facebook||''} onChange={e=>setForm(p=>({...p,facebook:e.target.value}))} placeholder="https://facebook.com/yourbakery" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🐦</span>
            <input value={form.twitter||''} onChange={e=>setForm(p=>({...p,twitter:e.target.value}))} placeholder="https://twitter.com/yourbakery" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">▶️</span>
            <input value={form.youtube||''} onChange={e=>setForm(p=>({...p,youtube:e.target.value}))} placeholder="https://youtube.com/@yourbakery" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎵</span>
            <input value={form.tiktok||''} onChange={e=>setForm(p=>({...p,tiktok:e.target.value}))} placeholder="https://tiktok.com/@yourbakery" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📌</span>
            <input value={form.pinterest||''} onChange={e=>setForm(p=>({...p,pinterest:e.target.value}))} placeholder="https://pinterest.com/yourbakery" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
          </div>
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

/* ─── Branding Section ─────────────────────────────────── */
const PRESET_COLORS = [
  { name: 'Amber',     hex: '#D97706' },
  { name: 'Rose',      hex: '#E11D48' },
  { name: 'Violet',    hex: '#7C3AED' },
  { name: 'Emerald',   hex: '#059669' },
  { name: 'Sky',       hex: '#0284C7' },
  { name: 'Orange',    hex: '#EA580C' },
  { name: 'Pink',      hex: '#DB2777' },
  { name: 'Teal',      hex: '#0D9488' },
  { name: 'Indigo',    hex: '#4F46E5' },
  { name: 'Slate',     hex: '#475569' },
];

function BrandingSection({ tenant, saving, setSaving, setError, setSaved, toast }) {
  const [name,          setName]         = useState(tenant?.name            || '');
  const [color,         setColor]        = useState(tenant?.theme_color     || '#D97706');
  const [whatsapp,      setWhatsapp]     = useState(tenant?.whatsapp_number || '');
  const [preview,       setPreview]      = useState(tenant?.theme_color     || '#D97706');
  const [logoUrl,       setLogoUrl]      = useState(tenant?.logo_url        || '');
  const [shopTagline,   setShopTagline]   = useState(() => {
    try {
      const ts = typeof tenant?.tenant_settings === 'string'
        ? JSON.parse(tenant?.tenant_settings)
        : tenant?.tenant_settings;
      return ts?.branding?.shop_tagline || 'Bakery & Cakes';
    } catch { return 'Bakery & Cakes'; }
  });
  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type client-side before uploading
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5MB');
      return;
    }
    setLogoUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      // Do NOT set Content-Type header — axios sets it with boundary automatically
      const { data } = await uploadApi.post('/upload/logo', fd);
      setLogoUrl(data.url);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Logo upload failed';
      setError(`Upload failed: ${msg}`);
      console.error('Logo upload error:', err?.response?.data || err);
    } finally { setLogoUploading(false); }
  };

  const handleColorChange = (hex) => {
    setColor(hex);
    setPreview(hex);
    // Live preview — update CSS variable immediately
    document.documentElement.style.setProperty('--tenant-primary',      hex);
    document.documentElement.style.setProperty('--tenant-primary-dark', darken(hex, 15));
  };

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    try {
      await api.put('/settings/branding', { theme_color: color, name, whatsapp_number: whatsapp, logo_url: logoUrl, shop_tagline: shopTagline });
      toast({ message: 'Branding saved! Refreshing…', type: 'success' });
      setTimeout(() => { window.location.reload(); }, 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Save failed';
      setError(msg);
      toast({ message: msg, type: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-gray-800">Branding & Theme</h2>

      {/* Logo upload */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Store Logo</label>
        <div className="flex items-start gap-4">
          {/* Logo preview */}
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-stone-50 overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {logoUploading ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={logoUploading}
              />
            </label>
            {logoUrl && (
              <button
                onClick={() => setLogoUrl('')}
                className="block text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Remove logo
              </button>
            )}
            <p className="text-xs text-gray-400">PNG with transparent background recommended · Max 5MB</p>
            {/* ── Logo preview panels ── */}
            <div className="mt-3 space-y-2">
              {/* Dark preview (Footer) */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Footer (dark background)</p>
                <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 w-full max-w-xs">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="logo preview dark"
                      className="h-8 w-auto object-contain flex-shrink-0 rounded"
                      style={{ maxWidth: '36px', background: 'rgba(255,255,255,0.12)', padding: '3px' }}
                    />
                  ) : null}
                  <span className="font-display font-bold text-sm" style={{ color: 'var(--tenant-primary)' }}>
                    {name || 'Shop Name'}
                  </span>
                </div>
              </div>

              {/* Light preview (Navbar) */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Navbar (light background)</p>
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 w-full max-w-xs shadow-sm">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="logo preview light"
                      className="h-8 w-auto object-contain flex-shrink-0"
                      style={{ maxWidth: '36px' }}
                    />
                  ) : null}
                  <span className="font-display font-bold text-sm" style={{ color: 'var(--tenant-primary)' }}>
                    {name || 'Shop Name'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store name */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Store name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Sweet Cakes"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all" />
      </div>

      {/* Shop tagline / subtitle */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Shop tagline
          <span className="ml-1 text-gray-400 font-normal normal-case">(shown under shop name in header)</span>
        </label>
        <input
          value={shopTagline}
          onChange={e => setShopTagline(e.target.value)}
          placeholder="Bakery & Cakes"
          maxLength={50}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all"
        />
        <p className="text-xs text-gray-400 mt-1">Preview: <span className="font-medium text-gray-600">{shopTagline || 'Bakery & Cakes'}</span></p>
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">WhatsApp number <span className="text-gray-400 normal-case font-normal">(digits only, no spaces)</span></label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 bg-gray-50 border border-gray-200 px-3 py-3 rounded-xl">+</span>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g,''))}
            placeholder="919876543210" maxLength={15}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all" />
        </div>
        <p className="text-xs text-gray-400 mt-1">Include country code — e.g. 91 for India</p>
      </div>

      {/* Theme color */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Theme color</label>

        {/* Live preview bar */}
        <div className="mb-4 p-4 rounded-2xl border border-gray-100 bg-stone-50 space-y-3">
          <p className="text-xs text-gray-500 font-medium">Live preview</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-10 px-5 rounded-full text-white text-sm font-semibold flex items-center"
              style={{ backgroundColor: preview }}>Primary button</div>
            <div className="h-10 px-5 rounded-full text-sm font-semibold border-2 flex items-center"
              style={{ borderColor: preview, color: preview }}>Outline button</div>
            <span className="text-sm font-bold" style={{ color: preview }}>Link text</span>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: preview }}>3</div>
          </div>
        </div>

        {/* Preset swatches */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-4">
          {PRESET_COLORS.map(p => (
            <button key={p.hex} onClick={() => handleColorChange(p.hex)}
              title={p.name}
              className={`w-full aspect-square rounded-xl transition-all duration-150 hover:scale-110 ${color === p.hex ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
              style={{ backgroundColor: p.hex }} />
          ))}
        </div>

        {/* Custom color input */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input type="color" value={color} onChange={e => handleColorChange(e.target.value)}
              className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Custom hex color</label>
            <input value={color}
              onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) handleColorChange(e.target.value); }}
              placeholder="#D97706" maxLength={7}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 transition-all" />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Current</p>
            <div className="w-12 h-12 rounded-xl border border-gray-100 shadow-sm"
              style={{ backgroundColor: preview }} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Changes preview instantly. Click Save to apply permanently.</p>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-lg"
        style={{ backgroundColor: 'var(--tenant-primary)' }}>
        {saving ? 'Saving…' : 'Save branding'}
      </button>
    </div>
  );
}

function darken(hex, amount) {
  try {
    const num = parseInt(hex.replace('#',''), 16);
    const r   = Math.max(0, (num >> 16) - amount);
    const g   = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b   = Math.max(0, (num & 0xFF) - amount);
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  } catch { return '#B45309'; }
}
