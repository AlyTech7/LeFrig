import type { SignUpResource } from '@clerk/types';

type SignUpLike = Pick<
  SignUpResource,
  'status' | 'createdSessionId' | 'missingFields' | 'unverifiedFields' | 'update'
>;

export type FinalizeSignUpResult =
  | { ok: true; sessionId: string }
  | { ok: false; needPassword: true }
  | { ok: false; needPassword?: false; error: string };

type Options = {
  password?: string;
  firstName?: string;
  lastName?: string;
};

/** Parte un nombre completo en nombre / apellidos. */
export function splitDisplayName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return { firstName: '' };
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** Completa el sign-up tras verificar email (nombre / password si Clerk lo exige). */
export async function finalizeSignUpAfterEmail(
  signUp: SignUpLike,
  options: Options = {},
): Promise<FinalizeSignUpResult> {
  let current = signUp;
  const firstName = options.firstName?.trim();
  const lastName = options.lastName?.trim();

  const applyPatch = async () => {
    if (current.status !== 'missing_requirements') return;

    const missing = current.missingFields ?? [];
    const patch: {
      firstName?: string;
      lastName?: string;
      username?: string;
      password?: string;
    } = {};

    if (firstName) {
      patch.firstName = firstName;
    } else if (missing.includes('first_name')) {
      patch.firstName = 'Usuario';
    }

    if (lastName) {
      patch.lastName = lastName;
    } else if (missing.includes('last_name')) {
      patch.lastName = firstName || 'Lefrig';
    }

    if (missing.includes('username')) {
      patch.username = `u${Date.now().toString(36)}`;
    }

    if (missing.includes('password')) {
      if (!options.password || options.password.length < 8) {
        return { needPassword: true as const };
      }
      patch.password = options.password;
    } else if (options.password && options.password.length >= 8) {
      // Clerk a veces acepta password aunque no esté en missing
      patch.password = options.password;
    }

    if (Object.keys(patch).length > 0) {
      current = (await current.update(patch)) as SignUpLike;
    }
    return null;
  };

  const first = await applyPatch();
  if (first?.needPassword) return { ok: false, needPassword: true };

  if (current.status === 'complete' && current.createdSessionId) {
    return { ok: true, sessionId: current.createdSessionId };
  }

  const second = await applyPatch();
  if (second?.needPassword) return { ok: false, needPassword: true };

  if (current.status === 'complete' && current.createdSessionId) {
    return { ok: true, sessionId: current.createdSessionId };
  }

  const missing = current.missingFields?.length
    ? ` Faltan: ${current.missingFields.join(', ')}.`
    : '';
  const unverified = current.unverifiedFields?.length
    ? ` Sin verificar: ${current.unverifiedFields.join(', ')}.`
    : '';

  return {
    ok: false,
    error: `No se pudo completar el registro (${current.status ?? 'desconocido'}).${missing}${unverified}`,
  };
}
