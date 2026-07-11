import { CampsClient } from '@/components/pages/CampsClient';
import { demoCamps } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AdminCampRow } from '@/lib/types';

export default async function CampsPage() {
  const camps = await fetchWithFallback<AdminCampRow[]>('/admin/camps', demoCamps);
  return <CampsClient initial={Array.isArray(camps) ? camps : demoCamps} />;
}
