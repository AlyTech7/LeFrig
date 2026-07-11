'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const routes = [
  { href: '/', label: 'Centro de mando', icon: '◈', group: 'Comando' },
  { href: '/analytics', label: 'Analytics', icon: '◎', group: 'Comando' },
  { href: '/camps', label: 'Campamentos', icon: '⬡', group: 'Comando' },
  { href: '/audit', label: 'Auditoría', icon: '◷', group: 'Comando' },
  { href: '/users', label: 'Usuarios', icon: '◉', group: 'Plataforma' },
  { href: '/listings', label: 'Anuncios', icon: '▣', group: 'Plataforma' },
  { href: '/shops', label: 'Tiendas', icon: '◫', group: 'Plataforma' },
  { href: '/orders', label: 'Pedidos', icon: '◧', group: 'Plataforma' },
  { href: '/transport', label: 'Transporte', icon: '⬢', group: 'Plataforma' },
  { href: '/vouchers', label: 'Vouchers', icon: '◆', group: 'Plataforma' },
  { href: '/moderation', label: 'Moderación', icon: '⬡', group: 'Seguridad' },
  { href: '/disputes', label: 'Disputas', icon: '⚖', group: 'Seguridad' },
  { href: '/settings', label: 'Configuración', icon: '⚙', group: 'Sistema' },
];

const CmdCtx = createContext({ open: () => {} });

export function useCommandPalette() {
  return useContext(CmdCtx);
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = routes.filter(
    (r) =>
      r.label.toLowerCase().includes(query.toLowerCase()) ||
      r.group.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <CmdCtx.Provider value={{ open: openPalette }}>
      {children}
      {open ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(5, 8, 12, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'start center',
            paddingTop: '15vh',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="adm-glass"
            style={{ width: '100%', maxWidth: 520, borderRadius: 20, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)' }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ir a sección… (Ctrl+K)"
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--adm-text)',
                  fontSize: '1rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ maxHeight: 320, overflow: 'auto', padding: 8 }}>
              {filtered.map((r) => (
                <button
                  key={r.href}
                  type="button"
                  className="adm-cmd-item"
                  onClick={() => {
                    router.push(r.href);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <span>{r.icon}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{r.label}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>{r.group}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </CmdCtx.Provider>
  );
}
