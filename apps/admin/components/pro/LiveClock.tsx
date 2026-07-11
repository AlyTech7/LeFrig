'use client';

import { useEffect, useState } from 'react';

export function LiveClock({
  locale = 'es-ES',
  options,
  fallback = '--:--',
}: {
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
}) {
  const [time, setTime] = useState(fallback);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString(locale, options));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [locale, options?.hour, options?.minute, options?.second]);

  return <span>{time}</span>;
}

export function RelativeTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState('—');

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) setLabel(`hace ${mins} min`);
      else {
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) setLabel(`hace ${hrs} h`);
        else setLabel(`hace ${Math.floor(hrs / 24)} d`);
      }
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [iso]);

  return <span>{label}</span>;
}
