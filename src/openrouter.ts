import { fetch } from 'undici';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

type Role = 'system' | 'user' | 'assistant';

type ContentPart = TextPart | ImagePart;

interface TextPart {
  type: 'input_text';
  text: string;
}

interface ImagePart {
  type: 'input_image';
  image_url: {
    url: string;
  };
}

export interface ChatMessage {
  role: Role;
  content: string | ContentPart[];
}

interface ChatCompletionPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

export interface OpenRouterClientOptions {
  apiKey?: string;
  textModel?: string;
  visionModel?: string;
  referer?: string;
  appTitle?: string;
}

export class OpenRouterClient {
  private readonly apiKey?: string;

  private readonly textModel: string;

  private readonly visionModel: string;

  private readonly referer?: string;

  private readonly appTitle?: string;

  constructor(options: OpenRouterClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.textModel = options.textModel ?? 'allenai/olmo-3-32b-think';
    this.visionModel = options.visionModel ?? this.textModel;
    this.referer = options.referer;
    this.appTitle = options.appTitle;
  }

  public isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  public async generateText(prompt: string, systemPrompt = 'You are a helpful WhatsApp assistant.'): Promise<string> {
    if (!this.textModel) {
      throw new Error('OpenRouter text model is not configured.');
    }

    return this.requestCompletion({
      model: this.textModel,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });
  }

  public async describeImage(params: { base64Data: string; mimeType: string; instruction?: string }): Promise<string> {
    if (!this.visionModel) {
      throw new Error('OpenRouter vision model is not configured.');
    }

    const { base64Data, mimeType, instruction } = params;
    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    return this.requestCompletion({
      model: this.visionModel,
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: instruction ?? 'Describe the contents of this WhatsApp image in one or two concise sentences.'
            },
            {
              type: 'input_image',
              image_url: { url: imageUrl }
            }
          ]
        }
      ]
    });
  }

  private async requestCompletion(payload: ChatCompletionPayload): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is missing.');
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter request failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const choice = data.choices?.[0]?.message?.content;
    const normalized = this.normalizeContent(choice);

    if (!normalized) {
      throw new Error('OpenRouter returned an empty response.');
    }

    return normalized;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`
    };

    if (this.referer) {
      headers['HTTP-Referer'] = this.referer;
    }

    if (this.appTitle) {
      headers['X-Title'] = this.appTitle;
    }

    return headers;
  }

  private normalizeContent(content: unknown): string {
    if (!content) {
      return '';
    }

    if (typeof content === 'string') {
      return content.trim();
    }

    if (Array.isArray(content)) {
      return content
        .map((chunk) => {
          if (typeof chunk === 'string') {
            return chunk;
          }

          if (typeof chunk === 'object' && chunk !== null && 'text' in chunk) {
            const { text } = chunk as { text?: string };
            return text ?? '';
          }

          return '';
        })
        .filter(Boolean)
        .join('\n')
        .trim();
    }

    if (typeof content === 'object' && 'text' in (content as Record<string, unknown>)) {
      const maybeText = (content as { text?: string }).text;
      return maybeText?.trim() ?? '';
    }

    return '';
  }
}
