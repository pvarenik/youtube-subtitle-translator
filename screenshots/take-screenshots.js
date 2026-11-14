const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'output');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  await ensureDir(SCREENSHOT_DIR);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Popup light
    await page.goto('file://' + path.join(__dirname, 'popup.html'));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(__dirname, 'output', 'popup-light.png'), fullPage: true });
    console.log('Saved: popup-light.png');

    // 2. Popup dark
    await page.goto('file://' + path.join(__dirname, 'popup-dark.html'));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(__dirname, 'output', 'popup-dark.png'), fullPage: true });
    console.log('Saved: popup-dark.png');

    // 3. Translation feature light
    await page.goto('file://' + path.join(__dirname, 'youtube-mock.html'));
    await page.waitForTimeout(300);
    await page.click('.ytst-word:has-text("translation")');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(__dirname, 'output', 'translation-feature.png'), fullPage: true });
    console.log('Saved: translation-feature.png');

    // 4. Translation feature dark
    await page.goto('file://' + path.join(__dirname, 'youtube-mock-dark.html'));
    await page.waitForTimeout(300);
    await page.click('.ytst-word:has-text("translation")');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(__dirname, 'output', 'translation-feature-dark.png'), fullPage: true });
    console.log('Saved: translation-feature-dark.png');

    console.log('All done!');
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch(console.error);