/* श्रुतधारा i18n — UI chrome in hi / en / sa (संस्कृतम्) / pra (प्राकृत).
   Content (names, tables, curated intros) stays Devanagari; en adds romanized
   subtitles and an English auto-description. sa/pra fall back to hi for prose. */

const DICT = {
  hi: {
    'ui.toc': 'विषय-सूची', 'ui.listen_this': 'यह सुनें', 'ui.copy_link': 'कड़ी कॉपी करें',
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
    'ui.bookmark': '🔖 बुकमार्क', 'ui.bookmarked': '🔖 सहेजा गया',
    'ui.quote': '❝ उद्धरण', 'ui.quote_copied': '✓ उद्धरण कॉपी हुआ',
    'ui.listen': '▶ सुनें', 'ui.stop': '⏸ रोकें', 'ui.listen_verse': '▶ यह सुनें',
    'ui.resume': 'जारी रखें ▶', 'ui.offline_audio': '⬇ ऑफ़लाइन ऑडियो', 'ui.offline_ready': '✓ ऑफ़लाइन उपलब्ध',
    'ui.bookmark_drawer_title': '🔖 सहेजे गए बुकमार्क', 'ui.bookmark_empty': 'कोई बुकमार्क सहेजा नहीं गया है।',
    'ui.bookmark_hint': 'पाठ पढ़ते समय <b>🔖 बुकमार्क</b> बटन दबाकर किसी भी श्लोक या गाथा को यहाँ सहेजें।',
    'ui.last_read': '📖 हाल ही में पढ़ा गया', 'ui.read_from_where_left': '▶ जहाँ छोड़ा था वहीं से जारी रखें'
  },
  en: {
    'ui.toc': 'Contents', 'ui.listen_this': 'Listen to this', 'ui.copy_link': 'Copy link',
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
    'ui.bookmark': '🔖 Bookmarks', 'ui.bookmarked': '🔖 Saved',
    'ui.quote': '❝ Quote', 'ui.quote_copied': '✓ Quote copied',
    'ui.listen': '▶ Listen', 'ui.stop': '⏸ Pause', 'ui.listen_verse': '▶ Listen to verse',
    'ui.resume': 'Resume ▶', 'ui.offline_audio': '⬇ Offline Audio', 'ui.offline_ready': '✓ Available Offline',
    'ui.bookmark_drawer_title': '🔖 Saved Bookmarks', 'ui.bookmark_empty': 'No bookmarks saved yet.',
    'ui.bookmark_hint': 'Click the <b>🔖 Bookmarks</b> button while reading to save verses here.',
    'ui.last_read': '📖 Recently Read', 'ui.read_from_where_left': '▶ Resume from where you left off'
  },
  sa: {
    'ui.toc': 'विषयसूची', 'ui.listen_this': 'इदं शृणुत', 'ui.copy_link': 'सङ्केतं प्रतिलिपयतु',
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
    'ui.bookmark': '🔖 पुस्तकाङ्कः', 'ui.bookmarked': '🔖 रक्षितम्',
    'ui.quote': '❝ उद्धरणम्', 'ui.quote_copied': '✓ प्रतिलिपिः कृता',
    'ui.listen': '▶ शृणुत', 'ui.stop': '⏸ विरामयतु', 'ui.listen_verse': '▶ इदं शृणुत',
    'ui.resume': 'अनुवर्तताम् ▶', 'ui.offline_audio': '⬇ ऑफ़लाइन श्रव्यम्', 'ui.offline_ready': '✓ ऑफ़लाइन उपलब्धम्',
    'ui.bookmark_drawer_title': '🔖 रक्षिताः पुस्तकाङ्काः', 'ui.bookmark_empty': 'न कश्चिद् पुस्तकाङ्कः रक्षितः।',
    'ui.bookmark_hint': 'पाठपठनकाले <b>🔖 पुस्तकाङ्कः</b> बटन् नुत्वा श्लोकाः अत्र रक्ष्यन्ताम्।',
    'ui.last_read': '📖 अद्यतनं पठितम्', 'ui.read_from_where_left': '▶ यत्र त्यक्तं तत एव अनुवर्तताम्'
  },
  pra: {
    'ui.toc': 'विसयसूई', 'ui.listen_this': 'एदं सुणह', 'ui.copy_link': 'संकेदं पडिलिवह',
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
    'ui.bookmark': '🔖 पोत्थयांकं', 'ui.bookmarked': '🔖 रखियं',
    'ui.quote': '❝ उद्धरणं', 'ui.quote_copied': '✓ पडिलिवि कया',
    'ui.listen': '▶ सुणह', 'ui.stop': '⏸ विरामयह', 'ui.listen_verse': '▶ एदं सुणह',
    'ui.resume': 'अणुवत्तह ▶', 'ui.offline_audio': '⬇ ओफलाइन सद्दं', 'ui.offline_ready': '✓ ओफलाइन उवलद्धं',
    'ui.bookmark_drawer_title': '🔖 रखिया पोत्थयांका',
    'ui.bookmark_empty': 'ण कोवि पोत्थयांको रखियो।',
    'ui.bookmark_hint': 'पाढपढणकाले <b>🔖 पोत्थयांकं</b> बटनं पोत्तूण गाहाइयं इध रखह।',
    'ui.last_read': '📖 अज्जं पढियं', 'ui.read_from_where_left': '▶ जध छड्डियं तध चेव अणुवत्तह'
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
window.sdT = t;

import { translit } from './translit.js';

export function tName(str) {
  return lang === 'en' ? translit(str) : str;
}
window.sdName = tName;

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
  document.querySelectorAll('[data-dv]').forEach((el) => {
    const dv = el.getAttribute('data-dv');
    el.innerHTML = tName(dv);
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
