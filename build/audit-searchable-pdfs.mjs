import fs from 'fs';
import path from 'path';

async function audit() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const catalog = JSON.parse(fs.readFileSync('data/shastra-pdfs.json', 'utf8'));
  const searchIndex = JSON.parse(fs.readFileSync('data/pdf-search-index.json', 'utf8'));
  
  // check which slugs have entries in searchIndex
  const indexSlugs = new Set(searchIndex.map(x => x.s));
  const indexCounts = {};
  for (const x of searchIndex) {
    indexCounts[x.s] = (indexCounts[x.s] || 0) + 1;
  }

  const pdfDir = path.join(process.env.HOME, 'Downloads/JainGranthLibrary_PDFs');
  
  const results = [];

  for (const [slug, item] of Object.entries(catalog)) {
    const fn = item.fileName;
    const localPath = path.join(pdfDir, fn);
    const exists = fs.existsSync(localPath);
    let totalPages = 0;
    let textPagesCount = 0;
    let sampleText = '';
    let isUnicode = false;
    let isScanned = true;

    if (exists) {
      try {
        const data = new Uint8Array(fs.readFileSync(localPath));
        const doc = await pdfjs.getDocument({ data, standardFontDataUrl: false }).promise;
        totalPages = doc.numPages;
        
        // Sample first 15 pages or all pages if fewer
        const checkPages = Math.min(totalPages, 15);
        for (let p = 1; p <= checkPages; p++) {
          try {
            const page = await doc.getPage(p);
            const tc = await page.getTextContent();
            const txt = tc.items.map(it => it.str).join(' ').trim();
            // Filter out watermark like 'Jain Education International'
            const cleanTxt = txt
              .replace(/Jain Education International/gi, '')
              .replace(/For Private & Personal Use Only/gi, '')
              .replace(/www\.jainelibrary\.org/gi, '')
              .replace(/Version 001: remember to check http:\/\/www\.AtmaDharma\.com for updates/gi, '')
              .trim();
            if (cleanTxt.length > 40) {
              textPagesCount++;
              if (!sampleText) sampleText = cleanTxt.slice(0, 80);
              if (/[ऀ-ॿ]/.test(cleanTxt)) isUnicode = true;
            }
          } catch {}
        }
        if (textPagesCount > 0) isScanned = false;
      } catch (err) {
        // failed to parse
      }
    }

    const inSearchIndex = indexSlugs.has(slug);
    const indexPages = indexCounts[slug] || 0;

    results.push({
      id: item.id,
      slug,
      name: item.name,
      nameEn: item.nameEn || item.name,
      fileName: fn,
      size: item.size,
      totalPages,
      exists,
      isScanned,
      isSearchable: inSearchIndex || !isScanned,
      inSearchIndex,
      indexPages,
      textType: isScanned ? 'Scanned Raster' : (isUnicode ? 'Unicode Hindi' : 'Legacy Font'),
      sampleText: sampleText.slice(0, 60)
    });
  }

  // Summary
  const total = results.length;
  const searchable = results.filter(r => r.isSearchable).length;
  const inIndex = results.filter(r => r.inSearchIndex).length;
  const textLayer = results.filter(r => !r.isScanned).length;
  const scanned = results.filter(r => r.isScanned).length;

  console.log('=== SUMMARY OF 64 SHASTRA PDFS ===');
  console.log(`Total PDFs in catalog: ${total}`);
  console.log(`PDFs with searchable text layers: ${textLayer} (${Math.round(textLayer/total*100)}%)`);
  console.log(`PDFs indexed in pdf-search-index.json: ${inIndex}`);
  console.log(`Pure scanned image PDFs (NO text layer, bitmap scans): ${scanned} (${Math.round(scanned/total*100)}%)`);
  console.log('\n--------------------------------------------------------------');
  
  // Save detailed report to json
  fs.writeFileSync('data/searchable-pdfs-audit.json', JSON.stringify({
    total,
    textLayerCount: textLayer,
    inIndexCount: inIndex,
    scannedCount: scanned,
    results
  }, null, 2));

  console.log('Saved detailed audit to data/searchable-pdfs-audit.json');

  console.log('\n--- SEARCHABLE PDFS (' + textLayer + ') ---');
  results.filter(r => !r.isScanned).forEach(r => {
    console.log(`#${r.id} [${r.slug}] ${r.nameEn} (${r.name}) - ${r.totalPages} pp, ${r.textType}, Indexed: ${r.inSearchIndex ? 'YES (' + r.indexPages + 'p)' : 'NO'}`);
  });

  console.log('\n--- SCANNED RASTER PDFS (' + scanned + ') ---');
  results.filter(r => r.isScanned).forEach(r => {
    console.log(`#${r.id} [${r.slug}] ${r.nameEn} (${r.name}) - ${r.totalPages} pp, Size: ${r.size}, Indexed: ${r.inSearchIndex ? 'YES' : 'NO'}`);
  });
}

audit().catch(console.error);
