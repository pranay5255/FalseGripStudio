# WhatsApp Web JS Demo (TypeScript)

A starter WhatsApp bot (written in TypeScript) that follows the [`whatsapp-web.js` getting-started guide](https://wwebjs.dev/guide/creating-your-bot/) and layers in authentication, attachment downloads, and [OpenRouter](https://openrouter.ai/docs/quickstart) text/vision calls. Use this scaffold to experiment and grow richer automations.

## Features
- [`LocalAuth`](https://wwebjs.dev/guide/creating-your-bot/authentication.html) login with QR display via `qrcode-terminal` and cached sessions under `.wwebjs_auth/`.
- Attachment handling per the [official guide](https://wwebjs.dev/guide/creating-your-bot/handling-attachments.html); any incoming media is written to `downloads/` with a safe filename.
- `!ask <prompt>` command that forwards text to OpenRouter and posts the completion back into the same chat.
- Automatic image captioning: inbound images are described via an OpenRouter vision model whenever API credentials are present.
- Daily chat summaries: after the client becomes ready, the bot fetches the last 24 hours of messages for a configured JID, summarizes them with OpenRouter, and posts the digest back into the chat.
- Bootstrap diagnostics: the bot discovers an installed Chrome/Chromium binary, validates Puppeteer end-to-end, lists your busiest chats, and seeds a configurable contact/group with test pings so you can confirm delivery.
- OpenRouter client extracted to `src/openrouter.ts` so you can reuse it for other commands or multimodal workflows.

## Getting Started
1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Environment variables**
   ```bash
   cp .env.example .env
   ```
   - Set `OPENROUTER_API_KEY` (required for `!ask` and captioning).
   - Optionally override `OPENROUTER_TEXT_MODEL`, `OPENROUTER_VISION_MODEL`, `OPENROUTER_REFERER`, or `OPENROUTER_APP_TITLE` per the OpenRouter quickstart suggestions.
   - Set `INITIAL_NOTIFICATION_JID` to the contact/group that should receive startup test messages and the daily summary (defaults to your own number placeholder).
   - Set `DOWNLOADS_DIR` if you want media saved outside of `./downloads`.
   - Toggle `DEBUG=true` to launch Chrome in non-headless mode and enable extra logging; provide `CHROME_PATH` if Puppeteer should use a specific executable.
3. **Launch the bot**
   ```bash
   pnpm start
   ```
4. Scan the QR code shown in the terminal. Subsequent runs reuse the cached LocalAuth session.

## Commands & Flows
- `!ask <prompt>` — sends the prompt through `OpenRouterClient.generateText` and replies with the generated answer.
- Attachment downloads — every media message is saved to `downloads/<safe-name>.<ext>`.
- Image captioning — if the media mimetype starts with `image/` and OpenRouter creds exist, the file is captioned via `OpenRouterClient.describeImage`.
- Ready hook — once the WhatsApp session is ready, the bot logs your recent chats, sends two diagnostic messages to `INITIAL_NOTIFICATION_JID`, and posts a 24 hour summary via `summarizeRecentChat`.
- Puppeteer health check — during bootstrap the script launches a temporary headless browser to make sure dependencies are installed before initializing the WhatsApp client.

## Configuration Notes
- `OPENROUTER_REFERER` and `OPENROUTER_APP_TITLE` feed the HTTP headers recommended by OpenRouter.
- Update Puppeteer launch args/headless mode inside `src/index.ts` if you need remote debugging or persistent Chrome profiles.
- Adjust prompt templates in `OpenRouterClient` to customize the bot persona or captioning style.

## Project Structure
```
.
├── downloads/              # Created on first run for inbound media
├── src
│   ├── index.ts            # WhatsApp client wiring, commands, media flow
│   └── openrouter.ts       # Minimal OpenRouter REST client for text & vision
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Runtime Flow by File
- `src/index.ts`
  - Loads environment variables, resolves the downloads directory, and wires `OpenRouterClient`.
  - Detects Chrome/Chromium, builds the Puppeteer config (headless toggled by `DEBUG`), and performs a health check before calling `client.initialize()`.
  - Registers all WhatsApp event handlers: QR display, authentication lifecycle, ready hook (logs top chats, sends test messages, triggers the summary), message command parsing, media ingestion, graceful shutdown signals, and reconnection logging.
  - Provides helper utilities (`handleAskCommand`, `handleMediaMessage`, `persistMedia`, `verifyPuppeteerSetup`, etc.) to keep the event handlers lean.
- `src/openrouter.ts`
  - Wraps OpenRouter's `/chat/completions` endpoint with typed helpers.
  - Exposes `generateText` for text-only conversations and `describeImage` for multimodal prompts, automatically normalizing multi-part responses.
  - Handles HTTP header construction (including optional Referer/App-Title) and input validation, so the rest of the bot just checks `openRouterClient.isEnabled()`.
- `src/chatSummary.ts`
  - Fetches recent messages for a target JID, trims the transcript to fit within the prompt budget, and formats friendly author labels.
  - Builds a focused prompt and uses `openRouterClient.generateText` to produce an action-oriented digest.
  - Sends the summary back to WhatsApp or emits a helpful warning if OpenRouter is disabled or the fetch fails.

## Extending the Demo
- Add command handlers inside the `message` listener in `src/index.ts` (e.g., `!summarize`, custom menus, templated replies).
- Wire persistence (databases, vector stores) by updating the helper functions and injecting new services.
- Experiment with different OpenRouter models by editing environment variables—no code changes required.

Helpful docs for quick reference:
- [Creating your bot](https://wwebjs.dev/guide/creating-your-bot/)
- [Authentication](https://wwebjs.dev/guide/creating-your-bot/authentication.html)
- [Handling attachments](https://wwebjs.dev/guide/creating-your-bot/handling-attachments.html)
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)
