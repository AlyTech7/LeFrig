import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MeiliHit {
  id: string;
  [key: string]: unknown;
}

@Injectable()
export class MeilisearchAdapter {
  private readonly logger = new Logger(MeilisearchAdapter.name);
  private readonly host: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService) {
    this.host = config.get<string>('MEILISEARCH_HOST')?.replace(/\/$/, '');
    this.apiKey = config.get<string>('MEILISEARCH_API_KEY');
  }

  isConfigured(): boolean {
    return !!this.host && !!this.apiKey;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async ensureIndex(index: string, primaryKey = 'id'): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await fetch(`${this.host}/indexes`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ uid: index, primaryKey }),
      });
    } catch (e) {
      this.logger.debug(`Index ${index} may exist: ${(e as Error).message}`);
    }
  }

  async indexDocument(index: string, doc: Record<string, unknown>): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await this.ensureIndex(index);
      await fetch(`${this.host}/indexes/${index}/documents`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify([doc]),
      });
    } catch (e) {
      this.logger.warn(`Meili index failed: ${(e as Error).message}`);
    }
  }

  async indexDocuments(index: string, docs: Record<string, unknown>[]): Promise<void> {
    if (!this.isConfigured() || docs.length === 0) return;
    try {
      await this.ensureIndex(index);
      const batchSize = 500;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        const res = await fetch(`${this.host}/indexes/${index}/documents`, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify(batch),
        });
        if (!res.ok) {
          this.logger.warn(`Meili bulk index batch failed: ${res.status}`);
        }
      }
    } catch (e) {
      this.logger.warn(`Meili bulk index failed: ${(e as Error).message}`);
    }
  }

  async configureIndex(
    index: string,
    settings: { filterableAttributes?: string[]; searchableAttributes?: string[] },
  ): Promise<void> {
    if (!this.isConfigured()) return;
    await this.ensureIndex(index);
    try {
      await fetch(`${this.host}/indexes/${index}/settings`, {
        method: 'PATCH',
        headers: this.headers(),
        body: JSON.stringify(settings),
      });
    } catch (e) {
      this.logger.debug(`Meili settings: ${(e as Error).message}`);
    }
  }

  async search(
    index: string,
    q: string,
    opts: { limit?: number; filter?: string; timeoutMs?: number } = {},
  ): Promise<MeiliHit[] | null> {
    if (!this.isConfigured() || !q.trim()) return null;
    const timeoutMs = opts.timeoutMs ?? 2500;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.host}/indexes/${index}/search`, {
        method: 'POST',
        headers: this.headers(),
        signal: controller.signal,
        body: JSON.stringify({
          q,
          limit: opts.limit ?? 20,
          ...(opts.filter && { filter: opts.filter }),
        }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { hits?: MeiliHit[] };
      return json.hits ?? [];
    } catch (e) {
      this.logger.warn(`Meili search failed: ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
