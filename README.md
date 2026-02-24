# TMoji Web

Production-ready library for rendering **Telegram Premium Custom Emojis** on any website. Supports static PNG, animated TGS (Lottie), WEBM, and GIF formats with lazy loading and intelligent caching.

![Telegram Style](https://img.shields.io/badge/style-Telegram-0088CC?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)

## Features

- **Multiple Formats** — PNG, TGS (Lottie), WEBM, GIF support
- **Lazy Loading** — Emojis load only when visible via Intersection Observer
- **Smart Caching** — Memory + localStorage LRU cache with 24h TTL
- **Tree Shakable** — Import only what you need
- **TypeScript** — Full type definitions included
- **CDN Ready** — Works with any static host
- **Backend API** — FastAPI service for fetching Telegram emoji data

## Quick Start

### Installation

```bash
npm install tmoji-web lottie-web
```

### Basic Usage

```javascript
import { TMoji } from 'tmoji-web';

const tg = new TMoji({
  apiBaseUrl: 'https://api.yourdomain.com'
});

// Load emoji pack
const pack = await tg.loadPack('https://t.me/addemoji/adaptive1pack_by_TMojiBot');

// Render single emoji
await tg.renderTo('#emoji-container', '123456789');

// Render text with emojis
await tg.renderText('#message', 'Hello {emoji:123456789} World!');
```

### HTML Auto-parse

```html
<p>Check this: <tmoji id="123456789" size="1.5em"></tmoji></p>
```

```javascript
await tg.parseAll();
```

## How It Works

### Telegram Emoji System

Telegram Premium Custom Emojis use a unique identification system:

1. **Custom Emoji ID** — A unique string identifier (e.g., `"1234567890123456789"`)
2. **File ID** — Used to download the actual file via Bot API
3. **File Format** — TGS (gzip+Lottie), WEBM, PNG, or GIF

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Website   │────▶│  TMoji JS  │────▶│  Backend    │────▶│ Telegram API │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  LRU Cache   │
                    │ (Memory+LS)  │
                    └──────────────┘
```

## Backend Setup

### Requirements

- Python 3.9+
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### Installation

```bash
cd backend
pip install -r requirements.txt
export BOT_TOKEN="your_token_here"
python -m app.main
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /pack?url=` | Load emoji pack by Telegram URL |
| `GET /emoji/{id}` | Get single emoji by ID |
| `GET /manifest/{pack_id}` | Get pack manifest JSON |

## File Formats

### TGS (Animated)

TGS is Telegram's sticker format:
- **Structure**: Gzip-compressed Lottie JSON
- **Size**: Max 64KB per file
- **Rendering**: Decompressed via CompressionStream API, rendered with lottie-web

### WEBM (Video)

- Hardware-accelerated video format
- Best for complex animations
- Fallback to poster image

### PNG (Static)

- 512×512px resolution
- Max 512KB per file
- Universal browser support

## Configuration

```typescript
const tg = new TMoji({
  apiBaseUrl: 'https://api.yourdomain.com',
  defaultSize: '1.2em',
  animated: true,
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  lazyThreshold: '50px'
});
```

## Performance

- **Bundle Size**: ~8KB core, ~52KB with Lottie
- **Lazy Loading**: Emojis load only when scrolled into view
- **Caching**: Two-tier LRU cache (memory + localStorage)
- **Concurrent Limits**: Max 10-20 Lottie animations recommended

## Example Emoji Pack

Try this official Telegram pack:
```
https://t.me/addemoji/adaptive1pack_by_TMojiBot
```

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Run examples
npm run dev

# Build backend
cd backend && pip install -r requirements.txt
```

## License

MIT License — see [LICENSE](LICENSE) for details.

## Disclaimer

This library is not affiliated with Telegram. Telegram and its logo are trademarks of Telegram FZ-LLC.
