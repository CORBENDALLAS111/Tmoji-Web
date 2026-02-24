
# TMoji Web - Production-Ready Library

## 📋 Research Summary

### Telegram Custom Emoji Technical Details

Based on comprehensive research of Telegram's Bot API and Web clients:

1. **Custom Emoji IDs**: Unique string identifiers (e.g., "1234567890123456789") used to reference specific emojis
2. **Bot API Access**: Available via `getCustomEmojiStickers` method with Bot API 6.2+
3. **File Formats**:
   - **TGS**: Gzip-compressed Lottie JSON (max 64KB)
   - **WEBM**: Video format for complex animations
   - **PNG**: Static 512×512px images (max 512KB)
   - **GIF**: Legacy animated format
4. **Pack Structure**: Emoji packs use `t.me/addemoji/{pack_name}` format
5. **Sticker Object**: Contains `file_id` (for download), `custom_emoji_id` (unique ID), `is_animated`, `is_video` flags

### Architecture Decisions

- **Frontend**: TypeScript library with modular architecture
- **Backend**: FastAPI Python service to proxy Telegram Bot API
- **Caching**: Two-tier LRU cache (memory + localStorage)
- **Rendering**: Dynamic format detection with lottie-web for TGS
- **Lazy Loading**: Intersection Observer for performance

## 📁 Project Structure

```
tmoji-web/
├── frontend/              # TypeScript library
│   ├── src/
│   │   ├── tmoji.ts    # Main class
│   │   ├── types.ts       # TypeScript definitions
│   │   ├── cache.ts       # LRU cache implementation
│   │   ├── api.ts         # HTTP client
│   │   ├── renderer.ts    # Emoji rendering engine
│   │   ├── lottie.ts      # Lottie animation handler
│   │   ├── parser.ts      # TGS decompression
│   │   ├── lazy.ts        # Lazy loading
│   │   └── text-parser.ts # Text parsing utilities
│   ├── dist/              # Built files
│   ├── package.json
│   ├── tsconfig.json
│   └── rollup.config.js
├── backend/               # FastAPI service
│   ├── app/
│   │   ├── main.py        # FastAPI application
│   │   └── __init__.py
│   └── requirements.txt
├── docs/                  # Documentation website
│   └── index.html         # Interactive docs
├── examples/              # Usage examples
│   └── index.html
├── scripts/               # Build tools
│   └── build.py
├── README.md
├── LICENSE
└── .gitignore
```

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
export BOT_TOKEN="your_bot_token"
python -m app.main
```

### 2. Frontend Usage
```html
<script type="module">
import { TMoji } from './frontend/dist/tmoji.esm.js';

const tg = new TMoji({ apiBaseUrl: 'http://localhost:8000' });

// Load pack
const pack = await tg.loadPack('adaptive1pack_by_TMojiBot');

// Render emoji
await tg.renderTo('#container', '123456789');
</script>
```

## 🎨 Design System

### Telegram Colors
- Primary: `#0088CC` (Lochmara Blue)
- Background: `#FFFFFF`
- Secondary: `#F5F5F5`
- Text: `#000000`
- Text Secondary: `#707579`

### Typography
- Font: Inter (Apple-style)
- Mono: JetBrains Mono
- Minimalist, high information density

## 📚 API Reference

### TMoji Class Methods

| Method | Description |
|--------|-------------|
| `loadPack(url)` | Load emoji pack from Telegram URL |
| `getEmoji(id)` | Fetch single emoji by ID |
| `renderTo(container, id, options)` | Render emoji to DOM element |
| `lazyRender(container, id, options)` | Render with lazy loading |
| `renderText(container, text)` | Parse `{emoji:ID}` syntax |
| `parseAll()` | Auto-parse `<tmoji>` tags |

### Backend Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /pack?url=` | Load pack by URL |
| `GET /emoji/{id}` | Get emoji by ID |
| `GET /manifest/{pack_id}` | Get pack manifest |

## ⚙️ Configuration Options

```typescript
{
  apiBaseUrl: string;      // Backend URL
  defaultSize: string;     // '1.2em'
  animated: boolean;       // true
  cacheDuration: number;   // 24h in ms
  lazyThreshold: string;   // '50px'
}
```

## 🔧 Build & Deploy

```bash
# Build frontend
npm run build

# Build everything
python scripts/build.py

# Output: tmoji-web.zip
```

## 📊 Performance

- Bundle Size: ~8KB core, ~52KB with Lottie
- Lazy loading via Intersection Observer
- Two-tier caching (memory + localStorage)
- Tree-shakeable ES modules

## ⚠️ Legal/Technical Notes

- Requires Telegram Bot Token from @BotFather
- Bot API has rate limits (30 requests/sec)
- TGS files must be decompressed (gzip → Lottie JSON)
- Not affiliated with Telegram FZ-LLC

## 📝 Example Emoji Pack

```
https://t.me/addemoji/adaptive1pack_by_TMojiBot
```

This pack can be used to test the implementation.
