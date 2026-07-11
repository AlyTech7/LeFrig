export type MessageStreamEvent = { type: string; message?: ChatMessage };

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id?: string; displayName: string };
};

/** Lee SSE de conversación con Authorization header (compatible web + React Native). */
export async function streamConversation(
  apiUrl: string,
  conversationId: string,
  token: string,
  onEvent: (event: MessageStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${apiUrl}/messages/conversations/${conversationId}/stream`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    signal,
  });
  if (!res.ok) throw new Error(`Stream ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Stream body unavailable');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!dataLine) continue;
      try {
        const parsed = JSON.parse(dataLine.slice(6)) as MessageStreamEvent;
        if (parsed.type !== 'ping') onEvent(parsed);
      } catch {
        /* ignore malformed */
      }
    }
  }
}
