'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { buildGlobalSearchHref, type GlobalSearchScope } from '@lefrig/shared';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { API_URL } from '@/lib/api';
import { useLocale, useT } from '@/lib/locale';
import styles from './CrownSearch.module.css';

const SCOPES: { id: GlobalSearchScope; labelKey: string; icon: AppIconName }[] = [
  { id: 'all', labelKey: 'search.scopeAll', icon: 'globe' },
  { id: 'market', labelKey: 'search.scopeMarket', icon: 'shopping-bag' },
  { id: 'shops', labelKey: 'search.scopeShops', icon: 'store' },
  { id: 'services', labelKey: 'search.scopeServices', icon: 'zap' },
  { id: 'transport', labelKey: 'search.scopeTransport', icon: 'truck' },
  { id: 'jobs', labelKey: 'search.scopeJobs', icon: 'briefcase' },
];

const PLACEHOLDER_KEYS = [
  'search.placeholderAll',
  'search.placeholderMarket',
  'search.placeholderTransport',
  'search.placeholderServices',
  'search.placeholderShops',
] as const;

const SCOPE_PLACEHOLDER: Record<GlobalSearchScope, string> = {
  all: 'search.placeholderAll',
  market: 'search.placeholderMarket',
  transport: 'search.placeholderTransport',
  services: 'search.placeholderServices',
  shops: 'search.placeholderShops',
  jobs: 'search.placeholderJobs',
};

type Suggestion = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type SearchResponse = {
  q: string;
  total: number;
  suggestions: Suggestion[];
};

const TYPE_ICON: Record<string, AppIconName> = {
  listing: 'shopping-bag',
  shop: 'store',
  service: 'zap',
  job: 'briefcase',
  need: 'heart',
  camp: 'map-pin',
  hub: 'truck',
  category: 'tag',
};

function suggestionMatchesScope(s: Suggestion, scope: GlobalSearchScope): boolean {
  if (scope === 'all') return true;
  if (scope === 'market') {
    return s.type === 'listing' || (s.type === 'category' && s.id.startsWith('listing-'));
  }
  if (scope === 'shops') return s.type === 'shop';
  if (scope === 'services') {
    return s.type === 'service' || (s.type === 'category' && s.id.startsWith('service-'));
  }
  if (scope === 'transport') return s.type === 'hub' || s.type === 'camp';
  if (scope === 'jobs') return s.type === 'job' || s.type === 'need';
  return true;
}

export function CrownSearch({ defaultScope = 'all' }: { defaultScope?: GlobalSearchScope }) {
  const t = useT();
  const { dir } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<GlobalSearchScope>(defaultScope);
  const [focused, setFocused] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const [suggestStyle, setSuggestStyle] = useState<CSSProperties | null>(null);
  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const placeholders = useMemo(() => PLACEHOLDER_KEYS.map((key) => t(key)), [t]);
  const activeScope = SCOPES.find((s) => s.id === scope) ?? SCOPES[0]!;
  const placeholder =
    focused || query ? t(SCOPE_PLACEHOLDER[scope]) : placeholders[placeholderIdx];
  const showSuggest = focused && query.trim().length >= 2;
  const visibleSuggestions = useMemo(
    () => suggestions.filter((s) => suggestionMatchesScope(s, scope)).slice(0, 8),
    [suggestions, scope],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setScope(defaultScope);
  }, [defaultScope]);

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
        zIndex: 1200,
      });
      return;
    }
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      minWidth,
      zIndex: 1200,
    });
  }, [dir]);

  const updateSuggestPos = useCallback(() => {
    const bar = inputRef.current?.closest('.sv-crown__search-bar');
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    setSuggestStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: Math.max(12, rect.left),
      width: Math.min(rect.width, window.innerWidth - 24),
      zIndex: 1210,
    });
  }, []);

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
    if (!showSuggest) {
      setSuggestStyle(null);
      return;
    }
    updateSuggestPos();
    const onReposition = () => updateSuggestPos();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [showSuggest, updateSuggestPos, query]);

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

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      abortRef.current?.abort();
      return;
    }

    setSuggestLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/search?q=${encodeURIComponent(q)}&limit=8`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error('search failed');
        const data = (await res.json()) as SearchResponse;
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions ?? []);
          setActiveIdx(-1);
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSuggestLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const pickScope = useCallback((id: GlobalSearchScope) => {
    setScope(id);
    setScopeOpen(false);
    setActiveIdx(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const go = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
      inputRef.current?.blur();
      setScopeOpen(false);
      setSuggestions([]);
    },
    [router],
  );

  const submit = useCallback(() => {
    if (activeIdx >= 0 && visibleSuggestions[activeIdx]) {
      go(visibleSuggestions[activeIdx]!.href);
      return;
    }
    go(buildGlobalSearchHref(scope, query));
  }, [activeIdx, visibleSuggestions, go, scope, query]);

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

  const suggestPanel =
    showSuggest && suggestStyle && mounted ? (
      <div
        ref={suggestRef}
        className={styles.suggest}
        style={suggestStyle}
        role="listbox"
        aria-label={t('search.suggestionsAria')}
      >
        {suggestLoading && visibleSuggestions.length === 0 ? (
          <p className={styles.muted}>{t('search.searching')}</p>
        ) : visibleSuggestions.length === 0 ? (
          <p className={styles.muted}>{t('search.noSuggestions')}</p>
        ) : (
          <ul className={styles.list} id="sv-crown-suggest">
            {visibleSuggestions.map((s, i) => (
              <li key={`${s.type}-${s.id}`} role="option" aria-selected={i === activeIdx}>
                <button
                  type="button"
                  className={i === activeIdx ? `${styles.item} ${styles.itemOn}` : styles.item}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(s.href);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <span className={styles.ico} aria-hidden>
                    <AppIcon name={TYPE_ICON[s.type] ?? 'search'} size={16} />
                  </span>
                  <span className={styles.copy}>
                    <span className={styles.title}>{s.title}</span>
                    {s.subtitle ? <span className={styles.sub}>{s.subtitle}</span> : null}
                  </span>
                  <span className={styles.type}>
                    {t(`search.groups.${s.type}` as 'search.groups.listing')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className={styles.all}
          onMouseDown={(e) => {
            e.preventDefault();
            go(buildGlobalSearchHref(scope, query));
          }}
        >
          {t('search.seeAllResults', { q: query.trim() })}
        </button>
      </div>
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
          onBlur={() => window.setTimeout(() => setFocused(false), 160)}
          onKeyDown={(e) => {
            if (!showSuggest || visibleSuggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIdx((i) => (i + 1) % visibleSuggestions.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIdx((i) => (i <= 0 ? visibleSuggestions.length - 1 : i - 1));
            } else if (e.key === 'Escape') {
              setSuggestions([]);
              setActiveIdx(-1);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-controls={showSuggest ? 'sv-crown-suggest' : undefined}
        />

        <button type="submit" className="sv-crown__search-submit" aria-label={t('search.aria')}>
          <AppIcon name="search" size={18} color="#1a1612" />
        </button>
      </form>

      {scopeMenu && mounted ? createPortal(scopeMenu, document.body) : null}
      {suggestPanel && mounted ? createPortal(suggestPanel, document.body) : null}
    </div>
  );
}
