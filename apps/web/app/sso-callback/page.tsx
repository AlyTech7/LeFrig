'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useT } from '@/lib/locale';

export default function SSOCallbackPage() {
  const t = useT();

  return (
    <div className="sv-auth sv-auth--slim">
      <div className="sv-auth__loading">{t('common.loading')}</div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
