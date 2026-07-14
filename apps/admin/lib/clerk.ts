import { isClerkConfigured, isUsableClerkPublishableKey } from './clerk-config';

export { isClerkConfigured, isUsableClerkPublishableKey };

import { readEnv } from './site-url';

const rawKey = readEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') ?? '';

export const CLERK_PUBLISHABLE_KEY = isUsableClerkPublishableKey(rawKey) ? rawKey : '';

export const isClerkEnabled = isClerkConfigured();
