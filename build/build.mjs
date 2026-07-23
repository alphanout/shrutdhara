/* श्रुतधारा build — generates dist/: static shell + 90 granth pages + catalog print page.
   No framework; run: node build/build.mjs */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify, devaNum, nameKey, translit } from '../js/translit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://shrutdhara.com';

const readJson = (f) => {
  const p = join(ROOT, 'data', f);
  if (!existsSync(p)) { console.warn(`! missing data/${f} — skipping`); return []; }
  return JSON.parse(readFileSync(p, 'utf8'));
};

const granths = readJson('granths-90.json');
const acharyas = readJson('acharyas-420.json');
const bhattarak = readJson('bhattarak-172.json');

/* curated editorial intros (optional, keyed by id; name-checked before use) */
const intros = new Map();
for (const it of readJson('granth-intros.json')) {
  const g = granths.find((x) => x.id === it.id);
  if (!g) continue;
  const a = (s) => String(s || '').replace(/\s+/g, '');
  if (a(g.name) !== a(it.for)) {
    console.warn(`! intro #${it.id} name mismatch ("${it.for}" vs "${g.name}") — skipped`);
    continue;
  }
  intros.set(it.id, it.text);
}

/* ---------- enrich: slugs + author links ---------- */
const seen = new Set();
for (const g of granths) {
  let s = slugify(g.name);
  if (seen.has(s)) s = `${s}-${g.id}`;
  seen.add(s);
  g.slug = s;
}
import { createResolvers, centuryOf } from './utils.mjs';
const { resolveGuru, resolveAcharya, regByKey, bhatByKey } = createResolvers(acharyas, bhattarak);
const bhattarakByKey = bhatByKey;
for (const g of granths) {
  const a = resolveAcharya(g.author);
  if (a) g.authorId = a.id;
}

/* ---------- shastra/ — full mool texts (markdown: frontmatter + verse blocks) ---------- */
const texts = new Map();
const SHASTRA = join(ROOT, 'shastra');
if (existsSync(SHASTRA)) {
  for (const f of readdirSync(SHASTRA).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
    const raw = readFileSync(join(SHASTRA, f), 'utf8');
    const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    const meta = {};
    if (fm) for (const line of fm[1].split('\n')) {
      const mm = line.match(/^(\w+):\s*(.*)$/);
      if (mm) meta[mm[1]] = mm[2].replace(/^"(.*)"$/, '$1');
    }
    const blocks = raw.slice(fm ? fm[0].length : 0).trim().split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const slug = meta.slug || f.replace(/\.md$/, '');
    texts.set(slug, { meta, blocks });
  }
}
for (const g of granths) if (texts.has(g.slug)) g.hasText = true;

/* ---------- dist skeleton ---------- */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'data'), { recursive: true });
for (const d of ['css', 'js', 'fonts']) cpSync(join(ROOT, d), join(DIST, d), { recursive: true });
if (existsSync(join(ROOT, 'assets/photos'))) cpSync(join(ROOT, 'assets/photos'), join(DIST, 'assets/photos'), { recursive: true });
if (existsSync(join(ROOT, 'audio'))) cpSync(join(ROOT, 'audio'), join(DIST, 'audio'), { recursive: true });
for (const f of ['assets/favicon.svg', 'assets/favicon-180.png', 'assets/favicon-32.png', 'assets/favicon-192.png']) {
  if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(DIST, f));
}
for (const f of ['index.html', 'kaal.html', 'granths.html', 'acharya.html', 'bhattarak.html', 'sources.html', 'about.html', '404.html']) {
  if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(DIST, f));
}
writeFileSync(join(DIST, 'data/granths-90.json'), JSON.stringify(granths, null, 1));
writeFileSync(join(DIST, 'data/acharyas-420.json'), JSON.stringify(acharyas, null, 1));
writeFileSync(join(DIST, 'data/bhattarak-172.json'), JSON.stringify(bhattarak, null, 1));

/* ---------- granth pages ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const deva = (s) => devaNum(String(s ?? ''));
// JSON-LD must not let a "</script>" inside any string break out of the block
const ldjson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

const ord = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
function centuryEn(c) {
  if (/मध्यकाल/.test(c)) return 'the medieval period';
  const m = String(c || '').match(/(\d{1,2})(?:–(\d{1,2}))?/);
  if (!m) return c;
  return m[2] ? `the ${ord(+m[1])}–${ord(+m[2])} century CE` : `the ${ord(+m[1])} century CE`;
}
const listHi = (a) => a.map((x) => x.name).join(', ');

function autoIntroHi(g, author, sameAuthor, sameCentury) {
  let s = `${g.name} — दिगम्बर जैन सम्प्रदाय के 90 प्रमुख प्राचीन ग्रन्थों की कालानुक्रमिक सूची में क्रमांक ${g.id} पर अंकित ग्रन्थ है। रचयिता ${g.author}; रचना-काल ${g.century} (लगभग)।`;
  if (author) {
    s += ` आचार्य-समयानुक्रमणिका (क्रमांक ${author.id}) के अनुसार इनका समय ${author.period} है${author.guru ? ` तथा गुरु ${author.guru}` : ''}।`;
    if (author.works) s += ` वहाँ इनकी विशेषता/प्रधान कृति के रूप में "${author.works}" उल्लिखित है।`;
  }
  if (sameAuthor.length) s += ` इसी लेखनी से ${listHi(sameAuthor)} भी इस सूची में सम्मिलित ${sameAuthor.length > 1 ? 'हैं' : 'है'}।`;
  if (sameCentury.length) s += ` समकालीन ग्रन्थों में ${listHi(sameCentury)} परिगणित हैं।`;
  return deva(s);
}
function autoIntroEn(g, author, sameAuthor, sameCentury) {
  let s = `${g.name} (${translit(g.name)}) is entry ${g.id} in the chronological list of the 90 principal ancient granths of the Digambar Jain tradition, composed by ${g.author} around ${centuryEn(g.century)}.`;
  if (author) {
    s += ` The acharya chronology (entry ${author.id}) places the author in ${author.period}${author.guru ? `, disciple of ${author.guru}` : ''}${author.works ? `, and credits him with "${author.works}"` : ''}.`;
  }
  if (sameAuthor.length) s += ` From the same pen: ${listHi(sameAuthor)}.`;
  if (sameCentury.length) s += ` Contemporary works include ${listHi(sameCentury)}.`;
  return s;
}

function granthPage(g, i) {
  const author = resolveAcharya(g.author);
  const guru = author?.guru || '';
  const guruRec = guru ? resolveGuru(guru) : null;
  const successor = author ? acharyas.find((x) => x.id > author.id && nameKey(x.guru || '') === nameKey(author.name)) : null;
  const sameAuthor = granths.filter((x) => x.id !== g.id && nameKey(x.author) === nameKey(g.author)).slice(0, 8);
  const sameCentury = granths.filter((x) => x.id !== g.id && centuryOf(x) === centuryOf(g) && nameKey(x.author) !== nameKey(g.author)).slice(0, 6);
  const prev = granths[i - 1], next = granths[i + 1];

  const kin = (rec, label) => rec
    ? `<a class="kin" href="../../${rec.isBhattarak ? 'bhattarak.html#b-' : 'acharya.html#a-'}${rec.id}" data-dv="${esc(label)}">${esc(label)}</a>`
    : (label ? `<span class="kin" data-dv="${esc(label)}">${esc(label)}</span>` : '');

  const parampara = [
    guru ? kin(guruRec, guru) + '<span class="arrow">→</span>' : '',
    author ? kin(author, g.author) : `<span class="me" data-dv="${esc(g.author)}">${esc(g.author)}</span>`,
    successor ? '<span class="arrow">→</span>' + kin(successor, successor.name) : '',
  ].join('');

  const chips = (list, key) => list.length ? `
      <div class="chips-l lat dv" data-i18n="${key}"></div>
      <div class="chips">${list.map((x) => `<a class="chip" href="../${x.slug}/" data-dv="${esc(x.name)}">${esc(x.name)}</a>`).join('')}</div>` : '';

  const curated = intros.get(g.id);
  const introHtml = curated ? `
  <section class="prose">
    <h2 data-i18n="ui.intro">संक्षिप्त परिचय</h2>
    ${curated.map((p) => `<p>${esc(p)}</p>`).join('')}
    <p class="prose-note">— सम्पादकीय परिचय; नीचे की तालिका-सामग्री मूल स्रोतों से अक्षरशः है। · Editorial summary; all list data is verbatim from the sources.</p>
  </section>` : '';
  const sameAuthor2 = sameAuthor, sameCentury2 = sameCentury;
  const recordHtml = `
  <section class="prose">
    <h2 data-i18n="ui.record">अभिलेख-विवरण</h2>
    <p class="lang-hi">${esc(autoIntroHi(g, author, sameAuthor2, sameCentury2))}</p>
    <p class="lang-en">${esc(autoIntroEn(g, author, sameAuthor2, sameCentury2))}</p>
  </section>`;

  return `<!DOCTYPE html>
<html lang="hi" data-root="../../">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(g.name)} — श्रुतधारा</title>
<meta name="description" content="${esc(g.name)} — ${esc(g.author)} · ${esc(g.century || '')} · दिगम्बर जैन ९० प्रमुख प्राचीन ग्रन्थों में क्रम ${g.id}।">
<meta property="og:title" content="${esc(g.name)} — श्रुतधारा">
<meta property="og:description" content="${esc(g.author)} · ${esc(g.century || '')} · अभिलेख ${g.id}/${granths.length}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}/granth/${g.slug}/">
<meta property="og:image" content="${SITE}/og/${g.slug}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="../../assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="../../assets/favicon-192.png">
<link rel="icon" type="image/svg+xml" href="../../assets/favicon.svg">
<link rel="apple-touch-icon" href="../../assets/favicon-180.png">
<link rel="canonical" href="${SITE}/granth/${g.slug}/">
<link rel="manifest" href="../../manifest.webmanifest">
<script type="application/ld+json">${ldjson({ '@context': 'https://schema.org', '@type': 'Book', name: g.name, author: { '@type': 'Person', name: g.author }, inLanguage: 'hi', url: `${SITE}/granth/${g.slug}/`, isAccessibleForFree: true })}</script>
<link rel="stylesheet" href="../../fonts/fonts.css">
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/print.css">
</head>
<body data-page="granth">

<header class="site-head">
  <div class="wrap bar">
    <a class="brand inlay khand" href="../../">श्रुतधारा</a>
    <nav class="site-nav" aria-label="मुख्य">
      <a href="../../" data-i18n="nav.home">द्वार</a>
      <a href="../../kaal.html" data-i18n="nav.kaal">काल-स्तर</a>
      <a href="../../granths.html" aria-current="page" data-i18n="nav.granths">ग्रन्थ</a>
      <a href="../../acharya.html" data-i18n="nav.acharya">आचार्य</a>
      <a href="../../bhattarak.html" data-i18n="nav.bhattarak">भट्टारक-विद्वान</a>
      <a href="../../sources.html" data-i18n="nav.sources">मूल स्रोत</a>
      <a href="../../about.html" data-i18n="nav.about">परिचय</a>
    </nav>
    <div class="tools">
      <button class="icon-btn" id="bmHeadBtn" type="button" title="सहेजे गए बुकमार्क / Saved Bookmarks" aria-label="सहेजे गए बुकमार्क">🔖</button>
      <select class="icon-btn" id="langSel" aria-label="भाषा / Language"><option value="hi">हिं</option><option value="en">EN</option><option value="sa">सं</option><option value="pra">प्रा</option></select>
      <button class="icon-btn" id="themeBtn" type="button" aria-label="थीम बदलें">☀/☾</button>
    </div>
  </div>
</header>

<main class="gpage">
  <div class="mang">॥ श्री ॥</div>
  <h1 class="inlay" data-dv="${esc(g.name)}">${esc(g.name)}</h1>
  <p class="translit-line">${esc(translit(g.name))}</p>
  <p class="meta num"><span data-dv="${esc(g.author)}">${esc(g.author)}</span> <span>· ${esc(deva(g.century || ''))} · अभिलेख ${deva(g.id)}/${deva(granths.length)}</span></p>
  ${parampara ? `<div class="parampara num">${parampara}</div>` : ''}
  ${introHtml}
  ${recordHtml}
  ${chips(sameAuthor, 'ui.same_pen')}
  ${chips(sameCentury, 'ui.same_century')}
  <section class="fulltext">
    <div class="chips-l lat dv" data-i18n="ui.fulltext">सम्पूर्ण ग्रन्थ पढ़ें</div>
    <div class="chips">
      <a class="chip ext" target="_blank" rel="noopener" href="https://www.jaingranthlibrary.com/search?q=${encodeURIComponent(g.name)}">जैन ग्रन्थ लाइब्रेरी ↗</a>
      <a class="chip ext" target="_blank" rel="noopener" href="https://jainkosh.org/wiki/Special:Search?search=${encodeURIComponent(g.name)}">जैनकोश ↗</a>
      <a class="chip ext" target="_blank" rel="noopener" href="https://archive.org/search?query=${encodeURIComponent(g.name)}">Archive.org ↗</a>
    </div>
    <p class="ext-note" data-i18n="ui.fulltext_note">बाह्य ग्रन्थालयों में खोज — नई टैब में खुलेगी</p>
  </section>
  <div class="btns">
    ${texts.has(g.slug) ? `<a class="btn kum" href="paath/" data-i18n="ui.paath">मूल पाठ पढ़ें</a>` : ''}
    <a class="btn ${texts.has(g.slug) ? 'ghost' : 'kum'}" href="../../pdf/${g.slug}.pdf" download data-i18n="ui.pdf">पीडीएफ़ डाउनलोड</a>
    <button class="btn ghost" id="shareBtn" type="button" data-i18n="ui.share">साझा करें</button>
  </div>
  <p class="src"><span data-i18n="ui.proof">प्रमाण</span>: ९०-ग्रन्थ सूची-पोस्टर, पंक्ति ${deva(g.id)} — <a href="../../sources.html">मूल छायाचित्र</a></p>
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

/* ---------- पाठ (reader) pages ---------- */
function paathPage(g, txt) {
  const { meta, blocks } = txt;
  /* group: verse block + attached @-layer blocks (@अर्थ / @en / @छाया) */
  const LAYER = { '@अर्थ': 'arth', '@en': 'en', '@छाया': 'chhaya' };
  const isProse = meta.format === 'prose';
  const out = [];
  const toc = [];
  let vn = 0, sn = 0;
  for (const b of blocks) {
    if (b.startsWith('## ')) {
      sn++;
      const name = b.slice(3);
      toc.push({ id: `s${sn}`, name });
      out.push(`<h2 id="s${sn}">${esc(name)}</h2>`);
      continue;
    }
    const lm = Object.keys(LAYER).find((k) => b.startsWith(k + ' ') || b.startsWith(k + '\n'));
    if (lm && out.length && out[out.length - 1].startsWith('<div class="vgroup"')) {
      const cls = LAYER[lm];
      const content = esc(b.slice(lm.length).trim()).replace(/\n/g, '<br>');
      out[out.length - 1] = out[out.length - 1].replace('</div><!--vg-->',
        `<div class="vlayer ${cls}" hidden>${content}</div></div><!--vg-->`);
      continue;
    }
    vn++;
    const isShloka = b.startsWith('दोहा-') || b.startsWith('श्लोक-') || b.startsWith('गाथा-') ||
      /^(?:दोहा|श्लोक|गाथा)\s*[-:]/.test(b.trim()) ||
      b.includes('॥') || b.includes('..');
    const shlokaCls = isShloka ? ' is-shloka' : '';
    // aria-labelledby points at the verse text so screen readers ANNOUNCE the
    // scripture (not a repeated "विवरण खोलें"); aria-describedby adds the action hint.
    out.push(`<div class="vgroup${shlokaCls}" id="v${vn}" data-n="${vn}" tabindex="0" role="button" aria-labelledby="vt${vn}" aria-describedby="vp-hint"><div class="verse" id="vt${vn}">${esc(b).replace(/\n/g, '<br>')}</div></div><!--vg-->`);
  }
  const body = out.join('\n');
  const tocHtml = `
  <aside class="toc" id="toc" aria-label="विषय-सूची">
    <div class="toc-h lat dv" data-i18n="ui.toc">विषय-सूची</div>
    ${toc.length ? `<nav class="toc-secs">${toc.map((t) => `<a href="#${t.id}">${esc(t.name)}</a>`).join('')}</nav>` : ''}
    ${!isProse && vn > 1 ? `<div class="toc-h lat dv" style="margin-top:16px">पद्य</div><div class="vgrid">${Array.from({ length: vn }, (_, i) => `<button type="button" data-v="${i + 1}" class="vg-btn num">${deva(i + 1)}</button>`).join('')}</div>` : ''}
  </aside>`;
  const panelHtml = `
  <div class="vpanel-scrim" id="vpanelScrim" hidden></div>
  <aside class="vpanel" id="vpanel" role="dialog" aria-modal="true" aria-labelledby="vpTitle" hidden>
    <div class="vp-head">
      <b id="vpTitle" class="num"></b>
      <button class="icon-btn" id="vpClose" type="button" aria-label="बंद करें">✕</button>
    </div>
    <div class="vp-body" id="vpBody"></div>
    <div class="vp-actions">
      <button class="btn kum" id="vpListen" type="button" data-i18n="ui.listen_verse">▶ यह सुनें</button>
      <button class="btn ghost" id="vpQuote" type="button" data-i18n="ui.quote">❝ उद्धरण</button>
      <button class="btn ghost" id="vpBookmark" type="button" data-i18n="ui.bookmark">🔖 बुकमार्क</button>
      <button class="btn ghost" id="vpLink" type="button" data-i18n="ui.copy_link">कड़ी कॉपी करें</button>
    </div>
  </aside>`;
  const hasAudio = existsSync(join(ROOT, 'audio', g.slug));
  const layerFlags = `data-prose="${isProse}" data-lang="${esc(meta.language || '')}"${hasAudio ? ` data-audio="../../../audio/${g.slug}/"` : ''}`;
  // BCP-47 language of the actual scripture text (independent of UI chrome lang)
  const contentLang = /संस्कृत/.test(meta.language || '') ? 'sa'
    : /प्राकृत/.test(meta.language || '') ? 'pra'
    : 'hi';
  const safeSrcUrl = /^https?:\/\//.test(meta.sourceUrl || '') ? meta.sourceUrl : '';
  return `<!DOCTYPE html>
<html lang="sa" data-root="../../../">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(g.name)} — मूल पाठ · श्रुतधारा</title>
<meta name="description" content="${esc(g.name)} का सम्पूर्ण मूल पाठ — ${esc(meta.verses || '')} पद्य। ${esc(g.author)}।">
<meta property="og:title" content="${esc(g.name)} — मूल पाठ">
<meta property="og:description" content="${esc(g.author)} · सम्पूर्ण पाठ, श्रुतधारा पर">
<meta property="og:image" content="${SITE}/og/${g.slug}.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="../../../assets/favicon-32.png">
<link rel="icon" type="image/svg+xml" href="../../../assets/favicon.svg">
<link rel="apple-touch-icon" href="../../../assets/favicon-180.png">
<link rel="stylesheet" href="../../../fonts/fonts.css">
<link rel="stylesheet" href="../../../css/style.css">
<link rel="stylesheet" href="../../../css/print.css">
</head>
<body data-page="paath">
<a class="skip-link" href="#paath-main">मुख्य पाठ पर जाएँ</a>
<span id="vp-hint" class="visually-hidden">विवरण देखने के लिये चुनें · select to view details</span>

<header class="site-head">
  <div class="wrap bar">
    <a class="brand inlay khand" href="../../../">श्रुतधारा</a>
    <nav class="site-nav" aria-label="मुख्य">
      <a href="../" >← <span data-dv="${esc(g.name)}">${esc(g.name)}</span></a>
      <a href="../../../granths.html" data-i18n="nav.granths">ग्रन्थ</a>
    </nav>
    <div class="tools">
      <button class="icon-btn" id="bmHeadBtn" type="button" title="सहेजे गए बुकमार्क / Saved Bookmarks" aria-label="सहेजे गए बुकमार्क">🔖</button>
      <select class="icon-btn" id="langSel" aria-label="भाषा / Language"><option value="hi">हिं</option><option value="en">EN</option><option value="sa">सं</option><option value="pra">प्रा</option></select>
      <button class="icon-btn" id="themeBtn" type="button" aria-label="थीम बदलें">☀/☾</button>
    </div>
  </div>
</header>

<div class="reader-wrap">
${tocHtml}
<main id="paath-main" class="paath${meta.format === 'prose' ? ' prose-text' : ''}" ${layerFlags} lang="${contentLang}">
  <div class="phead">
    <div class="mang">॥ श्री ॥</div>
    <h1 class="inlay" data-dv="${esc(g.name)}">${esc(g.name)}</h1>
    <p class="pmeta num"><span data-dv="${esc(g.author)}">${esc(g.author)}</span> · ${esc(meta.language || '')}${meta.verses ? ` · ${deva(meta.verses)} पद्य · ~${deva(Math.max(1, Math.round(+meta.verses * 9 / 60)))} मिनट` : ''}${meta.partial === 'true' ? ' · <span class="warn">आंशिक पाठ</span>' : ''}</p>
    ${meta.note ? `<p class="pmeta pnote">${esc(meta.note)}</p>` : ''}
  </div>
  ${body}
  <div class="attrib">
    <b>पाठ-स्रोत:</b> ${esc(meta.source || '')}${meta.license ? ` · ${esc(meta.license)}` : ''}${safeSrcUrl ? ` · <a href="${esc(safeSrcUrl)}" target="_blank" rel="noopener">मूल e-text ↗</a>` : ''}<br>
    यह मूल पाठ है — अर्थ/टीका सम्मिलित नहीं। अशुद्धि दिखे तो GitHub पर <code>shastra/${esc(g.slug)}.md</code> सुधारें।
  </div>
  <div class="btns">
    <a class="btn kum" href="../../../pdf/${g.slug}-paath.pdf" download data-i18n="ui.pdf">पीडीएफ़ डाउनलोड</a>
    <a class="btn ghost" href="../">← <span data-i18n="ui.back_granth">ग्रन्थ-पृष्ठ</span></a>
  </div>
  <div class="print-foot num">श्रुतधारा · ${esc(g.name)} — मूल पाठ · स्रोत: ${esc(meta.source || '')}</div>
</main>
</div>
${panelHtml}

<footer class="site-foot">
  <div class="k">॥ ❖ ॥</div>
  <p>“इनका अध्ययन और स्वाध्याय ही आत्मकल्याण का मार्ग है।”</p>
</footer>

<script type="module" src="../../../js/app.js"></script>
<script type="module" src="../../../js/reader.js"></script>
</body>
</html>
`;
}

let paathCount = 0;
const verseIndex = [];
for (const g of granths) {
  const txt = texts.get(g.slug);
  if (!txt) continue;
  const dir = join(DIST, 'granth', g.slug, 'paath');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), paathPage(g, txt));
  paathCount++;
  let vn = 0;
  for (const b of txt.blocks) {
    if (b.startsWith('## ') || b.startsWith('@')) continue;
    vn++;
    const t = b.replace(/\s+/g, ' ').trim().slice(0, 170);
    verseIndex.push({ s: g.slug, n: g.name, v: vn, t });
  }
}
writeFileSync(join(DIST, 'data/verse-index.json'), JSON.stringify(verseIndex));
writeFileSync(join(DIST, 'data/paath-index.json'), JSON.stringify(verseIndex));
console.log(`verse index: ${verseIndex.length} entries -> dist/data/verse-index.json`);

/* ---------- PWA: manifest + versioned service worker ---------- */
if (existsSync(join(ROOT, 'manifest.webmanifest'))) cpSync(join(ROOT, 'manifest.webmanifest'), join(DIST, 'manifest.webmanifest'));
if (existsSync(join(ROOT, 'assets/icon-512.png'))) cpSync(join(ROOT, 'assets/icon-512.png'), join(DIST, 'assets/icon-512.png'));
if (existsSync(join(ROOT, 'sw.js'))) {
  writeFileSync(join(DIST, 'sw.js'), readFileSync(join(ROOT, 'sw.js'), 'utf8').replace('__BUILD_VERSION__', String(Date.now())));
}

/* ---------- SEO: sitemap + robots ---------- */
{
  const urls = ['', 'kaal.html', 'granths.html', 'acharya.html', 'bhattarak.html', 'sources.html', 'about.html'];
  for (const g of granths) {
    urls.push(`granth/${g.slug}/`);
    if (texts.has(g.slug)) urls.push(`granth/${g.slug}/paath/`);
  }
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join('\n') + '\n</urlset>\n';
  writeFileSync(join(DIST, 'sitemap.xml'), sm);
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
}

/* ---------- custom domain: persist CNAME so a redeploy never drops it ---------- */
{
  const host = SITE.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (host && !host.includes('github.io')) writeFileSync(join(DIST, 'CNAME'), host + '\n');
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

console.log(`build ok → dist/ (${pages} granth pages, ${paathCount} paath texts, data: ${granths.length}/${acharyas.length}/${bhattarak.length})`);
