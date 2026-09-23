/* ============================================================
   श्रुतधारा · In-Browser Shastra PDF Reader & Highlighter
   ============================================================ */

import * as pdfjsLib from '../assets/vendor/pdfjs/pdf.min.mjs';
import { t, lang, apply } from './i18n.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.mjs';

// State
let pdfDoc = null;
let currentSlug = '';
let currentName = '';
let currentPage = 1;
let totalPages = 0;
let currentScale = 1.25;
let renderedPages = new Map(); // pageNum -> { canvas, textLayer }
let catalog = {};
let searchIndex = [];
let activeMatches = []; // [{ page, index, snippet }]
let currentMatchIdx = -1;
let currentQuery = '';

// DOM Elements
const viewport = document.getElementById('pdfViewport');
const overlay = document.getElementById('viewerOverlay');
const spinner = document.getElementById('viewerSpinner');
const overlayStatus = document.getElementById('overlayStatus');
const overlaySub = document.getElementById('overlaySub');
const fallbackBox = document.getElementById('fallbackBox');
const granthTitle = document.getElementById('granthTitle');
const granthBadge = document.getElementById('granthBadge');
const backLink = document.getElementById('backLink');
const downloadBtn = document.getElementById('downloadBtn');
const pageInput = document.getElementById('pageInput');
const pageTotal = document.getElementById('pageTotal');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomFitBtn = document.getElementById('zoomFitBtn');
const findInput = document.getElementById('findInput');
const findCount = document.getElementById('findCount');
const findPrevBtn = document.getElementById('findPrevBtn');
const findNextBtn = document.getElementById('findNextBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const viewerSidebar = document.getElementById('viewerSidebar');
const tabHitsBtn = document.getElementById('tabHitsBtn');
const tabCatalogBtn = document.getElementById('tabCatalogBtn');
const sidebarHits = document.getElementById('sidebarHits');
const sidebarCatalog = document.getElementById('sidebarCatalog');
const themeBtn = document.getElementById('themeBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const viewPaathBtn = document.getElementById('viewPaathBtn');
const pdfFileInput = document.getElementById('pdfFileInput');
const fallbackDownloadBtn = document.getElementById('fallbackDownloadBtn');
const fallbackPaathBtn = document.getElementById('fallbackPaathBtn');
const fallbackTitle = document.getElementById('fallbackTitle');
const fallbackDesc = document.getElementById('fallbackDesc');

const DIGITIZED_SLUGS = new Set([
  'shatkhandaagama', 'samayasaara', 'pravachanasaara', 'panchaastikaaya', 'niyamasaara',
  'ashtapaahuda', 'baarasa-anuvekkhaa', 'bhagavati-aaraadhanaa', 'tattvaarthasutra',
  'ratnakaranda-shraavakaachaara', 'aaptamimaansaa', 'yuktyanushaasana', 'sarvaarthasiddhi',
  'samaadhitantra', 'ishtopadesha', 'laghiyastraya', 'tattvaartharaajavaartika',
  'aadipuraana', 'gommatasaara-jivakaanda', 'gommatasaara-karmakaanda', 'dravyasangraha',
  'parikshaamukha', 'shrutaavataara', 'mokshamaargaprakaashaka', 'samayasaara-kalasha'
]);

// Initial Setup
async function init() {
  initTheme();
  setupEvents();
  if (typeof apply === 'function') apply(document);

  // Load catalog & search index in parallel
  try {
    const [catRes, idxRes] = await Promise.all([
      fetch('data/shastra-pdfs.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
      fetch('data/pdf-search-index.json').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]);
    catalog = catRes;
    searchIndex = idxRes;
  } catch (err) {
    console.warn('Could not load data catalogs:', err);
  }

  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  let fileUrl = params.get('file') || '';
  let slug = params.get('slug') || '';
  let name = params.get('name') || '';
  let query = params.get('q') || '';
  let page = parseInt(params.get('page') || '1', 10);

  if (hash && hash.startsWith('#page=')) {
    const p = parseInt(hash.replace('#page=', ''), 10);
    if (!isNaN(p)) page = p;
  }

  // If slug is provided without URL, resolve from catalog
  if (slug && catalog[slug]) {
    const item = catalog[slug];
    if (!fileUrl) fileUrl = item.url;
    if (!name) name = item.name;
  } else if (!slug && fileUrl) {
    // Attempt reverse lookup by filename
    for (const [s, it] of Object.entries(catalog)) {
      if (fileUrl.includes(it.fileName)) {
        slug = s;
        if (!name) name = it.name;
        break;
      }
    }
  }

  // Fallback to first granth if nothing specified
  if (!fileUrl && !slug) {
    const firstSlug = Object.keys(catalog)[0] || 'shatkhandaagama';
    const firstItem = catalog[firstSlug];
    if (firstItem) {
      slug = firstSlug;
      fileUrl = firstItem.url;
      name = firstItem.name;
    }
  }

  currentSlug = slug;
  currentName = name || (catalog[slug] ? catalog[slug].name : 'शास्त्र वाचक');
  currentQuery = query;
  currentPage = Math.max(1, page);

  updateHeader(currentName, slug);
  populateCatalogSidebar();

  if (fileUrl) {
    await loadPdf(fileUrl, currentPage, query);
  } else {
    showFallback('कोई ग्रन्थ निर्दिष्ट नहीं है', 'कृपया बाईं सूची से किसी ग्रन्थ का चयन करें।');
  }
}

// Header & Navigation updates
function updateHeader(title, slug) {
  granthTitle.textContent = title;
  document.title = `${title} (मूल ग्रन्थ PDF) — श्रुतधारा`;

  const item = catalog[slug];
  if (item) {
    granthBadge.textContent = `${item.category || ''} · ${item.size || ''}`;
    downloadBtn.href = item.url;
    downloadBtn.setAttribute('download', item.fileName || `${slug}.pdf`);
    fallbackDownloadBtn.href = item.url;
    fallbackDownloadBtn.setAttribute('download', item.fileName || `${slug}.pdf`);
    fallbackTitle.textContent = `${item.name} (${item.nameEn || ''})`;

    backLink.href = `granth/${slug}/`;
    backLink.textContent = `← ${title}`;

    if (DIGITIZED_SLUGS.has(slug)) {
      if (viewPaathBtn) {
        viewPaathBtn.href = `granth/${slug}/paath/`;
        viewPaathBtn.style.display = 'inline-flex';
      }
      fallbackPaathBtn.href = `granth/${slug}/paath/`;
      fallbackPaathBtn.style.display = 'inline-block';
    } else {
      if (viewPaathBtn) viewPaathBtn.style.display = 'none';
      fallbackPaathBtn.style.display = 'none';
    }
  } else {
    granthBadge.textContent = t('viewer.reader_title');
    backLink.href = 'granths.html';
    backLink.textContent = `← ${t('viewer.back_to_catalog')}`;
    if (viewPaathBtn) viewPaathBtn.style.display = 'none';
  }
}

// Load and Render PDF Document
async function loadPdf(source, initialPage = 1, autoSearch = '') {
  showOverlay(t('viewer.loading_status'), `${currentName} ${t('viewer.loading_sub')}`);
  fallbackBox.style.display = 'none';
  spinner.style.display = 'block';

  // Build candidate URL list
  const candidates = [];
  if (currentSlug && catalog[currentSlug]) {
    const fn = catalog[currentSlug].fileName;
    // 1. Cloudflare Worker proxy if running on shrutdhara.com (hit directly, avoids 404)
    if (typeof window !== 'undefined' && window.location.hostname.includes('shrutdhara.com')) {
      candidates.push(`/pdf-proxy/${encodeURIComponent(fn)}`);
    }
    // 2. Same-origin relative path if hosted locally
    candidates.push(`pdf/${fn}`);
  }
  // 3. Direct remote URL
  candidates.push(source);
  // 4. Public CORS Proxy fallback for github releases
  if (source.startsWith('https://github.com/')) {
    candidates.push(`https://corsproxy.io/?url=${encodeURIComponent(source)}`);
  }

  let lastErr = null;
  for (const url of candidates) {
    try {
      const loadingTask = pdfjsLib.getDocument({
        url,
        cMapUrl: 'assets/vendor/pdfjs/cmaps/',
        cMapPacked: true,
        wasmUrl: 'assets/vendor/pdfjs/wasm/',
        disableAutoFetch: true,
        rangeChunkSize: 65536,
      });

      loadingTask.onProgress = (p) => {
        if (p.total > 0) {
          const pct = Math.round((p.loaded / p.total) * 100);
          overlaySub.textContent = `${t('viewer.loading_sub')} ${pct}%`;
        }
      };

      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;
      pageTotal.textContent = `/ ${totalPages}`;
      pageInput.max = totalPages;

      hideOverlay();
      renderAllPagesPlaceholder();

      goToPage(initialPage);

      if (autoSearch) {
        findInput.value = autoSearch;
        executeSearch(autoSearch);
      }
      return; // Loaded successfully!
    } catch (err) {
      lastErr = err;
      console.warn(`Could not load PDF candidate URL "${url}":`, err.message || err);
    }
  }

  console.error('All PDF candidate sources failed:', lastErr);
  showFallback(currentName, t('viewer.fallback_desc'));
}

// Load ArrayBuffer from local File Input
function loadFromBuffer(arrayBuffer, fileName = '') {
  showOverlay('॥ नमो जिणाणं ॥', 'स्थानीय PDF लोड हो रही है...');
  pdfjsLib
    .getDocument({
      data: arrayBuffer,
      cMapUrl: 'assets/vendor/pdfjs/cmaps/',
      cMapPacked: true,
      wasmUrl: 'assets/vendor/pdfjs/wasm/',
    })

    .promise.then((doc) => {
      pdfDoc = doc;
      totalPages = pdfDoc.numPages;
      pageTotal.textContent = `/ ${totalPages}`;
      pageInput.max = totalPages;
      if (fileName) {
        granthTitle.textContent = fileName.replace(/\.pdf$/i, '');
      }
      hideOverlay();
      renderAllPagesPlaceholder();
      goToPage(1);
    })
    .catch((err) => {
      alert('फ़ाइल लोड करने में त्रुटि: ' + err.message);
      hideOverlay();
    });
}

// Render page placeholders in viewport
function renderAllPagesPlaceholder() {
  viewport.innerHTML = '';
  renderedPages.clear();

  for (let i = 1; i <= totalPages; i++) {
    const card = document.createElement('div');
    card.className = 'pdf-page-card';
    card.id = `page-card-${i}`;
    card.dataset.pageNum = i;

    const numBadge = document.createElement('div');
    numBadge.className = 'pdf-page-num num';
    numBadge.textContent = `पृष्ठ ${i}`;
    card.appendChild(numBadge);

    const canvas = document.createElement('canvas');
    canvas.id = `canvas-${i}`;
    card.appendChild(canvas);

    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    textLayer.id = `textLayer-${i}`;
    card.appendChild(textLayer);

    viewport.appendChild(card);
  }

  // Use IntersectionObserver to lazy-render pages as user scrolls
  setupIntersectionObserver();
}

function setupIntersectionObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.dataset.pageNum, 10);
          renderPage(pageNum);
          // Update current page input indicator as user scrolls
          currentPage = pageNum;
          pageInput.value = pageNum;
          window.history.replaceState(null, '', `#page=${pageNum}`);
        }
      }
    },
    { root: viewport, rootMargin: '400px 0px', threshold: 0.1 }
  );

  document.querySelectorAll('.pdf-page-card').forEach((el) => observer.observe(el));
}

// Render individual page
async function renderPage(num) {
  if (!pdfDoc || renderedPages.has(num)) return;
  renderedPages.set(num, true);

  const card = document.getElementById(`page-card-${num}`);
  const canvas = document.getElementById(`canvas-${num}`);
  const textLayerDiv = document.getElementById(`textLayer-${num}`);
  if (!card || !canvas || !textLayerDiv) return;

  try {
    const page = await pdfDoc.getPage(num);
    const viewportObj = page.getViewport({ scale: currentScale });

    canvas.height = viewportObj.height;
    canvas.width = viewportObj.width;
    card.style.width = `${viewportObj.width}px`;
    card.style.height = `${viewportObj.height}px`;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: viewportObj }).promise;

    // Render Text Layer for search & selection
    textLayerDiv.innerHTML = '';
    textLayerDiv.style.setProperty('--scale-factor', viewportObj.scale);
    const textContent = await page.getTextContent();

    // Render text spans
    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: viewportObj,
    });
    await textLayer.render();

    // Re-apply active query highlights if searching
    if (currentQuery) {
      highlightMatchesOnPage(num, currentQuery);
    }
  } catch (err) {
    console.error(`Error rendering page ${num}:`, err);
  }
}

// Highlighting text inside page textLayer
function highlightMatchesOnPage(pageNum, query) {
  const textLayerDiv = document.getElementById(`textLayer-${pageNum}`);
  if (!textLayerDiv || !query) return;

  const qLower = query.toLowerCase();
  const spans = textLayerDiv.querySelectorAll('span');
  for (const s of spans) {
    if (s.querySelector('.pdf-highlight')) continue;
    const text = s.textContent;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(qLower);
    if (idx >= 0) {
      const before = text.substring(0, idx);
      const match = text.substring(idx, idx + query.length);
      const after = text.substring(idx + query.length);
      s.innerHTML = `${escapeHtml(before)}<mark class="pdf-highlight" data-page-num="${pageNum}">${escapeHtml(match)}</mark>${escapeHtml(after)}`;
    }
  }
}


// Search across all pages
async function executeSearch(query) {
  currentQuery = query.trim();
  activeMatches = [];
  currentMatchIdx = -1;

  if (!currentQuery || currentQuery.length < 2) {
    findCount.textContent = '';
    clearHighlights();
    sidebarHits.innerHTML = `
      <div style="color:var(--etch-dim); font-size:0.85rem; text-align:center; padding:20px 8px;">
        खोजने के लिए ऊपर इनपुट में शब्द लिखें (उदा. समयसार, जीव, मोक्ष)
      </div>`;
    return;
  }

  findCount.textContent = 'खोज रहे हैं...';
  clearHighlights();

  // 1. Search in pre-built PDF search index for current granth (instant!)
  const qLower = currentQuery.toLowerCase();
  const granthEntries = searchIndex.filter((it) => it.s === currentSlug);

  if (granthEntries.length > 0) {
    for (const it of granthEntries) {
      if (it.t && it.t.toLowerCase().includes(qLower)) {
        activeMatches.push({
          page: it.p,
          snippet: it.sn || it.t.substring(0, 100),
        });
      }
    }
  }

  // 2. Also search live in PDF document if loaded and activeMatches is empty
  if (activeMatches.length === 0 && pdfDoc) {
    for (let p = 1; p <= Math.min(totalPages, 200); p++) {
      try {
        const page = await pdfDoc.getPage(p);
        const tc = await page.getTextContent();
        const str = tc.items.map((i) => i.str).join(' ');
        if (str.toLowerCase().includes(qLower)) {
          const idx = str.toLowerCase().indexOf(qLower);
          const snippet = str.substring(Math.max(0, idx - 40), Math.min(str.length, idx + 80));
          activeMatches.push({ page: p, snippet: '…' + snippet + '…' });
        }
      } catch {}
    }
  }

  // Update sidebar hits UI
  if (activeMatches.length > 0) {
    viewerSidebar.classList.remove('collapsed');
    switchTab('hits');

    findCount.textContent = `1 of ${activeMatches.length}`;
    currentMatchIdx = 0;

    sidebarHits.innerHTML = activeMatches
      .map(
        (m, idx) => `
      <div class="search-hit-item" data-idx="${idx}" data-page="${m.page}">
        <div class="search-hit-page">पृष्ठ ${m.page}</div>
        <div class="search-hit-snippet">${escapeHtml(m.snippet)}</div>
      </div>`
      )
      .join('');

    // Attach click events to hits
    sidebarHits.querySelectorAll('.search-hit-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        goToMatch(idx);
      });
    });

    // Apply highlights to all currently rendered pages
    for (const pageNum of renderedPages.keys()) {
      highlightMatchesOnPage(pageNum, currentQuery);
    }

    goToMatch(0);
  } else {

    findCount.textContent = '० परिणाम';
    sidebarHits.innerHTML = `
      <div style="color:var(--etch-dim); font-size:0.85rem; text-align:center; padding:20px 8px;">
        "${escapeHtml(currentQuery)}" का कोई परिणाम नहीं मिला।
      </div>`;
  }
}

function goToMatch(idx) {
  if (idx < 0 || idx >= activeMatches.length) return;
  currentMatchIdx = idx;
  const match = activeMatches[idx];
  findCount.textContent = `${idx + 1} of ${activeMatches.length}`;

  // Highlight active in sidebar
  sidebarHits.querySelectorAll('.search-hit-item').forEach((el, i) => {
    el.style.borderColor = i === idx ? 'var(--kumkum)' : 'var(--hairline)';
    el.style.background = i === idx ? 'var(--stone-3)' : 'var(--stone-2)';
  });

  goToPage(match.page);
  highlightMatchesOnPage(match.page, currentQuery);

  // Scroll to active highlight in textLayer

  setTimeout(() => {
    const card = document.getElementById(`page-card-${match.page}`);
    if (card) {
      const marks = card.querySelectorAll('.pdf-highlight');
      marks.forEach((m) => m.classList.remove('pdf-highlight-active'));
      if (marks.length > 0) {
        marks[0].classList.add('pdf-highlight-active');
        marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, 350);
}

function clearHighlights() {
  document.querySelectorAll('.pdf-highlight').forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    }
  });
}

// Navigation & Zoom
function goToPage(num) {
  num = Math.max(1, Math.min(num, totalPages));
  currentPage = num;
  pageInput.value = num;
  window.history.replaceState(null, '', `#page=${num}`);

  const targetCard = document.getElementById(`page-card-${num}`);
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  renderPage(num);
  if (num < totalPages) renderPage(num + 1);
  if (num > 1) renderPage(num - 1);
}

function changeZoom(factor) {
  currentScale = Math.max(0.6, Math.min(2.5, currentScale * factor));
  renderedPages.clear();
  renderAllPagesPlaceholder();
  goToPage(currentPage);
}

function fitToWidth() {
  const containerWidth = viewport.clientWidth - 48;
  if (containerWidth > 300) {
    currentScale = containerWidth / 600; // approximate standard A4 ratio
    currentScale = Math.max(0.75, Math.min(2.0, currentScale));
    renderedPages.clear();
    renderAllPagesPlaceholder();
    goToPage(currentPage);
  }
}

// Sidebar 64 Shastras Catalog
function populateCatalogSidebar() {
  const items = Object.entries(catalog);
  sidebarCatalog.innerHTML = `
    <div style="padding:4px 0 8px;">
      <input type="text" id="catalogFilter" placeholder="६४ शास्त्रों में खोजें..."
        style="width:100%; background:var(--stone-2); border:1px solid var(--hairline); color:var(--etch); padding:6px 8px; font-family:inherit; font-size:0.82rem; border-radius:4px;">
    </div>
    <div id="catalogList">
      ${items
        .map(
          ([s, it]) => `
        <div class="search-hit-item ${s === currentSlug ? 'active' : ''}" data-slug="${s}" style="${s === currentSlug ? 'border-color:var(--gold-2); background:var(--stone-3);' : ''}">
          <div class="search-hit-page khand" style="font-size:0.95rem;">${it.id}. ${it.name}</div>
          <div style="font-size:0.75rem; color:var(--etch-dim);">${it.nameEn || ''} · ${it.size}</div>
        </div>`
        )
        .join('')}
    </div>`;

  const catFilter = document.getElementById('catalogFilter');
  if (catFilter) {
    catFilter.addEventListener('input', () => {
      const val = catFilter.value.toLowerCase().trim();
      sidebarCatalog.querySelectorAll('#catalogList .search-hit-item').forEach((el) => {
        const text = el.textContent.toLowerCase();
        el.style.display = text.includes(val) ? 'block' : 'none';
      });
    });
  }

  sidebarCatalog.querySelectorAll('#catalogList .search-hit-item').forEach((el) => {
    el.addEventListener('click', () => {
      const s = el.dataset.slug;
      if (s && catalog[s]) {
        window.location.href = `viewer.html?slug=${s}`;
      }
    });
  });
}

function switchTab(tab) {
  if (tab === 'hits') {
    tabHitsBtn.classList.add('active');
    tabCatalogBtn.classList.remove('active');
    sidebarHits.style.display = 'block';
    sidebarCatalog.style.display = 'none';
  } else {
    tabCatalogBtn.classList.add('active');
    tabHitsBtn.classList.remove('active');
    sidebarCatalog.style.display = 'block';
    sidebarHits.style.display = 'none';
  }
}

// Event Listeners
function setupEvents() {
  prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
  nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
  pageInput.addEventListener('change', () => goToPage(parseInt(pageInput.value, 10)));

  zoomInBtn.addEventListener('click', () => changeZoom(1.2));
  zoomOutBtn.addEventListener('click', () => changeZoom(0.8));
  zoomFitBtn.addEventListener('click', fitToWidth);

  toggleSidebarBtn.addEventListener('click', () => {
    viewerSidebar.classList.toggle('collapsed');
  });

  tabHitsBtn.addEventListener('click', () => switchTab('hits'));
  tabCatalogBtn.addEventListener('click', () => switchTab('catalog'));

  // Search input debounce & enter
  let searchTimer = null;
  findInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => executeSearch(findInput.value), 250);
  });
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        if (activeMatches.length) goToMatch((currentMatchIdx - 1 + activeMatches.length) % activeMatches.length);
      } else {
        if (activeMatches.length) goToMatch((currentMatchIdx + 1) % activeMatches.length);
      }
    }
  });

  findNextBtn.addEventListener('click', () => {
    if (activeMatches.length) goToMatch((currentMatchIdx + 1) % activeMatches.length);
  });
  findPrevBtn.addEventListener('click', () => {
    if (activeMatches.length) goToMatch((currentMatchIdx - 1 + activeMatches.length) % activeMatches.length);
  });

  // Keyboard navigation shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target === findInput || e.target === pageInput) return;
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') goToPage(currentPage - 1);
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') goToPage(currentPage + 1);
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      findInput.focus();
      findInput.select();
    }
    if (e.key === 'Escape') {
      viewerSidebar.classList.add('collapsed');
      findInput.blur();
    }
  });

  // Local file input
  if (pdfFileInput) {
    pdfFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => loadFromBuffer(reader.result, file.name);
        reader.readAsArrayBuffer(file);
      }
    });
  }

  // Fullscreen
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}

// UI Overlays & Theme
function showOverlay(title, sub) {
  overlay.style.display = 'flex';
  overlayStatus.textContent = title;
  overlaySub.textContent = sub;
}

function hideOverlay() {
  overlay.style.display = 'none';
}

function showFallback(title, desc) {
  hideOverlay();
  overlay.style.display = 'flex';
  spinner.style.display = 'none';
  overlayStatus.textContent = '';
  overlaySub.textContent = '';
  fallbackBox.style.display = 'block';
  if (title) fallbackTitle.textContent = title;
  if (desc) fallbackDesc.textContent = desc;
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  themeBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const nxt = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nxt);
    localStorage.setItem('theme', nxt);
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Run on load
window.addEventListener('DOMContentLoaded', init);
