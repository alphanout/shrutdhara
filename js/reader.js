/* श्रुतधारा reader — पाठ pages: reading surface, zoom, progress, and सुनें (TTS)
   Medium-style essentials: comfortable measure, adjustable type, listen-along
   with per-verse highlight. All client-side (Web Speech API), no server. */

const main = document.querySelector('.paath');
if (main) {
  /* ---------- prefs ---------- */
  const P = {
    get: (k, d) => localStorage.getItem(k) ?? d,
    set: (k, v) => localStorage.setItem(k, v),
  };
  const SIZES = ['fs0', 'fs1', 'fs2', 'fs3', 'fs4'];
  let size = Math.min(4, Math.max(0, +P.get('sd-reader-size', 1)));
  let surface = P.get('sd-reader-surface', 'stone'); // default follows the site theme (incl. dark); sepia/white are opt-in
  const applySize = () => { SIZES.forEach((c) => main.classList.remove(c)); main.classList.add(SIZES[size]); };
  const applySurface = () => { document.body.setAttribute('data-surface', surface); };
  applySize(); applySurface();

  /* ---------- toolbar ---------- */
  const bar = document.createElement('div');
  bar.className = 'reader-bar';
  bar.innerHTML = `
    <button class="icon-btn toc-toggle" id="rToc" type="button" title="विषय-सूची / Contents" aria-controls="toc" aria-expanded="false">☰</button>
    <button class="icon-btn" id="rBookmarks" type="button" title="सहेजे गए बुकमार्क / Saved Bookmarks">🔖 बुकमार्क</button>
    <button class="icon-btn" id="rPlay" type="button" title="सुनें / Listen">▶ सुनें</button>
    <select class="icon-btn" id="rRate" title="गति / Speed">
      <option value="0.5">०.५×</option><option value="0.6">०.६×</option><option value="0.7">०.७×</option>
      <option value="0.8">०.८×</option><option value="0.9">०.९×</option><option value="1">१×</option>
      <option value="1.2">१.२×</option>
    </select>
    <select class="icon-btn" id="rVoice" title="स्वर-स्रोत / Voice" hidden>
      <option value="ai">🎙 AI-पाठ</option>
      <option value="tts">ब्राउज़र-स्वर</option>
    </select>
    <span class="rb-sep"></span>
    <button class="icon-btn" id="rMinus" type="button" title="अक्षर छोटे / Smaller">A−</button>
    <button class="icon-btn" id="rPlus" type="button" title="अक्षर बड़े / Larger">A+</button>
    <span class="rb-sep"></span>
    <button class="icon-btn rs" data-s="stone" type="button" title="पत्थर / Stone">◆</button>
    <button class="icon-btn rs" data-s="sepia" type="button" title="कागज़ / Sepia">❖</button>
    <button class="icon-btn rs" data-s="white" type="button" title="श्वेत / White">◇</button>`;
  const readerWrap = document.querySelector('.reader-wrap');
  if (readerWrap) readerWrap.parentNode.insertBefore(bar, readerWrap);
  else main.parentNode.insertBefore(bar, main);
  const markSurface = () => bar.querySelectorAll('.rs').forEach((b) => b.classList.toggle('on', b.dataset.s === surface));
  markSurface();

  bar.querySelector('#rBookmarks')?.addEventListener('click', () => {
    if (window.sdOpenBookmarks) window.sdOpenBookmarks();
  });

  bar.querySelector('#rMinus').addEventListener('click', () => { size = Math.max(0, size - 1); P.set('sd-reader-size', size); applySize(); });
  bar.querySelector('#rPlus').addEventListener('click', () => { size = Math.min(4, size + 1); P.set('sd-reader-size', size); applySize(); });
  bar.querySelectorAll('.rs').forEach((b) => b.addEventListener('click', () => {
    surface = b.dataset.s; P.set('sd-reader-surface', surface); applySurface(); markSurface();
  }));

  /* ---------- विषय-सूची: drawer + scroll-spy + verse grid ---------- */
  const toc = document.getElementById('toc');
  const tocBtn = bar.querySelector('#rToc');
  const isNarrow = () => matchMedia('(max-width: 980px)').matches;
  const syncTocInert = () => {
    if (toc && 'inert' in HTMLElement.prototype) {
      toc.inert = isNarrow() && !document.body.classList.contains('toc-open');
    }
  };
  tocBtn.addEventListener('click', () => {
    const open = document.body.classList.toggle('toc-open');
    tocBtn.setAttribute('aria-expanded', String(open));
    syncTocInert();
    if (open) toc?.querySelector('a, .vg-btn')?.focus();
  });
  syncTocInert();
  addEventListener('resize', syncTocInert);
  if (toc) {
    toc.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('.vg-btn')) {
        document.body.classList.remove('toc-open');
        tocBtn.setAttribute('aria-expanded', 'false');
        syncTocInert();
      }
      const vb = e.target.closest('.vg-btn');
      if (vb) {
        const vg = document.getElementById('v' + vb.dataset.v);
        if (vg) { vg.scrollIntoView({ block: 'center' }); openPanel(vg); }
      }
    });
    const links = [...toc.querySelectorAll('.toc-secs a')];
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    if (links.length && 'IntersectionObserver' in window) {
      let curLink = null;
      const io = new IntersectionObserver((es) => {
        for (const e of es) {
          if (e.isIntersecting) {
            if (curLink) curLink.classList.remove('cur');
            curLink = byId.get(e.target.id) || null;
            if (curLink) curLink.classList.add('cur');
          }
        }
      }, { rootMargin: '-15% 0px -75% 0px' });
      main.querySelectorAll('h2[id]').forEach((h) => io.observe(h));
    }
  }

  /* ---------- verse detail panel ---------- */
  const panel = document.getElementById('vpanel');
  const scrim = document.getElementById('vpanelScrim');
  let translitFn = null, openVg = null, curMoolText = '';
  const devaFn = (x) => String(x).replace(/[0-9]/g, (d) => '०१२३४५६७८९'[+d]);
  import(new URL('./translit.js', import.meta.url)).then((m) => { translitFn = m.translit; });
  const groups = [...main.querySelectorAll('.vgroup')];

  /* ---------- scroll hash-sync observer ---------- */
  if ('IntersectionObserver' in window && groups.length) {
    const verseObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length) {
        const target = visible[0].target;
        const n = target.dataset.n;
        if (n && location.hash !== '#v' + n) {
          history.replaceState(null, '', '#v' + n);
          saveLastReadPosition(n);
        }
      }
    }, { rootMargin: '-20% 0px -60% 0px' });
    groups.forEach((vg) => verseObserver.observe(vg));
  }

  /* save last read position */
  function saveLastReadPosition(n) {
    if (!n) return;
    const slug = location.pathname.split('/').filter(Boolean).slice(-2, -1)[0] || '';
    if (!slug) return;
    const gName = document.querySelector('.phead h1')?.textContent?.trim() || '';
    const isProse = main.getAttribute('data-prose') === 'true';
    const lang = main.getAttribute('data-lang') || '';
    const isGatha = lang.includes('प्राकृत') || /गाथा/i.test(lang) || /समयसार|नियमसार|प्रवचनसार|पंचास्तिकाय|अष्टपाहुड/i.test(gName);
    const unitLabel = isProse ? 'खण्ड' : (isGatha ? 'गाथा' : 'पद्य');
    const title = `${unitLabel} ${devaFn(n)}`;
    let lastRead = {};
    try { lastRead = JSON.parse(localStorage.getItem('sd-last-read') || '{}'); } catch {}
    lastRead[slug] = { slug, n, title, granthName: gName, time: Date.now() };
    localStorage.setItem('sd-last-read', JSON.stringify(lastRead));
  }

  /* helper: find currently visible verse index in viewport */
  function findVisibleVerseIndex() {
    let topIdx = 0;
    for (let i = 0; i < groups.length; i++) {
      const rect = groups[i].getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= 0) {
        topIdx = i;
      }
    }
    return topIdx;
  }

  /* ---------- initial bookmark highlight ---------- */
  try {
    const slug = location.pathname.split('/').filter(Boolean).slice(-2, -1)[0] || '';
    const bookmarks = JSON.parse(localStorage.getItem('sd-bookmarks') || '[]');
    const bookmarkedSet = new Set(bookmarks.map((b) => (typeof b === 'string' ? b : b.id)));
    groups.forEach((vg) => {
      if (bookmarkedSet.has(`${slug}#v${vg.dataset.n}`)) {
        vg.classList.add('is-bookmarked');
      }
    });
  } catch {}

  /* inject prev/next arrows into the panel head, once */
  const vpHead = panel && panel.querySelector('.vp-head');
  if (vpHead && !vpHead.querySelector('.vp-nav')) {
    const nav = document.createElement('div');
    nav.className = 'vp-nav';
    nav.innerHTML = `<button class="icon-btn" id="vpPrev" type="button" title="पिछला पद्य" aria-label="पिछला">‹</button>` +
                    `<button class="icon-btn" id="vpNext" type="button" title="अगला पद्य" aria-label="अगला">›</button>`;
    vpHead.insertBefore(nav, vpHead.firstChild);
  }

  /* inject quote / bookmark buttons into panel actions if missing */
  const vpActions = panel && panel.querySelector('.vp-actions');
  if (vpActions && !vpActions.querySelector('#vpQuote')) {
    const qBtn = document.createElement('button');
    qBtn.className = 'btn ghost';
    qBtn.id = 'vpQuote';
    qBtn.type = 'button';
    qBtn.textContent = '❝ उद्धरण';
    vpActions.insertBefore(qBtn, document.getElementById('vpLink'));
  }
  if (vpActions && !vpActions.querySelector('#vpBookmark')) {
    const bBtn = document.createElement('button');
    bBtn.className = 'btn ghost';
    bBtn.id = 'vpBookmark';
    bBtn.type = 'button';
    bBtn.textContent = '🔖 बुकमार्क';
    vpActions.insertBefore(bBtn, document.getElementById('vpLink'));
  }

  const LBL = { arth: 'हिन्दी अर्थ', chhaya: 'संस्कृत छाया', en: 'English' };
  function openPanel(vg) {
    if (!panel) return;
    if (openVg) openVg.classList.remove('open');
    openVg = vg;
    vg.classList.add('open');
    const n = vg.dataset.n;
    const idx = groups.indexOf(vg);
    const prevBtn = document.getElementById('vpPrev');
    const nextBtn = document.getElementById('vpNext');
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx < 0 || idx >= groups.length - 1;
    const verseEl = vg.querySelector('.verse');
    if (!verseEl) return;
    const mool = verseEl.innerHTML;
    const moolText = verseEl.textContent;
    curMoolText = moolText.replace(/\s+/g, ' ').trim();

    const lang = main.getAttribute('data-lang') || '';
    const gName = document.querySelector('.phead h1')?.textContent?.trim() || '';
    const isProse = main.getAttribute('data-prose') === 'true';
    const isGatha = lang.includes('प्राकृत') || /गाथा/i.test(lang) || /समयसार|नियमसार|प्रवचनसार|पंचास्तिकाय|अष्टपाहुड/i.test(gName);
    const unitLabel = isProse ? 'खण्ड' : (isGatha ? 'गाथा' : 'पद्य');

    document.getElementById('vpTitle').textContent = unitLabel + ' ' + devaFn(n);
    let html = `<div class="vp-sec"><span class="lat dv">मूल <button class="vp-copy" id="vpCopyMool" type="button" title="मूल कॉपी करें">⧉</button></span><div class="vp-mool">${mool}</div></div>`;
    if (translitFn) {
      html += `<div class="vp-sec"><span class="lat">Roman</span><div class="vp-lipi">${translitFn(moolText).replace(/\s+/g, ' ').trim()}</div></div>`;
    }
    for (const [cls, label] of Object.entries(LBL)) {
      const el = vg.querySelector('.vlayer.' + cls);
      if (el) html += `<div class="vp-sec"><span class="lat dv">${label}</span><div class="vp-txt">${el.innerHTML}</div></div>`;
    }
    document.getElementById('vpBody').innerHTML = html;
    const copyBtn = document.getElementById('vpCopyMool');
    if (copyBtn) copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(curMoolText); copyBtn.textContent = '✓'; setTimeout(() => { copyBtn.textContent = '⧉'; }, 1200); } catch {}
    });

    /* update bookmark button status */
    const slug = location.pathname.split('/').filter(Boolean).slice(-2, -1)[0] || '';
    const bookmarkId = `${slug}#v${n}`;
    const bmBtn = document.getElementById('vpBookmark');
    const _t = window.sdT || ((k) => k);
    if (bmBtn) {
      let bookmarks = [];
      try { bookmarks = JSON.parse(localStorage.getItem('sd-bookmarks') || '[]'); } catch {}
      const isBm = bookmarks.some((b) => (typeof b === 'string' ? b === bookmarkId : b.id === bookmarkId));
      bmBtn.classList.toggle('on', isBm);
      bmBtn.textContent = isBm ? _t('ui.bookmarked') : _t('ui.bookmark');
    }

    /* update vpListen button label */
    const listenBtn = document.getElementById('vpListen');
    if (listenBtn) {
      const isCurVersePlaying = playing && cur === (idx >= 0 ? idx : +n - 1);
      listenBtn.textContent = isCurVersePlaying ? _t('ui.stop') : _t('ui.listen_verse');
    }

    panel.hidden = false; scrim.hidden = false;
    requestAnimationFrame(() => { panel.classList.add('show'); document.getElementById('vpClose')?.focus(); });
    history.replaceState(null, '', '#v' + n);
    panel.dataset.n = n;
    saveLastReadPosition(n);
  }
  // keep Tab focus inside the open dialog
  panel?.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || panel.hidden) return;
    const f = [...panel.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  function goRel(delta) {
    if (!openVg) return;
    const i = groups.indexOf(openVg) + delta;
    if (i < 0 || i >= groups.length) return;
    groups[i].scrollIntoView({ block: 'center' });
    openPanel(groups[i]);
  }
  function closePanel() {
    if (!panel || panel.hidden) return;
    panel.classList.remove('show');
    scrim.hidden = true;
    if (openVg) { openVg.classList.remove('open'); openVg = null; }
    setTimeout(() => { panel.hidden = true; }, 260);
  }
  main.addEventListener('click', (e) => {
    const vg = e.target.closest('.vgroup');
    if (vg) openPanel(vg);
  });
  main.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') && e.target.classList?.contains('vgroup')) {
      e.preventDefault();
      openPanel(e.target);
    }
  });
  document.getElementById('vpClose')?.addEventListener('click', closePanel);
  document.getElementById('vpPrev')?.addEventListener('click', () => goRel(-1));
  document.getElementById('vpNext')?.addEventListener('click', () => goRel(1));
  scrim?.addEventListener('click', closePanel);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePanel(); document.body.classList.remove('toc-open'); tocBtn.setAttribute('aria-expanded', 'false'); syncTocInert(); }
    if (panel && !panel.hidden) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goRel(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goRel(-1); }
    }
  });

  /* universal clipboard helper with fallback for HTTP / non-secure contexts */
  async function copyToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {}
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-999999px';
      ta.style.top = '-999999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* Quote button: formatted multiline quote with citation */
  const handleQuoteClick = async () => {
    const _t = window.sdT || ((k) => k);
    const n = panel?.dataset.n || '';
    if (!n) return;
    const targetVg = openVg || document.getElementById('v' + n);
    const moolEl = targetVg?.querySelector('.verse');
    let moolFormatted = '';
    if (moolEl) {
      const html = moolEl.innerHTML || '';
      const textWithBreaks = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '');
      const lines = textWithBreaks.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      moolFormatted = lines.join('\n');
    }
    if (!moolFormatted) moolFormatted = curMoolText;

    const gName = document.querySelector('.phead h1')?.textContent?.trim() || '';
    const lang = main.getAttribute('data-lang') || '';
    const isProse = main.getAttribute('data-prose') === 'true';
    const isGatha = lang.includes('प्राकृत') || /गाथा/i.test(lang) || /समयसार|नियमसार|प्रवचनसार|पंचास्तिकाय|अष्टपाहुड/i.test(gName);
    const unitLabel = isProse ? 'खण्ड' : (isGatha ? 'गाथा' : 'पद्य');
    const citeNum = devaFn(n);
    const url = location.origin + location.pathname + '#v' + n;
    const citation = `"${moolFormatted}"\n— ${gName}, ${unitLabel} ${citeNum}\n${url}`;

    const ok = await copyToClipboard(citation);
    const qBtn = document.getElementById('vpQuote');
    if (qBtn) {
      qBtn.textContent = ok ? _t('ui.quote_copied') : '✓ कॉपी हुई';
      setTimeout(() => { qBtn.textContent = _t('ui.quote'); }, 1400);
    }
  };

  document.getElementById('vpQuote')?.addEventListener('click', handleQuoteClick);

  document.getElementById('vpBookmark')?.addEventListener('click', () => {
    const _t = window.sdT || ((k) => k);
    const n = panel?.dataset.n || '';
    if (!n) return;
    const slug = location.pathname.split('/').filter(Boolean).slice(-2, -1)[0] || '';
    const bookmarkId = `${slug}#v${n}`;
    const gName = document.querySelector('.phead h1')?.textContent?.trim() || '';
    let bookmarks = [];
    try { bookmarks = JSON.parse(localStorage.getItem('sd-bookmarks') || '[]'); } catch {}
    const idx = bookmarks.findIndex((b) => (typeof b === 'string' ? b === bookmarkId : b.id === bookmarkId));
    const bmBtn = document.getElementById('vpBookmark');
    const targetVg = document.getElementById('v' + n);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      if (bmBtn) { bmBtn.classList.remove('on'); bmBtn.textContent = _t('ui.bookmark'); }
      if (targetVg) targetVg.classList.remove('is-bookmarked');
    } else {
      const url = `${location.pathname}#v${n}`;
      bookmarks.push({ id: bookmarkId, slug, n, granthName: gName, text: curMoolText, url, createdAt: Date.now() });
      if (bmBtn) { bmBtn.classList.add('on'); bmBtn.textContent = _t('ui.bookmarked'); }
      if (targetVg) targetVg.classList.add('is-bookmarked');
    }
    localStorage.setItem('sd-bookmarks', JSON.stringify(bookmarks));
  });

  document.getElementById('vpLink')?.addEventListener('click', async () => {
    const url = location.origin + location.pathname + '#v' + (panel.dataset.n || '');
    const ok = await copyToClipboard(url);
    const lBtn = document.getElementById('vpLink');
    if (lBtn) {
      lBtn.textContent = ok ? '✓ कॉपी हुई' : 'कड़ी कॉपी हुई';
      setTimeout(() => { lBtn.textContent = 'कड़ी कॉपी करें'; }, 1400);
    }
  });

  /* ---------- Resume reading banner on paath page ---------- */
  const slug = location.pathname.split('/').filter(Boolean).slice(-2, -1)[0] || '';
  if (slug && !location.hash.startsWith('#v')) {
    try {
      const lastRead = JSON.parse(localStorage.getItem('sd-last-read') || '{}');
      const item = lastRead[slug];
      if (item && item.n && document.getElementById('v' + item.n)) {
        const toast = document.createElement('div');
        toast.className = 'resume-toast';
        toast.innerHTML = `
          <span>📖 पिछला पाठ: <b>${esc(item.title)}</b> से जारी रखें</span>
          <button class="btn kum sm" type="button" id="rtResume">जारी रखें ▶</button>
          <button class="icon-btn" type="button" id="rtClose" title="बंद करें">✕</button>`;
        document.body.appendChild(toast);
        toast.querySelector('#rtResume').addEventListener('click', () => {
          const vg = document.getElementById('v' + item.n);
          if (vg) { vg.scrollIntoView({ block: 'center' }); openPanel(vg); }
          toast.remove();
        });
        toast.querySelector('#rtClose').addEventListener('click', () => toast.remove());
      }
    } catch {}
  }

  if (location.hash.startsWith('#v')) {
    const vg = document.getElementById(location.hash.slice(1));
    if (vg) setTimeout(() => { vg.scrollIntoView({ block: 'center' }); openPanel(vg); }, 300);
  }

  /* ---------- progress bar ---------- */
  const prog = document.createElement('div');
  prog.className = 'read-progress';
  document.body.appendChild(prog);
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- सुनें (TTS) ---------- */
  const verses = [...main.querySelectorAll('.verse')];
  const playBtn = bar.querySelector('#rPlay');
  const rateSel = bar.querySelector('#rRate');
  rateSel.value = P.get('sd-rate', '0.7');
  if (!rateSel.value) rateSel.value = '0.7';
  rateSel.addEventListener('change', () => P.set('sd-rate', rateSel.value));
  const synth = window.speechSynthesis;
  let cur = -1, playing = false, singleMode = false;

  const padaChunks = (el) => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i).map((h) => {
      const d = document.createElement('div'); d.innerHTML = h; return d.textContent;
    });
    const chunks = [];
    for (const ln of lines) {
      for (const part of ln.split('।')) {
        const t = part.replace(/॥[^॥]*॥/g, ' ').replace(/[/]/g, ' ').replace(/\s+/g, ' ').trim();
        if (t) chunks.push(t);
      }
    }
    return chunks.length ? chunks : [el.textContent.replace(/\s+/g, ' ').trim()];
  };

  function pickVoice() {
    const vs = synth.getVoices();
    return vs.find((v) => /^hi(-|_)/i.test(v.lang)) || vs.find((v) => /^sa(-|_)/i.test(v.lang)) ||
           vs.find((v) => /india/i.test(v.name)) || null;
  }

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function highlight(i) {
    verses.forEach((v, j) => v.classList.toggle('playing', j === i));
    if (verses[i]) verses[i].scrollIntoView({ block: 'center', behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  const audioBase = main.getAttribute('data-audio');
  const voiceSel = bar.querySelector('#rVoice');
  if (audioBase && voiceSel) {
    voiceSel.hidden = false;
    voiceSel.value = P.get('sd-voice', 'ai');
    voiceSel.addEventListener('change', () => { P.set('sd-voice', voiceSel.value); stop(); });

    const dlBtn = document.createElement('button');
    dlBtn.className = 'icon-btn';
    dlBtn.id = 'rDlAudio';
    dlBtn.type = 'button';
    dlBtn.title = 'ऑफ़लाइन ऑडियो सहेजें';
    dlBtn.textContent = '⬇ ऑफ़लाइन ऑडियो';
    voiceSel.parentNode.insertBefore(dlBtn, voiceSel.nextSibling);

    const totalAudioFiles = verses.length;
    async function getCache() {
      if (!('caches' in window)) return null;
      const keys = await caches.keys();
      const active = keys.find((k) => k.startsWith('shrutdhara-'));
      return caches.open(active || 'shrutdhara-audio');
    }

    async function checkAudioCache() {
      const cache = await getCache();
      if (!cache || !totalAudioFiles) return;
      try {
        let cachedCount = 0;
        for (let i = 1; i <= totalAudioFiles; i++) {
          const url = new URL(audioBase + i + '.mp3', location.href).href;
          const match = await cache.match(url);
          if (match) cachedCount++;
        }
        if (cachedCount === totalAudioFiles) {
          dlBtn.textContent = '✓ ऑफ़लाइन उपलब्ध';
          dlBtn.disabled = true;
        }
      } catch {}
    }
    checkAudioCache();

    dlBtn.addEventListener('click', async () => {
      const cache = await getCache();
      if (!cache) {
        dlBtn.textContent = 'ब्राउज़र समर्थित नहीं';
        return;
      }
      dlBtn.disabled = true;
      try {
        for (let i = 1; i <= totalAudioFiles; i++) {
          const fileUrl = audioBase + i + '.mp3';
          const reqUrl = new URL(fileUrl, location.href).href;
          try {
            const res = await fetch(fileUrl);
            if (res.ok) {
              await cache.put(reqUrl, res.clone());
              await cache.put(fileUrl, res);
            }
          } catch {}
          const pct = Math.round((i / totalAudioFiles) * 100);
          dlBtn.textContent = `सहेजा जा रहा है... ${pct}%`;
        }
        dlBtn.textContent = '✓ ऑफ़लाइन उपलब्ध';
      } catch (err) {
        dlBtn.textContent = 'त्रुटि हुई';
        dlBtn.disabled = false;
      }
    });
  }

  let player = null;
  function speakFrom(i) {
    if (i >= verses.length) { stop(); return; }
    cur = i;
    highlight(i);
    updateListenBtnLabels();
    if (audioBase && voiceSel && voiceSel.value === 'ai') {
      if (!player) player = new Audio();
      player.src = audioBase + (i + 1) + '.mp3';
      player.playbackRate = +rateSel.value;
      player.onended = () => {
        if (!playing || cur !== i) return;
        if (singleMode) { stop(); return; }
        setTimeout(() => { if (playing && cur === i) speakFrom(i + 1); }, 600);
      };
      let fellBack = false;
      const fallback = () => { if (!fellBack && playing && cur === i) { fellBack = true; speakTTS(i); } };
      player.onerror = fallback;
      player.play().catch(fallback);
      return;
    }
    speakTTS(i);
  }

  function speakTTS(i) {
    if (!synth) { stop(); return; }
    const chunks = padaChunks(verses[i]);
    const voice = pickVoice();
    let ci = 0;
    const next = () => {
      if (!playing || cur !== i) return;
      if (ci >= chunks.length) {
        if (singleMode) { stop(); return; }
        setTimeout(() => { if (playing && cur === i) speakFrom(i + 1); }, 750);
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[ci]);
      u.lang = 'hi-IN';
      if (voice) u.voice = voice;
      u.rate = +rateSel.value;
      u.pitch = ci === chunks.length - 1 ? 0.88 : 1;
      ci++;
      u.onend = () => setTimeout(next, 340);
      u.onerror = () => setTimeout(next, 120);
      synth.speak(u);
    };
    next();
  }

  function updateListenBtnLabels() {
    if (playBtn) playBtn.textContent = playing ? '⏸ रोकें' : '▶ सुनें';
    const vpListen = document.getElementById('vpListen');
    if (vpListen) vpListen.textContent = (playing && singleMode) ? '⏸ रोकें' : '▶ यह सुनें';
  }

  function start(from) {
    if (!synth) { playBtn.textContent = 'इस ब्राउज़र में उपलब्ध नहीं'; playBtn.disabled = true; return; }
    playing = true;
    updateListenBtnLabels();
    if (synth) synth.cancel();
    speakFrom(from);
  }

  function stop() {
    playing = false;
    if (synth) synth.cancel();
    if (player) { player.pause(); player.currentTime = 0; }
    updateListenBtnLabels();
    verses.forEach((v) => v.classList.remove('playing'));
  }

  playBtn.addEventListener('click', () => {
    if (playing) {
      stop();
    } else {
      singleMode = false;
      const startIdx = cur >= 0 ? cur : findVisibleVerseIndex();
      start(startIdx);
    }
  });

  document.getElementById('vpListen')?.addEventListener('click', () => {
    const n = +(panel?.dataset.n || 0);
    const targetIdx = n > 0 ? n - 1 : 0;
    if (playing && cur === targetIdx) {
      stop();
    } else {
      singleMode = true;
      start(targetIdx);
    }
  });

  rateSel.addEventListener('change', () => { if (playing) { synth.cancel(); speakFrom(cur); } });
  verses.forEach((v, i) => v.addEventListener('dblclick', () => { singleMode = false; start(i); }));
  addEventListener('pagehide', stop);
  if (synth && synth.getVoices().length === 0) synth.addEventListener?.('voiceschanged', () => {});


}
