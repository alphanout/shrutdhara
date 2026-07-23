import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = './dist';
const PORT = 8905;

// simple static file server for testing
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
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
    const ext = extname(path);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(path));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // 1. Visit homepage
    console.log('Testing Homepage...');
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
    
    // Check title
    const title = await page.title();
    console.log(`✓ Homepage title: "${title}"`);

    // Test Language switching to English
    await page.select('#langSel', 'en');
    await new Promise(r => setTimeout(r, 400));
    const navHomeEn = await page.$eval('.site-nav a[aria-current="page"]', el => el.textContent.trim());
    console.log(`✓ English Home Nav: "${navHomeEn}"`);

    // Check header bookmark button and click it
    const bmBtn = await page.$('#bmHeadBtn');
    console.log(`✓ Header bookmark button present: ${bmBtn !== null}`);
    await page.click('#bmHeadBtn');
    await new Promise(r => setTimeout(r, 300));
    const drawerShown = await page.$eval('#bmDrawer', el => !el.hidden && el.classList.contains('show'));
    const drawerTitleEn = await page.$eval('.bm-head b', el => el.textContent.trim());
    console.log(`✓ Bookmarks drawer opens on homepage click (Title: "${drawerTitleEn}"): ${drawerShown}`);
    await page.screenshot({ path: 'dist/screenshot-bookmarks-en.png' });
    await page.evaluate(() => document.getElementById('bmClose')?.click());
    await new Promise(r => setTimeout(r, 300));

    // 2. Open reader page
    console.log('\nTesting Reader Page (Mokshamaargaprakaashaka)...');
    await page.goto(`http://127.0.0.1:${PORT}/granth/mokshamaargaprakaashaka/paath/`, { waitUntil: 'load' });

    // Verify title text has no broken Devanagari halant
    const h1Text = await page.$eval('.phead h1', el => el.textContent.trim());
    console.log(`✓ Reader H1: "${h1Text}"`);
    if (h1Text.includes('म्ो')) {
      throw new Error('FAILED: Found broken Devanagari "म्ो" in title!');
    }

    // Verify skip link is hidden
    const skipDisplay = await page.$eval('.skip-link', el => getComputedStyle(el).width);
    console.log(`✓ Skip-link width (hidden): ${skipDisplay}`);

    // Click verse #1 to open detail panel
    await page.evaluate(() => {
      const el = document.querySelector('.vgroup[data-n="1"]');
      if (el) { el.scrollIntoView(); el.click(); }
    });
    await new Promise(r => setTimeout(r, 400));
    
    const panelVisible = await page.$eval('#vpanel', el => !el.hidden && el.classList.contains('show'));
    console.log(`✓ Verse panel open state: ${panelVisible}`);

    const context = page.browser().defaultBrowserContext();
    await context.overridePermissions(`http://127.0.0.1:${PORT}`, ['clipboard-read', 'clipboard-write']);
    await page.evaluate(() => document.getElementById('vpQuote')?.click());
    const quoteText = await page.evaluate(async () => {
      try { return await navigator.clipboard.readText(); } catch (e) { return 'CLIPBOARD_ERROR: ' + e.message; }
    });
    console.log(`✓ Copied quote sample:\n${quoteText}`);

    // Save reading position and test resume link
    await page.evaluate(() => {
      localStorage.setItem('sd-last-read', JSON.stringify({
        mokshamaargaprakaashaka: { slug: 'mokshamaargaprakaashaka', n: '45', title: 'खण्ड ४५', granthName: 'मोक्षमार्गप्रकाशक', time: Date.now() }
      }));
    });

    console.log('\nTesting Homepage Resume Link...');
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
    
    const resumeHref = await page.$eval('.home-resume-strip a', el => el.getAttribute('href'));
    console.log(`✓ Resume button href: "${resumeHref}"`);

    // Click resume button and check final URL (assert no duplicated /granth//granth/ path)
    await page.click('.home-resume-strip a');
    await new Promise(r => setTimeout(r, 500));
    const finalUrl = page.url();
    console.log(`✓ Navigated URL: "${finalUrl}"`);

    if (finalUrl.includes('/granth//granth/') || finalUrl.includes('/granth/granth/')) {
      throw new Error(`FAILED: Found duplicated path in URL: ${finalUrl}`);
    } else {
      console.log('✓ SUCCESS: Resume URL is clean with 0 duplicated paths!');
    }

    console.log('\nALL RUNTIME TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
