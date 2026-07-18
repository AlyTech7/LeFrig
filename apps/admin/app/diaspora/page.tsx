import { permanentRedirect } from 'next/navigation';

/** Diáspora / pago manual no forman parte del piloto web. */
export default function DiasporaPage() {
  permanentRedirect('/');
}
