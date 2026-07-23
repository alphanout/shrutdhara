import puppeteer from 'puppeteer';

export async function testBookmarks(basePort) {
  console.log('  ▶ Running UI Test: Bookmarks Drawer & Persistence...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(`http://127.0.0.1:${basePort}/granth/mokshamaargaprakaashaka/paath/`, { waitUntil: 'load' });

    // Open detail panel for verse #1 and click bookmark
    await page.evaluate(() => {
      const vg = document.querySelector('.vgroup[data-n="1"]');
      if (vg) { vg.scrollIntoView(); vg.click(); }
    });
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(() => document.getElementById('vpBookmark')?.click());
    await new Promise(r => setTimeout(r, 300));

    // Verify bookmark is stored in localStorage
    const savedBookmarks = await page.evaluate(() => JSON.parse(localStorage.getItem('sd-bookmarks') || '[]'));
    console.log(`    ✓ Bookmarks count in localStorage: ${savedBookmarks.length}`);
    if (!savedBookmarks.length) throw new Error('Bookmark failed to persist in localStorage!');

    // Open Bookmarks Drawer
    await page.evaluate(() => document.getElementById('bmHeadBtn')?.click());
    await new Promise(r => setTimeout(r, 500));

    const drawerVisible = await page.$eval('#bmDrawer', el => !el.hidden && el.classList.contains('show'));
    console.log(`    ✓ Bookmarks drawer visible: ${drawerVisible}`);

    const cardTitle = await page.$eval('.bm-card-head b', el => el.textContent.trim());
    console.log(`    ✓ Saved bookmark card title: "${cardTitle}"`);

    // Close drawer
    await page.evaluate(() => document.getElementById('bmClose')?.click());
    await new Promise(r => setTimeout(r, 200));

    console.log('  ✓ UI Test Passed: Bookmarks Drawer & Persistence\n');
  } finally {
    await browser.close();
  }
}
