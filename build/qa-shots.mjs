/* Visual QA — screenshots every page type in dark+light × desktop+mobile.
   Usage: node build/qa-shots.mjs [baseUrl]
   Default base: a local server over dist/. Output: .qa-shots/<name>.png */

import { createServer } from 'node:http';
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, '.qa-shots');
mkdirSync(OUT, { recursive: true });

let base = process.argv[2];
let server = null;
if (!base) {
  const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  server = createServer((req, res) => {
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
  base = `http://127.0.0.1:${server.address().port}`;
}

const PAGES = [
  ['home', '/'],
  ['kaal', '/kaal.html'],
  ['granths', '/granths.html'],
  ['acharya', '/acharya.html'],
  ['bhattarak', '/bhattarak.html'],
  ['sources', '/sources.html'],
  ['granth-page', '/granth/samayasaara/'],
];
const VIEWS = [['desktop', 1280, 900], ['mobile', 390, 844]];
const THEMES = ['dark', 'light'];

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
let n = 0, failed = 0;
for (const [pname, path] of PAGES) {
  for (const [vname, w, h] of VIEWS) {
    for (const theme of THEMES) {
      const name = `${pname}--${vname}-${theme}`;
      try {
        await page.setViewport({ width: w, height: h });
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
        await page.goto(base + path, { waitUntil: 'load', timeout: 30000 });
        await new Promise((r) => setTimeout(r, 900)); // data render + reveal animations
        await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
        n++;
        console.log('  ✓', name);
      } catch (e) {
        failed++;
        console.log('  ✗', name, '—', e.message.split('\n')[0]);
      }
    }
  }
}
await browser.close();
if (failed) console.log(`! ${failed} shots failed`);
if (server) server.close();
console.log(`qa ok → .qa-shots/ (${n} screenshots from ${base})`);
