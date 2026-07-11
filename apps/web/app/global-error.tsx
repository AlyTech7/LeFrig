'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem 1.25rem', textAlign: 'center' }}>
        <h1>Lefrig</h1>
        <p>Algo salió mal. Inténtalo de nuevo.</p>
        <button type="button" onClick={() => reset()} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem' }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
