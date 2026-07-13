# श्रुतधारा (Shrutdhara) — Plan v2

**Goal:** a free, open (no login, no tracking) encyclopedia of the Digambar Jain श्रुत tradition — hosted as a **project site** at `https://alphanout.github.io/<repo>/` (portfolio stays untouched at the root). Every granth gets its own page **and an auto-generated PDF**. Custom domain can be attached later.

**Design preview (approve/critique this first):** open [design/abhilekh-preview.html](design/abhilekh-preview.html) in a browser — theme toggle top-right.

---

## 1. Repo name — recommendation: `shrutdhara`

The site is not a "library of granth files" (jaingranthlibrary already is that) — our data is the **unbroken 2,500-year stream of transmission**: 420 acharyas in guru→shishya sequence, the 90 granths they produced, 172 later scholars. The name should say *continuity*.

| Candidate | Meaning | Verdict |
|---|---|---|
| **`shrutdhara`** ⭐ | श्रुतधारा — the unbroken stream of श्रुत | Short, unique, names the timeline concept itself; good future domain (shrutdhara.org) |
| `shrut-ganga` | श्रुतगंगा — the Ganga of shrut | Lovely, slightly more poetic, less precise |
| `granth-manjusha` | ग्रन्थमंजूषा — casket of granths | Beautiful word, longer URL, names only one of three datasets |
| `shrutskandh` | श्रुतस्कन्ध — the corpus of scripture | Traditional term, harder to read/type in Latin |

Final URL: `https://alphanout.github.io/shrutdhara/`

---

## 2. The design — "अभिलेख / Abhilekh — the Inscription" (v2; v1 cream-pothi rejected)

The Digambar tradition's grandest visual memory is not paper — it is **stone**: Shravanabelagola's granite, and the शिलालेख on which these very dates survive. The site is built as a **digital monument**, dark-first:

- **Surface = शिला**: deep granite sanctum greys (`#0E0D0B → #26221C`); granths are chamfered **stele slabs**, no rounded cards, inset stone edges, one gold vein that wakes on hover. Light theme is its own scene — "प्रांगण", noon-lit sandstone with carved shadows inverted.
- **Type = टाँकी (chisel)**: display **Khand** 600/700 — condensed, angular Devanagari that reads chisel-cut; body **Mukta**. Ordinary headings are *engraved* into the surface (carve shadows); granth names are **स्वर्ण-जड़ाई** — gold-inlay gradient text, the way honored names were gold-filled in real inscriptions. Devanagari numerals throughout.
- **Color discipline**: bone-etch text on granite · gold inlay `#F0D288→#8A6420` · **कुंकुम** vermillion `#D4552F` reserved for living/structural marks only (like tilak on stone) · bronze-**patina** teal `#63B19B` for all links/interactive.
- **Time = स्वर्ण-शिरा**: the timeline is **काल-स्तर** — centuries stacked as geological strata with a gold vein running through the rock; acharyas as ledger rows, each granth cutting across its stratum as a gold band. Century scrubber to jump eras.
- **System rule: screen = stone, print = paper.** The site renders as granite; every auto-generated PDF prints on pure paper-cream, identical in both themes.

## 3. Information architecture

```
alphanout.github.io/shrutdhara/
├── द्वार (Home)            — आज का ग्रन्थ (date-seeded daily pick), omnisearch, 3 entrances
├── कालयात्रा (Timeline)     — THE signature page: one continuous scroll 527 BCE → 1991 CE;
│                             all 420 acharyas + 90 granths interleaved on the golden stream;
│                             guru names are links (tap → guru card highlights); fixed century
│                             scrubber rail (१…२०) to jump; lazy-rendered per century
├── ग्रन्थ-मंजूषा (90)        — pothi-strip catalog; filter by century/author; → granth pages
│   └── granth/<slug>/      — 90 dedicated pages (below)
│   └── pdf/<slug>.pdf      — 90 auto-built PDFs + सम्पूर्ण-सूची.pdf (whole catalog, printable)
├── आचार्य-परम्परा (420)     — century-grouped registry, search, guru links
├── भट्टारक एवं विद्वान (172) — language filter chips + भाषा×काल heatmap
│                             (the data's own story: Prakrit → Apabhramsha → Kannada → Hindi/Marathi)
├── मूल स्रोत                — all 25 source photos, lightbox; every data row cites its photo+row
└── परिचय                   — credits: भावत्रयफलप्रदर्शी (आ. कुन्थुसागर परम्परा), Mumukshu poster
```

**Omnisearch**: press `/` anywhere; searches all 682 records client-side; **transliteration-tolerant** — typing `samaysar` matches समयसार (small Devanagari↔Roman normalizer, no server, no library).

## 4. Per-granth pages + auto-PDF (the new core requirement)

Each of the 90 granths gets `granth/<slug>/` with:
- ॥श्री॥ mangal ornament, granth name in display type, author + century + क्रम (n/90)
- **Lineage ribbon** — author's guru → author → successor, resolved by joining the granth's author against the 420-acharya registry (e.g. समयसार: जिनचन्द्राचार्य → कुन्दकुन्द → उमास्वामी)
- **इसी लेखनी से / समकालीन** — same-author and same-century granth chips (auto-derived)
- **Provenance** — "मूल पोस्टर, पंक्ति ३" linking to the source photo (nothing is asserted beyond the data; no fabricated scholarship)
- Buttons: **पीडीएफ़ डाउनलोड** · साझा करें (Web Share API)
- Per-page **OG share card** (1200×630 image) so WhatsApp/Telegram previews look right — this audience shares everything on WhatsApp

**PDF pipeline (fully automatic, in CI):**
```
edit JSON on GitHub → Actions: build.mjs renders 90 pages + indexes
                    → headless Chromium prints each page → 90 A4 PDFs (+1 catalog PDF)
                    → same pass screenshots 90 OG cards
                    → deploy-pages publishes everything
```
- PDFs are always paper-cream (print stylesheet), manuscript double-border, footer with URL + पृष्ठ number; Devanagari shaping is native in Chromium.
- PDFs/OG images are **build artifacts, never committed** — repo stays lean.
- After setup, updating content = editing a JSON line in the GitHub web UI. Everything else is automatic.

## 5. Tech decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | **None.** Static HTML/CSS/JS + one ~150-line `build.mjs` (template literals) | 90 generated pages need *a* build step, not a framework; keeps repo readable forever |
| PDF/OG generation | Puppeteer (headless Chromium) in GitHub Actions | Exact same rendering as the site; A4 via `@page`; runs only in CI |
| Hosting | GitHub Pages via `actions/deploy-pages` | Project path `/shrutdhara/`; all URLs relative so local preview works |
| Fonts | Khand + Mukta woff2, vendored into the repo | No CDN dependency, faster, works offline |
| Data | 3 JSON files with `slug`, `authorId`/`guruId` cross-links, `uncertain` flags, `source:{image,row}` per record | Single source of truth; every row traceable to a photo |
| Search | Hand-rolled scorer + transliteration normalizer | 682 records — trivial client-side; zero deps |

## 6. Data extraction (unchanged from v1, still the bulk of the work)

1. Poster → `granths-90.json` (clean).
2. Book pp. 6–23 → `acharyas-420.json`; angled/cut-off cells recovered from overlapping photos; leftovers flagged `uncertain: true` (shown with ⚠ + photo link, honest not hidden).
3. Book pp. 23–29 → `bhattarak-172.json` (with language field for the heatmap).
4. Author-matching pass: link the 90 granths' authors to acharya ids (Kundkund, Samantabhadra, Pujyapad, Akalank, Jinsen, Nemichandra, Todarmal…).
5. Sanity: counts 90/420/172, serials continuous, every century section present.

## 7. Build order

| Phase | Work | Output |
|---|---|---|
| **A** | Extract all three datasets from the 25 photos, cross-link authors | 3 JSON files, verified counts |
| **B** | Design system CSS + shared shell; Home, कालयात्रा, three registries, sources gallery | The site, working locally |
| **C** | `build.mjs` (90 granth pages) + print stylesheet + Puppeteer PDF/OG script | 90 pages, 91 PDFs, 90 share cards |
| **D** | Repo `alphanout/shrutdhara` (public), Actions workflow, Pages on | Live at `/shrutdhara/` |
| **E** | QA: spot-check ~60 rows vs photos, mobile, both themes, PDF Devanagari, Lighthouse | Launch |

Nice-to-haves after launch: English transliteration toggle, service worker (full offline swadhyay), आचार्य-परम्परा PDF, custom domain.

---

*Design preview artifact: https://claude.ai/code/artifact/0dc269a0-f7ec-4680-bcb1-d27d5f0c3062 — approve the direction (or mark up changes) and Phase A starts.*
