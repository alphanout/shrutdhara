import { createServer } from 'http';
import { readFileSync, existsSync, statSync, createReadStream } from 'fs';
import { join, extname } from 'path';

import { testHeaderAndTheme } from './ui/header-and-theme.test.mjs';
import { testBookmarks } from './ui/bookmarks.test.mjs';
import { testSearchFlow } from './ui/search-flow.test.mjs';
import { testKaalFilter } from './ui/kaal-filter.test.mjs';
import { testI18nLanguages } from './integration/i18n-languages.test.mjs';
import { testReaderFlow } from './integration/reader-flow.test.mjs';
import { testResumeReading } from './integration/resume-reading.test.mjs';
import { testPdfViewerAndSearch } from './integration/pdf-viewer.test.mjs';


const DIST = './dist';
const PORT = 8870;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',

  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};


const server = createServer((req, res) => {
  let url = req.url.split('?')[0].split('#')[0];
  if (url.endsWith('/')) url += 'index.html';
  let path = join(DIST, url);
  if (!existsSync(path) && !extname(path)) path += '.html';
  if (!existsSync(path) && url.startsWith('/pdf/')) {
    const fn = url.replace('/pdf/', '');
    const altPath = join(process.env.HOME || '', 'Downloads/JainGranthLibrary_PDFs', fn);
    if (existsSync(altPath)) path = altPath;
  }
  if (existsSync(path)) {
    const stat = statSync(path);
    const range = req.headers.range;
    if (range && extname(path) === '.pdf') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const file = createReadStream(path, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf',
      });
      file.pipe(res);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[extname(path)] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    res.end(readFileSync(path));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🧪 Shrutdhara Automated Test Runner (Port ${PORT})`);
  console.log(`=======================================================\n`);

  try {
    await testHeaderAndTheme(PORT);
    await testBookmarks(PORT);
    await testSearchFlow(PORT);
    await testKaalFilter(PORT);
    await testI18nLanguages(PORT);
    await testReaderFlow(PORT);
    await testResumeReading(PORT);
    await testPdfViewerAndSearch(PORT);


    console.log(`=======================================================`);
    console.log(`🎉 ALL UI & INTEGRATION TESTS PASSED 100% PERFECTLY!`);
    console.log(`=======================================================\n`);
  } catch (err) {
    console.error(`\n❌ TEST SUITE FAILED WITH ERROR:\n`, err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
