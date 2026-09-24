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

    // Test Devanagari search for "राग"
    await page.goto(`http://127.0.0.1:${basePort}/`, { waitUntil: 'load' });
    await page.type('#q', 'राग');
    await page.waitForFunction(() => {
      const hits = document.getElementById('hits');
      return hits && hits.children.length > 0;
    }, { timeout: 3000 });
    const raagCount = await page.$$eval('#hits .hit', els => els.length);
    console.log(`    ✓ Search returned ${raagCount} results for Devanagari "राग"`);
    if (raagCount === 0) throw new Error('Search failed for "राग"!');

    // Test zero-results graceful handling (no uncaught exception)
    await page.type('#q', 'xyznonexistent');
    await page.waitForFunction(() => {
      const hits = document.getElementById('hits');
      return hits && hits.textContent.includes('No results');
    }, { timeout: 3000 });
    console.log(`    ✓ Zero-results state rendered cleanly without errors`);

    console.log('  ✓ UI Test Passed: Search Flow & Navigation\n');
  } finally {
    await browser.close();
  }
}
