/** Banderas SVG — Windows no renderiza 🇪🇭 (muestra "EH"). */
type Props = {
  country?: string;
  size?: number;
  className?: string;
  title?: string;
};

function WesternSaharaFlag({ size }: { size: number }) {
  const h = size;
  const w = Math.round(size * 1.5);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 900 600"
      aria-hidden
      className="country-flag__svg"
      style={{ display: 'block', borderRadius: 2, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }}
    >
      <rect width="900" height="200" y="0" fill="#000" />
      <rect width="900" height="200" y="200" fill="#fff" />
      <rect width="900" height="200" y="400" fill="#007a3d" />
      <path d="M0 0 L360 300 L0 600 Z" fill="#c4111b" />
      {/* Crescent + star */}
      <circle cx="560" cy="300" r="72" fill="#c4111b" />
      <circle cx="585" cy="300" r="58" fill="#fff" />
      <polygon
        fill="#c4111b"
        points="640,300 662,307 668,328 678,310 700,308 684,322 690,344 668,332 646,344 652,322"
        transform="translate(0 -16) scale(1)"
      />
    </svg>
  );
}

function AlgeriaFlag({ size }: { size: number }) {
  const h = size;
  const w = Math.round(size * 1.5);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 900 600"
      aria-hidden
      className="country-flag__svg"
      style={{ display: 'block', borderRadius: 2, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }}
    >
      <rect width="450" height="600" fill="#006233" />
      <rect x="450" width="450" height="600" fill="#fff" />
      <circle cx="450" cy="300" r="110" fill="#d21034" />
      <circle cx="480" cy="300" r="90" fill="#fff" />
      <polygon
        fill="#d21034"
        points="520,300 548,310 556,338 568,314 598,312 576,332 584,360 552,342 520,360 528,332"
        transform="translate(-10 -30)"
      />
    </svg>
  );
}

/** Emojis que sí suelen verse bien en Windows (no EH/DZ). */
const EMOJI_BY_COUNTRY: Record<string, string> = {
  MR: '🇲🇷',
  ES: '🇪🇸',
  FR: '🇫🇷',
};

export function CountryFlag({ country, size = 16, className, title }: Props) {
  const code = (country ?? '').toUpperCase();
  if (!code) return null;

  if (code === 'EH') {
    return (
      <span
        className={`country-flag ${className ?? ''}`}
        title={title ?? 'Western Sahara'}
        role="img"
        aria-label="Western Sahara"
        style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
      >
        <WesternSaharaFlag size={size} />
      </span>
    );
  }
  if (code === 'DZ') {
    return (
      <span
        className={`country-flag ${className ?? ''}`}
        title={title ?? 'Algérie'}
        role="img"
        aria-label="Algeria"
        style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
      >
        <AlgeriaFlag size={size} />
      </span>
    );
  }

  const emoji = EMOJI_BY_COUNTRY[code];
  if (emoji) {
    return (
      <span
        className={`country-flag country-flag--emoji ${className ?? ''}`}
        style={{ fontSize: size, lineHeight: 1, display: 'inline-flex' }}
        aria-hidden
      >
        {emoji}
      </span>
    );
  }
  return null;
}
