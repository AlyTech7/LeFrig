const PURPOSE = 'admin_panel';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const API_TTL_MS = 5 * 60 * 1000;

function getSecret(): string {
  const raw = process.env.CLERK_SECRET_KEY?.trim();
  if (!raw) throw new Error('CLERK_SECRET_KEY no configurada');
  return raw;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return toBase64Url(new Uint8Array(sig));
}

async function encodeToken(payload: Record<string, unknown>): Promise<string> {
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSign(body);
  return `${body}.${sig}`;
}

async function decodeToken(token: string): Promise<Record<string, unknown> | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = await hmacSign(body);
  if (sig.length !== expected.length) return null;
  for (let i = 0; i < sig.length; i += 1) {
    if (sig.charCodeAt(i) !== expected.charCodeAt(i)) return null;
  }
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type AdminSessionPayload = {
  clerkUserId: string;
  roles: string[];
};

export async function createAdminSessionToken(payload: AdminSessionPayload): Promise<string> {
  return encodeToken({
    purpose: PURPOSE,
    clerkUserId: payload.clerkUserId,
    roles: payload.roles,
    exp: Date.now() + SESSION_TTL_MS,
  });
}

export async function verifyAdminSessionToken(
  token: string | undefined | null,
): Promise<AdminSessionPayload | null> {
  const decoded = token ? await decodeToken(token) : null;
  if (!decoded || decoded.purpose !== PURPOSE) return null;
  if (typeof decoded.exp !== 'number' || decoded.exp < Date.now()) return null;
  if (typeof decoded.clerkUserId !== 'string') return null;
  const roles = Array.isArray(decoded.roles)
    ? decoded.roles.filter((r): r is string => typeof r === 'string')
    : [];
  return { clerkUserId: decoded.clerkUserId, roles };
}

/** Token corto para el proxy admin → API Nest. */
export async function createAdminApiToken(clerkUserId: string): Promise<string> {
  return encodeToken({
    purpose: PURPOSE,
    clerkUserId,
    exp: Date.now() + API_TTL_MS,
  });
}

export const ADMIN_SESSION_COOKIE = 'admin_session';
