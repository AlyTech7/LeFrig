'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALE_META, type Locale } from '@lefrig/shared';
import { useLocale } from '@/lib/locale';

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = LOCALE_META[locale];

  return (
    <div className={`lf-lang ${compact ? 'lf-lang--compact' : ''}`} ref={ref}>
      <button
        type="button"
        className="lf-lang__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={current.nativeName}
      >
        <span className="lf-lang__code">{locale.toUpperCase()}</span>
        {!compact && <span className="lf-lang__name">{current.nativeName}</span>}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="lf-lang__chev">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
      {open && (
        <ul className="lf-lang__menu" role="listbox" aria-label="Idioma">
          {(Object.keys(LOCALE_META) as Locale[]).map((code) => {
            const meta = LOCALE_META[code];
            const active = code === locale;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={active ? 'lf-lang__opt lf-lang__opt--on' : 'lf-lang__opt'}
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                >
                  <strong>{meta.nativeName}</strong>
                  <span>{meta.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
