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

function signInErrorRedirect(req: NextRequest, message: string): NextResponse {
  const url = new URL('/sign-in', req.url);
  url.searchParams.set('error', message);
  const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
  if (redirectUrl) url.searchParams.set('redirect_url', redirectUrl);
  return NextResponse.redirect(url, 303);
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
    return signInErrorRedirect(req, 'Email y contraseña requeridos');
  }

  try {
    const client = await clerkClient();
    const normalizedEmail = email.toLowerCase();
    const { data: users } = await client.users.getUserList({
      emailAddress: [normalizedEmail],
      limit: 1,
    });
    const user = users[0];
    if (!user) {
      return signInErrorRedirect(req, 'Credenciales incorrectas');
    }

    if (!user.passwordEnabled) {
      return signInErrorRedirect(
        req,
        'Tu cuenta no tiene contraseña. Configúrala en Clerk Dashboard → Users.',
      );
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
  } catch (err: unknown) {
    const clerkErr = err as { errors?: { code?: string; message?: string }[] };
    const code = clerkErr.errors?.[0]?.code;
    if (code === 'incorrect_password') {
      return signInErrorRedirect(req, 'Contraseña incorrecta');
    }
    console.error('[admin/auth/sign-in]', err);
    return signInErrorRedirect(req, 'No se pudo iniciar sesión. Inténtalo de nuevo.');
  }
}
