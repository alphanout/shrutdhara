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
    
    // Test dedicated 64 PDF filter chip
    await page.waitForSelector('button[data-c="pdf"]');
    await page.click('button[data-c="pdf"]');
    await new Promise(r => setTimeout(r, 300));
    const pdfSlabs = await page.$$eval('#slabs .slab', els => els.length);
    console.log(`    ✓ Slabs visible after clicking 64 PDF filter: ${pdfSlabs}`);
    if (pdfSlabs !== 64) {
      throw new Error(`Expected exactly 64 slabs for PDF filter, got ${pdfSlabs}`);
    }

    // Reset to All
    await page.click('button[data-c=""]');
    await new Promise(r => setTimeout(r, 200));
    const resetSlabs = await page.$$eval('#slabs .slab', els => els.length);
    if (resetSlabs !== 90) {
      throw new Error(`Expected 90 slabs after resetting to All, got ${resetSlabs}`);
    }

    // Test a specific century filter (e.g. 2nd century)
    const centBtn = await page.$('button[data-c="2"]');
    if (centBtn) {
      await centBtn.click();
      await new Promise(r => setTimeout(r, 200));
      const centSlabs = await page.$$eval('#slabs .slab', els => els.length);
      console.log(`    ✓ Slabs visible after filtering by 2nd century: ${centSlabs}`);
      if (centSlabs === 0 || centSlabs >= 90) {
        throw new Error(`Unexpected slab count for 2nd century: ${centSlabs}`);
      }
    }

    console.log('  ✓ UI Test Passed: Granths Century Filters\n');
  } finally {
    await browser.close();
  }
}
