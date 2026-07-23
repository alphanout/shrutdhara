/* श्रुतधारा — client engine: theme, data, search, renderers.
   Pages declare <body data-page="..."> and <html data-root="..."> (path prefix to site root). */

import { romanKey, skeleton, slugify, devaNum, nameKey } from './translit.js';
import { t, lang } from './i18n.js';

const root = document.documentElement.getAttribute('data-root') || '';
const page = document.body.getAttribute('data-page') || '';

/* ---------- theme ---------- */
const THEME_KEY = 'sd-theme';
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const r = document.documentElement;
    const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const cur = r.getAttribute('data-theme') || (sysDark ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    r.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  });
}

/* ---------- data ---------- */
let DATA = null;
async function loadData() {
  if (DATA) return DATA;
  const get = async (f) => {
    try {
      const r = await fetch(root + 'data/' + f);
      if (!r.ok) return [];
      return await r.json();
    } catch { return []; }
  };
  const [granths, acharyas, bhattarak] = await Promise.all([
    get('granths-90.json'), get('acharyas-420.json'), get('bhattarak-172.json'),
  ]);
  DATA = { granths, acharyas, bhattarak };
  // search corpus
  DATA.corpus = [];
  for (const g of granths) DATA.corpus.push({
    kind: 'g', label: g.name, sub: g.author, d: g.century || '',
    keys: keysOf(g.name, g.author), href: root + 'granth/' + (g.slug || slugify(g.name)) + '/',
  });
  for (const a of acharyas) DATA.corpus.push({
    kind: 'a', label: a.name, sub: a.works || '', d: a.period || '',
    keys: keysOf(a.name, a.works), href: root + 'acharya.html#a-' + a.id,
  });
  for (const b of bhattarak) DATA.corpus.push({
    kind: 'b', label: b.name, sub: b.works || b.guruOrType || '', d: b.period || '',
    keys: keysOf(b.name, b.works, b.guruOrType), href: root + 'bhattarak.html#b-' + b.id,
  });
  // guru lookup: normalized acharya name -> id
  DATA.guruIndex = new Map();
  for (const a of acharyas) {
    const k = nameKey(a.name);
    if (k && !DATA.guruIndex.has(k)) DATA.guruIndex.set(k, a.id);
  }
  return DATA;
}
function keysOf(...parts) {
  const raw = parts.filter(Boolean).join(' ');
  return { raw, rk: romanKey(raw), sk: skeleton(raw) };
}

/* ---------- search ---------- */
const KIND_LABEL = { g: t('kind.g'), a: t('kind.a'), b: t('kind.b') };
function initSearch() {
  const input = document.getElementById('q');
  const out = document.getElementById('hits');
  if (!input || !out) return;
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape' && document.activeElement === input) { input.blur(); }
  });
  let t = null;
  let verseIdx = null, verseIdxLoading = false;
  async function loadVerseIndex() {
    if (verseIdx) return verseIdx;
    if (verseIdxLoading) {
      while (verseIdxLoading) await new Promise((r) => setTimeout(r, 50));
      return verseIdx || [];
    }
    verseIdxLoading = true;
    try {
      const r = await fetch(root + 'data/verse-index.json');
      verseIdx = r.ok ? await r.json() : [];
      for (const v of verseIdx) { v.rk = romanKey(v.t); v.sk = skeleton(v.t); }
    } catch { verseIdx = []; }
    verseIdxLoading = false;
    return verseIdx;
  }
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 90); });
  async function run() {
    const q = input.value.trim();
    if (q.length < 2) { out.innerHTML = ''; return; }
    const { corpus } = await loadData();
    const qDeva = /[ऀ-ॿ]/.test(q);
    const qrk = romanKey(q), qsk = skeleton(q);
    const scored = [];
    for (const c of corpus) {
      let s = -1;
      if (qDeva && c.keys.raw.includes(q)) s = c.keys.raw.indexOf(q) === 0 ? 0 : 1;
      else if (qrk && c.keys.rk.includes(qrk)) s = c.keys.rk.indexOf(qrk) === 0 ? 0 : 1;
      else if (qsk.length > 2 && c.keys.sk.includes(qsk)) s = 2;
      if (s >= 0) scored.push([s, c]);
      if (scored.length > 400) break;
    }
    scored.sort((x, y) => x[0] - y[0]);
    let html = scored.slice(0, 10).map(([, c]) => `
      <a class="hit" href="${c.href}">
        <span class="t ${c.kind}">${KIND_LABEL[c.kind]}</span>
        <b>${esc(c.label)}</b>${c.sub ? ' — ' + esc(trim(c.sub, 60)) : ''}
        <span class="d num">${esc(deva(c.d))}</span>
      </a>`).join('');
    /* गाथा-खोज: match inside full texts (lazy index) */
    if (q.length >= 3) {
      const vi = await loadVerseIndex();
      if (input.value.trim() !== q) return;   // stale
      if (vi && vi.length) {
        const qDeva2 = /[ऀ-ॿ]/.test(q);
        const qrk2 = romanKey(q), qsk2 = skeleton(q);
        const vHits = [];
        for (const v of vi) {
          if (qDeva2 ? v.t.includes(q) : (qrk2 && v.rk.includes(qrk2)) || (qsk2.length > 3 && v.sk.includes(qsk2))) {
            vHits.push(v);
            if (vHits.length >= 8) break;
          }
        }
        if (vHits.length) {
          html += vHits.map((v) => `
      <a class="hit" href="${root}granth/${v.s}/paath/#v${v.v}">
        <span class="t g">पाठ</span>
        <b>${esc(v.n)}</b> ${esc(deva(v.v))} — ${esc(trim(v.t, 64))}
      </a>`).join('');
        }
      }
    }
    out.innerHTML = html || `<div class="hit"><span class="t b">∅</span> ${t('ui.no_results')}</div>`;
  }
}

/* ---------- helpers ---------- */
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function trim(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function deva(s) { return devaNum(String(s ?? '')); }
const CENT_NAME = {
  hi: { 'ई.पू.': 'ईसवी पूर्व', '?': 'काल अनिश्चित', f: (s) => deva(s) + 'वीं शताब्दी ई.' },
  en: { 'ई.पू.': 'Before CE', '?': 'undated', f: (s) => { const n = +s, o = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (o[(v - 20) % 10] || o[v] || o[0]) + ' century CE'; } },
  sa: { 'ई.पू.': 'ईसापूर्वम्', '?': 'अज्ञातकालः', f: (s) => 'शतकम् ' + deva(s) },
  pra: { 'ई.पू.': 'ईसापुव्वं', '?': 'अण्णायकालो', f: (s) => 'सयं ' + deva(s) },
};
function centLabel(sec) {
  const L = CENT_NAME[lang] || CENT_NAME.hi;
  return L[sec] || L.f(sec);
}
function firstYear(period) {
  const m = String(period || '').match(/(\d{1,4})/);
  return m ? +m[1] : null;
}
function centuryOf(entry) {
  if (entry.centurySection) return entry.centurySection;
  const m = String(entry.century || '').match(/(\d{1,2})/);
  if (m) return m[1];
  const p = String(entry.period || '');
  const sh = p.match(/ई\.?\s*श\.?\s*(\d{1,2})(?!\d)/); // "ई.श. 7–8" = centuries, not years
  if (sh) return sh[1];
  const y = firstYear(p);
  if (y) return String(Math.floor((y - 1) / 100) + 1);
  return '?';
}
function guruHtml(data, guru) {
  if (!guru) return '';
  const id = data.guruIndex.get(nameKey(guru));
  return id ? `गुरु — <a href="#a-${id}" data-flash="a-${id}">${esc(guru)}</a>` : `गुरु — ${esc(guru)}`;
}
function initFlash() {
  function flash() {
    const id = location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('flash');
    el.scrollIntoView({ block: 'center' });
    setTimeout(() => el.classList.remove('flash'), 1600);
  }
  addEventListener('hashchange', flash);
  setTimeout(flash, 80);
}

/* ---------- page: home ---------- */
async function renderHome() {
  const mount = document.getElementById('today');
  const data = await loadData();
  if (mount && data.granths.length) {
    const d = new Date();
    const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
    const g = data.granths[seed % data.granths.length];
    const df = new Intl.DateTimeFormat('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    mount.href = root + 'granth/' + (g.slug || slugify(g.name)) + '/';
    mount.innerHTML = `
      <div class="dnum inlay num">${deva(g.id)}</div>
      <div>
        <p class="lat dv" style="margin:0 0 4px">${t('ui.today')} · ${esc(deva(df))} · ${t('ui.daily')}</p>
        <div class="tn carve">${esc(g.name)}</div>
        <div class="tm num"><b>${esc(g.author)}</b> · ${esc(deva(g.century || ''))}</div>
      </div>`;
  }
  const strip = document.getElementById('paathStrip');
  const list = document.getElementById('paathList');
  if (strip && list) {
    const withText = data.granths.filter((g) => g.hasText);
    if (withText.length) {
      strip.hidden = false;
      list.innerHTML = withText.map((g) =>
        `<a class="chip" href="${root}granth/${g.slug || slugify(g.name)}/paath/">${esc(g.name)} · पाठ</a>`).join('');
    }
  }
  const stats = document.getElementById('stats');
  if (stats && data.granths.length) {
    stats.querySelectorAll('[data-stat]').forEach((el) => {
      const k = el.getAttribute('data-stat');
      el.textContent = deva(data[k]?.length ?? '—');
    });
  }
}

/* ---------- page: granth catalog ---------- */
async function renderGranths() {
  const mount = document.getElementById('slabs');
  if (!mount) return;
  const data = await loadData();
  const filters = document.getElementById('centFilters');
  let cent = '';
  const cents = [...new Set(data.granths.map((g) => centuryOf(g)))]
    .sort((a, b) => (a === '?') - (b === '?') || (+a) - (+b));
  if (filters) {
    filters.innerHTML = `<button class="chip on" data-c="">${t('ui.all')}</button>` +
      cents.map((c) => `<button class="chip" data-c="${esc(c)}">${esc(deva(c))}</button>`).join('');
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-c]');
      if (!b) return;
      cent = b.getAttribute('data-c');
      filters.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
      draw();
    });
  }
  function draw() {
    const list = data.granths.filter((g) => !cent || centuryOf(g) === cent);
    mount.innerHTML = list.map((g) => `
      <a class="slab" href="${root}granth/${g.slug || slugify(g.name)}/">
        <span class="vein"></span>
        <span class="serial inlay num">अभिलेख ${deva(g.id)} / ${deva(data.granths.length)}${g.hasText ? ' <span class="tag">पाठ ✓</span>' : ''}</span>
        <span class="gname carve">${esc(g.name)}</span>
        <span class="foot"><span class="kum-mark"></span><span class="a">${esc(g.author)}</span><span class="e num">${esc(deva(g.century || ''))}</span></span>
      </a>`).join('') || `<p class="loading">डेटा उपलब्ध नहीं — data/granths-90.json अनुपस्थित।</p>`;
  }
  draw();
}

/* ---------- shared ledger rendering ---------- */
function ledgerRow(data, e, kind) {
  const works = e.works || e.guruOrType || '';
  const warn = e.uncertain ? ` <span class="warn" title="मूल छायाचित्र में यह पंक्ति अस्पष्ट है">⚠</span>` : '';
  return `
    <div class="row" id="${kind}-${e.id}">
      <span class="yr num">${esc(deva(e.period || ''))}</span>
      <span class="who">${esc(e.name)}${warn}</span>
      <span class="guru">${kind === 'a' ? guruHtml(data, e.guru) : esc(e.guruOrType || '')}</span>
      <span class="wk">${esc(kind === 'a' ? (e.works || '') : (e.works || ''))}</span>
    </div>`;
}
function granthRow(data, g) {
  return `
    <div class="row granth">
      <span class="yr num">${esc(deva(g.century || ''))}</span>
      <span class="who"><a class="inlay" style="text-decoration:none" href="${root}granth/${g.slug || slugify(g.name)}/">${esc(g.name)}</a> <span class="tag">ग्रन्थ</span></span>
      <span class="guru">${esc(g.author)}</span>
      <span class="wk num">अभिलेख ${deva(g.id)}/${deva(data.granths.length)}</span>
    </div>`;
}

/* ---------- page: acharya registry / काल-स्तर ---------- */
async function renderStrata({ withGranths }) {
  const mount = document.getElementById('strata');
  if (!mount) return;
  const data = await loadData();
  if (!data.acharyas.length) { mount.innerHTML = `<p class="loading">डेटा उपलब्ध नहीं — data/acharyas-420.json अनुपस्थित।</p>`; return; }
  const order = ['ई.पू.', ...Array.from({ length: 20 }, (_, i) => String(i + 1))];
  const bySec = new Map(order.map((s) => [s, []]));
  for (const a of data.acharyas) {
    const s = String(a.centurySection || '?');
    if (!bySec.has(s)) bySec.set(s, []);
    bySec.get(s).push({ kind: 'a', e: a });
  }
  if (withGranths) {
    for (const g of data.granths) {
      const s = centuryOf(g);
      if (!bySec.has(s)) bySec.set(s, []);
      bySec.get(s).push({ kind: 'g', e: g });
    }
    for (const b of data.bhattarak) {
      const s = centuryOf(b);
      if (!bySec.has(s)) bySec.set(s, []);
      bySec.get(s).push({ kind: 'b', e: b });
    }
  }
  let html = '<div class="vein"></div>';
  const scrub = [];
  for (const [sec, items] of bySec) {
    if (!items.length) continue;
    scrub.push(sec);
    html += `
      <div class="stratum" id="cent-${esc(sec)}">
        <div class="age"><span class="cnum carve num">${esc(sec === 'ई.पू.' ? 'ई.पू.' : deva(String(sec).padStart(2, '0')))}</span><span class="clab">${esc(centLabel(sec))}</span></div>
        <div class="rows">
          ${items.map((it) => it.kind === 'g' ? granthRow(data, it.e) : ledgerRow(data, it.e, it.kind)).join('')}
        </div>
      </div>`;
  }
  mount.innerHTML = html;
  const sc = document.getElementById('scrub');
  if (sc) {
    sc.innerHTML = `<span class="lat dv">${t('ui.century_jump')}</span>` + scrub.map((s) =>
      `<button data-s="cent-${esc(s)}">${esc(s === 'ई.पू.' ? 'ई.पू.' : deva(s))}</button>`).join('');
    sc.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-s]');
      if (!b) return;
      document.getElementById(b.getAttribute('data-s'))?.scrollIntoView({ block: 'start' });
      sc.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    });
  }
}

/* ---------- page: bhattarak ---------- */
const LANGS = ['हिन्दी', 'मराठी', 'कन्नड़', 'अपभ्रंश', 'तमिल', 'संस्कृत'];
async function renderBhattarak() {
  const mount = document.getElementById('ledger');
  if (!mount) return;
  const data = await loadData();
  if (!data.bhattarak.length) { mount.innerHTML = `<p class="loading">डेटा उपलब्ध नहीं — data/bhattarak-172.json अनुपस्थित।</p>`; return; }
  const langOf = (b) => LANGS.find((l) => (b.guruOrType || '').includes(l) || (b.works || '').includes(l)) || '';
  let lang = '';
  const filters = document.getElementById('langFilters');
  if (filters) {
    filters.innerHTML = `<button class="chip on" data-l="">${t('ui.all')}</button>` +
      LANGS.map((l) => `<button class="chip" data-l="${l}">${l}</button>`).join('');
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-l]');
      if (!b) return;
      lang = b.getAttribute('data-l');
      filters.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
      draw();
    });
  }
  function draw() {
    const list = data.bhattarak.filter((b) => !lang || langOf(b) === lang);
    mount.innerHTML = `<div class="rows">${list.map((b) => ledgerRow(data, b, 'b')).join('')}</div>`;
  }
  draw();
  const heat = document.getElementById('heat');
  if (heat) {
    const cents = Array.from({ length: 14 }, (_, i) => i + 7); // 7..20
    const langs = LANGS.filter((l) => data.bhattarak.some((b) => langOf(b) === l));
    const count = (l, c) => data.bhattarak.filter((b) => langOf(b) === l && +centuryOf(b) === c).length;
    const cls = (n) => (n <= 0 ? '' : n <= 2 ? 'h1' : n <= 5 ? 'h2' : n <= 10 ? 'h3' : 'h4');
    heat.innerHTML = `<table>
      <tr><th scope="row"><span class="visually-hidden">भाषा</span></th>${cents.map((c) => `<th class="num" scope="col">${deva(c)}</th>`).join('')}</tr>
      ${langs.map((l) => `<tr><th scope="row">${l}</th>${cents.map((c) => { const n = count(l, c); return `<td class="${cls(n)}" title="${l} · ${deva(c)}वीं शती · ${deva(n)}"></td>`; }).join('')}</tr>`).join('')}
    </table>`;
  }
}

/* ---------- global bookmarks drawer & resume reading ---------- */
function initBookmarksDrawer() {
  const tools = document.querySelector('.site-head .tools');
  if (tools && !tools.querySelector('#bmHeadBtn')) {
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.id = 'bmHeadBtn';
    btn.type = 'button';
    btn.title = 'सहेजे गए बुकमार्क / Saved Bookmarks';
    btn.innerHTML = '🔖';
    tools.insertBefore(btn, tools.firstChild);
    btn.addEventListener('click', openDrawer);
  }

  let scrim = document.getElementById('bmScrim');
  let drawer = document.getElementById('bmDrawer');
  if (!drawer) {
    scrim = document.createElement('div');
    scrim.className = 'bm-drawer-scrim';
    scrim.id = 'bmScrim';
    scrim.hidden = true;
    document.body.appendChild(scrim);

    drawer = document.createElement('div');
    drawer.className = 'bm-drawer';
    drawer.id = 'bmDrawer';
    drawer.hidden = true;
    drawer.innerHTML = `
      <div class="bm-head">
        <b>🔖 सहेजे गए बुकमार्क</b>
        <button class="icon-btn" id="bmClose" type="button">✕</button>
      </div>
      <div class="bm-body" id="bmList"></div>`;
    document.body.appendChild(drawer);

    drawer.querySelector('#bmClose').addEventListener('click', closeDrawer);
    scrim.addEventListener('click', closeDrawer);
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });
  }

  function openDrawer() {
    renderList();
    scrim.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('show'));
  }
  function closeDrawer() {
    drawer.classList.remove('show');
    scrim.hidden = true;
    setTimeout(() => { drawer.hidden = true; }, 240);
  }
  window.sdOpenBookmarks = openDrawer;

  function renderList() {
    const listEl = drawer.querySelector('#bmList');
    let bookmarks = [];
    try { bookmarks = JSON.parse(localStorage.getItem('sd-bookmarks') || '[]'); } catch {}
    if (!bookmarks.length) {
      listEl.innerHTML = `<div class="bm-empty">
        <p>कोई बुकमार्क सहेजा नहीं गया है।</p>
        <small>पाठ पढ़ते समय <b>🔖 बुकमार्क</b> बटन दबाकर किसी भी श्लोक या गाथा को यहाँ सहेजें।</small>
      </div>`;
      return;
    }

    /* group bookmarks by granth */
    const grouped = new Map();
    for (const bm of bookmarks) {
      const g = bm.granthName || bm.slug || 'ग्रन्थ';
      if (!grouped.has(g)) grouped.set(g, []);
      grouped.get(g).push(bm);
    }

    let html = '';
    for (const [gName, items] of grouped) {
      html += `<div class="bm-group"><h3>${esc(gName)}</h3>`;
      for (const bm of items) {
        const href = `${root}granth/${bm.slug}/paath/#v${bm.n}`;
        const title = bm.n ? `गाथा/पद्य ${devaNum(bm.n)}` : 'सहेजा गया पाठ';
        html += `
          <div class="bm-card">
            <div class="bm-card-head">
              <b>${esc(title)}</b>
              <button class="bm-del" data-id="${esc(bm.id)}" type="button" title="हटाएं">🗑</button>
            </div>
            <div class="bm-card-txt">${esc(trim(bm.text || '', 110))}</div>
            <a class="btn ghost sm" href="${esc(href)}">👉 पढ़ें</a>
          </div>`;
      }
      html += `</div>`;
    }
    listEl.innerHTML = html;

    listEl.querySelectorAll('.bm-del').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        bookmarks = bookmarks.filter((x) => (typeof x === 'string' ? x !== id : x.id !== id));
        localStorage.setItem('sd-bookmarks', JSON.stringify(bookmarks));
        renderList();
      });
    });
  }
}

/* ---------- granth page resume reading button ---------- */
function initGranthResume() {
  if (page !== 'granth') return;
  const slug = location.pathname.split('/').filter(Boolean).slice(-1)[0] || '';
  if (!slug) return;
  try {
    const lastRead = JSON.parse(localStorage.getItem('sd-last-read') || '{}');
    const item = lastRead[slug];
    if (item && item.n) {
      const btns = document.querySelector('.gpage .btns') || document.querySelector('.gpage');
      if (btns) {
        const rBtn = document.createElement('a');
        rBtn.className = 'btn kum';
        rBtn.style.marginRight = '10px';
        rBtn.href = `paath/#v${item.n}`;
        rBtn.innerHTML = `▶ जहाँ छोड़ा था वहीं से जारी रखें (${esc(item.title)})`;
        btns.insertBefore(rBtn, btns.firstChild);
      }
    }
  } catch {}
}

/* ---------- homepage resume card ---------- */
function initHomeResume() {
  if (page !== 'home') return;
  try {
    const lastRead = JSON.parse(localStorage.getItem('sd-last-read') || '{}');
    const entries = Object.values(lastRead).sort((a, b) => (b.time || 0) - (a.time || 0));
    if (!entries.length) return;
    const latest = entries[0];
    const statsEl = document.getElementById('stats');
    if (statsEl && statsEl.parentNode) {
      const href = `${root}granth/${latest.slug}/paath/#v${latest.n}`;
      const card = document.createElement('div');
      card.className = 'home-resume-strip';
      card.innerHTML = `
        <span>📖 हाल ही में पढ़ा गया: <b>${esc(latest.granthName)}</b> — ${esc(latest.title)}</span>
        <a class="btn kum sm" href="${esc(href)}">जारी रखें ▶</a>`;
      statsEl.parentNode.insertBefore(card, statsEl.nextSibling);
    }
  } catch {}
}

/* ---------- boot ---------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register(root + 'sw.js', { scope: root || './' }).catch(() => {});
  // when a new worker takes control (after a deploy), reload once so the page
  // isn't left "one deploy behind". Guard prevents reload loops.
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}
initTheme();
initSearch();
initFlash();
initBookmarksDrawer();
initGranthResume();
if (page === 'home') { renderHome(); initHomeResume(); }
if (page === 'kaal') renderStrata({ withGranths: true });
if (page === 'acharya') renderStrata({ withGranths: false });
if (page === 'granths') renderGranths();
if (page === 'bhattarak') renderBhattarak();
