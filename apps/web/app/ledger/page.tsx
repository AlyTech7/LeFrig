import { permanentRedirect } from 'next/navigation';

/** Fiado / libreta desactivados — conservar ruta para no romper bookmarks */
export default function LedgerPage() {
  permanentRedirect('/shops');
}
