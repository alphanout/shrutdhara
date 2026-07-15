/* श्रुतधारा i18n — UI chrome in hi / en / sa (संस्कृतम्) / pra (प्राकृत).
   Content (names, tables, curated intros) stays Devanagari; en adds romanized
   subtitles and an English auto-description. sa/pra fall back to hi for prose. */

const DICT = {
  hi: {
    'ui.texts_avail': 'उपलब्ध मूल पाठ — पूरा ग्रन्थ पढ़ें',
    'ui.paath': 'मूल पाठ पढ़ें', 'ui.back_granth': 'ग्रन्थ-पृष्ठ',
    'ui.fulltext': 'सम्पूर्ण ग्रन्थ पढ़ें', 'ui.fulltext_note': 'बाह्य ग्रन्थालयों में खोज — नई टैब में खुलेगी',
    'nav.home': 'द्वार', 'nav.kaal': 'काल-स्तर', 'nav.granths': 'ग्रन्थ', 'nav.acharya': 'आचार्य',
    'nav.bhattarak': 'भट्टारक-विद्वान', 'nav.sources': 'मूल स्रोत', 'nav.about': 'परिचय',
    'stats.g': 'प्रमुख प्राचीन ग्रन्थ', 'stats.a': 'आचार्य एवं श्रमण', 'stats.b': 'भट्टारक एवं विद्वान',
    'hero.tag': 'पत्थर पर खुदा इतिहास — <b>५२७ ई.पू. से १९९१ ई. तक</b> की दिगम्बर जैन श्रुत-परम्परा',
    'ui.search_h': 'सर्वखोज', 'ui.search_ph': 'खोजें — समयसार, कुन्दकुन्द, टोडरमल… या रोमन में ‘samaysar’',
    'ui.search_hint': 'तीनों सूचियाँ एक साथ — देवनागरी और रोमन दोनों से मिलान, ब्राउज़र में ही।',
    'ui.today': 'आज का अभिलेख', 'ui.daily': 'प्रतिदिन नया',
    'ui.pdf': 'पीडीएफ़ डाउनलोड', 'ui.share': 'साझा करें',
    'ui.same_pen': 'इसी लेखनी से', 'ui.same_century': 'समकालीन ग्रन्थ',
    'ui.intro': 'संक्षिप्त परिचय', 'ui.record': 'अभिलेख-विवरण', 'ui.proof': 'प्रमाण',
    'ui.loading': 'सूची बन रही है…', 'ui.no_results': 'कोई परिणाम नहीं — वर्तनी बदल कर देखें',
    'ui.century_jump': 'शताब्दी', 'ui.all': 'सभी',
    'kind.g': 'ग्रन्थ', 'kind.a': 'आचार्य', 'kind.b': 'विद्वान',
    'ui.warn': '⚠ चिह्न = मूल छायाचित्र में अस्पष्ट पंक्ति',
  },
  en: {
    'ui.texts_avail': 'Full texts available — read the whole granth',
    'ui.paath': 'Read the original text', 'ui.back_granth': 'Granth page',
    'ui.fulltext': 'Read the full text', 'ui.fulltext_note': 'Searches external libraries — opens in a new tab',
    'nav.home': 'Home', 'nav.kaal': 'Timeline', 'nav.granths': 'Granths', 'nav.acharya': 'Acharyas',
    'nav.bhattarak': 'Bhattarakas & Scholars', 'nav.sources': 'Sources', 'nav.about': 'About',
    'stats.g': 'principal ancient granths', 'stats.a': 'acharyas & shramanas', 'stats.b': 'bhattarakas & scholars',
    'hero.tag': 'History carved in stone — the Digambar Jain śruta tradition, <b>527 BCE to 1991 CE</b>',
    'ui.search_h': 'Search everything', 'ui.search_ph': 'Search — samaysar, kundkund, todarmal… (Roman or देवनागरी)',
    'ui.search_hint': 'All three registries at once — matches Devanagari and Roman, entirely in your browser.',
    'ui.today': "Today's inscription", 'ui.daily': 'new each day',
    'ui.pdf': 'Download PDF', 'ui.share': 'Share',
    'ui.same_pen': 'From the same pen', 'ui.same_century': 'Contemporary granths',
    'ui.intro': 'Introduction', 'ui.record': 'Record details', 'ui.proof': 'Source',
    'ui.loading': 'Loading…', 'ui.no_results': 'No results — try another spelling',
    'ui.century_jump': 'Century', 'ui.all': 'All',
    'kind.g': 'Granth', 'kind.a': 'Acharya', 'kind.b': 'Scholar',
    'ui.warn': '⚠ marks a row unclear in the source photograph',
  },
  sa: {
    'ui.texts_avail': 'उपलब्धाः मूलपाठाः',
    'ui.paath': 'मूलपाठः पठ्यताम्', 'ui.back_granth': 'ग्रन्थपृष्ठम्',
    'ui.fulltext': 'सम्पूर्णग्रन्थपठनम्', 'ui.fulltext_note': 'बाह्यग्रन्थालयेषु अन्वेषणम् — नवीने पटले उद्घाटयति',
    'nav.home': 'द्वारम्', 'nav.kaal': 'कालयात्रा', 'nav.granths': 'ग्रन्थाः', 'nav.acharya': 'आचार्याः',
    'nav.bhattarak': 'भट्टारकाः विद्वांसश्च', 'nav.sources': 'मूलस्रोतांसि', 'nav.about': 'परिचयः',
    'stats.g': 'प्रमुखाः प्राचीनग्रन्थाः', 'stats.a': 'आचार्याः श्रमणाश्च', 'stats.b': 'भट्टारकाः विद्वांसश्च',
    'hero.tag': 'शिलोत्कीर्णः इतिहासः — दिगम्बरजैनश्रुतपरम्परा, <b>५२७ ई.पू. तः १९९१ ई. पर्यन्तम्</b>',
    'ui.search_h': 'सर्वान्वेषणम्', 'ui.search_ph': 'अन्विष्यताम् — समयसार, कुन्दकुन्द…',
    'ui.search_hint': 'तिसृषु सूचीषु युगपद् अन्वेषणम् — देवनागर्या रोमनलिप्या च।',
    'ui.today': 'अद्यतनोऽभिलेखः', 'ui.daily': 'प्रतिदिनं नूतनः',
    'ui.pdf': 'पीडीएफ़ गृह्यताम्', 'ui.share': 'संविभजतु',
    'ui.same_pen': 'अस्यैव लेखन्याः', 'ui.same_century': 'समकालीनग्रन्थाः',
    'ui.intro': 'संक्षिप्तपरिचयः', 'ui.record': 'अभिलेखविवरणम्', 'ui.proof': 'प्रमाणम्',
    'ui.loading': 'निर्मीयते…', 'ui.no_results': 'न किमपि लब्धम् — अन्यथा लिख्यताम्',
    'ui.century_jump': 'शतकम्', 'ui.all': 'सर्वे',
    'kind.g': 'ग्रन्थः', 'kind.a': 'आचार्यः', 'kind.b': 'विद्वान्',
    'ui.warn': '⚠ चिह्नम् = मूलचित्रे अस्पष्टा पङ्क्तिः',
  },
  pra: {
    'ui.texts_avail': 'उवलद्धा मूलपाढा',
    'ui.paath': 'मूलपाढं पढह', 'ui.back_granth': 'गंथ-पत्तं',
    'ui.fulltext': 'पुण्णं गंथं पढह', 'ui.fulltext_note': 'बाहिरगंथालएसु गवेसणा — णवे पडले उग्घाडइ',
    'nav.home': 'दुवारं', 'nav.kaal': 'कालजत्ता', 'nav.granths': 'गंथा', 'nav.acharya': 'आयरिया',
    'nav.bhattarak': 'भट्टारया विउसा य', 'nav.sources': 'मूलपमाणाइं', 'nav.about': 'परिचओ',
    'stats.g': 'पमुहा पुराणगंथा', 'stats.a': 'आयरिया समणा य', 'stats.b': 'भट्टारया विउसा य',
    'hero.tag': 'सिलाए उक्किण्णो इदिहासो — दिगंबरजइणसुयपरंपरा, <b>५२७ ई.पू. — १९९१ ई.</b>',
    'ui.search_h': 'सव्वगवेसणा', 'ui.search_ph': 'गवेसह — समयसार, कुन्दकुन्द…',
    'ui.search_hint': 'तिसु सूईसु एक्ककाले गवेसणा — देवणागरीए रोमणलिवीए य।',
    'ui.today': 'अज्जं अहिलेहो', 'ui.daily': 'पइदिणं णवो',
    'ui.pdf': 'पीडीएफ़ गेण्हह', 'ui.share': 'संविभयह',
    'ui.same_pen': 'एदस्सेव लेहणीए', 'ui.same_century': 'समकालीणा गंथा',
    'ui.intro': 'संखेवपरिचओ', 'ui.record': 'अहिलेह-विवरणं', 'ui.proof': 'पमाणं',
    'ui.loading': 'णिम्मीयदि…', 'ui.no_results': 'ण किंपि लद्धं — अण्णहा लिहह',
    'ui.century_jump': 'सयं', 'ui.all': 'सव्वे',
    'kind.g': 'गंथो', 'kind.a': 'आयरिओ', 'kind.b': 'विउसो',
    'ui.warn': '⚠ चिण्हं = मूलचित्ते अप्फुडा पंती',
  },
};

const KEY = 'sd-lang';
export const lang = (() => {
  const l = localStorage.getItem(KEY);
  return DICT[l] ? l : 'hi';
})();

export function t(k) {
  return (DICT[lang] && DICT[lang][k]) || DICT.hi[k] || k;
}

function apply() {
  const r = document.documentElement;
  r.setAttribute('data-lang', lang);
  r.setAttribute('lang', { hi: 'hi', en: 'en', sa: 'sa', pra: 'pra' }[lang]);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.innerHTML = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
  const sel = document.getElementById('langSel');
  if (sel) {
    sel.value = lang;
    sel.addEventListener('change', () => {
      localStorage.setItem(KEY, sel.value);
      location.reload();
    });
  }
}
apply();
