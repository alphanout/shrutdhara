import puppeteer from 'puppeteer';

export async function testI18nLanguages(basePort) {
  console.log('  ▶ Running Integration Test: Complete 4-Language i18n Switching...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    const langs = [
      { code: 'hi', nav: 'द्वार', fulltext: 'सम्पूर्ण ग्रन्थ पढ़ें' },
      { code: 'en', nav: 'Home', fulltext: 'Read the full text' },
      { code: 'sa', nav: 'द्वारम्', fulltext: 'सम्पूर्णग्रन्थपठनम्' },
      { code: 'pra', nav: 'दुवारं', fulltext: 'पुण्णं गंथं पढह' }
    ];

    for (const l of langs) {
      await page.goto(`http://127.0.0.1:${basePort}/granth/mokshamaargaprakaashaka/`, { waitUntil: 'load' });
      await page.select('#langSel', l.code);
      await new Promise(r => setTimeout(r, 400));

      const navText = await page.$eval('.site-nav a[data-i18n="nav.home"]', el => el.textContent.trim());
      const ftText = await page.$eval('.fulltext [data-i18n="ui.fulltext"]', el => el.textContent.trim());
      console.log(`    ✓ [${l.code.toUpperCase()}] Nav: "${navText}" | Fulltext Header: "${ftText}"`);

      if (navText !== l.nav || ftText !== l.fulltext) {
        throw new Error(`i18n mismatch for language ${l.code}: expected nav="${l.nav}" got "${navText}", expected fulltext="${l.fulltext}" got "${ftText}"`);
      }
    }

    console.log('  ✓ Integration Test Passed: All 4 Languages (hi, en, sa, pra) i18n Verified!\n');
  } finally {
    await browser.close();
  }
}
