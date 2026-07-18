import { permanentRedirect } from 'next/navigation';

/** Admin vouchers UI desactivada — API pública de canje también desmontada */
export default function AdminVouchersPage() {
  permanentRedirect('/');
}
