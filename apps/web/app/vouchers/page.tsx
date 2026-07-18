import { permanentRedirect } from 'next/navigation';

/** Vouchers desactivados — conservar ruta para no romper bookmarks */
export default function VouchersPage() {
  permanentRedirect('/shops');
}
