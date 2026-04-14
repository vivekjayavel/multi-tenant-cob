import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadProductImage } from '../../lib/upload';

export default function ImageUploader({ productId, currentImage, onUpload }) {
  const [preview,   setPreview]   = useState(currentImage || null);
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const inputRef = useRef(null);
  const ACCEPTED = ['image/jpeg','image/png','image/webp'], MAX_MB = 5;

  const handleFile = useCallback(async (file) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) { setError('Only JPG, PNG, and WebP files are allowed.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File must be under ${MAX_MB}MB.`); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setUploading(true); setProgress(0);
    try { const data = await uploadProductImage(file, productId, setProgress); onUpload?.(data); }
    catch (err) { setError(err?.response?.data?.message || 'Upload failed. Please try again.'); setPreview(currentImage || null); }
    finally { setUploading(false); setProgress(0); }
  }, [productId, currentImage, onUpload]);

  return (
    <div className="space-y-3">
      <div onClick={() => !uploading && inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }} className={`relative rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden min-h-[200px] ${dragOver ? 'scale-[1.01]' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'} ${uploading ? 'cursor-not-allowed opacity-80' : ''}`} style={dragOver ? { borderColor: 'var(--tenant-primary)' } : {}}>
        <AnimatePresence mode="wait">
          {preview ? <motion.img key="preview" src={preview} alt="Preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full object-cover absolute inset-0" style={{ maxHeight: '280px' }} /> : <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-12 px-6 text-center"><svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg><div><p className="text-sm font-medium text-gray-700">Drop image here or <span style={{ color: 'var(--tenant-primary)' }}>browse</span></p><p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · max {MAX_MB}MB</p></div></motion.div>}
        </AnimatePresence>
        {uploading && <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3"><p className="text-white text-sm font-medium">Uploading… {progress}%</p><div className="w-48 h-1.5 bg-white/30 rounded-full overflow-hidden"><motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: 'linear' }} /></div></div>}
        {preview && !uploading && <div className="absolute bottom-3 right-3"><button type="button" className="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50">Replace</button></div>}
      </div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      <AnimatePresence>
        {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-600 flex items-center gap-1.5"><svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</motion.p>}
      </AnimatePresence>
    </div>
  );
}
