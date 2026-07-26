import { describe, it, expect } from 'vitest';
import { assertRouteMatchesScope, routeScopeForHubs } from '@lefrig/shared';

describe('routeScopeForHubs', () => {
  it('wilaya ↔ tindouf es local', () => {
    expect(routeScopeForHubs('aaiun', 'tindouf')).toBe('local');
    expect(routeScopeForHubs('tindouf', 'rabouni')).toBe('local');
    expect(routeScopeForHubs('smara', 'aaiun')).toBe('local');
  });

  it('aaiun ↔ madrid es internacional', () => {
    expect(routeScopeForHubs('aaiun', 'madrid')).toBe('international');
  });

  it('aaiun ↔ oran (Argelia) es internacional', () => {
    expect(routeScopeForHubs('aaiun', 'dz-oran')).toBe('international');
  });

  it('mismo hub o desconocido es invalid', () => {
    expect(routeScopeForHubs('aaiun', 'aaiun')).toBe('invalid');
    expect(routeScopeForHubs('aaiun', 'no-existe')).toBe('invalid');
  });
});

describe('assertRouteMatchesScope', () => {
  it('rechaza ruta internacional en pestaña local', () => {
    const r = assertRouteMatchesScope('local', 'rabouni', 'nouakchott');
    expect(r.ok).toBe(false);
  });

  it('acepta ruta local en pestaña local', () => {
    const r = assertRouteMatchesScope('local', 'rabouni', 'tindouf');
    expect(r).toEqual({ ok: true, resolved: 'local' });
  });

  it('rechaza solo-local en pestaña internacional', () => {
    const r = assertRouteMatchesScope('international', 'smara', 'aaiun');
    expect(r.ok).toBe(false);
  });
});
