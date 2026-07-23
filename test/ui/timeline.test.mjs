import puppeteer from 'puppeteer';

export async function testTimeline(basePort) {
  console.log('  ▶ Running UI Test: Timeline Data & Guru Links...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    // We will test acharya.html for timeline rendering
    await page.goto(`http://127.0.0.1:${basePort}/acharya.html`, { waitUntil: 'load' });

    // Wait for timeline rows to populate
    await page.waitForSelector('#strata .row');

    // Count rows
    const rowCount = await page.$$eval('#strata .row', els => els.length);
    console.log(`    ✓ Timeline rows loaded: ${rowCount}`);
    if (rowCount < 50) throw new Error('Timeline did not render enough rows.');

    // Check for Guru link resolution
    const guruLinkCount = await page.$$eval('#strata .row .guru a', els => els.length);
    console.log(`    ✓ Resolved Guru links in timeline: ${guruLinkCount}`);
    if (guruLinkCount === 0) throw new Error('No Guru links resolved in timeline!');

    // Click a guru link to ensure it scrolls/highlights correctly
    await page.evaluate(() => {
      const link = document.querySelector('#strata .row .guru a');
      if (link) link.click();
    });
    
    // Check if the URL has a hash
    const hash = await page.evaluate(() => location.hash);
    console.log(`    ✓ Guru link click navigated to hash: ${hash}`);
    if (!hash.startsWith('#a-') && !hash.startsWith('#b-')) {
      throw new Error('Guru link did not set a valid anchor hash.');
    }

    console.log('  ✓ UI Test Passed: Timeline Data & Guru Links\n');
  } finally {
    await browser.close();
  }
}
