import type { Metadata } from 'next';
import { LegalHub } from '@/components/legal/LegalHub';
import { LegalPageIntro } from '@/components/legal/LegalPageIntro';
import { LEGAL_DOCUMENTS } from '@/lib/legal-content';
import './legal.css';

export const metadata: Metadata = {
  title: 'Información legal',
  description:
    'Aviso legal, términos y condiciones, política de privacidad, cookies, pagos, normas comunitarias y propiedad intelectual de Lefrig.',
  openGraph: {
    title: 'Información legal | Lefrig',
    description: 'Documentación legal completa de la plataforma comunitaria saharaui Lefrig.',
  },
};

export default function LegalPage() {
  return (
    <>
      <LegalPageIntro />
      <div className="legal-page-body">
        <LegalHub documents={LEGAL_DOCUMENTS} />
      </div>
    </>
  );
}
