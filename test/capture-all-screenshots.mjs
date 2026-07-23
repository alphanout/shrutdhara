import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const DIST = './dist';
const PORT = 8860;
const SHOTS = './test/screenshots';

mkdirSync(SHOTS, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = createServer((req, res) => {
  let url = req.url.split('?')[0].split('#')[0];
  if (url.endsWith('/')) url += 'index.html';
  let path = join(DIST, url);
  if (!existsSync(path) && !extname(path)) path += '.html';
  if (existsSync(path)) {
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(readFileSync(path));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`📷 Capturing High-Res Screenshots Across All Pages & Languages`);
  console.log(`=======================================================\n`);

  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const pagesToCapture = [
      { name: 'home', path: '/' },
      { name: 'granths', path: '/granths.html' },
      { name: 'kaal', path: '/kaal.html' },
      { name: 'acharya', path: '/acharya.html' },
      { name: 'bhattarak', path: '/bhattarak.html' },
      { name: 'granth_detail', path: '/granth/mokshamaargaprakaashaka/' },
      { name: 'paath_reader', path: '/granth/mokshamaargaprakaashaka/paath/' }
    ];

    const languages = ['hi', 'en', 'sa', 'pra'];

    for (const p of pagesToCapture) {
      for (const lang of languages) {
        await page.goto(`http://127.0.0.1:${PORT}${p.path}`, { waitUntil: 'domcontentloaded' });
        await page.evaluate((l) => {
          localStorage.setItem('sd-lang', l);
        }, lang);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 400));

        const fileName = `${p.name}_${lang}.png`;
        await page.screenshot({ path: join(SHOTS, fileName), fullPage: false });
        console.log(`  ✓ Captured: test/screenshots/${fileName}`);
      }
    }

    console.log(`\n=======================================================`);
    console.log(`📸 ALL ${pagesToCapture.length * languages.length} SCREENSHOTS CAPTURED IN test/screenshots/!`);
    console.log(`=======================================================\n`);
  } catch (err) {
    console.error(`❌ Screenshot capture error:`, err);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
