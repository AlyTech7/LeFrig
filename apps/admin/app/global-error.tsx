'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <h2>Error en el panel admin</h2>
        <p>El equipo ha sido notificado.</p>
        <button type="button" onClick={() => reset()}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
