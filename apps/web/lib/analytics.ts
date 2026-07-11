import { API_URL } from './api';

type TrackPayload = {
  category?: string;
  campId?: string;
  term?: string;
  value?: number;
};

export function trackEvent(eventType: string, data?: TrackPayload) {
  fetch(`${API_URL}/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, ...data }),
  }).catch(() => {});
}
