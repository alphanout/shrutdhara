import puppeteer from 'puppeteer';

export async function testResumeReading(basePort) {
  console.log('  ▶ Running Integration Test: Resume Reading & Clean URLs (0-404)...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    // Seed valid last-read state
    await page.goto(`http://127.0.0.1:${basePort}/`, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.setItem('sd-last-read', JSON.stringify({
        mokshamaargaprakaashaka: { slug: 'mokshamaargaprakaashaka', n: '45', title: 'खण्ड ४५', granthName: 'मोक्षमार्गप्रकाशक', time: Date.now() }
      }));
    });

    // Reload homepage to verify strip
    await page.goto(`http://127.0.0.1:${basePort}/`, { waitUntil: 'load' });
    const href = await page.$eval('.home-resume-strip a', el => el.getAttribute('href'));
    console.log(`    ✓ Resume button target href: "${href}"`);

    await page.click('.home-resume-strip a');
    await new Promise(r => setTimeout(r, 400));

    const finalUrl = page.url();
    console.log(`    ✓ Resume click navigated to: "${finalUrl}"`);
    if (finalUrl.includes('/granth//granth/') || finalUrl.includes('/granth/granth/')) {
      throw new Error(`Duplicated path error in URL: ${finalUrl}`);
    }

    console.log('  ✓ Integration Test Passed: Resume Reading Clean URLs\n');
  } finally {
    await browser.close();
  }
}
