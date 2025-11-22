import 'dotenv/config';

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import mime from 'mime-types';
import qrcodeTerminal from 'qrcode-terminal';
import { Chat, Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import puppeteer from 'puppeteer';

import { OpenRouterClient } from './openrouter';
import { summarizeRecentChat } from './chatSummary';

const downloadsDir = path.resolve(process.env.DOWNLOADS_DIR ?? path.join(process.cwd(), 'downloads'));
const initialNotificationJid = process.env.INITIAL_NOTIFICATION_JID ?? '919654807428@c.us';

const openRouterClient = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  textModel: process.env.OPENROUTER_TEXT_MODEL,
  visionModel: process.env.OPENROUTER_VISION_MODEL,
  referer: process.env.OPENROUTER_REFERER,
  appTitle: process.env.OPENROUTER_APP_TITLE ?? 'WhatsApp Demo Bot'
});

const getChromePath = (): string | undefined => {
  // Try common Chrome/Chromium paths on Linux
  const possiblePaths = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium'
  ];

  for (const chromePath of possiblePaths) {
    if (chromePath && existsSync(chromePath)) {
      console.log(`🔍 Found Chrome/Chromium at: ${chromePath}`);
      return chromePath;
    }
  }
  
  console.warn('⚠️  Chrome/Chromium not found in common paths. Puppeteer will use bundled Chromium.');
  return undefined;
};

const chromePath = getChromePath();
const isDebugMode = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

const puppeteerConfig = {
  headless: !isDebugMode,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-site-isolation-trials',
    '--disable-blink-features=AutomationControlled',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-ipc-flooding-protection',
    '--window-size=1920,1080',
  ],
  executablePath: chromePath,
  ignoreHTTPSErrors: true,
  ...(isDebugMode && {
    devtools: true,
    slowMo: 50,
  }),
};

if (isDebugMode) {
  console.log('🐛 Debug mode enabled. Browser will run in non-headless mode.');
  console.log('📋 Puppeteer config:', JSON.stringify(puppeteerConfig, null, 2));
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: puppeteerConfig,
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51-beta.html',
  },
});

client.on('qr', (qr) => {
  console.log('📱 Scan the QR code below to authenticate:');
  qrcodeTerminal.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
  console.log(`⏳ Loading: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
  console.log('✅ WhatsApp authentication successful.');
  console.log('🔄 Initializing client...');
});

client.on('auth_failure', (message) => {
  console.error('❌ Authentication failed:', message);
  console.error('💡 Try deleting .wwebjs_auth/ folder and scanning QR code again.');
});

client.on('ready', async () => {
  console.log('🤖 WhatsApp bot is ready and waiting for messages...');
  console.log('📊 Client info:', {
    info: client.info,
    wid: client.info?.wid,
  });
  await logTopChats();
  await sendInitialMessages(initialNotificationJid, 2);
  await summarizeRecentChat({
    client,
    openRouterClient,
    jid: initialNotificationJid,
  });
});

client.on('disconnected', (reason) => {
  console.warn('⚠️  WhatsApp client disconnected:', reason);
  console.log('🔄 Attempting to reconnect...');
});

client.on('change_state', (state) => {
  console.log(`🔄 State changed: ${state}`);
});

client.on('remote_session_saved', () => {
  console.log('💾 Remote session saved successfully.');
});

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

async function logTopChats(limit = 10): Promise<void> {
  try {
    const chats = await client.getChats();
    if (!chats.length) {
      console.log('📭 No chats available yet.');
      return;
    }

    const topChats = chats
      .filter((chat): chat is Chat & { id: Chat['id'] } => Boolean(chat.id?._serialized))
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, limit);

    console.log(`📇 Top ${topChats.length} chats by recent activity:`);
    topChats.forEach((chat, index) => {
      const jid = chat.id._serialized;
      const label = chat.name ?? chat.id.user ?? jid;
      const kind = chat.isGroup ? 'group' : 'chat';
      console.log(`${index + 1}. [${kind}] ${label} (${jid})`);
    });
  } catch (error) {
    console.error('❌ Failed to fetch chats:', error);
  }
}

async function sendInitialMessages(jid: string, count: number): Promise<void> {
  if (!jid || count <= 0) {
    return;
  }

  const prefix = 'FitBOT Initialised - Chat Summary module enabled';
  const payloads = Array.from({ length: count }, (_, index) => {
    const ordinal = index + 1;
    return `${prefix}. Test message ${ordinal}.`;
  });

  for (const payload of payloads) {
    try {
      await client.sendMessage(jid, payload);
      console.log(`📨 Sent initial message to ${jid}: "${payload}"`);
    } catch (error) {
      console.error(`❌ Failed to send initial message to ${jid}:`, error);
    }
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

async function verifyPuppeteerSetup(): Promise<boolean> {
  try {
    console.log('🔧 Verifying Puppeteer setup...');
    
    if (chromePath) {
      console.log(`✅ Using Chrome executable: ${chromePath}`);
    } else {
      console.log('ℹ️  Using Puppeteer bundled Chromium');
    }

    // Try to launch a test browser instance
    const testBrowser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: chromePath,
    });

    const testPage = await testBrowser.newPage();
    await testPage.goto('https://www.google.com', { waitUntil: 'networkidle0', timeout: 10000 });
    const title = await testPage.title();
    await testBrowser.close();

    console.log(`✅ Puppeteer test successful. Browser title: ${title}`);
    return true;
  } catch (error) {
    console.error('❌ Puppeteer verification failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    return false;
  }
}

async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 Starting WhatsApp bot...');
    
    await mkdir(downloadsDir, { recursive: true });
    console.log(`📁 Downloads directory: ${downloadsDir}`);

    if (!openRouterClient.isEnabled()) {
      console.warn('⚠️  OpenRouter API key not detected. !ask command and captions will be disabled.');
    } else {
      console.log('✅ OpenRouter client enabled');
    }

    // Verify Puppeteer setup before initializing WhatsApp client
    const puppeteerReady = await verifyPuppeteerSetup();
    if (!puppeteerReady) {
      console.error('❌ Puppeteer setup verification failed. Please check your Chrome/Chromium installation.');
      console.error('💡 On Ubuntu, you may need to install:');
      console.error('   sudo apt-get update');
      console.error('   sudo apt-get install -y google-chrome-stable');
      console.error('   OR');
      console.error('   sudo apt-get install -y chromium-browser');
      process.exitCode = 1;
      return;
    }

    console.log('🔄 Initializing WhatsApp client...');
    await client.initialize();
    console.log('✅ WhatsApp client initialized successfully');
  } catch (error) {
    console.error('❌ Fatal error during bootstrap:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Provide helpful debugging information
      if (error.message.includes('Executable doesn\'t exist')) {
        console.error('\n💡 Chrome executable not found. Solutions:');
        console.error('   1. Install Chrome: sudo apt-get install -y google-chrome-stable');
        console.error('   2. Or set CHROME_PATH environment variable');
        console.error('   3. Or let Puppeteer use bundled Chromium (remove executablePath)');
      } else if (error.message.includes('Failed to launch')) {
        console.error('\n💡 Browser launch failed. Solutions:');
        console.error('   1. Install missing dependencies:');
        console.error('      sudo apt-get install -y libnss3 libatk1.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2');
        console.error('   2. Check if running in a container/Docker (may need --no-sandbox)');
        console.error('   3. Try running with DEBUG=true to see browser window');
      }
    }
    process.exitCode = 1;
  }
}

// Handle process signals gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  try {
    await client.destroy();
    console.log('✅ Client destroyed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  try {
    await client.destroy();
    console.log('✅ Client destroyed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

void bootstrap().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exitCode = 1;
});
