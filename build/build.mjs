/* श्रुतधारा build — generates dist/: static shell + 90 granth pages + catalog print page.
   No framework; run: node build/build.mjs */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify, devaNum, nameKey } from '../js/translit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const readJson = (f) => {
  const p = join(ROOT, 'data', f);
  if (!existsSync(p)) { console.warn(`! missing data/${f} — skipping`); return []; }
  return JSON.parse(readFileSync(p, 'utf8'));
};

const granths = readJson('granths-90.json');
const acharyas = readJson('acharyas-420.json');
const bhattarak = readJson('bhattarak-172.json');

/* ---------- enrich: slugs + author links ---------- */
const seen = new Set();
for (const g of granths) {
  let s = slugify(g.name);
  if (seen.has(s)) s = `${s}-${g.id}`;
  seen.add(s);
  g.slug = s;
}
const regByKey = new Map();
for (const a of acharyas) {
  const k = nameKey(a.name);
  if (k && !regByKey.has(k)) regByKey.set(k, a);
}
/* author → acharya record: exact key, then prefix, then containment (len ≥ 6) */
function resolveAcharya(author) {
  const k = nameKey(author);
  if (!k) return null;
  if (regByKey.has(k)) return regByKey.get(k);
  if (k.length >= 6) {
    for (const a of acharyas) {
      const ak = nameKey(a.name);
      if (ak.startsWith(k) || k.startsWith(ak)) return a;
    }
    for (const a of acharyas) {
      if (nameKey(a.name).includes(k)) return a;
    }
  }
  return null;
}
const centuryOf = (g) => {
  const m = String(g.century || '').match(/(\d{1,2})/);
  return m ? m[1] : '?';
};
for (const g of granths) {
  const a = resolveAcharya(g.author);
  if (a) g.authorId = a.id;
}

/* ---------- dist skeleton ---------- */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'data'), { recursive: true });
for (const d of ['css', 'js', 'fonts']) cpSync(join(ROOT, d), join(DIST, d), { recursive: true });
if (existsSync(join(ROOT, 'assets/photos'))) cpSync(join(ROOT, 'assets/photos'), join(DIST, 'assets/photos'), { recursive: true });
for (const f of ['index.html', 'kaal.html', 'granths.html', 'acharya.html', 'bhattarak.html', 'sources.html', 'about.html']) {
  if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(DIST, f));
}
writeFileSync(join(DIST, 'data/granths-90.json'), JSON.stringify(granths, null, 1));
writeFileSync(join(DIST, 'data/acharyas-420.json'), JSON.stringify(acharyas, null, 1));
writeFileSync(join(DIST, 'data/bhattarak-172.json'), JSON.stringify(bhattarak, null, 1));

/* ---------- granth pages ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const deva = (s) => devaNum(String(s ?? ''));

function granthPage(g, i) {
  const author = resolveAcharya(g.author);
  const guru = author?.guru || '';
  const guruRec = guru ? regByKey.get(nameKey(guru)) : null;
  const successor = author ? acharyas.find((x) => x.id > author.id && nameKey(x.guru || '') === nameKey(author.name)) : null;
  const sameAuthor = granths.filter((x) => x.id !== g.id && nameKey(x.author) === nameKey(g.author)).slice(0, 8);
  const sameCentury = granths.filter((x) => x.id !== g.id && centuryOf(x) === centuryOf(g) && nameKey(x.author) !== nameKey(g.author)).slice(0, 6);
  const prev = granths[i - 1], next = granths[i + 1];

  const kin = (rec, label) => rec
    ? `<a class="kin" href="../../acharya.html#a-${rec.id}">${esc(label)}</a>`
    : (label ? `<span class="kin">${esc(label)}</span>` : '');

  const parampara = [
    guru ? kin(guruRec, guru) + '<span class="arrow">→</span>' : '',
    `<span class="me">${esc(g.author)}</span>`,
    successor ? '<span class="arrow">→</span>' + kin(successor, successor.name) : '',
  ].join('');

  const chips = (list, title) => list.length ? `
      <div class="chips-l lat dv">${title}</div>
      <div class="chips">${list.map((x) => `<a class="chip" href="../${x.slug}/">${esc(x.name)}</a>`).join('')}</div>` : '';

  return `<!DOCTYPE html>
<html lang="hi" data-root="../../">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(g.name)} — श्रुतधारा</title>
<meta name="description" content="${esc(g.name)} — ${esc(g.author)} · ${esc(g.century || '')} · दिगम्बर जैन ९० प्रमुख प्राचीन ग्रन्थों में क्रम ${g.id}।">
<meta property="og:title" content="${esc(g.name)} — श्रुतधारा">
<meta property="og:description" content="${esc(g.author)} · ${esc(g.century || '')} · अभिलेख ${g.id}/${granths.length}">
<link rel="stylesheet" href="../../fonts/fonts.css">
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/print.css">
</head>
<body data-page="granth">

<header class="site-head">
  <div class="wrap bar">
    <a class="brand inlay khand" href="../../">श्रुतधारा</a>
    <nav class="site-nav" aria-label="मुख्य">
      <a href="../../">द्वार</a>
      <a href="../../kaal.html">काल-स्तर</a>
      <a href="../../granths.html" aria-current="page">ग्रन्थ</a>
      <a href="../../acharya.html">आचार्य</a>
      <a href="../../bhattarak.html">भट्टारक-विद्वान</a>
      <a href="../../sources.html">मूल स्रोत</a>
      <a href="../../about.html">परिचय</a>
    </nav>
    <div class="tools"><button class="icon-btn" id="themeBtn" type="button" aria-label="थीम बदलें">☀/☾</button></div>
  </div>
</header>

<main class="gpage">
  <div class="gvein" aria-hidden="true"></div>
  <div class="mang">॥ श्री ॥</div>
  <h1 class="inlay">${esc(g.name)}</h1>
  <p class="meta num">${esc(g.author)} <span>· ${esc(deva(g.century || ''))} · अभिलेख ${deva(g.id)}/${deva(granths.length)}</span></p>
  ${parampara ? `<div class="parampara num">${parampara}</div>` : ''}
  ${chips(sameAuthor, 'इसी लेखनी से')}
  ${chips(sameCentury, 'समकालीन ग्रन्थ')}
  <div class="btns">
    <a class="btn kum" href="../../pdf/${g.slug}.pdf" download>पीडीएफ़ डाउनलोड</a>
    <button class="btn ghost" id="shareBtn" type="button">साझा करें</button>
  </div>
  <p class="src">प्रमाण: ९०-ग्रन्थ सूची-पोस्टर, पंक्ति ${deva(g.id)} — <a href="../../sources.html">मूल छायाचित्र</a></p>
  <nav class="nextprev num" aria-label="क्रम">
    <span>${prev ? `<a href="../${prev.slug}/">← ${esc(prev.name)}</a>` : ''}</span>
    <span>${next ? `<a href="../${next.slug}/">${esc(next.name)} →</a>` : ''}</span>
  </nav>
  <div class="print-foot num">श्रुतधारा · ग्रन्थ ${deva(g.id)}/${deva(granths.length)} · स्रोत: ९०-ग्रन्थ कालानुक्रमिक सूची (मुमुक्षु)</div>
</main>

<footer class="site-foot">
  <div class="k">॥ ❖ ॥</div>
  <p>“इनका अध्ययन और स्वाध्याय ही आत्मकल्याण का मार्ग है।”</p>
</footer>

<script type="module" src="../../js/app.js"></script>
<script>
document.getElementById('shareBtn').addEventListener('click', async () => {
  const data = { title: document.title, url: location.href };
  try { if (navigator.share) { await navigator.share(data); return; } } catch {}
  try { await navigator.clipboard.writeText(location.href); alert('कड़ी कॉपी हो गई'); } catch {}
});
</script>
</body>
</html>
`;
}

let pages = 0;
for (let i = 0; i < granths.length; i++) {
  const g = granths[i];
  const dir = join(DIST, 'granth', g.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), granthPage(g, i));
  pages++;
}

/* ---------- catalog print page (source of the सम्पूर्ण-सूची PDF) ---------- */
if (granths.length) {
  const rows = granths.map((g) => `
    <tr><td class="num">${deva(g.id)}</td><td class="nm">${esc(g.name)}</td><td>${esc(g.author)}</td><td class="num">${esc(deva(g.century || ''))}</td></tr>`).join('');
  writeFileSync(join(DIST, 'catalog.html'), `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8">
<title>९० प्रमुख प्राचीन ग्रन्थ — सम्पूर्ण सूची</title>
<link rel="stylesheet" href="fonts/fonts.css">
<style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font-family:'Mukta','Kohinoor Devanagari','Nirmala UI',sans-serif; background:#f4ecd9; color:#26221b; font-size:10.5pt; margin:0; padding:24px; }
  h1 { font-family:'Khand',sans-serif; font-weight:700; text-align:center; font-size:22pt; margin:0; color:#26221b; }
  .sub { text-align:center; color:#a03414; font-weight:500; margin:2px 0 18px; }
  table { width:100%; border-collapse:collapse; }
  th { font-family:'Khand',sans-serif; font-weight:600; text-align:left; color:#a03414; border-bottom:1.5px solid #8a6420; padding:4px 8px; }
  td { border-bottom:.5px solid #c9b98d; padding:3.5px 8px; vertical-align:top; }
  td.num { font-variant-numeric:tabular-nums; white-space:nowrap; }
  td.nm { font-weight:500; }
  .foot { margin-top:14px; padding-top:6px; border-top:1px solid #c9b98d; font-size:8pt; color:#8b7c5a; text-align:center; }
</style>
</head>
<body>
  <h1>॥ दिगम्बर जैन सम्प्रदाय के ९० प्रमुख प्राचीन ग्रन्थ ॥</h1>
  <p class="sub">कालानुक्रमिक सूची — ग्रन्थ · रचयिता · काल (लगभग)</p>
  <table>
    <thead><tr><th>क्रम</th><th>ग्रन्थ</th><th>रचयिता</th><th>काल</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="foot">श्रुतधारा · स्रोत: मुमुक्षु सूची-पोस्टर · “इनका अध्ययन और स्वाध्याय ही आत्मकल्याण का मार्ग है।”</p>
</body>
</html>
`);
}

console.log(`build ok → dist/ (${pages} granth pages, data: ${granths.length}/${acharyas.length}/${bhattarak.length})`);
