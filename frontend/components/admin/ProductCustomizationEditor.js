import { useState } from 'react';

const DEFAULT_OPTIONS = {
  weight:       { enabled: false, label: 'Weight',              options: ['500g', '1kg', '2kg', '3kg'], placeholder: '' },
  egg:          { enabled: false, label: 'Egg / Eggless',       options: ['Egg', 'Eggless'], placeholder: '', surcharge: 50 },
  flavour:      { enabled: false, label: 'Flavour',             options: ['Chocolate', 'Vanilla', 'Strawberry', 'Butterscotch'], placeholder: '' },
  occasion:     { enabled: false, label: 'Occasion',            options: ['Birthday', 'Anniversary', 'Wedding', 'Baby Shower', 'Farewell'], placeholder: '' },
  message:      { enabled: false, label: 'Message on Cake',     options: [], placeholder: 'e.g. Happy Birthday John!' },
  instructions: { enabled: false, label: 'Special Instructions', options: [], placeholder: 'Allergies, preferences, delivery notes…' },
};

export default function ProductCustomizationEditor({ value, onChange }) {
  const opts = parseOrDefault(value);

  const toggle = (key) => {
    const updated = { ...opts, [key]: { ...opts[key], enabled: !opts[key].enabled } };
    onChange(hasAnyEnabled(updated) ? updated : null);
  };

  const updateField = (key, field, val) => {
    const updated = { ...opts, [key]: { ...opts[key], [field]: val } };
    onChange(updated);
  };

  const updateOptions = (key, raw) => {
    const options = raw.split('\n').map(s => s.trim()).filter(Boolean);
    updateField(key, 'options', options);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Customisation Options
        </label>
        {hasAnyEnabled(opts) && (
          <button type="button" onClick={() => onChange(null)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors">
            Clear all
          </button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {Object.entries(DEFAULT_OPTIONS).map(([key, defaults]) => {
          const opt     = opts[key] || defaults;
          const isText  = key === 'message' || key === 'instructions';
          const enabled = opt.enabled;

          return (
            <div key={key} className={`transition-colors ${enabled ? 'bg-white' : 'bg-gray-50/50'}`}>
              {/* Toggle row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toggle(key)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${enabled ? '' : 'bg-gray-200'}`}
                    style={enabled ? { backgroundColor: 'var(--tenant-primary)' } : {}}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">{defaults.label}</span>
                </div>
                {enabled && (
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {isText ? 'text input' : `${opt.options?.length || 0} options`}
                  </span>
                )}
              </div>

              {/* Expanded editor */}
              {enabled && (
                <div className="px-4 pb-4 space-y-2">
                  {/* Custom label */}
                  <input
                    type="text"
                    value={opt.label || defaults.label}
                    onChange={e => updateField(key, 'label', e.target.value)}
                    placeholder="Label shown to customer"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 bg-white"
                  />

                  {/* Options list (dropdowns only) */}
                  {!isText && (
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">Options (one per line)</p>
                      <textarea
                        value={(opt.options || []).join('\n')}
                        onChange={e => updateOptions(key, e.target.value)}
                        rows={4}
                        placeholder={`e.g.\n${defaults.options.slice(0, 3).join('\n')}`}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 resize-none bg-white placeholder-gray-300"
                      />
                      {/* Preview pills */}
                      {(opt.options || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {opt.options.map(o => (
                            <span key={o} className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 bg-white">
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Placeholder (text inputs only) */}
                  {isText && (
                    <input
                      type="text"
                      value={opt.placeholder || defaults.placeholder}
                      onChange={e => updateField(key, 'placeholder', e.target.value)}
                      placeholder="Placeholder text shown to customer"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 bg-white"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseOrDefault(value) {
  if (!value) return Object.fromEntries(
    Object.entries(DEFAULT_OPTIONS).map(([k, v]) => [k, { ...v }])
  );
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Object.fromEntries(
      Object.entries(DEFAULT_OPTIONS).map(([k, v]) => [k, { ...v, ...parsed[k] }])
    );
  } catch {
    return Object.fromEntries(Object.entries(DEFAULT_OPTIONS).map(([k, v]) => [k, { ...v }]));
  }
}

function hasAnyEnabled(opts) {
  return Object.values(opts).some(o => o?.enabled);
}
