import { permanentRedirect } from 'next/navigation';

/** Diáspora vive en flujos de tienda/pedidos; la ruta legacy redirige. */
export default function DiasporaPage() {
  permanentRedirect('/shops');
}
