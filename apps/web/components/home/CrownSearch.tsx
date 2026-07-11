'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { buildGlobalSearchHref, type GlobalSearchScope } from '@lefrig/shared';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { useLocale, useT } from '@/lib/locale';

const SCOPES: { id: GlobalSearchScope; labelKey: string; icon: AppIconName }[] = [
  { id: 'all', labelKey: 'search.scopeAll', icon: 'globe' },
  { id: 'market', labelKey: 'search.scopeMarket', icon: 'shopping-bag' },
  { id: 'transport', labelKey: 'search.scopeTransport', icon: 'truck' },
  { id: 'services', labelKey: 'search.scopeServices', icon: 'zap' },
];

const PLACEHOLDER_KEYS = [
  'search.placeholderMarket',
  'search.placeholderTransport',
  'search.placeholderServices',
  'search.placeholderShops',
] as const;

const SCOPE_PLACEHOLDER: Record<GlobalSearchScope, (typeof PLACEHOLDER_KEYS)[number]> = {
  all: 'search.placeholderMarket',
  market: 'search.placeholderMarket',
  transport: 'search.placeholderTransport',
  services: 'search.placeholderServices',
};

export function CrownSearch() {
  const t = useT();
  const { dir } = useLocale();
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<GlobalSearchScope>('all');
  const [focused, setFocused] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const [mounted, setMounted] = useState(false);

  const placeholders = useMemo(() => PLACEHOLDER_KEYS.map((key) => t(key)), [t]);
  const activeScope = SCOPES.find((s) => s.id === scope) ?? SCOPES[0]!;
  const placeholder =
    focused || query ? t(SCOPE_PLACEHOLDER[scope]) : placeholders[placeholderIdx];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (focused || query) return;
    const timer = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholders.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [focused, query, placeholders.length]);

  const updateMenuPos = useCallback(() => {
    const btn = scopeRef.current?.querySelector('.sv-crown__scope-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 184);
    if (dir === 'rtl') {
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
        left: 'auto',
        minWidth,
      });
      return;
    }
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      minWidth,
    });
  }, [dir]);

  useEffect(() => {
    if (!scopeOpen) {
      setMenuStyle(null);
      return;
    }
    updateMenuPos();
    const onReposition = () => updateMenuPos();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [scopeOpen, updateMenuPos]);

  useEffect(() => {
    if (!scopeOpen) return;
    const onDoc = (e: PointerEvent) => {
      const target = e.target as Node;
      if (scopeRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setScopeOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [scopeOpen]);

  const pickScope = useCallback((id: GlobalSearchScope) => {
    setScope(id);
    setScopeOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const submit = useCallback(() => {
    router.push(buildGlobalSearchHref(scope, query));
    inputRef.current?.blur();
    setScopeOpen(false);
  }, [router, scope, query]);

  const scopeMenu =
    scopeOpen && menuStyle && mounted ? (
      <ul
        ref={menuRef}
        className="sv-crown__scope-menu sv-crown__scope-menu--portal"
        role="listbox"
        aria-label={t('search.scopesAria')}
        style={menuStyle}
      >
        {SCOPES.map((s) => {
          const active = s.id === scope;
          return (
            <li key={s.id} role="option" aria-selected={active}>
              <button
                type="button"
                className={active ? 'sv-crown__scope-opt sv-crown__scope-opt--on' : 'sv-crown__scope-opt'}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pickScope(s.id);
                }}
              >
                <AppIcon name={s.icon} size={16} />
                <span>{t(s.labelKey)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div
      className={`sv-crown__search ${focused ? 'sv-crown__search--focused' : ''} ${scopeOpen ? 'sv-crown__search--scope-open' : ''}`}
    >
      <form
        className="sv-crown__search-bar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="sv-crown__scope" ref={scopeRef}>
          <button
            type="button"
            className="sv-crown__scope-btn"
            aria-expanded={scopeOpen}
            aria-haspopup="listbox"
            aria-label={t('search.scopesAria')}
            onClick={() => setScopeOpen((open) => !open)}
          >
            <span className="sv-crown__scope-icon" aria-hidden>
              <AppIcon name={activeScope.icon} size={15} />
            </span>
            <span className="sv-crown__scope-label">{t(activeScope.labelKey)}</span>
            <AppIcon name="chevron-down" size={14} className="sv-crown__scope-chev" />
          </button>
        </div>

        <span className="sv-crown__search-divider" aria-hidden />

        <label htmlFor={inputId} className="sv-crown__search-label">
          {t('search.label')}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          className="sv-crown__search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
        />

        <button type="submit" className="sv-crown__search-submit" aria-label={t('search.aria')}>
          <AppIcon name="search" size={18} color="#1a1612" />
        </button>
      </form>

      {scopeMenu && mounted ? createPortal(scopeMenu, document.body) : null}
    </div>
  );
}
