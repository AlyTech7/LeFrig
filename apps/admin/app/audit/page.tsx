import { AuditClient } from '@/components/pages/AuditClient';
import { demoAccessLogs } from '@/lib/demo-data';
import { fetchWithFallback } from '@/lib/api-server';
import type { AccessLogRow } from '@/lib/types';

type RawLog = {
  id: string;
  action: string;
  resource: string | null;
  ipAddress: string | null;
  createdAt: string | Date;
  admin: { displayName: string; email: string | null };
};

function mapLogs(raw: RawLog[]): AccessLogRow[] {
  return raw.map((l) => ({
    id: l.id,
    action: l.action,
    resource: l.resource,
    ipAddress: l.ipAddress,
    createdAt: typeof l.createdAt === 'string' ? l.createdAt : l.createdAt.toISOString(),
    admin: l.admin,
  }));
}

export default async function AuditPage() {
  const logs = await fetchWithFallback<RawLog[]>('/admin/access-logs', demoAccessLogs);
  return <AuditClient initial={mapLogs(Array.isArray(logs) ? logs : demoAccessLogs)} />;
}
