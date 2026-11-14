# YouTube Subtitle Word Translator - Store Listing

## Short Description (≤132 chars)
Click any word in YouTube subtitles to instantly translate it. Supports Google, DeepL, LibreTranslate with offline caching.

## Long Description
**YouTube Subtitle Word Translator** makes learning languages while watching videos effortless. Simply click any word in YouTube subtitles to see its translation instantly in a tooltip.

### Key Features
- **Click-to-translate**: Click any subtitle word → instant translation tooltip
- **Multiple providers**: Google Translate (free), DeepL Free/Pro, LibreTranslate, custom endpoints
- **30 UI languages**: English, Russian, Belarusian, German, French, Spanish, Chinese, Japanese, Korean, Arabic, and more — each displayed in its native script
- **Smart CJK support**: Chinese/Japanese/Korean text split per-character for precise translation
- **Dark mode**: Automatic (system) or manual light/dark/theme switching
- **Theme support**: Light, dark, or system-preferred
- **Works on**: YouTube, YouTube Music, YouTube TV
- **Offline caching**: LRU cache (500 entries) for instant repeat translations
- **Secure**: API keys stored locally, optional host permissions for self-hosted endpoints
- **No tracking**: Zero analytics, zero external requests except translation APIs

### Supported Translation Providers
| Provider | API Key | Notes |
|----------|---------|-------|
| Google Translate | Not required | Free, good quality |
| DeepL Free | Required | High quality, generous free tier |
| DeepL Pro | Required | Best quality, higher limits |
| LibreTranslate | Optional | Self-hostable, privacy-focused |
| Custom endpoint | Optional | Your own LibreTranslate-compatible server |

### Supported UI Languages (30)
English, Russian, Belarusian, Bulgarian, Czech, Danish, German, Greek, Spanish, Estonian, Finnish, French, Hungarian, Indonesian, Italian, Japanese, Korean, Lithuanian, Latvian, Norwegian (Bokmål), Dutch, Polish, Portuguese (Brazil/Portugal), Romanian, Slovak, Slovenian, Swedish, Turkish, Ukrainian, Chinese (Simplified/Traditional)

### How It Works
1. Install the extension
2. Click the extension icon → choose source language, target language, and translation provider
3. (Optional) Enter API key for DeepL or custom endpoint
4. Open any YouTube video with subtitles
5. Click any word in the subtitles → translation appears instantly

### Privacy
- **No data collection**: No analytics, no tracking, no user identification
- **Local storage only**: Settings and cache stored locally in your browser
- **API keys**: Stored locally, never sent anywhere except to the chosen translation provider
- **Optional permissions**: Host permission requested only when you configure a custom endpoint

### Permissions
- `storage` — save settings and translation cache
- `host_permissions` — YouTube, Google Translate, DeepL, LibreTranslate domains
- `optional_permissions` — custom endpoint domain (requested on-demand)

### Open Source
MIT licensed. Source code: https://github.com/pvarenik/youtube-subtitle-translator

---

## Screenshots Required (5-8 recommended)

### 1. Main Feature - Click Translation
**Description**: YouTube video playing with subtitles, user clicking a word, translation tooltip visible
**Dimensions**: 1280x800 (or 1280x720)
**Key elements**: Video player, subtitles, clicked word highlighted, tooltip with translation + language chip (e.g., "EN → RU")

### 2. Extension Popup - Settings
**Description**: Extension popup open showing all configuration options
**Dimensions**: 640x800 (popup aspect ratio)
**Key elements**: Language dropdowns (source/target), provider selector, API key field, custom endpoint field, Test button, theme toggle (sun/moon/monitor icons), language dropdown (flags + native names)

### 3. Dark Mode
**Description**: Same popup in dark mode
**Dimensions**: 640x800
**Key elements**: Dark background, light text, theme icon showing moon

### 4. Provider Selection
**Description**: Popup showing provider dropdown with all options
**Dimensions**: 640x800
**Key elements**: Google, DeepL Free, DeepL Pro, LibreTranslate, Custom — with descriptive labels

### 5. Language Dropdown
**Description**: Language selector dropdown open showing flags and native names
**Dimensions**: 640x800
**Key elements**: Flag emojis, native language names (e.g., "Deutsch", "日本語", "中文", "Беларуская"), sorted with EN/RU/BE first

### 6. YouTube Music / TV Support
**Description**: Extension working on music.youtube.com or tv.youtube.com
**Dimensions**: 1280x800
**Key elements**: YouTube Music/TV interface with subtitles, translation tooltip

### 7. Custom Endpoint Configuration
**Description**: Popup with LibreTranslate/Custom provider selected, showing endpoint field
**Dimensions**: 640x800
**Key elements**: Endpoint input field, hint text, permission prompt screenshot (if available)

### 8. Translation Chip Detail
**Description**: Close-up of tooltip showing detected language → target language chip
**Dimensions**: 640x400
**Key elements**: Tooltip with translation text, "EN → RU" style chip, error state example

---

## Screenshot Tips
- Use clean browser profile (no other extensions visible)
- High-quality captures (1280px width minimum)
- Show realistic content (real videos, real translations)
- Capture both light and dark theme
- Show error states gracefully (optional)
- Blur any personal info if visible

---

## Keywords / Tags
youtube, subtitle, translation, translator, language learning, dictionary, deepL, google translate, libretranslate, click-to-translate, tooltip, youtube music, youtube tv, dark mode, privacy, open source

---

## Category
Productivity / Education / Languages

---

## Version History (for "What's New")
### v2.1.0
- Multi-layered persistence fix (localStorage priority over sync storage)
- Theme toggle (system/light/dark)
- Language dropdown with 30 languages, flags, native names
- Belarusian language support
- All 30 UI languages fully translated
- YouTube Music / TV support
- CJK per-character tokenization
- Dark mode CSS support
- AbortController for request cancellation

### v2.0.0
- Manifest V3 rewrite
- Cross-browser support (Firefox 140+, Chrome 103+)
- Multiple translation providers
- Optional host permissions for custom endpoints
- LRU translation cache
- Comprehensive i18n (EN/RU)

---

## Support Links
- **GitHub Issues**: https://github.com/pvarenik/youtube-subtitle-translator/issues
- **Source Code**: https://github.com/pvarenik/youtube-subtitle-translator
- **License**: MIT