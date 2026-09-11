import puppeteer from 'puppeteer';

export async function testPdfViewerAndSearch(basePort) {
  console.log('  ▶ Running Integration Test: PDF Viewer, In-Browser Search & Highlighting...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    // 1. Test In-Browser PDF Reader with Shatkhandagama
    await page.goto(`http://127.0.0.1:${basePort}/viewer.html?slug=shatkhandaagama`, { waitUntil: 'networkidle0' });

    // Verify Title & Metadata loaded
    const title = await page.$eval('#granthTitle', el => el.textContent.trim());
    console.log(`    ✓ Viewer Granth Title: "${title}"`);
    if (!title.includes('षट्खण्डागम')) {
      throw new Error(`Expected title to include षट्खण्डागम, got: ${title}`);
    }

    // Wait for PDF to load and render pages
    await page.waitForFunction(() => {
      const el = document.getElementById('pageTotal');
      return el && el.textContent.includes('7');
    }, { timeout: 10000 });

    const totalText = await page.$eval('#pageTotal', el => el.textContent.trim());
    console.log(`    ✓ Total Pages Loaded: "${totalText}"`);

    // Verify Canvas was rendered
    const canvasDimensions = await page.$eval('#canvas-1', el => ({ w: el.width, h: el.height }));
    console.log(`    ✓ Page 1 Canvas Rendered: ${canvasDimensions.w}x${canvasDimensions.h}px`);
    if (canvasDimensions.w <= 0 || canvasDimensions.h <= 0) {
      throw new Error('Canvas was not rendered properly!');
    }

    // 2. Test In-Viewer Search & Highlighting
    await page.type('#findInput', 'Jain');
    await new Promise(r => setTimeout(r, 600));

    const findStatus = await page.$eval('#findCount', el => el.textContent.trim());
    console.log(`    ✓ Search matches found in PDF: "${findStatus}"`);
    if (!findStatus.includes('of')) {
      throw new Error(`Expected search matches, got "${findStatus}"`);
    }

    // Verify highlight in DOM
    const highlightCount = await page.$$eval('.pdf-highlight', els => els.length);
    console.log(`    ✓ Rendered highlighted marks on page: ${highlightCount}`);
    if (highlightCount === 0) {
      throw new Error('No .pdf-highlight elements found in text layer!');
    }

    // 3. Test Granth detail page has PDF link
    await page.goto(`http://127.0.0.1:${basePort}/granth/shatkhandaagama/`, { waitUntil: 'load' });
    const pdfBtnHref = await page.$eval('a[href*="viewer.html"]', el => el.getAttribute('href'));
    console.log(`    ✓ Granth page PDF reader button: "${pdfBtnHref}"`);
    if (!pdfBtnHref.includes('viewer.html?slug=shatkhandaagama')) {
      throw new Error(`Invalid PDF viewer link on granth page: ${pdfBtnHref}`);
    }

    // 4. Test sources.html 64 Shastras catalog
    await page.goto(`http://127.0.0.1:${basePort}/sources.html`, { waitUntil: 'networkidle0' });
    const cardCount = await page.$$eval('#pdfCardsGrid .card', els => els.length);
    console.log(`    ✓ Sources page Shastra PDF cards rendered: ${cardCount}`);
    if (cardCount !== 64) {
      throw new Error(`Expected 64 Shastra PDF cards, found: ${cardCount}`);
    }

    console.log('  ✓ Integration Test Passed: PDF Viewer, In-Browser Search & Highlighting 100% Verified!\n');
  } finally {
    await browser.close();
  }
}
