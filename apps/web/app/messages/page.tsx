'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/AppIcon';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

type Conversation = {
  id: string;
  messages: { content: string; createdAt: string }[];
  participants: { user: { id: string; displayName: string } }[];
};

export default function MessagesPage() {
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const t = useT();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    authFetch<Conversation[]>('/messages/conversations')
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [authFetch, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner" style={{ textAlign: 'center' }}>
          <p className="lf-page-sub">{t('common.loading')}</p>
        </div>
      </section>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <section className="lf-page-hero">
          <div className="lf-page-hero-inner" style={{ textAlign: 'center' }}>
            <AppIcon name="message-circle" size={40} color="var(--lf-gold)" />
            <h1 className="lf-page-title" style={{ marginTop: 16 }}>{t('messages.title')}</h1>
            <p className="lf-page-sub">
              <Link href="/sign-in?redirect_url=/messages" style={{ color: 'var(--lf-gold)', fontWeight: 700 }}>
                {t('nav.signIn')}
              </Link>{' '}
              {t('messages.signInSuffix')}
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AppIcon name="message-circle" size={36} color="var(--lf-gold)" />
            <div>
              <h1 className="lf-page-title" style={{ margin: 0 }}>{t('messages.title')}</h1>
              <p className="lf-page-sub" style={{ margin: '4px 0 0' }}>
                {t('messages.sub')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="lf-page-body" style={{ maxWidth: 720 }}>
        {loading ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>{t('common.loading')}</p>
        ) : conversations.length === 0 ? (
          <p style={{ color: 'var(--lf-text-muted)' }}>
            {t('messages.emptyHint')}{' '}
            <Link href="/marketplace" style={{ color: 'var(--lf-gold)' }}>{t('messages.marketLink')}</Link>.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {conversations.map((conv) => {
              const other = conv.participants.find((p) => p.user)?.user;
              const last = conv.messages[0];
              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 18,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'var(--lf-surface)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'rgba(13,148,136,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: 'var(--lf-emerald)',
                    }}
                  >
                    {other?.displayName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{other?.displayName ?? t('messages.conversation')}</p>
                    <p style={{ margin: 0, color: 'var(--lf-text-muted)', fontSize: '0.9rem' }}>
                      {last?.content ?? t('messages.emptyThread')}
                    </p>
                  </div>
                  <AppIcon name="chevron-right" size={18} color="var(--lf-text-muted)" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
