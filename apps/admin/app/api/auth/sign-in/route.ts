import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from '@/lib/admin-session';
import { adminRedirectUrl } from '@/lib/site-url';

function rolesFromUser(user: { publicMetadata?: unknown }): string[] {
  const meta = user.publicMetadata as { roles?: string[] } | undefined;
  return meta?.roles ?? [];
}

export async function POST(req: NextRequest) {
  let email = '';
  let password = '';

  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await req.json()) as { email?: string; password?: string };
    email = body.email?.trim() ?? '';
    password = body.password ?? '';
  } else {
    const form = await req.formData();
    email = String(form.get('email') ?? '').trim();
    password = String(form.get('password') ?? '');
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ emailAddress: [email], limit: 1 });
    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    await client.users.verifyPassword({ userId: user.id, password });

    const roles = rolesFromUser(user);
    const allowed = roles.some((r) => ['admin', 'moderator'].includes(r));
    if (!allowed) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    const sessionToken = await createAdminSessionToken({ clerkUserId: user.id, roles });
    const redirectTo = req.nextUrl.searchParams.get('redirect_url') ?? adminRedirectUrl('/');
    const res = NextResponse.redirect(redirectTo, 303);
    res.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }
}
