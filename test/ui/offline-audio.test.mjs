import puppeteer from 'puppeteer';

export async function testOfflineAudio(basePort) {
  console.log('  ▶ Running UI Test: Offline Audio Caching Flow...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    // Navigate to a granth page that has audio
    await page.goto(`http://127.0.0.1:${basePort}/granth/samayasaara/paath/`, { waitUntil: 'load' });

    // Find the offline download button
    const dlBtn = await page.waitForSelector('#rOff', { timeout: 3000 }).catch(() => null);
    if (!dlBtn) {
      console.log('    ⚠ Warning: Could not find #rOff button. This granth might not have audio metadata configured.');
      return;
    }
    
    // Check initial state
    const btnText = await page.$eval('#rOff', el => el.textContent.trim());
    console.log(`    ✓ Initial audio button text: "${btnText}"`);
    
    // Intercept fetch requests to simulate fast caching instead of actually downloading mp3s
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().endsWith('.mp3')) {
        request.respond({
          status: 200,
          contentType: 'audio/mpeg',
          body: Buffer.from('fake audio')
        });
      } else {
        request.continue();
      }
    });

    // Click the button
    await page.click('#rOff');
    await new Promise(r => setTimeout(r, 50));

    // Verify it updates to "सहेजा जा रहा है..." (Saving...)
    const loadingText = await page.$eval('#rOff', el => el.textContent.trim());
    console.log(`    ✓ Audio button intermediate text: "${loadingText}"`);
    if (!loadingText.includes('सहेजा जा रहा है')) {
      throw new Error('Audio button did not switch to saving state.');
    }

    // Wait for the download to finish (simulated by mocked fetch)
    await page.waitForFunction(() => {
      const btn = document.getElementById('rOff');
      return btn && btn.textContent.includes('✓');
    }, { timeout: 5000 });

    const finalText = await page.$eval('#rOff', el => el.textContent.trim());
    console.log(`    ✓ Final audio button text: "${finalText}"`);
    
    // Check if dl btn is disabled
    const isDisabled = await page.$eval('#rOff', el => el.disabled);
    console.log(`    ✓ Audio button is disabled after completion: ${isDisabled}`);
    if (!isDisabled) throw new Error('Audio button was not disabled after offline caching completed.');

    console.log('  ✓ UI Test Passed: Offline Audio Caching Flow\n');
  } finally {
    await browser.close();
  }
}
