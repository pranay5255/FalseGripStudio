import type { Client, Message } from 'whatsapp-web.js';

import type { OpenRouterClient } from './openrouter';

interface SummarizeChatOptions {
  client: Client;
  openRouterClient: OpenRouterClient;
  jid: string;
  lookbackMs?: number;
  maxMessages?: number;
}

const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_MESSAGES = 50;
const MAX_PROMPT_CHARS = 9_000;

export const summarizeRecentChat = async ({
  client,
  openRouterClient,
  jid,
  lookbackMs = DEFAULT_LOOKBACK_MS,
  maxMessages = DEFAULT_MAX_MESSAGES,
}: SummarizeChatOptions): Promise<void> => {
  if (!openRouterClient.isEnabled()) {
    console.warn('⚠️  OpenRouter client disabled. Skipping chat summary.');
    return;
  }

  try {
    const chat = await client.getChatById(jid);
    const messages = await chat.fetchMessages({ limit: maxMessages });
    const cutoff = Date.now() - lookbackMs;

    const recentMessages = messages
      .filter((message) => Boolean(message.timestamp) && message.timestamp! * 1000 >= cutoff)
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    if (!recentMessages.length) {
      await client.sendMessage(jid, 'ℹ️ No messages from the last 24 hours to summarize.');
      return;
    }

    const transcript = buildTranscript(recentMessages);
    const prompt = buildSummaryPrompt(transcript);
    const summary = await openRouterClient.generateText(prompt, 'You are an expert WhatsApp assistant that writes concise daily summaries.');

    await client.sendMessage(
      jid,
      `📝 *Last 24h Summary*\n${summary.trim()}`,
    );
  } catch (error) {
    console.error(`❌ Failed to summarize chat ${jid}:`, error);
    await client.sendMessage(jid, '⚠️ Unable to generate the chat summary right now. Please try again later.');
  }
};

const buildTranscript = (messages: Message[]): string => {
  const rows = messages.map((message) => {
    const timestamp = message.timestamp ? new Date(message.timestamp * 1000).toISOString() : 'unknown-time';
    const author = resolveAuthorLabel(message);
    const body = resolveMessageBody(message);
    return `[${timestamp}] ${author}: ${body}`;
  });

  const transcript = rows.join('\n');
  if (transcript.length <= MAX_PROMPT_CHARS) {
    return transcript;
  }

  return transcript.slice(transcript.length - MAX_PROMPT_CHARS);
};

const resolveAuthorLabel = (message: Message): string => {
  if (message.fromMe) {
    return 'Me';
  }

  const withMeta = message as Message & { _data?: { notifyName?: string; pushname?: string } };
  return withMeta._data?.notifyName ?? withMeta._data?.pushname ?? message.author ?? message.from ?? 'Contact';
};

const resolveMessageBody = (message: Message): string => {
  if (message.body) {
    return sanitizeWhitespace(message.body);
  }

  if (message.hasMedia) {
    return '[media message]';
  }

  return '[no text]';
};

const sanitizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const buildSummaryPrompt = (transcript: string): string => {
  return [
    'You are helping summarize a WhatsApp conversation from the last 24 hours.',
    'Provide:',
    '1. A concise overview of what was discussed.',
    '2. Key action items or follow-ups with owners if possible.',
    '3. Outstanding questions.',
    '',
    'Conversation transcript:',
    transcript,
  ].join('\n');
};
