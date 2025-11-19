# WhatsApp Web JS Demo (TypeScript)

A starter WhatsApp bot (written in TypeScript) that follows the [`whatsapp-web.js` getting-started guide](https://wwebjs.dev/guide/creating-your-bot/) and layers in authentication, attachment downloads, and [OpenRouter](https://openrouter.ai/docs/quickstart) text/vision calls. Use this scaffold to experiment and grow richer automations.

## Features
- [`LocalAuth`](https://wwebjs.dev/guide/creating-your-bot/authentication.html) login with QR display via `qrcode-terminal` and cached sessions under `.wwebjs_auth/`.
- Attachment handling per the [official guide](https://wwebjs.dev/guide/creating-your-bot/handling-attachments.html); any incoming media is written to `downloads/` with a safe filename.
- `!ask <prompt>` command that forwards text to OpenRouter and posts the completion back into the same chat.
- Automatic image captioning: inbound images are described via an OpenRouter vision model whenever API credentials are present.
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
3. **Launch the bot**
   ```bash
   pnpm start
   ```
4. Scan the QR code shown in the terminal. Subsequent runs reuse the cached LocalAuth session.

## Commands & Flows
- `!ask <prompt>` — sends the prompt through `OpenRouterClient.generateText` and replies with the generated answer.
- Attachment downloads — every media message is saved to `downloads/<safe-name>.<ext>`.
- Image captioning — if the media mimetype starts with `image/` and OpenRouter creds exist, the file is captioned via `OpenRouterClient.describeImage`.

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

## Extending the Demo
- Add command handlers inside the `message` listener in `src/index.ts` (e.g., `!summarize`, custom menus, templated replies).
- Wire persistence (databases, vector stores) by updating the helper functions and injecting new services.
- Experiment with different OpenRouter models by editing environment variables—no code changes required.

Helpful docs for quick reference:
- [Creating your bot](https://wwebjs.dev/guide/creating-your-bot/)
- [Authentication](https://wwebjs.dev/guide/creating-your-bot/authentication.html)
- [Handling attachments](https://wwebjs.dev/guide/creating-your-bot/handling-attachments.html)
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)
