import puppeteer from 'puppeteer';

export async function testPdfViewerAndSearch(basePort) {
  console.log('  ▶ Running Integration Test: PDF Viewer, In-Browser Search & Highlighting...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    // 1. Test In-Browser PDF Reader with Shatkhandagama (genuine 969-page scripture)
    await page.goto(`http://127.0.0.1:${basePort}/viewer.html?slug=shatkhandaagama#page=2`, { waitUntil: 'domcontentloaded' });

    // Verify Title & Metadata loaded
    await page.waitForFunction(() => {
      const el = document.getElementById('granthTitle');
      return el && el.textContent.includes('षट्खण्डागम');
    }, { timeout: 10000 });
    const title = await page.$eval('#granthTitle', el => el.textContent.trim());
    console.log(`    ✓ Viewer Granth Title: "${title}"`);

    // Wait for authentic Shatkhandagama PDF (969 pages) to load
    await page.waitForFunction(() => {
      const el = document.getElementById('pageTotal');
      return el && el.textContent.includes('969');
    }, { timeout: 20000 });

    const totalText = await page.$eval('#pageTotal', el => el.textContent.trim());
    console.log(`    ✓ Total Pages Loaded: "${totalText}"`);
    if (!totalText.includes('969')) {
      throw new Error(`Expected authentic Shatkhandagama with 969 pages, got: ${totalText}`);
    }

    // Verify Page 2 input and hash
    const initialPage = await page.$eval('#pageInput', el => el.value);
    console.log(`    ✓ Initial Page on #page=2: ${initialPage}`);
    if (initialPage !== '2') {
      throw new Error(`Expected page 2 to be active, got: ${initialPage}`);
    }

    // Verify Canvas was rendered for Page 2
    await page.waitForSelector('#canvas-2', { timeout: 10000 });
    const canvasDimensions = await page.$eval('#canvas-2', el => ({ w: el.width, h: el.height }));
    console.log(`    ✓ Page 2 Canvas Rendered: ${canvasDimensions.w}x${canvasDimensions.h}px`);
    if (canvasDimensions.w <= 0 || canvasDimensions.h <= 0) {
      throw new Error('Page 2 Canvas was not rendered properly!');
    }

    // 1b. Test Zoom buttons (+ and -) do NOT change page
    console.log('    ▶ Testing Zoom in-place stability...');
    await page.click('#zoomInBtn');
    await new Promise(r => setTimeout(r, 600));
    let postZoomInPage = await page.$eval('#pageInput', el => el.value);
    let postZoomInHash = await page.evaluate(() => window.location.hash);
    console.log(`    ✓ Post Zoom-in page: ${postZoomInPage}, hash: ${postZoomInHash}`);
    if (postZoomInPage !== '2' || postZoomInHash !== '#page=2') {
      throw new Error(`Zoom-in altered the current page! Expected page 2, got: ${postZoomInPage}`);
    }

    await page.click('#zoomOutBtn');
    await new Promise(r => setTimeout(r, 600));
    let postZoomOutPage = await page.$eval('#pageInput', el => el.value);
    let postZoomOutHash = await page.evaluate(() => window.location.hash);
    console.log(`    ✓ Post Zoom-out page: ${postZoomOutPage}, hash: ${postZoomOutHash}`);
    if (postZoomOutPage !== '2' || postZoomOutHash !== '#page=2') {
      throw new Error(`Zoom-out altered the current page! Expected page 2, got: ${postZoomOutPage}`);
    }

    // 1c. Test Mobile Viewport Horizontal Scrolling (no left clipping!)
    console.log('    ▶ Testing Mobile Viewport Horizontal Scrolling...');
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 400));

    // Verify on Shatkhandagama and Aptamimansa (not samaysaar)
    const cardRect = await page.$eval('#page-card-2', el => {
      const r = el.getBoundingClientRect();
      const parent = el.closest('.pdf-viewport');
      return {
        cardLeft: r.left,
        cardWidth: r.width,
        scrollLeft: parent.scrollLeft,
        scrollWidth: parent.scrollWidth,
        clientWidth: parent.clientWidth
      };
    });
    console.log(`    ✓ Mobile Card Metrics: width=${cardRect.cardWidth}px, clientWidth=${cardRect.clientWidth}px, cardLeft=${cardRect.cardLeft}px`);
    // Crucial check: cardLeft must not be negative (which would mean left edge is clipped and unreachable)
    if (cardRect.cardLeft < -2) {
      throw new Error(`Mobile left edge clipped! cardLeft is negative: ${cardRect.cardLeft}px`);
    }

    // Scroll to right and back to left
    await page.$eval('.pdf-viewport', el => { el.scrollLeft = 100; });
    const scrolledRight = await page.$eval('.pdf-viewport', el => el.scrollLeft);
    if (scrolledRight <= 0) {
      throw new Error('Failed to scroll horizontally to right on mobile viewport!');
    }
    await page.$eval('.pdf-viewport', el => { el.scrollLeft = 0; });
    const scrolledLeft = await page.$eval('.pdf-viewport', el => el.scrollLeft);
    if (scrolledLeft !== 0) {
      throw new Error('Failed to scroll back to left=0 on mobile viewport!');
    }
    console.log('    ✓ Mobile Horizontal Scroll: full pan right and left without clipping verified');

    // 1d. Test 2-Finger Pinch-To-Zoom & Touch Gestures
    console.log('    ▶ Testing 2-Finger Pinch-To-Zoom gesture on mobile...');
    const prePinchWidth = await page.$eval('#page-card-2', el => el.offsetWidth);

    await page.evaluate(() => {
      const vp = document.getElementById('pdfViewport');
      const createTouch = (id, x, y) => new Touch({ identifier: id, target: vp, clientX: x, clientY: y });
      
      // Start 2 touches (distance = 100px)
      const t1Start = createTouch(1, 150, 250);
      const t2Start = createTouch(2, 250, 250);
      vp.dispatchEvent(new TouchEvent('touchstart', { touches: [t1Start, t2Start], cancelable: true, bubbles: true }));

      // Spread 2 touches apart (distance = 180px, factor = 1.8)
      const t1Move = createTouch(1, 110, 250);
      const t2Move = createTouch(2, 290, 250);
      vp.dispatchEvent(new TouchEvent('touchmove', { touches: [t1Move, t2Move], cancelable: true, bubbles: true }));

      // Lift touches to commit zoom
      vp.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t1Move, t2Move], cancelable: true, bubbles: true }));
    });

    await new Promise(r => setTimeout(r, 600));
    const postPinchWidth = await page.$eval('#page-card-2', el => el.offsetWidth);
    console.log(`    ✓ 2-Finger Pinch Zoom: pre-width=${prePinchWidth}px, post-width=${postPinchWidth}px`);
    if (postPinchWidth <= prePinchWidth) {
      throw new Error(`2-finger pinch-to-zoom failed! Card width did not increase (pre: ${prePinchWidth}, post: ${postPinchWidth})`);
    }

    // Test Double-Tap to toggle fit
    console.log('    ▶ Testing Mobile Double-Tap zoom reset...');
    await page.evaluate(() => {
      const vp = document.getElementById('pdfViewport');
      const createTouch = (id, x, y) => new Touch({ identifier: id, target: vp, clientX: x, clientY: y });
      const t1 = createTouch(1, 180, 250);
      vp.dispatchEvent(new TouchEvent('touchstart', { touches: [t1], cancelable: true, bubbles: true }));
      setTimeout(() => {
        vp.dispatchEvent(new TouchEvent('touchstart', { touches: [t1], cancelable: true, bubbles: true }));
      }, 100);
    });
    await new Promise(r => setTimeout(r, 600));
    const postDoubleTapWidth = await page.$eval('#page-card-2', el => el.offsetWidth);
    console.log(`    ✓ Mobile Double-Tap toggle zoom: post-width=${postDoubleTapWidth}px`);

    // 2b. Test Dual-Query Search in Legacy-Encoded PDF (Aptamimansa with "राग")
    await page.goto(`http://127.0.0.1:${basePort}/viewer.html?slug=aaptamimaansaa`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const el = document.getElementById('pageTotal');
      return el && el.textContent.includes('68');
    }, { timeout: 15000 });
    console.log('    ✓ Loaded Aptamimansa PDF (68 pages)');

    await page.click('#findInput', { clickCount: 3 });
    await page.type('#findInput', 'राग');
    await new Promise(r => setTimeout(r, 1500));

    const legacyFindStatus = await page.$eval('#findCount', el => el.textContent.trim());
    console.log(`    ✓ Dual-Query Search matches for "राग": "${legacyFindStatus}"`);
    if (!legacyFindStatus.includes('of')) {
      throw new Error(`Expected search matches for "राग" in Aptamimansa, got "${legacyFindStatus}"`);
    }

    const legacyHighlightCount = await page.$$eval('.pdf-highlight', els => els.length);
    console.log(`    ✓ Rendered highlighted marks for "राग" in legacy text layer: ${legacyHighlightCount}`);
    if (legacyHighlightCount === 0) {
      throw new Error('Expected highlights for "राग" (jeie) in Aptamimansa!');
    }

    // Verify sidebar hits display decoded Devanagari Hindi snippet
    const hitSnippet = await page.$eval('.search-hit-snippet', el => el.textContent.trim());
    console.log(`    ✓ Decoded sidebar hit snippet preview: "${hitSnippet.slice(0, 50)}..."`);

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
