import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useToast } from './Toast';

export default function CustomizeModal({ product, onClose }) {
  const { dispatch } = useCart();
  const toast = useToast();
  const opts = parseOptions(product.customization_options);

  const [selections, setSelections] = useState({
    weight:       '',
    flavour:      '',
    occasion:     '',
    message:      '',
    instructions: '',
  });
  const [qty,   setQty]   = useState(1);
  const [error, setError] = useState('');

  const set = (key, val) => setSelections(s => ({ ...s, [key]: val }));

  const handleAdd = () => {
    // Validate required dropdowns
    const missing = [];
    if (opts.weight?.enabled   && opts.weight.options.length   && !selections.weight)   missing.push(opts.weight.label   || 'Weight');
    if (opts.flavour?.enabled  && opts.flavour.options.length  && !selections.flavour)  missing.push(opts.flavour.label  || 'Flavour');
    if (opts.occasion?.enabled && opts.occasion.options.length && !selections.occasion) missing.push(opts.occasion.label || 'Occasion');
    if (missing.length) { setError(`Please select: ${missing.join(', ')}`); return; }

    // Build clean customization object (only non-empty values)
    const customization = {};
    if (selections.weight)       customization.weight       = selections.weight;
    if (selections.flavour)      customization.flavour      = selections.flavour;
    if (selections.occasion)     customization.occasion     = selections.occasion;
    if (selections.message)      customization.message      = selections.message;
    if (selections.instructions) customization.instructions = selections.instructions;

    const itemName = product.name;
    dispatch({
      type: 'ADD',
      item: {
        id:             product.id,
        name:           product.name,
        price:          unitPrice,
        original_price: getWeightPrice(selections.weight, originalPrice, 1),
        image_url:      product.image_url,
        slug:           product.slug,
        quantity:       qty,
        customization:  Object.keys(customization).length ? customization : undefined,
      },
    });
    toast({ message: `${itemName} added to cart 🛒`, type: 'success', duration: 2000 });
    onClose();
  };

  const available = product.available_qty ?? product.stock_qty ?? 0;
  // Lock body scroll when modal opens
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const originalPrice = parseFloat(product.price);
  const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
  const discountRatio = salePrice ? salePrice / originalPrice : 1;
  const basePrice = salePrice || originalPrice;
  const unitPrice = getWeightPrice(selections.weight, basePrice, discountRatio);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-0 sm:px-4"
        style={{ paddingTop: '88px', paddingBottom: '8px' }}
        onTouchMove={e => e.preventDefault()}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col mx-4 sm:mx-0" style={{ height: 'calc(100dvh - 100px)', maxHeight: '680px' }}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-5 border-b border-gray-100 flex-shrink-0">
            {product.image_url && (
              <img src={product.image_url} alt={product.name}
                className="w-16 h-16 object-cover rounded-2xl flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-gray-900 text-lg leading-tight">{product.name}</h2>
              <p className="font-bold text-base mt-0.5" style={{ color: 'var(--tenant-primary)' }}>
                ₹{unitPrice.toLocaleString('en-IN')}
              </p>
              {product.delivery_time && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-amber-700 font-medium">{product.delivery_time}</span>
                </div>
              )}
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Options */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
                {error}
              </motion.p>
            )}

            {/* Weight */}
            {opts.weight?.enabled && opts.weight.options.length > 0 && (
              <WeightField
                label={opts.weight.label || 'Weight'}
                value={selections.weight}
                options={opts.weight.options}
                onChange={v => { set('weight', v); setError(''); }}
                discountRatio={discountRatio}
                required
              />
            )}

            {/* Flavour */}
            {opts.flavour?.enabled && opts.flavour.options.length > 0 && (
              <DropdownField
                label={opts.flavour.label || 'Flavour'}
                value={selections.flavour}
                options={opts.flavour.options}
                onChange={v => { set('flavour', v); setError(''); }}
                required
              />
            )}

            {/* Occasion */}
            {opts.occasion?.enabled && opts.occasion.options.length > 0 && (
              <DropdownField
                label={opts.occasion.label || 'Occasion'}
                value={selections.occasion}
                options={opts.occasion.options}
                onChange={v => { set('occasion', v); setError(''); }}
                required
              />
            )}

            {/* Message on cake */}
            {opts.message?.enabled && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {opts.message.label || 'Message on Cake'}
                  <span className="ml-1 text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={selections.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder={opts.message.placeholder || 'e.g. Happy Birthday John!'}
                  maxLength={60}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300"
                />
                <p className="text-right text-[10px] text-gray-400 mt-1">{selections.message.length}/60</p>
              </div>
            )}

            {/* Special Instructions */}
            {opts.instructions?.enabled && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {opts.instructions.label || 'Special Instructions'}
                  <span className="ml-1 text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={selections.instructions}
                  onChange={e => set('instructions', e.target.value)}
                  placeholder={opts.instructions.placeholder || 'Allergies, preferences, delivery notes…'}
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300 resize-none"
                />
                <p className="text-right text-[10px] text-gray-400 mt-1">{selections.instructions.length}/300</p>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold text-gray-700">Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-gray-600 hover:bg-gray-50 transition-colors font-medium text-base sm:text-lg">−</button>
                <span className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold border-x border-gray-200 min-w-[36px] sm:min-w-[44px] text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(available, q + 1))}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 text-gray-600 hover:bg-gray-50 transition-colors font-medium text-base sm:text-lg">+</button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-500 text-sm sm:text-base">Total</span>
              <span className="font-bold text-base sm:text-lg" style={{ color: 'var(--tenant-primary)' }}>
                ₹{(unitPrice * qty).toLocaleString('en-IN')}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              disabled={available === 0}
              className="w-full text-white font-semibold py-3 sm:py-4 rounded-2xl transition-all hover:shadow-lg disabled:opacity-50 text-sm sm:text-base"
              style={{ backgroundColor: 'var(--tenant-primary)' }}>
              Add to Cart
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  , document.body);
}

function WeightField({ label, value, options, onChange, required, discountRatio = 1 }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const { label: optLabel, price } = parseWeightOption(opt);
          const saleWeightPrice = price !== null ? Math.round(price * discountRatio) : null;
          const isSelected = value === opt;
          const hasSale = discountRatio < 1 && price !== null;
          return (
            <button key={opt} onClick={() => onChange(opt)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border-2 transition-all ${
                isSelected
                  ? 'text-white border-transparent shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              }`}
              style={isSelected ? { backgroundColor: 'var(--tenant-primary)', borderColor: 'var(--tenant-primary)' } : {}}>
              <span>{optLabel}</span>
              {saleWeightPrice !== null && (
                <span className={`ml-1 text-[10px] sm:text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  ₹{saleWeightPrice.toLocaleString('en-IN')}
                  {hasSale && <span className={`ml-0.5 line-through text-[9px] sm:text-[10px] ${isSelected ? 'text-white/50' : 'text-gray-300'}`}>₹{price.toLocaleString('en-IN')}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DropdownField({ label, value, options, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {/* Pill selector */}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border-2 transition-all ${
              value === opt
                ? 'text-white border-transparent shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
            style={value === opt ? { backgroundColor: 'var(--tenant-primary)', borderColor: 'var(--tenant-primary)' } : {}}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function parseOptions(raw) {
  if (!raw) return {};
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch { return {}; }
}

// Parse weight option: "1kg|1499" → { label: "1kg", price: 1499 }
// Plain "1kg" → { label: "1kg", price: null }
function parseWeightOption(opt) {
  const parts = String(opt).split('|');
  return {
    label: parts[0].trim(),
    price: parts[1] ? parseFloat(parts[1]) : null,
  };
}

function getWeightPrice(weightValue, basePrice, discountRatio = 1) {
  if (!weightValue) return basePrice;
  const parsed = parseWeightOption(weightValue);
  if (parsed.price !== null) return Math.round(parsed.price * discountRatio);
  return basePrice;
}
