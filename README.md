# श्रुतधारा (Shrutdhara)

ढाई हज़ार वर्षों की अविच्छिन्न दिगम्बर जैन श्रुत-परम्परा का खुला, निःशुल्क डिजिटल स्मारक —
**९० प्रमुख प्राचीन ग्रन्थ · ४२० आचार्य · १७२ भट्टारक एवं विद्वान**। न लॉगिन, न ट्रैकिंग।

A free, open digital monument to the unbroken 2,500-year Digambar Jain śruta tradition.

## Data provenance

Every row is transcribed verbatim from photographed sources (see `assets/photos/` and the साइट का "मूल स्रोत" page):

- **भावत्रयफलप्रदर्शी** (आचार्यवर्य कुन्थुसागर जी की परम्परा), पृष्ठ ६–२९ — आचार्य समयानुक्रमणिका (420) एवं भट्टारक-विद्वान परिचय (172)
- **मुमुक्षु सूची-पोस्टर** — ९० प्रमुख प्राचीन ग्रन्थों की कालानुक्रमिक सूची

Rows that are unclear in the photographs carry `"uncertain": true` and show a ⚠ on the site.
`data/transcription.md` holds the page-by-page transcription for human verification.

## Architecture

Zero-framework static site. `data/*.json` is the single source of truth.

```text
index.html + *.html      site pages (client-rendered from JSON via js/app.js)
js/translit.js           Devanagari→Roman: search keys + URL slugs (shared browser/build)
build/build.mjs          generates dist/ + one page per granth (granth/<slug>/)
build/pdf.mjs            headless-Chromium prints every granth page + catalog to dist/pdf/
.github/workflows/       push → build → PDFs → GitHub Pages
```

Edit a line in `data/*.json` on GitHub → pages, PDFs and the catalog rebuild automatically.

## Local development

```bash
npm install        # once (puppeteer, for PDFs)
npm run build      # → dist/
npm run pdf        # → dist/pdf/ (optional locally)
npm run serve      # http://localhost:8788
```

---

“इनका अध्ययन और स्वाध्याय ही आत्मकल्याण का मार्ग है।”
