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
    <button class="icon-btn toc-toggle" id="rToc" type="button" title="विषय-सूची / Contents">☰</button>
    <button class="icon-btn" id="rPlay" type="button" title="सुनें / Listen">▶ सुनें</button>
    <select class="icon-btn" id="rRate" title="गति / Speed">
      <option value="0.8">०.८×</option><option value="1" selected>१×</option><option value="1.25">१.२५×</option>
    </select>
    <span class="rb-sep"></span>
    <button class="icon-btn" id="rMinus" type="button" title="अक्षर छोटे / Smaller">A−</button>
    <button class="icon-btn" id="rPlus" type="button" title="अक्षर बड़े / Larger">A+</button>
    <span class="rb-sep"></span>
    <button class="icon-btn rs" data-s="stone" type="button" title="पत्थर / Stone">◆</button>
    <button class="icon-btn rs" data-s="sepia" type="button" title="कागज़ / Sepia">❖</button>
    <button class="icon-btn rs" data-s="white" type="button" title="श्वेत / White">◇</button>`;
  document.querySelector('.reader-wrap').parentNode.insertBefore(bar, document.querySelector('.reader-wrap'));
  const markSurface = () => bar.querySelectorAll('.rs').forEach((b) => b.classList.toggle('on', b.dataset.s === surface));
  markSurface();

  bar.querySelector('#rMinus').addEventListener('click', () => { size = Math.max(0, size - 1); P.set('sd-reader-size', size); applySize(); });
  bar.querySelector('#rPlus').addEventListener('click', () => { size = Math.min(4, size + 1); P.set('sd-reader-size', size); applySize(); });
  bar.querySelectorAll('.rs').forEach((b) => b.addEventListener('click', () => {
    surface = b.dataset.s; P.set('sd-reader-surface', surface); applySurface(); markSurface();
  }));

  /* ---------- विषय-सूची: drawer + scroll-spy + verse grid ---------- */
  const toc = document.getElementById('toc');
  bar.querySelector('#rToc').addEventListener('click', () => document.body.classList.toggle('toc-open'));
  if (toc) {
    toc.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('.vg-btn')) document.body.classList.remove('toc-open');
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
  let translitFn = null, openVg = null;
  const devaFn = (x) => String(x).replace(/[0-9]/g, (d) => '०१२३४५६७८९'[+d]);
  import(new URL('./translit.js', import.meta.url)).then((m) => { translitFn = m.translit; });

  const LBL = { arth: 'हिन्दी अर्थ', chhaya: 'संस्कृत छाया', en: 'English' };
  function openPanel(vg) {
    if (!panel) return;
    if (openVg) openVg.classList.remove('open');
    openVg = vg;
    vg.classList.add('open');
    const n = vg.dataset.n;
    const mool = vg.querySelector('.verse').innerHTML;
    const moolText = vg.querySelector('.verse').textContent;
    document.getElementById('vpTitle').textContent =
      (main.getAttribute('data-prose') === 'true' ? 'खण्ड ' : 'पद्य ') + devaFn(n);
    let html = `<div class="vp-sec"><span class="lat dv">मूल</span><div class="vp-mool">${mool}</div></div>`;
    if (translitFn) {
      html += `<div class="vp-sec"><span class="lat">Roman</span><div class="vp-lipi">${translitFn(moolText).replace(/\s+/g, ' ').trim()}</div></div>`;
    }
    for (const [cls, label] of Object.entries(LBL)) {
      const el = vg.querySelector('.vlayer.' + cls);
      if (el) html += `<div class="vp-sec"><span class="lat dv">${label}</span><div class="vp-txt">${el.innerHTML}</div></div>`;
    }
    document.getElementById('vpBody').innerHTML = html;
    panel.hidden = false; scrim.hidden = false;
    requestAnimationFrame(() => panel.classList.add('show'));
    history.replaceState(null, '', '#v' + n);
    panel.dataset.n = n;
  }
  function closePanel() {
    if (!panel || panel.hidden) return;
    panel.classList.remove('show');
    scrim.hidden = true;
    if (openVg) { openVg.classList.remove('open'); openVg = null; }
    history.replaceState(null, '', location.pathname);
    setTimeout(() => { panel.hidden = true; }, 260);
  }
  main.addEventListener('click', (e) => {
    const vg = e.target.closest('.vgroup');
    if (vg) openPanel(vg);
  });
  main.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList?.contains('vgroup')) openPanel(e.target);
  });
  document.getElementById('vpClose')?.addEventListener('click', closePanel);
  scrim?.addEventListener('click', closePanel);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePanel(); document.body.classList.remove('toc-open'); } });
  document.getElementById('vpLink')?.addEventListener('click', async () => {
    const url = location.origin + location.pathname + '#v' + (panel.dataset.n || '');
    try { await navigator.clipboard.writeText(url); document.getElementById('vpLink').textContent = '✓ कॉपी हुई'; } catch {}
  });
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
  const synth = window.speechSynthesis;
  let cur = -1, playing = false, singleMode = false;

  const speechText = (el) => el.textContent
    .replace(/॥[^॥]*॥/g, '.')
    .replace(/[।/]/g, ',')
    .replace(/\s+/g, ' ').trim();

  function pickVoice() {
    const vs = synth.getVoices();
    return vs.find((v) => /^hi(-|_)/i.test(v.lang)) || vs.find((v) => /^sa(-|_)/i.test(v.lang)) ||
           vs.find((v) => /india/i.test(v.name)) || null;
  }

  function highlight(i) {
    verses.forEach((v, j) => v.classList.toggle('playing', j === i));
    if (verses[i]) verses[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function speakFrom(i) {
    if (!synth || i >= verses.length) { stop(); return; }
    cur = i;
    highlight(i);
    const u = new SpeechSynthesisUtterance(speechText(verses[i]));
    u.lang = 'hi-IN';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = +rateSel.value;
    u.onend = () => { if (playing && !singleMode) speakFrom(cur + 1); else if (singleMode) stop(); };
    u.onerror = () => { if (playing && !singleMode) speakFrom(cur + 1); else if (singleMode) stop(); };
    synth.speak(u);
  }

  function start(from) {
    if (!synth) { playBtn.textContent = 'इस ब्राउज़र में उपलब्ध नहीं'; playBtn.disabled = true; return; }
    playing = true;
    playBtn.textContent = '⏸ रोकें';
    synth.cancel();
    speakFrom(from);
  }
  function stop() {
    playing = false;
    if (synth) synth.cancel();
    playBtn.textContent = '▶ सुनें';
    verses.forEach((v) => v.classList.remove('playing'));
  }

  playBtn.addEventListener('click', () => { singleMode = false; playing ? stop() : start(Math.max(0, cur)); });
  document.getElementById('vpListen')?.addEventListener('click', () => {
    const n = +(panel?.dataset.n || 0);
    if (n > 0) { singleMode = true; start(n - 1); }
  });
  rateSel.addEventListener('change', () => { if (playing) { synth.cancel(); speakFrom(cur); } });
  verses.forEach((v, i) => v.addEventListener('dblclick', () => start(i))); // double-tap a verse: listen from there
  addEventListener('pagehide', stop);
  if (synth && synth.getVoices().length === 0) synth.addEventListener?.('voiceschanged', () => {});
}
