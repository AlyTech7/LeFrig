import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';
import {
  ADMIN_SESSION_COOKIE,
  createAdminApiToken,
  verifyAdminSessionToken,
} from '@/lib/admin-session';

/** Prefijos de API que el panel admin puede proxificar. */
const ALLOWED_PREFIXES = ['/admin', '/moderation', '/analytics'];

function isAllowedProxyPath(path: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

async function resolveBearerToken(req: NextRequest): Promise<string | null> {
  const { getToken } = await auth();
  const clerkToken = await getToken();
  if (clerkToken) return clerkToken;

  const adminSession = await verifyAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!adminSession) return null;

  return await createAdminApiToken(adminSession.clerkUserId);
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const token = await resolveBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = `/${pathSegments.join('/')}`;
  if (!isAllowedProxyPath(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  const target = `${API_URL}${path}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    cache: 'no-store',
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}
