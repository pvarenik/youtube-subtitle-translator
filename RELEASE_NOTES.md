# YouTube Subtitle Word Translator v2.2.0

## What's New

### 🌍 Translation Quality Improvements
- **Professional translation review** of all 30 UI languages
- Fixed **Belarusian language name** across all locales:
  - English: "Belarussian" → **"Belarusian"** (standard spelling)
  - Korean: "벨라루스인" (person) → **"벨라루스어"** (language)
  - Turkish: "Belaruslu" (person) → **"Belarusça"** (language)
  - Russian: "белорусский" → **"Беларуский"** (proper noun capitalization)
- All language names now use native scripts with proper capitalization

### 🔧 Bug Fixes
- **Language persistence fixed**: Target language now correctly saves/restores (was resetting to Bulgarian)
- **Multi-layered persistence**: localStorage + sessionStorage + storage.sync with instant writes on change
- **Popup auto-resize**: Dynamic height when fields appear/disappear
- **Race condition fix**: AbortController for translation requests prevents stale responses

### ✨ Features
- **Theme toggle**: Light / Dark / System (with OS preference detection)
- **Language dropdown**: 30 languages with flags and native names (EN/RU/BE first)
- **YouTube Music & TV support**: Now works on music.youtube.com and tv.youtube.com
- **CJK per-character tokenization**: Unicode Script properties for Chinese/Japanese/Korean
- **Dark mode CSS**: Automatic theme-aware tooltip styling
- **AbortController**: Proper request cancellation on rapid clicks

### 🌐 Localization
- **30 UI languages** fully translated (no English fallbacks)
- Native language names in dropdown (e.g., "Русский", "日本語", "Беларуская")
- "Loaded" status message added to all 30 languages

### 🔒 Privacy & Security
- Zero analytics, zero tracking
- API keys stored locally only
- Optional host permissions for custom endpoints

---

## v2.1.0 (Previous)

### Persistence & Settings
- Multi-layered settings persistence (localStorage + sessionStorage + sync storage)
- Theme toggle (system/light/dark) with CSS custom properties
- Language dropdown with 30 DeepL-supported languages
- Belarusian (be) added as 3rd UI language
- All 30 UI languages fully translated via DeepL API
- YouTube Music/TV support added to host_permissions

### Technical
- CJK tokenization using Unicode Script properties
- Dark mode support in content.css
- AbortController polyfill for older browsers
- Cache invalidation on settings change
- Dynamic popup height with nudgePopupResize()

---

## v2.0.0 (Base Release)

### Core Features
- Click-to-translate on YouTube subtitles
- Multiple providers: Google, DeepL Free/Pro, LibreTranslate, Custom
- LRU translation cache (500 entries)
- Optional host permissions for self-hosted endpoints
- Manifest V3 with cross-browser support (Firefox 140+, Chrome 103+)
- Comprehensive i18n (EN/RU initially)

### MV3 Migration
- Service worker background script
- Host permissions + optional permissions
- Action API for popup
- Content scripts for YouTube, YouTube Music, YouTube TV