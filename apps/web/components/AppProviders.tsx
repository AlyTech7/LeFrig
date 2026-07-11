'use client';

import { LocaleProvider } from '@/lib/locale';
import { ClerkProviderWrapper } from '@/components/ClerkProviderWrapper';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ClerkProviderWrapper>{children}</ClerkProviderWrapper>
    </LocaleProvider>
  );
}
