# yt-subtitle-translator

Browser extension that translates YouTube subtitle words on click.

Click any word in YouTube subtitles to see its translation in a tooltip.

## Features

- Click-to-translate tooltip (closes on click outside, scroll, or Esc; auto-hides after 12s)
- Detected source language chip (e.g. `EN → RU`) when source is set to Auto-detect
- Translation cache - repeated clicks on the same word skip the API
- Chinese/Japanese subtitles are split per character, so each character is clickable
- Settings and API key sync across devices via browser sync storage
- UI in English and Russian
- "Test" button in the options page to verify provider/endpoint configuration

## Providers

- Google Translate (free)
- DeepL Free (API key required)
- DeepL Pro (API key required)
- LibreTranslate (public instance or self-hosted)
- Custom endpoint (LibreTranslate-compatible API)

The extension asks for broad host access only when you point LibreTranslate or
a custom endpoint at your own server - it then requests access just for that
site, on demand.

## Requirements

- Firefox 140+ (or Firefox for Android 142+)
- Chrome / Edge 103+

## Install (temporary)

Firefox:

1. Open `about:debugging`.
2. Click **This Firefox** -> **Load Temporary Add-on**.
3. Select `manifest.json` in this directory.

If an older signed version of this add-on is already installed (about:addons),
uninstall it first: loading a temporary copy fails when an add-on with the
same ID is already installed.

Note: in release Firefox, installing an unsigned `.xpi` (drag-and-drop or
`about:addons`) fails with "This add-on could not be installed because it
appears to be corrupt". This does not mean the package is broken: unsigned
add-ons are blocked in release builds. Use the temporary load above for
testing, or upload to addons.mozilla.org for signing (the "unlisted" channel
gives you an installable signed file). Developer Edition and ESR can disable
the check via `xpinstall.signatures.required`.

Chrome/Edge:

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this directory.

## Configure

Click the extension icon to set source/target languages, provider, and API key.

## Development

```
npm install
npm run lint    # web-ext lint
npm start       # run in a temporary Firefox instance
npm run build   # zip package in web-ext-artifacts/
```
