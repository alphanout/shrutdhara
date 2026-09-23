/* श्रुतधारा i18n — UI chrome in hi / en / sa (संस्कृतम्) / pra (प्राकृत).
   Content (names, tables, curated intros) stays Devanagari; en adds romanized
   subtitles and an English auto-description. sa/pra fall back to hi for prose. */

import { translit } from './translit.js';

export const DICT = {
  hi: {
    /* Navigation & Toolbars */
    'nav.home': 'द्वार',
    'nav.kaal': 'काल-स्तर',
    'nav.granths': 'ग्रन्थ',
    'nav.acharya': 'आचार्य',
    'nav.bhattarak': 'भट्टारक-विद्वान',
    'nav.sources': 'मूल स्रोत',
    'nav.about': 'परिचय',

    /* Home Stats Plaques */
    'stats.g': 'प्रमुख प्राचीन ग्रन्थ',
    'stats.a': 'आचार्य एवं श्रमण',
    'stats.b': 'भट्टारक एवं विद्वान',
    'stats.pdf': 'मूल ग्रन्थ PDF',
    'stats.pdf_sub': '६४ शास्त्र',

    /* Home Hero & Sections */
    'hero.tag': 'पत्थर पर खुदा इतिहास — <b>५२७ ई.पू. से १९९१ ई. तक</b> की दिगम्बर जैन श्रुत-परम्परा',
    'home.kaal_h': 'काल-स्तर में <span class="r">उतरिए</span>',
    'home.kaal_desc': '२५०० वर्ष भूवैज्ञानिक परतों की तरह — हर शताब्दी एक स्तर, बीच से बहती स्वर्ण-शिरा; आचार्य उसके तट पर, ग्रन्थ सोने की पट्टी बनकर परत को चीरते हुए।',
    'home.kaal_btn': 'काल-यात्रा आरम्भ करें',

    /* Search Component */
    'ui.search_h': 'सर्वखोज',
    'ui.search_ph': 'खोजें — समयसार, कुन्दकुन्द, टोडरमल… या रोमन में ‘samaysar’',
    'ui.search_hint': 'तीनों सूचियाँ एक साथ — देवनागरी और रोमन दोनों से मिलान, ब्राउज़र में ही।',
    'ui.loading': 'सूची बन रही है…',
    'ui.no_results': 'कोई परिणाम नहीं — वर्तनी बदल कर देखें',
    'ui.today': 'आज का अभिलेख',
    'ui.daily': 'प्रतिदिन नया',
    'ui.century_jump': 'शताब्दी',
    'ui.all': 'सभी',
    'kind.g': 'ग्रन्थ',
    'kind.a': 'आचार्य',
    'kind.b': 'विद्वान',
    'ui.warn': '⚠ चिह्न = मूल छायाचित्र में अस्पष्ट पंक्ति',

    /* Granths Catalog */
    'granths.h': 'ग्रन्थ-प्रांगण <span class="r">· ९० शिलाएँ</span>',
    'granths.lede': '९० प्रमुख प्राचीन ग्रन्थ, रचना-काल के क्रम में — हर शिला पर ग्रन्थ, रचयिता और शती; भीतर उसका पूरा पट्ट और पीडीएफ़।',
    'granths.loading': 'शिलाएँ खुद रही हैं…',
    'ui.only_pdf': '📖 केवल मूल PDF (६४)',
    'ui.pdf_tag': '📖 PDF',
    'ui.has_text': 'पाठ ✓',

    /* Sources Page */
    'sources.h': 'मूल स्रोत <span class="r">· हर पंक्ति का प्रमाण</span>',
    'sources.lede': 'साइट का समस्त डेटा इन्हीं २५ छायाचित्रों से अक्षरशः लिया गया है — ९०-ग्रन्थ सूची का पोस्टर एवं भावत्रयफलप्रदर्शी के पृष्ठ ६–२९। किसी चित्र पर स्पर्श करें: पूर्ण आकार खुलेगा।',
    'sources.poster_h': '९० ग्रन्थ — <span class="r">पोस्टर</span>',
    'sources.bhavatraya_h': 'भावत्रयफलप्रदर्शी — <span class="r">पृष्ठ ६–२९</span>',
    'sources.shastras_h': '६४ मूल ग्रन्थ — <span class="r">हस्तलिखित व मुद्रित PDF संग्रह</span>',
    'sources.shastras_lede': '९० ग्रन्थों में से ६४ प्राचीन ग्रन्थों के पूर्ण मूल PDF संस्करण (हस्तलिखित प्रतियाँ एवं मुद्रित ग्रन्थ) स्वाध्याय हेतु उपलब्ध हैं। इन्हें इन-ब्राउज़र वाचक में खोज व टेक्स्ट हाइलाइट के साथ पढ़ा जा सकता है अथवा डाउनलोड किया जा सकता है।',
    'sources.search_shastras_ph': '६४ शास्त्रों में खोजें (नाम, अनुयोग)...',
    'sources.read_viewer': '📖 पढ़ें (Viewer)',

    /* PDF Viewer UI */
    'viewer.reader_title': 'मूल ग्रन्थ PDF वाचक',
    'viewer.tab_hits': '🔍 खोज परिणाम',
    'viewer.tab_catalog': '📚 ६४ शास्त्र',
    'viewer.search_hint': 'खोजने के लिए ऊपर इनपुट में शब्द लिखें (उदा. समयसार, जीव, मोक्ष)',
    'viewer.loading_status': '॥ नमो जिणाणं ॥',
    'viewer.loading_sub': 'ग्रन्थ लोड हो रहा है...',
    'viewer.fallback_desc': 'यह प्राचीन ग्रन्थ GitHub Releases पर सुरक्षित संग्रहित है। ब्राउज़र सुरक्षा (CORS) नियमों के कारण, आप इसे सीधे नीचे दिए गए बटन से डाउनलोड कर सकते हैं अथवा पहले से डाउनलोड की गई PDF यहाँ खोल सकते हैं:',
    'viewer.download_remote': '⬇ मूल ग्रन्थ PDF डाउनलोड करें',
    'viewer.choose_local': '📂 डाउनलोड की गई PDF फ़ाइल यहाँ चुनें',
    'viewer.choose_local_sub': '(चुनते ही इन-ब्राउज़र वाचक, खोज व हाइलाइट तुरंत सक्रिय हो जाएगा)',
    'viewer.read_paath_btn': '📖 डिजिटाइज़्ड मूल पाठ पढ़ें',
    'viewer.prev_page': 'पिछला पृष्ठ',
    'viewer.next_page': 'अगला पृष्ठ',
    'viewer.zoom_in': 'बड़ा करें (+)',
    'viewer.zoom_out': 'छोटा करें (-)',
    'viewer.zoom_reset': 'सामान्य आकार',
    'viewer.search_btn': '🔍 खोजें',
    'viewer.back_to_granth': 'ग्रन्थ पृष्ठ',
    'viewer.back_to_catalog': 'ग्रन्थ सूची',
    'viewer.download_btn': '⬇ डाउनलोड',
    'viewer.download_title': 'PDF डाउनलोड करें',
    'viewer.fullscreen': 'पूर्ण पर्दा',
    'viewer.prev_hit': 'पिछला परिणाम',
    'viewer.next_hit': 'अगला परिणाम',

    /* Detail / Reader Pages */
    'ui.toc': 'विषय-सूची',
    'ui.listen_this': 'यह सुनें',
    'ui.copy_link': 'कड़ी कॉपी करें',
    'ui.texts_avail': 'उपलब्ध मूल पाठ — पूरा ग्रन्थ पढ़ें',
    'ui.paath': 'मूल पाठ पढ़ें',
    'ui.back_granth': 'ग्रन्थ-पृष्ठ',
    'ui.fulltext': 'सम्पूर्ण ग्रन्थ पढ़ें',
    'ui.fulltext_note': 'बाह्य ग्रन्थालयों में खोज — नई टैब में खुलेगी',
    'ui.pdf': 'विवरण PDF',
    'ui.share': 'साझा करें',
    'ui.same_pen': 'इसी लेखनी से',
    'ui.same_century': 'समकालीन ग्रन्थ',
    'ui.intro': 'संक्षिप्त परिचय',
    'ui.record': 'अभिलेख-विवरण',
    'ui.proof': 'प्रमाण',
    'ui.bookmark': '🔖 बुकमार्क',
    'ui.bookmarked': '🔖 सहेजा गया',
    'ui.quote': '❝ उद्धरण',
    'ui.quote_copied': '✓ उद्धरण कॉपी हुआ',
    'ui.listen': '▶ सुनें',
    'ui.stop': '⏸ रोकें',
    'ui.listen_verse': '▶ यह सुनें',
    'ui.resume': 'जारी रखें ▶',
    'ui.offline_audio': '⬇ ऑफ़लाइन ऑडियो',
    'ui.offline_ready': '✓ ऑफ़लाइन उपलब्ध',
    'ui.bookmark_drawer_title': '🔖 सहेजे गए बुकमार्क',
    'ui.bookmark_empty': 'कोई बुकमार्क सहेजा नहीं गया है।',
    'ui.bookmark_hint': 'पाठ पढ़ते समय <b>🔖 बुकमार्क</b> बटन दबाकर किसी भी श्लोक या गाथा को यहाँ सहेजें।',
    'ui.last_read': '📖 हाल ही में पढ़ा गया',
    'ui.read_from_where_left': '▶ जहाँ छोड़ा था वहीं से जारी रखें',
    'ui.read_pdf_chip': '📖 मूल ग्रन्थ PDF',
    'ui.read_pdf_btn': '📖 मूल ग्रन्थ PDF पढ़ें',
    'ui.close': 'बंद करें',
    'ui.share_copied': '✓ कड़ी कॉपी हो गई',

    /* Kaal / Acharya / Bhattarak / About / 404 */
    'kaal.h': '<span class="r">काल-स्तर</span> — एक अखण्ड यात्रा',
    'kaal.lede': 'भगवान महावीर के प्रथम शिष्य गौतम-गणधर (५२७ ई.पू.) से बीसवीं शताब्दी तक — आचार्य, उनके ग्रन्थ और परवर्ती विद्वान, सब अपने-अपने काल की परत पर। गुरु का नाम सदा कड़ी है।',
    'kaal.loading': 'काल-स्तर बन रहे हैं…',
    'acharya.h': 'आचार्य-परम्परा <span class="r">· ४२०</span>',
    'acharya.lede': 'आचार्य समयानुक्रमणिका — काल, नाम, गुरु और प्रधान कृति; शताब्दीवार। गुरु के नाम पर स्पर्श करें: उनकी पंक्ति आलोकित होगी।',
    'bhattarak.h': 'भट्टारक एवं विद्वान <span class="r">· १७२</span>',
    'bhattarak.lede': '१७२ भट्टारक एवं उत्तरकालीन विद्वान — काल, नाम, गद्दी / प्रकार और रचित ग्रन्थ; कालक्रम में।',
    'about.h': 'परिचय',
    'about.lede': 'श्रुतधारा — ढाई हज़ार वर्षों की अविच्छिन्न दिगम्बर जैन श्रुत-परम्परा का खुला, निःशुल्क डिजिटल स्मारक। न लॉगिन, न ट्रैकिंग, न विज्ञापन।',
    'about.sources_h': 'स्रोत एवं <span class="r">श्रेय</span>',
    'about.method_h': 'पद्धति',
    'notfound.h': 'यह पत्र <span class="r">रिक्त</span> है',
    'notfound.lede': 'जिस पृष्ठ की आपने खोज की वह इस अभिलेख में नहीं मिला। नीचे खोजें, या द्वार पर लौटें।',
    'notfound.back_home': 'द्वार पर लौटें',
    'footer.tagline': '“इनका अध्ययन और स्वाध्याय ही आत्मकल्याण का मार्ग है।”',
    'footer.sources_link': 'मूल छायाचित्र'
  },

  en: {
    /* Navigation & Toolbars */
    'nav.home': 'Home',
    'nav.kaal': 'Timeline',
    'nav.granths': 'Granths',
    'nav.acharya': 'Acharyas',
    'nav.bhattarak': 'Bhattarakas & Scholars',
    'nav.sources': 'Sources',
    'nav.about': 'About',

    /* Home Stats Plaques */
    'stats.g': 'principal ancient granths',
    'stats.a': 'acharyas & shramanas',
    'stats.b': 'bhattarakas & scholars',
    'stats.pdf': 'original shastra PDFs',
    'stats.pdf_sub': '64 Shastras',

    /* Home Hero & Sections */
    'hero.tag': 'History carved in stone — the Digambar Jain śruta tradition, <b>527 BCE to 1991 CE</b>',
    'home.kaal_h': 'Descend into the <span class="r">Timeline Strata</span>',
    'home.kaal_desc': '2,500 years like geological strata — each century a layer with a golden vein running through it; Acharyas along its banks, granths cutting through the strata like golden bands.',
    'home.kaal_btn': 'Begin Timeline Journey',

    /* Search Component */
    'ui.search_h': 'Search everything',
    'ui.search_ph': 'Search — samaysar, kundkund, todarmal… (Roman or देवनागरी)',
    'ui.search_hint': 'All three registries at once — matches Devanagari and Roman, entirely in your browser.',
    'ui.loading': 'Loading…',
    'ui.no_results': 'No results — try another spelling',
    'ui.today': "Today's inscription",
    'ui.daily': 'new each day',
    'ui.century_jump': 'Century',
    'ui.all': 'All',
    'kind.g': 'Granth',
    'kind.a': 'Acharya',
    'kind.b': 'Scholar',
    'ui.warn': '⚠ marks a row unclear in the source photograph',

    /* Granths Catalog */
    'granths.h': 'Granth Courtyard <span class="r">· 90 Slabs</span>',
    'granths.lede': '90 principal ancient texts in chronological order — each slab holds the text name, author, and century; inside lies its full inscription and PDF.',
    'granths.loading': 'Carving inscriptions…',
    'ui.only_pdf': '📖 Source PDFs only (64)',
    'ui.pdf_tag': '📖 PDF',
    'ui.has_text': 'Text ✓',

    /* Sources Page */
    'sources.h': 'Original Sources <span class="r">· Proof for every line</span>',
    'sources.lede': 'All site data is verbatim from these 25 archival photographs — the 90-Granth poster and Bhavatrayaphalapradarshi pages 6–29. Click any image to view in full resolution.',
    'sources.poster_h': '90 Granths — <span class="r">Poster</span>',
    'sources.bhavatraya_h': 'Bhavatrayaphalapradarshi — <span class="r">Pages 6–29</span>',
    'sources.shastras_h': '64 Canonical Shastras — <span class="r">Manuscript & Printed PDF Archive</span>',
    'sources.shastras_lede': 'Full original PDF editions of 64 out of the 90 canonical texts (manuscripts & early print editions) are available for self-study. Read them in the in-browser viewer with search and text highlighting, or download them directly.',
    'sources.search_shastras_ph': 'Search 64 Shastras (name, anuyoga)...',
    'sources.read_viewer': '📖 Read (Viewer)',

    /* PDF Viewer UI */
    'viewer.reader_title': 'Original Shastra PDF Reader',
    'viewer.tab_hits': '🔍 Search Results',
    'viewer.tab_catalog': '📚 64 Shastras',
    'viewer.search_hint': 'Type a word in the search box above to search (e.g. samaysar, jiva, moksha)',
    'viewer.loading_status': '॥ Namo Jināṇaṁ ॥',
    'viewer.loading_sub': 'Loading granth PDF...',
    'viewer.fallback_desc': 'This historical granth is stored on GitHub Releases. Due to browser security (CORS) rules, you can download it via the button below or open your downloaded PDF file here:',
    'viewer.download_remote': '⬇ Download Source PDF',
    'viewer.choose_local': '📂 Choose downloaded PDF file here',
    'viewer.choose_local_sub': '(Instant reader, search & text highlighting will activate upon selection)',
    'viewer.read_paath_btn': '📖 Read Digitized Scripture',
    'viewer.prev_page': 'Previous Page',
    'viewer.next_page': 'Next Page',
    'viewer.zoom_in': 'Zoom In (+)',
    'viewer.zoom_out': 'Zoom Out (-)',
    'viewer.zoom_reset': 'Reset Zoom',
    'viewer.search_btn': '🔍 Search',
    'viewer.back_to_granth': 'Granth Page',
    'viewer.back_to_catalog': 'Granth Catalog',
    'viewer.download_btn': '⬇ Download',
    'viewer.download_title': 'Download PDF',
    'viewer.fullscreen': 'Fullscreen',
    'viewer.prev_hit': 'Previous match',
    'viewer.next_hit': 'Next match',

    /* Detail / Reader Pages */
    'ui.toc': 'Contents',
    'ui.listen_this': 'Listen to this',
    'ui.copy_link': 'Copy link',
    'ui.texts_avail': 'Full texts available — read the whole granth',
    'ui.paath': 'Read the original text',
    'ui.back_granth': 'Granth page',
    'ui.fulltext': 'Read the full text',
    'ui.fulltext_note': 'Searches external libraries — opens in a new tab',
    'ui.pdf': 'Overview PDF',
    'ui.share': 'Share',
    'ui.same_pen': 'From the same pen',
    'ui.same_century': 'Contemporary granths',
    'ui.intro': 'Introduction',
    'ui.record': 'Record details',
    'ui.proof': 'Source',
    'ui.bookmark': '🔖 Bookmarks',
    'ui.bookmarked': '🔖 Saved',
    'ui.quote': '❝ Quote',
    'ui.quote_copied': '✓ Quote copied',
    'ui.listen': '▶ Listen',
    'ui.stop': '⏸ Pause',
    'ui.listen_verse': '▶ Listen to verse',
    'ui.resume': 'Resume ▶',
    'ui.offline_audio': '⬇ Offline Audio',
    'ui.offline_ready': '✓ Available Offline',
    'ui.bookmark_drawer_title': '🔖 Saved Bookmarks',
    'ui.bookmark_empty': 'No bookmarks saved yet.',
    'ui.bookmark_hint': 'Click the <b>🔖 Bookmarks</b> button while reading to save verses here.',
    'ui.last_read': '📖 Recently Read',
    'ui.read_from_where_left': '▶ Resume from where you left off',
    'ui.read_pdf_chip': '📖 Source PDF',
    'ui.read_pdf_btn': '📖 Read Source PDF',
    'ui.close': 'Close',
    'ui.share_copied': '✓ Link copied to clipboard',

    /* Kaal / Acharya / Bhattarak / About / 404 */
    'kaal.h': '<span class="r">Timeline Strata</span> — An Unbroken Journey',
    'kaal.lede': 'From Gautama Gandhara (527 BCE) to the 20th century — Acharyas, their granths, and later scholars, each on their layer of time. The guru\'s name is always the link.',
    'kaal.loading': 'Building strata layers…',
    'acharya.h': 'Acharya Lineage <span class="r">· 420</span>',
    'acharya.lede': 'Chronology of 420 Acharyas — period, name, guru, and principal work; century by century. Click a guru\'s name to highlight their row.',
    'bhattarak.h': 'Bhattarakas & Scholars <span class="r">· 172</span>',
    'bhattarak.lede': '172 Bhattarakas and later scholars — period, name, seat/type, and composed texts in chronological order.',
    'about.h': 'About',
    'about.lede': 'Shrutdhara — an open, free digital memorial to 2,500 years of unbroken Digambar Jain śruta heritage. No login, no tracking, no ads.',
    'about.sources_h': 'Sources & <span class="r">Credits</span>',
    'about.method_h': 'Methodology',
    'notfound.h': 'This folio is <span class="r">blank</span>',
    'notfound.lede': 'The page you requested was not found in this inscription. Search below, or return home.',
    'notfound.back_home': 'Return to Home',
    'footer.tagline': '"Their study and contemplation is the true path to self-liberation."',
    'footer.sources_link': 'Original Photographs'
  },

  sa: {
    /* Navigation & Toolbars */
    'nav.home': 'द्वारम्',
    'nav.kaal': 'कालयात्रा',
    'nav.granths': 'ग्रन्थाः',
    'nav.acharya': 'आचार्याः',
    'nav.bhattarak': 'भट्टारकाः विद्वांसश्च',
    'nav.sources': 'मूलस्रोतांसि',
    'nav.about': 'परिचयः',

    /* Home Stats Plaques */
    'stats.g': 'प्रमुखाः प्राचीनग्रन्थाः',
    'stats.a': 'आचार्याः श्रमणाश्च',
    'stats.b': 'भट्टारकाः विद्वांसश्च',
    'stats.pdf': 'मूलग्रन्थ-पीडीएफ़',
    'stats.pdf_sub': '६४ शास्त्राणि',

    /* Home Hero & Sections */
    'hero.tag': 'शिलोत्कीर्णः इतिहासः — दिगम्बरजैनश्रुतपरम्परा, <b>५२७ ई.पू. तः १९९१ ई. पर्यन्तम्</b>',
    'home.kaal_h': 'काल-स्तरेषु <span class="r">अवतरतु</span>',
    'home.kaal_desc': 'सार्धद्विसहस्रवर्षाणि भूस्तरीयपरता इव — प्रत्येकं शतकं स्तररूपम्, मध्यतः वहन्ती स्वर्णशिरा; तटे आचार्याः, ग्रन्थाश्च स्वर्णपट्टिकाभूताः।',
    'home.kaal_btn': 'कालयात्रा प्रारभ्यताम्',

    /* Search Component */
    'ui.search_h': 'सर्वान्वेषणम्',
    'ui.search_ph': 'अन्विष्यताम् — समयसार, कुन्दकुन्द…',
    'ui.search_hint': 'तिसृषु सूचीषु युगपद् अन्वेषणम् — देवनागर्या रोमनलिप्या च।',
    'ui.loading': 'निर्मीयते…',
    'ui.no_results': 'न किमपि लब्धम् — अन्यथा लिख्यताम्',
    'ui.today': 'अद्यतनोऽभिलेखः',
    'ui.daily': 'प्रतिदिनं नूतनः',
    'ui.century_jump': 'शतकम्',
    'ui.all': 'सर्वे',
    'kind.g': 'ग्रन्थः',
    'kind.a': 'आचार्यः',
    'kind.b': 'विद्वान्',
    'ui.warn': '⚠ चिह्नम् = मूलचित्रे अस्पष्टा पङ्क्तिः',

    /* Granths Catalog */
    'granths.h': 'ग्रन्थप्राङ्गणम् <span class="r">· ९० शिलाः</span>',
    'granths.lede': '९० प्रमुखाः प्राचीनग्रन्थाः, रचनाकालक्रमेण — प्रत्येकशिलायां ग्रन्थः, रचयिता, शतकं च; अन्तर्भागे सम्पूर्णविवरणं पीडीएफ़ च।',
    'granths.loading': 'शिलाः उत्कीर्यन्ते…',
    'ui.only_pdf': '📖 केवलाः मूल-पीडीएफ़ (६४)',
    'ui.pdf_tag': '📖 पीडीएफ़',
    'ui.has_text': 'पाठः ✓',

    /* Sources Page */
    'sources.h': 'मूलस्रोतांसि <span class="r">· प्रत्येकपङ्क्तेः प्रमाणम्</span>',
    'sources.lede': 'जालस्थानस्य समस्ततथ्यानि एतेभ्यः २५ छायाचित्रेभ्यः एव गृहीतानि — ९०-ग्रन्थसूचीचित्रं भावत्रयफलप्रदर्शिनः ६–२९ पृष्ठाणि च। चित्रं स्पृशतु: पूर्णरूपं दृश्यते।',
    'sources.poster_h': '९० ग्रन्थाः — <span class="r">चित्रफलकम्</span>',
    'sources.bhavatraya_h': 'भावत्रयफलप्रदर्शी — <span class="r">पृष्ठाणि ६–२९</span>',
    'sources.shastras_h': '६४ मूलग्रन्थाः — <span class="r">हस्तलिखित-मुद्रित-पीडीएफ़-संग्रहः</span>',
    'sources.shastras_lede': '९० ग्रन्थेषु ६४ प्राचीनग्रन्थानां सम्पूर्णाः मूल-पीडीएफ़-संस्करणाः स्वाध्यायार्थम् उपलभ्यन्ते। अन्तःपटले अन्वेषण-दीपनसहितं पठ्यतां वा स्वीक्रियताम्।',
    'sources.search_shastras_ph': '६४ शास्त्रेषु अन्विष्यताम् (नाम, अनुयोगः)...',
    'sources.read_viewer': '📖 पठ्यताम् (वाचकः)',

    /* PDF Viewer UI */
    'viewer.reader_title': 'मूलग्रन्थ-पीडीएफ़-वाचकः',
    'viewer.tab_hits': '🔍 अन्वेषणपरिणामाः',
    'viewer.tab_catalog': '📚 ६४ शास्त्राणि',
    'viewer.search_hint': 'अन्वेषणार्थम् उपरिस्थे कोष्ठे शब्दं लिखतु (यथा समयसार, जीव, मोक्ष)',
    'viewer.loading_status': '॥ नमो जिणाणं ॥',
    'viewer.loading_sub': 'ग्रन्थः आरोप्यते...',
    'viewer.fallback_desc': 'अयम् ऐतिहासिकग्रन्थः GitHub Releases मध्ये रक्षितः। जालचालक-सुरक्षाकारणात् अधस्तनेन पिञ्जेन डाउनलोडं कृत्वा वा अत्र उद्घाट्यताम्:',
    'viewer.download_remote': '⬇ मूलग्रन्थ-पीडीएफ़ डाउनलोडं करोतु',
    'viewer.choose_local': '📂 डाउनलोड-कृतां पीडीएफ़-सञ्चिकां चिनोतु',
    'viewer.choose_local_sub': '(चयनमात्रेण अन्तःपटलवाचकः, अन्वेषणं दीपनं च सद्यः सक्रियं भविष्यति)',
    'viewer.read_paath_btn': '📖 अङ्कीकृतं मूलपाठं पठतु',
    'viewer.prev_page': 'पूर्वपृष्ठम्',
    'viewer.next_page': 'उत्तरपृष्ठम्',
    'viewer.zoom_in': 'विस्तारयतु (+)',
    'viewer.zoom_out': 'सङ्कोचयतु (-)',
    'viewer.zoom_reset': 'यथावत् आकारः',
    'viewer.search_btn': '🔍 अन्विष्यताम्',
    'viewer.back_to_granth': 'ग्रन्थपृष्ठम्',
    'viewer.back_to_catalog': 'ग्रन्थसूची',
    'viewer.download_btn': '⬇ डाउनलोडं करोतु',
    'viewer.download_title': 'पीडीएफ़ डाउनलोडं करोतु',
    'viewer.fullscreen': 'सम्पूर्णपट्टम्',
    'viewer.prev_hit': 'पूर्वपरिणामः',
    'viewer.next_hit': 'अग्रिमपरिणामः',

    /* Detail / Reader Pages */
    'ui.toc': 'विषयसूची',
    'ui.listen_this': 'इदं शृणुत',
    'ui.copy_link': 'सङ्केतं प्रतिलिपयतु',
    'ui.texts_avail': 'उपलब्धाः मूलपाठाः',
    'ui.paath': 'मूलपाठः पठ्यताम्',
    'ui.back_granth': 'ग्रन्थपृष्ठम्',
    'ui.fulltext': 'सम्पूर्णग्रन्थपठनम्',
    'ui.fulltext_note': 'बाह्यग्रन्थालयेषु अन्वेषणम् — नवीने पटले उद्घाटयति',
    'ui.pdf': 'विवरण-पीडीएफ़',
    'ui.share': 'संविभजतु',
    'ui.same_pen': 'अस्यैव लेखन्याः',
    'ui.same_century': 'समकालीनग्रन्थाः',
    'ui.intro': 'संक्षिप्तपरिचयः',
    'ui.record': 'अभिलेखविवरणम्',
    'ui.proof': 'प्रमाणम्',
    'ui.bookmark': '🔖 पुस्तकाङ्कः',
    'ui.bookmarked': '🔖 रक्षितम्',
    'ui.quote': '❝ उद्धरणम्',
    'ui.quote_copied': '✓ प्रतिलिपिः कृता',
    'ui.listen': '▶ शृणुत',
    'ui.stop': '⏸ विरामयतु',
    'ui.listen_verse': '▶ इदं शृणुत',
    'ui.resume': 'अनुवर्तताम् ▶',
    'ui.offline_audio': '⬇ ऑफ़लाइन श्रव्यम्',
    'ui.offline_ready': '✓ ऑफ़लाइन उपलब्धम्',
    'ui.bookmark_drawer_title': '🔖 रक्षिताः पुस्तकाङ्काः',
    'ui.bookmark_empty': 'न कश्चिद् पुस्तकाङ्कः रक्षितः।',
    'ui.bookmark_hint': 'पाठपठनकाले <b>🔖 पुस्तकाङ्कः</b> बटन् नुत्वा श्लोकाः अत्र रक्ष्यन्ताम्।',
    'ui.last_read': '📖 अद्यतनं पठितम्',
    'ui.read_from_where_left': '▶ यत्र त्यक्तं तत एव अनुवर्तताम्',
    'ui.read_pdf_chip': '📖 मूलग्रन्थ-पीडीएफ़',
    'ui.read_pdf_btn': '📖 मूलग्रन्थ-पीडीएफ़ पठ्यताम्',
    'ui.close': 'पिदधातु',
    'ui.share_copied': '✓ सङ्केतः प्रतिलिपितः',

    /* Kaal / Acharya / Bhattarak / About / 404 */
    'kaal.h': '<span class="r">कालस्तराः</span> — एका अखण्डा यात्रा',
    'kaal.lede': 'भगवतो महावीरस्य प्रथमात् शिष्यात् गौतमगणधरात् विंशतिशतकं यावत् — आचार्याः, तेषां ग्रन्थाः, विद्वांसश्च स्वकालस्तरे। गुरोः नाम सर्वदा शृङ्खला।',
    'kaal.loading': 'कालस्तराः निर्मीयन्ते…',
    'acharya.h': 'आचार्यपरम्परा <span class="r">· ४२०</span>',
    'acharya.lede': 'आचार्यसमयानुक्रमणिका — कालः, नाम, गुरुः, प्रधाना कृतिश्च; शतकक्रमेण। गुरोः नाम्नि स्पृशतु: तेषां पङ्क्तिः दीपिता भविष्यति।',
    'bhattarak.h': 'भट्टारकाः विद्वांसश्च <span class="r">· १७२</span>',
    'bhattarak.lede': '१७२ भट्टारकाः उत्तरकालीनाः विद्वांसश्च — कालः, नाम, पीठम् / प्रकारः, रचिताः ग्रन्थाश्च; कालक्रमेण।',
    'about.h': 'परिचयः',
    'about.lede': 'श्रुतधारा — सार्धद्विसहस्रवर्षाणाम् अविच्छिन्नायाः दिगम्बरजैनश्रुतपरम्परायाः मुक्तः, निःशुल्कः अङ्कीयस्मारकः। न प्रवेशः, नानुसन्धानम्, न विज्ञापनम्।',
    'about.sources_h': 'स्रोतांसि <span class="r">गौरवं च</span>',
    'about.method_h': 'पद्धतिः',
    'notfound.h': 'इदं पत्रं <span class="r">रिक्तम्</span> अस्ति',
    'notfound.lede': 'भवता अन्विष्टं पृष्ठम् अस्मिन् अभिलेखे न लब्धम्। अधः अन्विष्यतां वा द्वारं प्रतिगम्यताम्।',
    'notfound.back_home': 'द्वारं प्रतिगम्यताम्',
    'footer.tagline': '“एतेषामध्ययनं स्वाध्यायश्चैव आत्मकल्याणस्य मार्गः।”',
    'footer.sources_link': 'मूलच्छायाचित्राणि'
  },

  pra: {
    /* Navigation & Toolbars */
    'nav.home': 'दुवारं',
    'nav.kaal': 'कालजत्ता',
    'nav.granths': 'गंथा',
    'nav.acharya': 'आयरिया',
    'nav.bhattarak': 'भट्टारया विउसा य',
    'nav.sources': 'मूलपमाणाइं',
    'nav.about': 'परिचओ',

    /* Home Stats Plaques */
    'stats.g': 'पमुहा पुराणगंथा',
    'stats.a': 'आयरिया समणा य',
    'stats.b': 'भट्टारया विउसा य',
    'stats.pdf': 'मूलगंथ-पीडीएफ़',
    'stats.pdf_sub': '६४ सत्था',

    /* Home Hero & Sections */
    'hero.tag': 'सिलाए उक्किण्णो इदिहासो — दिगंबरजइणसुयपरंपरा, <b>५२७ ई.पू. — १९९१ ई.</b>',
    'home.kaal_h': 'काल-थरेसु <span class="r">ओदरह</span>',
    'home.kaal_desc': 'अढाइसहस्सवासाणि भूथरा इव — पइ-सयं एक्को थरो, मज्झे वहमाणा सुवण्णसिरा; तडे आयरिया, गंथा य सुवण्णपट्टियाहूदा।',
    'home.kaal_btn': 'कालजत्ता आरंभह',

    /* Search Component */
    'ui.search_h': 'सव्वगवेसणा',
    'ui.search_ph': 'गवेसह — समयसार, कुन्दकुन्द…',
    'ui.search_hint': 'तिसु सूईसु एक्ककाले गवेसणा — देवणागरीए रोमणलिवीए य।',
    'ui.loading': 'णिम्मीयदि…',
    'ui.no_results': 'ण किंपि लद्धं — अण्णहा लिहह',
    'ui.today': 'अज्जं अहिलेहो',
    'ui.daily': 'पइदिणं णवो',
    'ui.century_jump': 'सयं',
    'ui.all': 'सव्वे',
    'kind.g': 'गंथो',
    'kind.a': 'आयरिओ',
    'kind.b': 'विउसो',
    'ui.warn': '⚠ चिण्हं = मूलचित्ते अप्फुडा पंती',

    /* Granths Catalog */
    'granths.h': 'गंथ-पंगणं <span class="r">· ९० सिलाओ</span>',
    'granths.lede': '९० पमुहा पुराणगंथा, रयणाकालकमेण — पइ-सिलाए गंथो, रइओ, सयं च; अब्भंतरे सव्वविवरणं पीडीएफ़ य।',
    'granths.loading': 'सिलाओ उक्किण्णंति…',
    'ui.only_pdf': '📖 केवलं मूल-पीडीएफ़ (६४)',
    'ui.pdf_tag': '📖 पीडीएफ़',
    'ui.has_text': 'पाढो ✓',

    /* Sources Page */
    'sources.h': 'मूलपमाणाइं <span class="r">· पइ-पंतीए पमाणं</span>',
    'sources.lede': 'ठाणस्स सव्वं दव्वं एदेहिं २५ छायाचित्तेहिं चेव गहिदं — ९०-गंथसूईचित्तं भावत्तयफलपदरिसिस्स ६–२९ पत्ताणि य। चित्तं फुसह: पुण्णरूवं दिस्सइ।',
    'sources.poster_h': '९० गंथा — <span class="r">चित्तफलओ</span>',
    'sources.bhavatraya_h': 'भावत्तयफलपदरिसी — <span class="r">पत्ताणि ६–२९</span>',
    'sources.shastras_h': '६४ मूलगंथा — <span class="r">हत्थलिहिद-मुद्दिद-पीडीएफ़-संगहो</span>',
    'sources.shastras_lede': '९० गंथेसु ६४ पुराणगंथाणं पुण्णा मूल-पीडीएफ़-संस्करणा सज्झाए उवलब्धंति। अंतोपडले गवेसणा-जोइसहिदं पढह वा गेण्हह।',
    'sources.search_shastras_ph': '६४ सत्थेसु गवेसह (णामं, अणुओगो)...',
    'sources.read_viewer': '📖 पढह (वाचओ)',

    /* PDF Viewer UI */
    'viewer.reader_title': 'मूलगंथ-पीडीएफ़-वाचओ',
    'viewer.tab_hits': '🔍 गवेसणा-पडिवत्ती',
    'viewer.tab_catalog': '📚 ६४ सत्था',
    'viewer.search_hint': 'गवेसणट्ठे उवरिल्ले कोट्टे सद्दं लिहह (जध समयसार, जीव, मोक्ख)',
    'viewer.loading_status': '॥ णमो जिणाणं ॥',
    'viewer.loading_sub': 'गंथो आरोविज्जइ...',
    'viewer.fallback_desc': 'अयं पुराणगंथो GitHub Releases मज्झे रखिओ। जालचालग-सुरक्खाकारणा हेद्विम-पिंजेण डाउनलोडं काऊण वा इध उग्घाडह:',
    'viewer.download_remote': '⬇ मूलगंथ-पीडीएफ़ डाउनलोडं करह',
    'viewer.choose_local': '📂 डाउनलोड-कयं पीडीएफ़-सञ्चियं चणह',
    'viewer.choose_local_sub': '(चणणमित्तेण अंतोपडलवाचओ, गवेसणा दीवणं च सव्वं सज्जं भविस्सइ)',
    'viewer.read_paath_btn': '📖 अंकिदं मूलपाढं पढह',
    'viewer.prev_page': 'पुव्वपत्तं',
    'viewer.next_page': 'उत्तरपत्तं',
    'viewer.zoom_in': 'विथ्थारयह (+)',
    'viewer.zoom_out': 'संकोयह (-)',
    'viewer.zoom_reset': 'जधावत्त अयारो',
    'viewer.search_btn': '🔍 गवेसह',
    'viewer.back_to_granth': 'गंथ-पत्तं',
    'viewer.back_to_catalog': 'गंथ-सूई',
    'viewer.download_btn': '⬇ डाउनलोडं करह',
    'viewer.download_title': 'पीडीएफ़ डाउनलोडं करह',
    'viewer.fullscreen': 'पुण्णपट्टं',
    'viewer.prev_hit': 'पुव्वपरिणामो',
    'viewer.next_hit': 'अग्गिमपरिणामो',

    /* Detail / Reader Pages */
    'ui.toc': 'विसयसूई',
    'ui.listen_this': 'एदं सुणह',
    'ui.copy_link': 'संकेदं पडिलिवह',
    'ui.texts_avail': 'उवलद्धा मूलपाढा',
    'ui.paath': 'मूलपाढं पढह',
    'ui.back_granth': 'गंथ-पत्तं',
    'ui.fulltext': 'पुण्णं गंथं पढह',
    'ui.fulltext_note': 'बाहिरगंथालएसु गवेसणा — णवे पडले उग्घाडइ',
    'ui.pdf': 'विवरण-पीडीएफ़',
    'ui.share': 'संविभयह',
    'ui.same_pen': 'एदस्सेव लेहणीए',
    'ui.same_century': 'समकालीणा गंथा',
    'ui.intro': 'संखेवपरिचओ',
    'ui.record': 'अहिलेह-विवरणं',
    'ui.proof': 'पमाणं',
    'ui.bookmark': '🔖 पोत्थयांकं',
    'ui.bookmarked': '🔖 रखियं',
    'ui.quote': '❝ उद्धरणं',
    'ui.quote_copied': '✓ पडिलिवि कया',
    'ui.listen': '▶ सुणह',
    'ui.stop': '⏸ विरामयह',
    'ui.listen_verse': '▶ एदं सुणह',
    'ui.resume': 'अणुवत्तह ▶',
    'ui.offline_audio': '⬇ ओफलाइन सद्दं',
    'ui.offline_ready': '✓ ओफलाइन उवलद्धं',
    'ui.bookmark_drawer_title': '🔖 रखिया पोत्थयांका',
    'ui.bookmark_empty': 'ण कोवि पोत्थयांको रखियो।',
    'ui.bookmark_hint': 'पाढपढणकाले <b>🔖 पोत्थयांकं</b> बटनं पोत्तूण गाहाइयं इध रखह।',
    'ui.last_read': '📖 अज्जं पढियं',
    'ui.read_from_where_left': '▶ जध छड्डियं तध चेव अणुवत्तह',
    'ui.read_pdf_chip': '📖 मूलगंथ-पीडीएफ़',
    'ui.read_pdf_btn': '📖 मूलगंथ-पीडीएफ़ पढह',
    'ui.close': 'पिदहह',
    'ui.share_copied': '✓ संकेदो पडिलिविओ',

    /* Kaal / Acharya / Bhattarak / About / 404 */
    'kaal.h': '<span class="r">कालथरा</span> — एक्का अखंडा जत्ता',
    'kaal.lede': 'भगवओ महावीरस्स पढमाओ सिस्साओ गोदमगणिहराओ वीसइमं सयं जाव — आयरिया, ताणं गंथा, विउसा य सअकालथरे। गुरुणो णामं सव्वदा संकलिया।',
    'kaal.loading': 'कालथरा णिम्मीयंति…',
    'acharya.h': 'आयरियपरंपरा <span class="r">· ४२०</span>',
    'acharya.lede': 'आयरियसमयाणुक्कमणिया — कालो, णामं, गुरू, पमुहा कित्ती य; सयक्रमेण। गुरुणो णामे फुसह: ताणं पंती जोइदा भविस्सइ।',
    'bhattarak.h': 'भट्टारया विउसा य <span class="r">· १७२</span>',
    'bhattarak.lede': '१७२ भट्टारया उत्तरकालीणा विउसा य — कालो, णामं, पीढं / पयारो, रचिदा गंथा य; कालकमेण।',
    'about.h': 'परिचओ',
    'about.lede': 'सुयधारा — अढाइसहस्सवासाणं अविच्छिण्णाए दिगंबरजइणसुयपरंपराए मुत्तो, णिस्सुल्को अंकिदथंभो। ण पवेसो, ण अणुसरणं, ण विज्जावणं।',
    'about.sources_h': 'पमाणाइं <span class="r">गुणगहणं च</span>',
    'about.method_h': 'पद्धदी',
    'notfound.h': 'एदं पत्तं <span class="r">रित्तं</span> अत्थि',
    'notfound.lede': 'तुब्भेहिं गवेसिदं पत्तं इहं अहिलेहे ण लद्धं। हेद्दे गवेसह वा दुवारं पडिगच्छह।',
    'notfound.back_home': 'दुवारं पडिगच्छह',
    'footer.tagline': '“एदाणं अज्झयणं सज्झाओ चेव अप्पकल्लाणस्स मग्गो।”',
    'footer.sources_link': 'मूलच्छायाचित्ताणि'
  }
};

const KEY = 'sd-lang';
export const lang = (() => {
  try {
    const l = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return (l && DICT[l]) ? l : 'hi';
  } catch {
    return 'hi';
  }
})();

export function t(k, fallback) {
  if (!k) return '';
  return (DICT[lang] && DICT[lang][k]) || (DICT.hi && DICT.hi[k]) || fallback || k;
}
if (typeof window !== 'undefined') window.sdT = t;

export function tName(str) {
  return lang === 'en' ? translit(str) : str;
}
if (typeof window !== 'undefined') window.sdName = tName;

export function apply(scope = (typeof document !== 'undefined' ? document : null)) {
  if (!scope) return;
  if (typeof document !== 'undefined' && (scope === document || scope === document.documentElement)) {
    const r = document.documentElement;
    r.setAttribute('data-lang', lang);
    r.setAttribute('lang', { hi: 'hi', en: 'en', sa: 'sa', pra: 'pra' }[lang] || 'hi');
  }

  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.getAttribute('data-i18n');
    const val = t(k);
    if (val) el.innerHTML = val;
  });

  scope.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const k = el.getAttribute('data-i18n-ph');
    const val = t(k);
    if (val) el.setAttribute('placeholder', val);
  });

  scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const k = el.getAttribute('data-i18n-title');
    const val = t(k);
    if (val) el.setAttribute('title', val);
  });

  scope.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const k = el.getAttribute('data-i18n-aria');
    const val = t(k);
    if (val) el.setAttribute('aria-label', val);
  });

  scope.querySelectorAll('[data-dv]').forEach((el) => {
    const dv = el.getAttribute('data-dv');
    el.innerHTML = tName(dv);
  });

  const sel = scope.getElementById ? scope.getElementById('langSel') : (typeof document !== 'undefined' ? document.getElementById('langSel') : null);
  if (sel && !sel._hasLangListener) {
    sel.value = lang;
    sel._hasLangListener = true;
    sel.addEventListener('change', () => {
      try {
        localStorage.setItem(KEY, sel.value);
      } catch {}
      if (typeof location !== 'undefined' && location.reload) {
        location.reload();
      }
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply(document));
  } else {
    apply(document);
  }
}
