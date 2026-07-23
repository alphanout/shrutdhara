import puppeteer from 'puppeteer';

export async function testSearchFlow(basePort) {
  console.log('  ▶ Running UI Test: Search Flow & Navigation...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(`http://127.0.0.1:${basePort}/`, { waitUntil: 'load' });

    // Focus search input
    await page.type('#q', 'samaysar');
    
    // Wait for the hits to populate
    await page.waitForFunction(() => {
      const hits = document.getElementById('hits');
      return hits && hits.children.length > 0 && !hits.textContent.includes('No results');
    }, { timeout: 2000 });

    const resultsCount = await page.$$eval('#hits .hit', els => els.length);
    console.log(`    ✓ Search returned ${resultsCount} results for "samaysar"`);
    if (resultsCount === 0) throw new Error('Search failed to return results!');

    // Click the first result
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('#hits .hit:first-child')
    ]);

    // Check we navigated correctly
    const url = page.url();
    console.log(`    ✓ Navigated to search result: ${url}`);
    if (!url.includes('127.0.0.1')) {
      throw new Error('Search result did not navigate correctly!');
    }

    console.log('  ✓ UI Test Passed: Search Flow & Navigation\n');
  } finally {
    await browser.close();
  }
}
