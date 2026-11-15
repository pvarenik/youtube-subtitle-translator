# YouTube Subtitle Word Translator

Click any word in YouTube subtitles to instantly see its translation in a tooltip.

![Version](https://img.shields.io/badge/version-2.2.0-blue)
![Manifest](https://img.shields.io/badge/manifest-V3-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## Features

- **Click-to-translate**: Click any word in YouTube subtitles → instant translation tooltip
- **Multiple providers**: Google Translate (free), DeepL Free/Pro, LibreTranslate, custom endpoints
- **30 UI languages**: English, Russian, Belarusian, German, French, Spanish, Chinese, Japanese, Korean, and more — each displayed in its native script
- **Smart CJK support**: Chinese/Japanese/Korean text split per-character for precise translation
- **Dark mode**: Automatic (system) or manual light/dark/theme switching
- **Works on**: YouTube, YouTube Music, YouTube TV
- **Offline caching**: LRU cache (500 entries) for instant repeat translations
- **Secure**: API keys stored locally, optional host permissions for self-hosted endpoints
- **No tracking**: Zero analytics, zero external requests except translation APIs

## Installation

### Firefox (Recommended)

1. Download the latest `youtube_subtitle_word_translator-2.2.0.zip` from [Releases](https://github.com/pvarenik/youtube-subtitle-translator/releases)
2. Open `about:addons` → gear icon → **Install Add-on From File**
3. Select the downloaded zip file
4. Or install from [Firefox Add-ons](https://addons.mozilla.org/) (pending review)

### Development Installation

1. Clone this repository
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on**
3. Select `manifest.json` in the project root
4. Or run `npm start` (requires [web-ext](https://github.com/mozilla/web-ext))

### Chrome / Edge / Brave

1. Open `chrome://extensions` → enable **Developer mode**
2. Click **Load unpacked** → select the project directory

## Usage

1. Click the extension icon → configure:
   - **Source language** (Auto-detect or specific)
   - **Target language** (30 languages available)
   - **Provider** (Google, DeepL Free/Pro, LibreTranslate, Custom)
   - **API key** (required for DeepL)
2. Open any YouTube video with subtitles enabled
3. Click any word in the subtitles → translation appears instantly

## Configuration

| Setting | Description |
|---------|-------------|
| Source Language | Auto-detect or force specific language |
| Target Language | 30 languages (EN, RU, BE, DE, FR, ES, ZH, JA, KO, etc.) |
| Provider | Google (free), DeepL Free/Pro, LibreTranslate, Custom |
| API Key | Required for DeepL; optional for LibreTranslate/Custom |
| Custom Endpoint | Your own LibreTranslate-compatible server |
| Theme | System / Light / Dark |
| UI Language | 30 languages with native names and flags |

## Supported Languages (30)

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| ru | Russian | Русский |
| be | Belarusian | Беларуская |
| bg | Bulgarian | Български |
| cs | Czech | Čeština |
| da | Danish | Dansk |
| de | German | Deutsch |
| el | Greek | Ελληνικά |
| es | Spanish | Español |
| et | Estonian | Eesti |
| fi | Finnish | Suomi |
| fr | French | Français |
| hu | Hungarian | Magyar |
| id | Indonesian | Bahasa Indonesia |
| it | Italian | Italiano |
| ja | Japanese | 日本語 |
| ko | Korean | 한국어 |
| lt | Lithuanian | Lietuvių |
| lv | Latvian | Latviešu |
| nb | Norwegian | Norsk (Bokmål) |
| nl | Dutch | Nederlands |
| pl | Polish | Polski |
| pt | Portuguese | Português |
| ro | Romanian | Română |
| sk | Slovak | Slovenčina |
| sl | Slovenian | Slovenščina |
| sv | Swedish | Svenska |
| tr | Turkish | Türkçe |
| uk | Ukrainian | Українська |
| zh | Chinese | 中文 |

## Translation Providers

| Provider | API Key | Notes |
|----------|---------|-------|
| Google Translate | Not required | Free, good quality |
| DeepL Free | Required | High quality, generous free tier |
| DeepL Pro | Required | Best quality, higher limits |
| LibreTranslate | Optional | Self-hostable, privacy-focused |
| Custom Endpoint | Optional | Your own LibreTranslate-compatible server |

## Privacy

- **No data collection**: No analytics, no tracking, no user identification
- **Local storage only**: Settings and cache stored locally in your browser
- **API keys**: Stored locally, never sent anywhere except to the chosen translation provider
- **Optional permissions**: Host permission requested only when you configure a custom endpoint

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save settings and translation cache |
| `host_permissions` | YouTube, Google Translate, DeepL, LibreTranslate domains |
| `optional_permissions` | Custom endpoint domain (requested on-demand) |

## Development

### Prerequisites

- Node.js 18+
- npm
- [web-ext](https://github.com/mozilla/web-ext) (optional)

### Commands

```bash
# Install dependencies
npm install

# Lint code
npm run lint

# Run in Firefox (dev)
npm start

# Build production zip
npm run build
```

### Project Structure

```
├── manifest.json          # Manifest V3
├── background.js          # Service worker
├── content.js             # Content script
├── content.css            # Tooltip styles
├── options/
│   ├── options.html       # Settings page
│   ├── options.js         # Settings logic
│   ├── options.css        # Settings styles
│   └── i18n.json          # 30 languages
├── icons/                 # Extension icons
├── screenshots/           # Store screenshots
├── web-ext-artifacts/     # Build output
├── manifest.json          # Manifest V3
├── package.json
└── README.md
```

## Building for Release

```bash
npm run build
# Output: web-ext-artifacts/youtube_subtitle_word_translator-2.2.0.zip
```

Upload this zip to [addons.mozilla.org](https://addons.mozilla.org/developers/addon/submit/) or Chrome Web Store.

## Changelog

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for detailed version history.

### v2.2.0 (Latest)
- Professional translation review of all 30 languages
- Fixed Belarusian translations (Polish, Portuguese, Dutch, Slovak, Slovenian, Czech, Lithuanian, Latvian, Estonian)
- Fixed related Slavic languages (Ukrainian, Czech, Slovak, Slovenian, Bulgarian, Lithuanian, Latvian, Estonian)
- Fixed Belarusian language name globally (EN/KO/TR/RU/UK)
- Added "loaded" status to all 30 languages
- Version 2.2.0

### v2.1.0
- Multi-layered settings persistence (localStorage + sessionStorage + sync)
- Theme toggle (System/Light/Dark)
- Language dropdown with 30 languages, flags, native names
- Belarusian (be) added as 3rd UI language
- All 30 languages fully translated
- YouTube Music/TV support
- CJK per-character tokenization
- Dark mode CSS support

### v2.0.0
- Manifest V3 rewrite
- Multiple providers (Google, DeepL, LibreTranslate, Custom)
- LRU translation cache
- Optional host permissions
- Cross-browser MV3 (Firefox 140+, Chrome 103+)
- Comprehensive i18n (EN/RU)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/pvarenik/youtube-subtitle-translator/issues)
- **Source**: [GitHub](https://github.com/pvarenik/youtube-subtitle-translator)

---

*Made with ❤️ for language learners everywhere*