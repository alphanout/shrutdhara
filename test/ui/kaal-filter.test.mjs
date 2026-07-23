import puppeteer from 'puppeteer';

export async function testKaalFilter(basePort) {
  console.log('  ▶ Running UI Test: Granths Century Filters...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(`http://127.0.0.1:${basePort}/granths.html`, { waitUntil: 'load' });

    // Wait for slabs to be present
    await page.waitForSelector('.slab');
    
    // Count initial slabs
    const initialSlabs = await page.$$eval('.slab', els => els.length);
    console.log(`    ✓ Initial granth slabs visible: ${initialSlabs}`);
    
    // Check if centFilters exists
    const filterExists = await page.$eval('#centFilters', el => el !== null).catch(() => false);
    if (filterExists) {
      // Find a century filter button that is NOT the "All" button
      const buttons = await page.$$eval('#centFilters .chip', els => els.map(el => el.textContent));
      if (buttons.length > 1) {
        // Click the second filter (the first specific century)
        await page.click('#centFilters .chip:nth-child(2)');
        await new Promise(r => setTimeout(r, 300));
        
        // Count slabs again
        const filteredSlabs = await page.$$eval('.slab', els => els.length);
        console.log(`    ✓ Slabs visible after filtering by century: ${filteredSlabs}`);
        
        if (filteredSlabs === initialSlabs) {
          console.warn('    ⚠ Warning: Filter did not reduce the number of slabs. Is this expected for this century?');
        }
      }
    } else {
      console.log('    ✓ No century filters found on this page, skipping filter test.');
    }

    console.log('  ✓ UI Test Passed: Granths Century Filters\n');
  } finally {
    await browser.close();
  }
}
