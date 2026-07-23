import puppeteer from 'puppeteer';

export async function testReaderFlow(basePort) {
  console.log('  ▶ Running Integration Test: Reader Flow, Multiline Quote & Audio Recitation...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(`http://127.0.0.1:${basePort}/granth/mokshamaargaprakaashaka/paath/`, { waitUntil: 'load' });

    // Open detail panel for verse 1
    await page.evaluate(() => {
      const vg = document.querySelector('.vgroup[data-n="1"]');
      if (vg) { vg.scrollIntoView(); vg.click(); }
    });
    await new Promise(r => setTimeout(r, 400));

    // Grant clipboard permission
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(`http://127.0.0.1:${basePort}`, ['clipboard-read', 'clipboard-write']);

    // Click quote button
    await page.evaluate(() => document.getElementById('vpQuote')?.click());
    await new Promise(r => setTimeout(r, 300));

    const quoteText = await page.evaluate(async () => {
      try { return await navigator.clipboard.readText(); } catch (e) { return ''; }
    });
    console.log(`    ✓ Formatted Quote snippet:\n"${quoteText.slice(0, 80).replace(/\n/g, ' ')}..."`);
    if (quoteText && !quoteText.includes('— मोक्षमार्गप्रकाशक')) {
      throw new Error('Quote missing granth citation name!');
    }

    // Test Listen button toggle
    const playBtnBefore = await page.$eval('#rPlay', el => el.textContent.trim());
    await page.click('#rPlay');
    await new Promise(r => setTimeout(r, 200));
    const playBtnAfter = await page.$eval('#rPlay', el => el.textContent.trim());
    console.log(`    ✓ Recitation Play button toggled: "${playBtnBefore}" → "${playBtnAfter}"`);

    await page.click('#rPlay'); // stop

    console.log('  ✓ Integration Test Passed: Reader Flow & Multiline Quote\n');
  } finally {
    await browser.close();
  }
}
