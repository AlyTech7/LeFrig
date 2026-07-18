'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { PageBody, PageHero } from '@/components/PageHero';
import { API_URL } from '@/lib/api';
import { useT } from '@/lib/locale';
import './search.css';

type Hit = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string | null;
};

type SearchResponse = {
  q: string;
  total: number;
  groups: { type: string; label: string; items: Hit[] }[];
};

const TYPE_ICON: Record<string, AppIconName> = {
  listing: 'shopping-bag',
  shop: 'store',
  service: 'zap',
  job: 'briefcase',
  need: 'heart',
  camp: 'map-pin',
  hub: 'truck',
  category: 'tag',
};

export default function SearchClient() {
  const t = useT();
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!q) {
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}&limit=12`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('fail');
        const json = (await res.json()) as SearchResponse;
        if (!controller.signal.aborted) setData(json);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setData(null);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 80);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  return (
    <>
      <PageHero
        icon="search"
        title={q ? t('search.resultsTitle', { q }) : t('search.pageTitle')}
        subtitle={
          q
            ? data
              ? t('search.resultsCount', { count: data.total })
              : t('search.pageSubtitle')
            : t('search.pageSubtitle')
        }
        maxWidth={880}
      />
      <PageBody maxWidth={880}>
        {!q ? (
          <div className="lf-search-empty">
            <p>{t('search.emptyPrompt')}</p>
            <div className="lf-search-shortcuts">
              <Link href="/marketplace">{t('nav.marketplace')}</Link>
              <Link href="/transport">{t('nav.transport')}</Link>
              <Link href="/services">{t('nav.services')}</Link>
              <Link href="/shops">{t('nav.shops')}</Link>
              <Link href="/jobs">{t('nav.jobs')}</Link>
            </div>
          </div>
        ) : loading ? (
          <p className="lf-search-muted">{t('search.searching')}</p>
        ) : error ? (
          <p className="lf-search-muted">{t('errors.apiUnavailable')}</p>
        ) : !data || data.total === 0 ? (
          <div className="lf-search-empty">
            <p>{t('search.noResults', { q })}</p>
            <div className="lf-search-shortcuts">
              <Link href={`/marketplace?q=${encodeURIComponent(q)}`}>{t('search.tryMarket')}</Link>
              <Link href={`/transport?q=${encodeURIComponent(q)}`}>{t('search.tryTransport')}</Link>
              <Link href={`/services?q=${encodeURIComponent(q)}`}>{t('search.tryServices')}</Link>
            </div>
          </div>
        ) : (
          <div className="lf-search-groups">
            {data.groups.map((group) => (
              <section key={group.type} className="lf-search-group">
                <h2>
                  <AppIcon name={TYPE_ICON[group.type] ?? 'search'} size={18} color="var(--lf-gold, #a8842d)" />
                  {t(`search.groups.${group.type}` as 'search.groups.listing') ===
                  `search.groups.${group.type}`
                    ? group.label
                    : t(`search.groups.${group.type}` as 'search.groups.listing')}
                </h2>
                <ul>
                  {group.items.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link href={item.href} className="lf-search-hit">
                        <span className="lf-search-hit__ico" aria-hidden>
                          <AppIcon name={TYPE_ICON[item.type] ?? 'search'} size={18} />
                        </span>
                        <span className="lf-search-hit__copy">
                          <strong>{item.title}</strong>
                          {item.subtitle ? <small>{item.subtitle}</small> : null}
                        </span>
                        <AppIcon name="chevron-right" size={16} color="rgba(26,22,18,0.35)" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
