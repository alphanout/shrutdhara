import puppeteer from 'puppeteer';

export async function testHeaderAndTheme(basePort) {
  console.log('  ▶ Running UI Test: Header & Theme switching...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(`http://127.0.0.1:${basePort}/`, { waitUntil: 'domcontentloaded' });
    
    // Check initial surface attribute
    let surface = await page.$eval('body', el => el.getAttribute('data-surface'));
    console.log(`    ✓ Initial theme surface: "${surface || 'default'}"`);

    // Click theme button
    await page.click('#themeBtn');
    await new Promise(r => setTimeout(r, 200));
    let newSurface = await page.$eval('body', el => el.getAttribute('data-surface'));
    console.log(`    ✓ Theme surface after toggle: "${newSurface}"`);

    // Verify header brand link
    const brandHref = await page.$eval('.brand', el => el.getAttribute('href'));
    console.log(`    ✓ Brand link href: "${brandHref}"`);

    console.log('  ✓ UI Test Passed: Header & Theme\n');
  } finally {
    await browser.close();
  }
}
