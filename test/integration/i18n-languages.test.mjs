import puppeteer from 'puppeteer';

export async function testI18nLanguages(basePort) {
  console.log('  ▶ Running Integration Test: Complete 4-Language i18n Switching across all pages...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    const langs = [
      {
        code: 'hi',
        nav: 'द्वार',
        fulltext: 'सम्पूर्ण ग्रन्थ पढ़ें',
        pdfStat: 'मूल ग्रन्थ PDF',
        catalogTab: '📚 ६४ शास्त्र'
      },
      {
        code: 'en',
        nav: 'Home',
        fulltext: 'Read the full text',
        pdfStat: 'original shastra PDFs',
        catalogTab: '📚 64 Shastras'
      },
      {
        code: 'sa',
        nav: 'द्वारम्',
        fulltext: 'सम्पूर्णग्रन्थपठनम्',
        pdfStat: 'मूलग्रन्थ-पीडीएफ़',
        catalogTab: '📚 ६४ शास्त्राणि'
      },
      {
        code: 'pra',
        nav: 'दुवारं',
        fulltext: 'पुण्णं गंथं पढह',
        pdfStat: 'मूलगंथ-पीडीएफ़',
        catalogTab: '📚 ६४ सत्था'
      }
    ];

    for (const l of langs) {
      // 1. Test Granth detail page
      await page.goto(`http://127.0.0.1:${basePort}/granth/mokshamaargaprakaashaka/`, { waitUntil: 'load' });
      const currentVal = await page.$eval('#langSel', el => el.value);
      if (currentVal !== l.code) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.select('#langSel', l.code)
        ]);
      }
      await new Promise(r => setTimeout(r, 200));

      const navText = await page.$eval('.site-nav a[data-i18n="nav.home"]', el => el.textContent.trim());
      const ftText = await page.$eval('.fulltext [data-i18n="ui.fulltext"]', el => el.textContent.trim());

      if (navText !== l.nav || ftText !== l.fulltext) {
        throw new Error(`i18n mismatch on granth page for ${l.code}: nav="${navText}", fulltext="${ftText}"`);
      }

      // 2. Test Home Page (Stats Plaque)
      await page.goto(`http://127.0.0.1:${basePort}/`, { waitUntil: 'load' });
      const pdfStatText = await page.$eval('#stats a[href*="shastra-pdfs"] [data-i18n="stats.pdf"]', el => el.textContent.trim());

      if (pdfStatText !== l.pdfStat) {
        throw new Error(`i18n mismatch on home page for ${l.code}: expected pdfStat="${l.pdfStat}", got "${pdfStatText}"`);
      }

      // 3. Test PDF Viewer
      await page.goto(`http://127.0.0.1:${basePort}/viewer.html?slug=shatkhandaagama`, { waitUntil: 'load' });
      const catalogTabText = await page.$eval('#tabCatalogBtn', el => el.textContent.trim());

      if (catalogTabText !== l.catalogTab) {
        throw new Error(`i18n mismatch on viewer page for ${l.code}: expected catalogTab="${l.catalogTab}", got "${catalogTabText}"`);
      }

      console.log(`    ✓ [${l.code.toUpperCase()}] Verified Granth ("${navText}"), Home ("${pdfStatText}"), Viewer ("${catalogTabText}")`);
    }

    // Reset language back to default English
    await page.goto(`http://127.0.0.1:${basePort}/`, { waitUntil: 'load' });
    const finalVal = await page.$eval('#langSel', el => el.value);
    if (finalVal !== 'en') {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.select('#langSel', 'en')
      ]);
    }
    await new Promise(r => setTimeout(r, 200));

    console.log('  ✓ Integration Test Passed: All 4 Languages (hi, en, sa, pra) verified across pages!\n');
  } finally {
    await browser.close();
  }
}
