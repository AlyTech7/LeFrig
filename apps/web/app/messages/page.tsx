'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/AppIcon';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import '../hub-studio.css';

type Conversation = {
  id: string;
  messages: { content: string; createdAt: string }[];
  participants: { user: { id: string; displayName: string } }[];
};

const DATE_LOCALE = { es: 'es-ES', ar: 'ar-MA', en: 'en-GB', fr: 'fr-FR' } as const;

export default function MessagesPage() {
  const { authFetch, isSignedIn, isLoaded } = useAuthFetch();
  const t = useT();
  const { locale } = useLocale();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sync = await authFetch<{ user?: { id?: string } }>('/auth/sync', { method: 'POST' });
        if (!cancelled) setMyId(sync.user?.id ?? '');
        const list = await authFetch<Conversation[]>('/messages/conversations');
        if (!cancelled) setConversations(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch, isLoaded, isSignedIn]);

  return (
    <div className="hub-page">
      <header className="hub-hero">
        <div className="hub-hero__top">
          <Link href="/me" className="hub-back">
            <AppIcon name="arrow-left" size={16} color="var(--hub-gold)" />
            {t('messages.back')}
          </Link>
          <Link href="/marketplace" className="hub-btn hub-btn--ghost">
            {t('messages.marketLink')}
          </Link>
        </div>
        <h1>{t('messages.title')}</h1>
        <p className="hub-lead">{t('messages.sub')}</p>
      </header>

      {!isLoaded || loading ? (
        <div className="hub-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hub-skel" />
          ))}
        </div>
      ) : !isSignedIn ? (
        <div className="hub-empty">
          <p>
            <Link href="/sign-in?redirect_url=/messages" className="hub-back">
              {t('nav.signIn')}
            </Link>{' '}
            {t('messages.signInSuffix')}
          </p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="hub-empty">
          <span className="hub-empty__icon" aria-hidden>
            💬
          </span>
          <h2>{t('messages.emptyTitle')}</h2>
          <p>{t('messages.emptyHint')}</p>
          <Link href="/marketplace" className="hub-btn">
            {t('messages.marketLink')}
          </Link>
        </div>
      ) : (
        <ul className="hub-msg-list">
          {conversations.map((conv) => {
            const other =
              conv.participants.find((p) => p.user?.id && p.user.id !== myId)?.user ??
              conv.participants.find((p) => p.user)?.user;
            const last = conv.messages[0];
            return (
              <li key={conv.id}>
                <Link href={`/messages/${conv.id}`} className="hub-msg-item">
                  <div className="hub-msg-avatar">{other?.displayName?.[0]?.toUpperCase() ?? '?'}</div>
                  <div className="hub-msg-body">
                    <strong>{other?.displayName ?? t('messages.conversation')}</strong>
                    <p>{last?.content ?? t('messages.emptyThread')}</p>
                    {last?.createdAt ? (
                      <p style={{ fontSize: '0.75rem', marginTop: 4 }}>
                        {new Date(last.createdAt).toLocaleString(DATE_LOCALE[locale], {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    ) : null}
                  </div>
                  <AppIcon name="chevron-right" size={16} color="var(--hub-faint)" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
