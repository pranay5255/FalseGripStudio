import 'dotenv/config';

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import mime from 'mime-types';
import qrcodeTerminal from 'qrcode-terminal';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';

import { OpenRouterClient } from './openrouter';

const downloadsDir = path.resolve(process.env.DOWNLOADS_DIR ?? path.join(process.cwd(), 'downloads'));

const openRouterClient = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  textModel: process.env.OPENROUTER_TEXT_MODEL,
  visionModel: process.env.OPENROUTER_VISION_MODEL,
  referer: process.env.OPENROUTER_REFERER,
  appTitle: process.env.OPENROUTER_APP_TITLE ?? 'WhatsApp Demo Bot'
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('Scan the QR code below to authenticate:');
  qrcodeTerminal.generate(qr, { small: true });
});

client.on('authenticated', () => console.log('✅ WhatsApp authentication successful.'));
client.on('auth_failure', (message) => console.error('❌ Authentication failed:', message));
client.on('ready', () => console.log('🤖 WhatsApp bot is ready and waiting for messages...'));
client.on('disconnected', (reason) => console.warn('⚠️ WhatsApp client disconnected:', reason));

client.on('message', async (message) => {
  const incoming = (message.body ?? '').trim();

  if (incoming.toLowerCase().startsWith('!ask')) {
    const prompt = incoming.slice(4).trim();
    await handleAskCommand(message, prompt);
    return;
  }

  if (message.hasMedia) {
    await handleMediaMessage(message);
  }
});

async function handleAskCommand(message: Message, prompt: string): Promise<void> {
  if (!prompt) {
    await message.reply('Usage: !ask <your prompt>');
    return;
  }

  if (!openRouterClient.isEnabled()) {
    await message.reply('OpenRouter API key missing. Set OPENROUTER_API_KEY to enable AI responses.');
    return;
  }

  try {
    await message.react('⏳');
    const response = await openRouterClient.generateText(prompt);
    await client.sendMessage(message.from, response);
    await message.react('✅');
  } catch (error) {
    console.error('Failed to generate OpenRouter response:', error);
    await message.react('⚠️');
    await message.reply('I could not reach OpenRouter right now. Please try again soon.');
  }
}

async function handleMediaMessage(message: Message): Promise<void> {
  try {
    const media = await message.downloadMedia();

    if (!media) {
      console.warn('Media flag detected but no payload downloaded for message', formatMessageId(message));
      return;
    }

    const savedPath = await persistMedia(media, message);
    console.log(`💾 Saved media from message ${formatMessageId(message)} to ${savedPath}`);

    if (media.mimetype?.startsWith('image/') && openRouterClient.isEnabled()) {
      try {
        const caption = await openRouterClient.describeImage({
          base64Data: media.data,
          mimeType: media.mimetype
        });

        await client.sendMessage(message.from, `🖼️ Caption: ${caption}`);
      } catch (error) {
        console.error('Failed to caption image via OpenRouter:', error);
      }
    }
  } catch (error) {
    console.error('Error handling media message:', error);
  }
}

async function persistMedia(media: MessageMedia, message: Message): Promise<string> {
  if (!existsSync(downloadsDir)) {
    await mkdir(downloadsDir, { recursive: true });
  }

  const extensionRaw = media.mimetype ? mime.extension(media.mimetype) : undefined;
  const extension = typeof extensionRaw === 'string' ? extensionRaw : undefined;
  const baseName = sanitizeFilename(media.filename ?? deriveMessageSlug(message)) || deriveMessageSlug(message);
  const fileName = extension && !baseName.toLowerCase().endsWith(`.${extension.toLowerCase()}`) ? `${baseName}.${extension}` : baseName;
  const filePath = path.join(downloadsDir, fileName);
  const buffer = Buffer.from(media.data, 'base64');

  await writeFile(filePath, buffer);
  return filePath;
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9-_\.]/gi, '_');
}

function deriveMessageSlug(message: Message): string {
  const serialized = formatMessageId(message);
  const timestamp = message.timestamp ? new Date(message.timestamp * 1000).toISOString().replace(/[:.]/g, '-') : Date.now().toString();
  return `${serialized}-${timestamp}`;
}

function formatMessageId(message: Message): string {
  const id = (message.id as { _serialized?: string; id?: string }) ?? {};
  return id._serialized ?? id.id ?? 'message';
}

async function bootstrap(): Promise<void> {
  await mkdir(downloadsDir, { recursive: true });

  if (!openRouterClient.isEnabled()) {
    console.warn('OpenRouter API key not detected. !ask command and captions will be disabled.');
  }

  await client.initialize();
}

void bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exitCode = 1;
});
