import { Injectable, Logger } from '@nestjs/common';

export interface TranscribeResult {
  text: string;
  language: string;
  confidence: number;
}

export interface TranslateResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface CategorizeResult {
  category: string;
  confidence: number;
  alternatives: { category: string; confidence: number }[];
}

export interface SpamDetectResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
}

export interface PriceSuggestResult {
  suggestedPrice: number;
  currency: string;
  range: { min: number; max: number };
  basedOnSamples: number;
}

export interface AssistantResult {
  reply: string;
  suggestions: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async transcribe(audioUrl: string, language = 'ar'): Promise<TranscribeResult> {
    this.logger.log(`[MOCK AI] transcribe ${audioUrl}`);
    return {
      text: 'مرحبا، أريد شراء هاتف مستعمل',
      language,
      confidence: 0.92,
    };
  }

  async translate(text: string, targetLanguage: string): Promise<TranslateResult> {
    this.logger.log(`[MOCK AI] translate → ${targetLanguage}`);
    const mockTranslations: Record<string, string> = {
      es: 'Hola, quiero comprar un móvil usado',
      en: 'Hello, I want to buy a used phone',
      fr: 'Bonjour, je veux acheter un téléphone d occasion',
    };
    return {
      translatedText: mockTranslations[targetLanguage] ?? text,
      sourceLanguage: 'ar',
      targetLanguage,
    };
  }

  async categorize(title: string, description: string): Promise<CategorizeResult> {
    this.logger.log(`[MOCK AI] categorize: ${title}`);
    const lower = `${title} ${description}`.toLowerCase();
    let category = 'other';
    if (/phone|móvil|galaxy|iphone|هاتف/.test(lower)) category = 'mobiles';
    else if (/solar|panel|شمس/.test(lower)) category = 'solar';
    else if (/vehículo|car|سيارة/.test(lower)) category = 'vehicles';

    return {
      category,
      confidence: 0.88,
      alternatives: [
        { category: 'electronics', confidence: 0.45 },
        { category: 'other', confidence: 0.12 },
      ],
    };
  }

  async detectSpam(text: string): Promise<SpamDetectResult> {
    this.logger.log(`[MOCK AI] spam detect`);
    const spamPatterns = [/gana dinero/i, /click aquí/i, /مجاني 100%/];
    const isSpam = spamPatterns.some((p) => p.test(text));
    return {
      isSpam,
      score: isSpam ? 0.95 : 0.05,
      reasons: isSpam ? ['Patrón de spam detectado'] : [],
    };
  }

  async suggestPrice(category: string, campId: string, condition?: string): Promise<PriceSuggestResult> {
    this.logger.log(`[MOCK AI] price suggest ${category} @ ${campId}`);
    const basePrices: Record<string, number> = {
      mobiles: 7500,
      solar: 11000,
      vehicles: 85000,
      food: 200,
    };
    const base = basePrices[category] ?? 1000;
    const factor = condition === 'new' ? 1.2 : condition === 'used' ? 0.85 : 1;
    const suggested = Math.round(base * factor);

    return {
      suggestedPrice: suggested,
      currency: 'MRU',
      range: { min: Math.round(suggested * 0.8), max: Math.round(suggested * 1.2) },
      basedOnSamples: 42,
    };
  }

  async assistant(query: string, _context?: Record<string, unknown>): Promise<AssistantResult> {
    this.logger.log(`[MOCK AI] assistant: ${query.slice(0, 50)}`);
    return {
      reply: 'Puedo ayudarte a encontrar productos, servicios o transporte en tu campamento. ¿Qué necesitas?',
      suggestions: ['Buscar móviles', 'Ver transporte a Tindouf', 'Crear anuncio'],
    };
  }
}
