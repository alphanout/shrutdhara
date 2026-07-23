/* श्रुतधारा PDF pass — prints every dist/granth/<slug>/ page + the catalog to A4 PDFs.
   run after build: node build/pdf.mjs  (needs devDependency: puppeteer) */

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = createServer((req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = join(DIST, p);
    if (!f.startsWith(DIST) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

mkdirSync(join(DIST, 'pdf'), { recursive: true });
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(120000);
page.setDefaultTimeout(120000);

async function print(url, out) {
  mkdirSync(dirname(out), { recursive: true });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, timeout: 120000 });
  writeFileSync(out, pdfBuffer);
}

let n = 0;
const granthDir = join(DIST, 'granth');
if (existsSync(granthDir)) {
  for (const slug of readdirSync(granthDir)) {
    await print(`${base}/granth/${slug}/`, join(DIST, 'pdf', `${slug}.pdf`));
    n++;
    if (n % 15 === 0) console.log(`  …${n} PDFs`);
  }
}
if (existsSync(join(DIST, 'catalog.html'))) {
  await print(`${base}/catalog.html`, join(DIST, 'pdf', 'sampurna-suchi.pdf'));
  n++;
}
/* full mool-text PDFs where a paath page exists */
if (existsSync(granthDir)) {
  for (const slug of readdirSync(granthDir)) {
    if (existsSync(join(granthDir, slug, 'paath', 'index.html'))) {
      await print(`${base}/granth/${slug}/paath/`, join(DIST, 'pdf', `${slug}-paath.pdf`));
      n++;
      if (n % 15 === 0) console.log(`  …${n} PDFs`);
    }
  }
}

/* OG share cards: dark-theme 1200×630 snapshots of each granth page + home */
mkdirSync(join(DIST, 'og'), { recursive: true });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
let m = 0;
if (existsSync(granthDir)) {
  for (const slug of readdirSync(granthDir)) {
    await page.goto(`${base}/granth/${slug}/`, { waitUntil: 'load', timeout: 120000 });
    await page.screenshot({ path: join(DIST, 'og', `${slug}.jpg`), type: 'jpeg', quality: 82, timeout: 120000 });
    m++;
  }
}
await page.goto(`${base}/`, { waitUntil: 'load', timeout: 120000 });
await page.screenshot({ path: join(DIST, 'og', 'site.jpg'), type: 'jpeg', quality: 82 });
m++;
console.log(`og ok → dist/og/ (${m} cards)`);

await browser.close();
server.close();
console.log(`pdf ok → dist/pdf/ (${n} files)`);
