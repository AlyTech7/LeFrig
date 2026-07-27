'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppIcon } from '@/components/AppIcon';
import { API_URL } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { streamConversation, type ChatMessage } from '@/lib/messageStream';
import { useT } from '@/lib/locale';
import '../../hub-studio.css';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, isSignedIn, isLoaded, getToken } = useAuthFetch();
  const t = useT();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const [myId, setMyId] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    authFetch<ChatMessage[]>(`/messages/conversations/${params.id}`)
      .then(setMessages)
      .catch(() => {
        if (!silent) setMessages([]);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !params.id) {
      setLoading(false);
      return;
    }
    authFetch<{ user?: { id?: string } }>('/auth/sync', { method: 'POST' })
      .then((sync) => setMyId(sync.user?.id ?? ''))
      .catch(() => setMyId(''));
    load();
  }, [authFetch, isLoaded, isSignedIn, params.id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !params.id) return;
    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      while (!cancelled) {
        try {
          const token = await getToken();
          if (!token || cancelled) break;
          setLive(true);
          await streamConversation(
            API_URL,
            params.id,
            token,
            (ev) => {
              if (ev.type === 'message' && ev.message) appendMessage(ev.message);
            },
            ac.signal,
          );
        } catch {
          if (cancelled) return;
          setLive(false);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      setLive(false);
    };
  }, [getToken, isLoaded, isSignedIn, params.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const msg = await authFetch<ChatMessage>('/messages', {
        method: 'POST',
        body: JSON.stringify({ conversationId: params.id, content: text.trim() }),
      });
      setText('');
      appendMessage(msg);
    } finally {
      setSending(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="hub-page">
        <p className="hub-lead">{t('messages.loading')}</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="hub-page">
        <div className="hub-empty">
          <Link href="/sign-in" className="hub-back">
            {t('nav.signIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hub-page">
      <div className="hub-chat">
        <div className="hub-chat__toolbar">
          <Link href="/messages" className="hub-back">
            <AppIcon name="arrow-left" size={16} color="var(--hub-gold)" />
            {t('messages.backList')}
          </Link>
          {live ? (
            <span className="hub-live">
              <span className="hub-live__dot" />
              {t('messages.live')}
            </span>
          ) : (
            <span className="hub-card__meta">{t('messages.offline')}</span>
          )}
        </div>

        <h1 style={{ margin: '0 0 0.85rem', fontSize: '1.35rem' }}>{t('messages.chat')}</h1>

        <div ref={listRef} className="hub-bubbles">
          {loading ? (
            <p className="hub-lead">{t('messages.loading')}</p>
          ) : messages.length === 0 ? (
            <p className="hub-lead">{t('messages.emptyThread')}</p>
          ) : (
            messages.map((m) => {
              const mine = Boolean(myId && m.sender.id === myId);
              return (
                <div key={m.id} className={`hub-bubble ${mine ? 'hub-bubble--mine' : 'hub-bubble--other'}`}>
                  {!mine ? <p className="hub-bubble__name">{m.sender.displayName}</p> : null}
                  <p>{m.content}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="hub-composer">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('messages.placeholder')}
            onKeyDown={(e) => e.key === 'Enter' && void send()}
            aria-label={t('messages.placeholder')}
          />
          <button type="button" className="hub-btn" onClick={() => void send()} disabled={sending || !text.trim()}>
            {sending ? '…' : t('messages.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
