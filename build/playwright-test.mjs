import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = './dist';
const PORT = 8920;

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
  console.log(`Playwright test server listening on http://127.0.0.1:${PORT}`);
  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Visit homepage
    console.log('Testing Homepage in English...');
    await page.goto(`http://127.0.0.1:${PORT}/`);
    
    // Switch language to English
    await page.selectOption('#langSel', 'en');
    await new Promise(r => setTimeout(r, 400));

    const homeNavText = await page.textContent('.site-nav a[aria-current="page"]');
    console.log(`✓ English Home Nav item: "${homeNavText.trim()}"`);

    // Open Bookmarks Drawer
    await page.click('#bmHeadBtn');
    await new Promise(r => setTimeout(r, 300));
    const drawerTitle = await page.textContent('.bm-head b');
    console.log(`✓ English Bookmark Drawer Title: "${drawerTitle.trim()}"`);
    await page.screenshot({ path: 'dist/screenshot-bookmarks-en.png' });

    // Close drawer
    await page.click('#bmClose');
    await new Promise(r => setTimeout(r, 300));

    // 2. Visit Paath page
    console.log('\nTesting Reader Page (Mokshamaargaprakaashaka)...');
    await page.goto(`http://127.0.0.1:${PORT}/granth/mokshamaargaprakaashaka/paath/`);
    
    // Click verse 1 to open detail panel
    await page.click('.vgroup[data-n="1"]');
    await new Promise(r => setTimeout(r, 400));

    const panelVisible = await page.isVisible('#vpanel');
    console.log(`✓ Reader Panel Visible: ${panelVisible}`);
    await page.screenshot({ path: 'dist/screenshot-reader-en.png' });

    console.log('\nALL PLAYWRIGHT TESTS & SCREENSHOTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('PLAYWRIGHT TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
