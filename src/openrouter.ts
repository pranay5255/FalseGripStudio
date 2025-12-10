import { fetch } from 'undici';
import { readFile } from 'node:fs/promises';
import mime from 'mime-types';

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

export interface DescribeImageParams {
  base64Data?: string;
  mimeType?: string;
  imagePath?: string;
  imageUrl?: string;
  instruction?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
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

  public async describeImage(params: DescribeImageParams): Promise<string> {
    if (!this.visionModel) {
      throw new Error('OpenRouter vision model is not configured.');
    }

    const { instruction, system, temperature, maxTokens, model } = params;
    const imagePart = await this.resolveImagePart(params);
    const systemMessage = system ?? 'You are a helpful multimodal WhatsApp assistant.';
    const userInstruction =
      instruction ?? 'Describe the contents of this WhatsApp image in one or two concise sentences.';

    if (imagePart) {
      const messages: ChatMessage[] = [];
      if (systemMessage) {
        messages.push({ role: 'system', content: systemMessage });
      }
      messages.push({
        role: 'user',
        content: [
          { type: 'input_text', text: userInstruction },
          imagePart
        ]
      });

      return this.requestCompletion({
        model: model ?? this.visionModel,
        temperature: typeof temperature === 'number' ? temperature : 0.2,
        max_tokens: typeof maxTokens === 'number' ? maxTokens : 300,
        messages
      });
    }

    const textOnlyMessages: ChatMessage[] = [];
    if (systemMessage) {
      textOnlyMessages.push({ role: 'system', content: systemMessage });
    }
    textOnlyMessages.push({ role: 'user', content: userInstruction });

    return this.requestCompletion({
      model: model ?? this.textModel,
      temperature: typeof temperature === 'number' ? temperature : 0.2,
      max_tokens: typeof maxTokens === 'number' ? maxTokens : 300,
      messages: textOnlyMessages
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

  private async resolveImagePart(params: DescribeImageParams): Promise<ImagePart | undefined> {
    const { imageUrl, imagePath } = params;
    let { base64Data, mimeType } = params;

    if (imageUrl) {
      return { type: 'input_image', image_url: { url: imageUrl } };
    }

    if (imagePath) {
      const buffer = await readFile(imagePath);
      base64Data = buffer.toString('base64');
      const lookedUp = mime.lookup(imagePath);
      mimeType = typeof lookedUp === 'string' ? lookedUp : mimeType ?? 'image/jpeg';
    }

    if (!base64Data) {
      return undefined;
    }

    const resolvedMime = mimeType ?? 'image/jpeg';
    const dataUrl = `data:${resolvedMime};base64,${base64Data}`;
    return { type: 'input_image', image_url: { url: dataUrl } };
  }
}
