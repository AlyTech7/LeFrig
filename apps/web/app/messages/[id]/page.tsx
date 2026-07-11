'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button, Input, colors } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { PageBody, PageHero } from '@/components/PageHero';
import { API_URL } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { streamConversation, type ChatMessage } from '@/lib/messageStream';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, isSignedIn } = useAuthFetch();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    authFetch<ChatMessage[]>(`/messages/conversations/${params.id}`)
      .then(setMessages)
      .catch(() => { if (!silent) setMessages([]); })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    if (!isSignedIn || !params.id) {
      setLoading(false);
      return;
    }
    load();
  }, [authFetch, isSignedIn, params.id]);

  useEffect(() => {
    if (!isSignedIn || !params.id) return;
    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      while (!cancelled) {
        try {
          const token = await getToken();
          if (!token || cancelled) break;
          setLive(true);
          await streamConversation(API_URL, params.id, token, (ev) => {
            if (ev.type === 'message' && ev.message) appendMessage(ev.message);
          }, ac.signal);
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
  }, [getToken, isSignedIn, params.id]);

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

  if (!isSignedIn) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <Link href="/sign-in" style={{ color: colors.deepGreen[600], fontWeight: 700 }}>Inicia sesión</Link>
      </div>
    );
  }

  return (
    <>
      <PageHero icon="message-circle" title="Chat" subtitle={live ? 'En vivo · SSE' : 'Mensajes en tiempo real'} maxWidth={720} />
      <PageBody maxWidth={720}>
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link href="/messages" style={{ color: 'var(--lf-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppIcon name="arrow-left" size={18} color="var(--lf-gold)" />
          Conversaciones
        </Link>
        {live && (
          <span style={{ fontSize: '0.75rem', color: 'var(--lf-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lf-emerald)' }} />
            En vivo
          </span>
        )}
      </div>

      <div ref={listRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, maxHeight: '55vh', overflowY: 'auto' }}>
        {loading ? (
          <p style={{ color: colors.gray[500] }}>Cargando...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: colors.gray[500] }}>Sin mensajes aún. Escribe el primero.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: 16,
                background: 'var(--lf-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--lf-emerald)' }}>
                {m.sender.displayName}
              </p>
              <p style={{ margin: 0 }}>{m.content}</p>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje..." onKeyDown={(e) => e.key === 'Enter' && send()} />
        <Button onClick={send} disabled={sending}>{sending ? '...' : 'Enviar'}</Button>
      </div>
      </div>
      </PageBody>
    </>
  );
}
