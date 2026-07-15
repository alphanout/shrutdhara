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
    <button class="icon-btn rs" data-s="white" type="button" title="श्वेत / White">◇</button>
    <span class="rb-sep"></span>
    <button class="icon-btn rl" data-l="lipi" type="button" title="Roman lipi">Aa</button>
    <button class="icon-btn rl" data-l="arth" type="button" title="हिन्दी अर्थ" hidden>अर्थ</button>
    <button class="icon-btn rl" data-l="chhaya" type="button" title="संस्कृत छाया" hidden>छाया</button>
    <button class="icon-btn rl" data-l="en" type="button" title="English" hidden>EN</button>`;
  main.parentNode.insertBefore(bar, main);
  const markSurface = () => bar.querySelectorAll('.rs').forEach((b) => b.classList.toggle('on', b.dataset.s === surface));
  markSurface();

  bar.querySelector('#rMinus').addEventListener('click', () => { size = Math.max(0, size - 1); P.set('sd-reader-size', size); applySize(); });
  bar.querySelector('#rPlus').addEventListener('click', () => { size = Math.min(4, size + 1); P.set('sd-reader-size', size); applySize(); });
  bar.querySelectorAll('.rs').forEach((b) => b.addEventListener('click', () => {
    surface = b.dataset.s; P.set('sd-reader-surface', surface); applySurface(); markSurface();
  }));

  /* ---------- verse layers: lipi (auto), अर्थ, छाया, EN ---------- */
  import(new URL('./translit.js', import.meta.url)).then(({ translit }) => {
    const layers = ['lipi', 'arth', 'chhaya', 'en'];
    const avail = (l) => l === 'lipi' || main.getAttribute('data-has-' + l) === 'true';
    let lipiDone = false;
    const fillLipi = () => {
      if (lipiDone) return; lipiDone = true;
      main.querySelectorAll('.vgroup').forEach((vg) => {
        const v = vg.querySelector('.verse'), out = vg.querySelector('.vlayer.lipi');
        if (v && out) out.textContent = translit(v.textContent).replace(/\s+/g, ' ').trim();
      });
    };
    layers.forEach((l) => {
      const btn = bar.querySelector(`.rl[data-l="${l}"]`);
      if (!btn) return;
      if (!avail(l)) { btn.hidden = true; return; }
      btn.hidden = false;
      let on = P.get('sd-layer-' + l, '0') === '1';
      const apply = () => {
        if (l === 'lipi' && on) fillLipi();
        document.body.classList.toggle('show-' + l, on);
        btn.classList.toggle('on', on);
      };
      apply();
      btn.addEventListener('click', () => { on = !on; P.set('sd-layer-' + l, on ? '1' : '0'); apply(); });
    });
  });

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
  let cur = -1, playing = false;

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
    u.onend = () => { if (playing) speakFrom(cur + 1); };
    u.onerror = () => { if (playing) speakFrom(cur + 1); };
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

  playBtn.addEventListener('click', () => (playing ? stop() : start(Math.max(0, cur))));
  rateSel.addEventListener('change', () => { if (playing) { synth.cancel(); speakFrom(cur); } });
  verses.forEach((v, i) => v.addEventListener('dblclick', () => start(i))); // double-tap a verse: listen from there
  addEventListener('pagehide', stop);
  if (synth && synth.getVoices().length === 0) synth.addEventListener?.('voiceschanged', () => {});
}
