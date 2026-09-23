/* ============================================================
   श्रुतधारा · Font Converter (Unicode <-> KrutiDev / APS-DV / Legacy)
   Dual-Query Search & Legacy Font Normalization
   ============================================================ */

// ------------------------------------------------------------
// 1. KrutiDev 010 Mappings
// ------------------------------------------------------------
const KD_UNICODE_MAP = {
  'अ': 'v', 'आ': 'vk', 'इ': 'b', 'ई': 'bZ', 'उ': 'm', 'ऊ': 'Å',
  'ऋ': '_', 'ए': ',', 'ऐ': ',s', 'ओ': 'vks', 'औ': 'vkS',
  'क': 'd', 'क्': 'D', 'ख': '[k', 'ख्': '[', 'ग': 'x', 'ग्': 'X',
  'घ': '?k', 'घ्': '?', 'ङ': '³',
  'च': 'p', 'च्': 'P', 'छ': 'N', 'ज': 't', 'ज्': 'T',
  'झ': '÷k', 'झ्': '÷', 'ञ': '¥',
  'ट': 'V', 'ठ': 'B', 'ड': 'M', 'ढ': '<', 'ण': '.k', 'ण्': '.',
  'त': 'r', 'त्': 'R', 'थ': 'Fk', 'थ्': 'F', 'द': 'n', 'ध': '/k', 'ध्': '/',
  'न': 'u', 'न्': 'U',
  'प': 'i', 'प्': 'I', 'फ': 'Q', 'फ्': '¶', 'ब': 'c', 'ब्': 'C',
  'भ': 'Hk', 'भ्': 'H', 'म': 'e', 'म्': 'E',
  'य': ';', 'य्': '¸', 'र': 'j', 'ल': 'y', 'ल्': 'Y', 'व': 'o', 'व्': 'O',
  'श': "'k", 'श्': "'", 'ष': '"k', 'ष्': '"', 'स': 'l', 'स्': 'L', 'ह': 'g',
  'क्ष': '{k', 'क्ष्': '{', 'त्र': '=', 'त्र्': '«', 'ज्ञ': 'K', 'श्र': 'J',
  'ा': 'k', 'ी': 'h', 'ु': 'q', 'ू': 'w', 'ृ': '`',
  'े': 's', 'ै': 'S', 'ो': 'ks', 'ौ': 'kS',
  'ं': 'a', 'ँ': '¡', 'ः': '%', '्': '~', '।': 'A', '॥': 'AA',
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

// ------------------------------------------------------------
// 2. APS-DV Mappings
// ------------------------------------------------------------
const APS_UNICODE_MAP = {
  'अ': 'De', 'आ': 'Dee', 'इ': 'F', 'ई': 'F&', 'उ': 'G', 'ऊ': 'T',
  'ऋ': '$e+', 'ए': 'S', 'ऐ': 'Sे', 'ओ': 'Dees', 'औ': 'Deew',
  'क': 'keâ', 'क्': 'keä', 'ख': 'Ke', 'ख्': 'K', 'ग': 'ie', 'ग्': 'i',
  'घ': 'Ie', 'घ्': 'I', 'ङ': '*',
  'च': 'Ûe', 'च्': 'Û', 'छ': 'Ú', 'ज': 'pe', 'ज्': 'p',
  'झ': 'Pe', 'झ्': 'P', 'ञ': '_',
  'ट': 'š', 'ठ': '"', 'ड': '[', 'ढ': '{', 'ण': 'Ce', 'ण्': 'C',
  'त': 'le', 'त्': 'l', 'थ': 'Le', 'थ्': 'L', 'द': 'o', 'ध': 'Oe', 'ध्': 'O',
  'न': 've', 'न्': 'v',
  'प': 'he', 'प्': 'h', 'फ': 'Heâ', 'फ्': 'heä', 'ब': 'ye', 'ब्': 'y',
  'भ': 'Ye', 'भ्': 'Y', 'म': 'ce', 'म्': 'c',
  'य': 'Ùe', 'य्': 'Ù', 'र': 'j', 'ल': 'ue', 'ल्': 'u', 'व': 'Je', 'व्': 'J',
  'श': 'Me', 'श्': 'M', 'ष': '<e', 'ष्': '<', 'स': 'me', 'स्': 'm', 'ह': 'n', 'ह्': 'å',
  'क्ष': '#e', 'क्ष्': '#', 'त्र': '$e', 'त्र्': '$', 'ज्ञ': '%e', 'ज्ञ्': '%', 'श्र': 'ß',
  'प्र': 'Øe', 'प्र्': 'Ø', 'द्र': 'õ', 'द्ध': 'æ', 'द्द': 'ö', 'द्य': 'Åe', 'द्य्': 'Å', 'द्व': 'É',
  'ा': 'e', 'ी': 'er', 'ु': 'g', 'ू': 't', 'ृ': '=',
  'े': 's', 'ै': 'w', 'ो': 'es', 'ौ': 'ew',
  'ं': 'b', 'ँ': 'B', 'ः': 'Š', '्': 'd', '।': '~',
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

// ------------------------------------------------------------
// Forward Converters (Devanagari Unicode -> Legacy ASCII)
// ------------------------------------------------------------

export function toKrutiDev(text) {
  if (!text) return '';
  // 1. Move short 'i' matra before consonant: C + ि -> f + C
  const reShortI = /([क-ह](?:्[क-ह])*)ि/g;
  let s = text.replace(reShortI, 'f$1');

  // 2. Move reph 'र्' after syllable: र् + C -> C + Z
  const reReph = /र्([क-ह](?:[ाीुूृेैोौंँ])*)/g;
  s = s.replace(reReph, '$1Z');

  let out = '';
  let i = 0;
  while (i < s.length) {
    let matched = false;
    for (let len = 4; len >= 1; len--) {
      const sub = s.substring(i, i + len);
      if (KD_UNICODE_MAP[sub]) {
        out += KD_UNICODE_MAP[sub];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += s[i];
      i++;
    }
  }
  return out;
}

export function toApsDv(text) {
  if (!text) return '';
  // 1. Short 'i' in APS-DV is prefixed as 'ef'
  const reShortI = /([क-ह](?:्[क-ह])*)ि/g;
  let s = text.replace(reShortI, 'ef$1');

  // 2. Reph 'र्' in APS-DV is suffixed as '&'
  const reReph = /र्([क-ह](?:[ाीुूृेैोौंँ])*)/g;
  s = s.replace(reReph, '$1&');

  let out = '';
  let i = 0;
  while (i < s.length) {
    let matched = false;
    for (let len = 4; len >= 1; len--) {
      const sub = s.substring(i, i + len);
      if (APS_UNICODE_MAP[sub]) {
        out += APS_UNICODE_MAP[sub];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += s[i];
      i++;
    }
  }
  return out;
}

/**
 * Returns an array of search variants for a given user query.
 * If query contains Devanagari characters, automatically computes
 * KrutiDev and APS-DV representations (including common stem variants).
 */
export function unicodeToLegacyVariants(query) {
  if (!query) return [];
  const q = query.trim();
  if (!q) return [];

  const variants = new Set([q]);

  // Check if string contains Devanagari characters
  if (/[\u0900-\u097F]/.test(q)) {
    // 1. KrutiDev representation (e.g. राग -> jkx)
    const kd = toKrutiDev(q);
    if (kd && kd !== q) {
      variants.add(kd);
      variants.add(kd.toLowerCase());
    }

    // 2. APS-DV representation (e.g. राग -> jeie)
    const aps = toApsDv(q);
    if (aps && aps !== q) {
      variants.add(aps);
      variants.add(aps.toLowerCase());

      // If ends with 'e' (as in full consonant like 'ie' for ग, 'le' for त),
      // also add the stem without final 'e' (e.g. 'jei' for राग, 'Deehl' for आप्त)
      if (aps.endsWith('e') && aps.length > 2) {
        const stem = aps.slice(0, -1);
        variants.add(stem);
        variants.add(stem.toLowerCase());
      }
    }

    // Common Jain shastra terms fast-lookup variants
    const FAST_VARIANTS = {
      'राग': ['jeie', 'jei', 'jkx'],
      'रागी': ['jeieer', 'jeier', 'jkxh'],
      'द्वेष': ['És<e', 'És<', '}os"k'],
      'आप्त': ['Deehle', 'Deehl', 'vkIr'],
      'आप्तमीमांसा': ['Deehleceerceebmee', 'Deehleceerceebm', 'vkIrcehekalk'],
      'समयसार': ['meceÙemeej', 'lece;lkj', 'le;lkj'],
      'जीव': ['peerJe', 'peerJ', 'tho'],
      'अजीव': ['DepeerJe', 'DepeerJ', 'vatho'],
      'मोक्ष': ['cees#e', 'cees#', 'eks{k', 'eks{'],
      'ज्ञान': ['%eeve', '%eev', 'Kkku', 'Kku'],
      'मुनि': ['cegefve', 'cegfeve', 'eqfu'],
      'धर्म': ['Oece&', '/keZ'],
      'जिन': ['efpeve', 'ftu'],
      'आचार्य': ['DeeÛeeÙe&', 'vkpk;Z'],
      'गाथा': ['ieeLee', 'xkFkk'],
      'श्लोक': ['ßueeskeâ', '’yksd'],
      'कुन्दकुन्द': ['kegâvonkegâvon', 'dqanqdqa']
    };

    if (FAST_VARIANTS[q]) {
      for (const v of FAST_VARIANTS[q]) {
        variants.add(v);
        variants.add(v.toLowerCase());
      }
    }
  }

  return Array.from(variants).filter(Boolean);
}

// ------------------------------------------------------------
// Reverse Decoding Tables (Legacy ASCII -> Devanagari Unicode)
// ------------------------------------------------------------

const APS_REVERSE_PAIRS = [
  // Multi-character ligatures & prefixes
  ['ÜeR', 'ह्रीं'], ['DenË', 'अर्हं'], ['ßeer', 'श्री'], ['ßee', 'श्रा'],
  ['kesâ', 'के'], ['ke=â', 'कृ'], ['kegâ', 'कु'], ['keä', 'क्'], ['keâ', 'क'],
  ['Heâ', 'फ'], ['heâ', 'फ'], ['Heä', 'फ्'], ['heä', 'फ्'],
  ['òeâ', 'क्त'], ['òe', 'त्त'], ['§', 'श्च'], ['«', 'ग्र'], ['ß', 'श्र'], ['õ', 'द्र'],
  ['æ', 'द्ध'], ['ö', 'द्द'], ['Åe', 'द्य'], ['Å', 'द्य्'], ['É', 'द्व'],
  ['#e', 'क्ष'], ['#', 'क्ष्'], ['$e', 'त्र'], ['$', 'त्र्'], ['%e', 'ज्ञ'], ['%', 'ज्ञ्'],
  ['Øe', 'प्र'], ['Ø', 'प्र्'], ['Me', 'श'], ['M', 'श्'], ['Me', 'श'],
  ['Dee@', 'ऑ'], ['Dees', 'ओ'], ['Deew', 'औ'], ['Dee', 'आ'], ['De', 'अ'],
  ['F&', 'ई'], ['F', 'इ'], ['G', 'उ'], ['T', 'ऊ'], ['Sे', 'ऐ'], ['S', 'ए'],
  ['e&â', 'ार्क'], ['e&', 'ार्'], ['&s', 's&'],
  ['X', 'γें'], ['x', 'γे'], ['Z', 'γैं'], ['z', 'γै'],
  ['eA', 'γीं'], ['ea', 'γी'],
  // Short-i matra placeholder 'α'
  ['ef', 'α'], ['eq', 'α'], ['e|', 'γµ'],
  ['eW', 'ें'], ['ew', 'ौ'], ['es', 'ो'],
  ['meb', 'सं'], ['ceb', 'मं'], ['veb', 'नं'], ['heb', 'पं'], ['Ùeb', 'यं'], ['leb', 'तं'],
  // Base consonants with 'e' (full) or without (half)
  ['Ke', 'ख'], ['K', 'ख्'],
  ['ie', 'ग'], ['i', 'ग्'],
  ['Ie', 'घ'], ['I', 'घ्'],
  ['Ûe', 'च'], ['Û', 'च्'],
  ['Ú', 'छ'],
  ['pe', 'ज'], ['p', 'ज्'],
  ['Pe', 'झ'], ['P', 'झ्'],
  ['_', 'ञ्'],
  ['š', 'ट'], ['"', 'ठ'], ['[', 'ड'], ['{', 'ढ'], ['Ce', 'ण'], ['C', 'ण्'],
  ['le', 'त'], ['l', 'त्'],
  ['Le', 'थ'], ['L', 'थ्'],
  ['o', 'द'],
  ['Oe', 'ध'], ['O', 'ध्'],
  ['ve', 'न'], ['v', 'न्'],
  ['he', 'प'], ['h', 'प्'],
  ['ye', 'ब'], ['y', 'ब्'],
  ['Ye', 'भ'], ['Y', 'भ्'],
  ['ce', 'म'], ['c', 'म्'],
  ['Ùe', 'य'], ['Ù', 'य्'],
  ['j', 'र'],
  ['ue', 'ल'], ['u', 'ल्'], ['}', 'ल'],
  ['Je', 'व'], ['J', 'व्'], ['k', 'व्'],
  ['<e', 'ष'], ['<', 'ष्'],
  ['me', 'स'], ['m', 'स्'],
  ['n', 'ह'], ['å', 'ह्'],
  ['er', 'ी'], ['e', 'ा'], ['g', 'ु'], ['t', 'ू'], ['=', 'ृ'], ['s', 'े'], ['w', 'ै'],
  ['b', 'ं'], ['B', 'ँ'], ['Š', 'ः'], ['d', '्'], ['~', '।'],
  ['0', '०'], ['1', '१'], ['2', '२'], ['3', '३'], ['4', '४'],
  ['5', '५'], ['6', '६'], ['7', '७'], ['8', '८'], ['9', '९'],
  ['&', 'γ']
];

const KD_REVERSE_PAIRS = [
  ['aa', 'a'], ['ZZ', 'Z'], ['=kk', '=k'], ['f=k', 'f='],
  ['v‚', 'ऑ'], ['vks', 'ओ'], ['vkS', 'औ'], ['vk', 'आ'], ['v', 'अ'],
  ['b±', 'ईं'], ['Ã', 'ई'], ['bZ', 'ई'], ['b', 'इ'],
  ['m', 'उ'], ['Å', 'ऊ'], [',s', 'ऐ'], [',', 'ए'], ['_', 'ऋ'],
  ['d', 'क'], ['D', 'क्'], ['[', 'ख्'], ['x', 'ग'], ['X', 'ग्'],
  ['Ä', 'घ'], ['?', 'घ्'], ['³', 'ङ'], ['p', 'च'], ['P', 'च्'],
  ['N', 'छ'], ['t', 'ज'], ['T', 'ज्'], ['>', 'झ'], ['¥', 'ञ'],
  ['V', 'ट'], ['B', 'ठ'], ['M', 'ड'], ['<', 'ढ'], ['.', 'ण्'],
  ['r', 'त'], ['R', 'त्'], ['F', 'थ्'], ['n', 'द'], ['/', 'ध्'],
  ['u', 'न'], ['U', 'न्'], ['i', 'प'], ['I', 'प्'], ['Q', 'फ'], ['¶', 'फ्'],
  ['c', 'ब'], ['C', 'ब्'], ['Ò', 'भ'], ['H', 'भ्'], ['e', 'म'], ['E', 'म्'],
  [';', 'य'], ['¸', 'य्'], ['j', 'र'], ['y', 'ल'], ['Y', 'ल्'],
  ['o', 'व'], ['O', 'व्'], ["'", 'श्'], ['"', 'ष्'], ['l', 'स'], ['L', 'स्'],
  ['g', 'ह'], ['Ñ', 'कृ'], ['—', 'कृ'], ['ô', 'क्क'], ['ä', 'क्त'], ['{', 'क्ष्'],
  ['K', 'ज्ञ'], ['=', 'त्र'], ['«', 'त्र्'], ['–', 'दृ'],
  ['Ì', 'द्द'], ['í', 'द्द'], [')', 'द्ध'], ['|', 'द्य'], ['}', 'द्व'],
  ['é', 'न्न'], ['J', 'श्र'], ['Ø', 'क्र'], ['Ý', 'फ्र'], ['æ', 'द्र'],
  ['ç', 'प्र'], ['Á', 'प्र'], ['#', 'रु'], [':', 'रू'], ['z', '्र'],
  ['ks', 'ो'], ['kS', 'ौ'], ['h', 'ी'], ['q', 'ु'], ['w', 'ू'],
  ['`', 'ृ'], ['s', 'े'], ['S', 'ै'], ['a', 'ं'], ['¡', 'ँ'],
  ['%', 'ः'], ['~', '्'], ['k', 'ा'], ['A', '।'],
  ['0', '०'], ['1', '१'], ['2', '२'], ['3', '३'], ['4', '४'],
  ['5', '५'], ['6', '६'], ['7', '७'], ['8', '८'], ['9', '९'],
  ['f', 'α'], ['Z', 'γ']
];

function applyPostReplacements(text) {
  let s = text;
  // Move short-i 'α' after consonant cluster: α + C -> C + ि
  s = s.replace(/α([कखगघङचछजझञटठडढणतथदधनपफबभमयरलळवशषसहक़ख़ग़ज़ड़ढ़फ़य़ऱऩ])/g, '$1α');
  s = s.replace(/α((्[कखगघङचछजझञटठडढणतथदधनपफबभमयरलळवशषसहक़ख़ग़ज़ड़ढ़फ़य़ऱऩ])+)/g, '$1α');
  s = s.replace(/α/g, 'ि');

  // Move reph 'γ' before consonant: C + matras + γ -> र् + C + matras
  s = s.replace(/([कखगघङचछजझञटठडढणतथदधनपफबभमयरलळवशषसहक़ख़ग़ज़ड़ढ़फ़य़ऱऩ])([ािीुूृेैोौंँ]*)([γ])/g, '$3$1$2');
  s = s.replace(/(([कखगघङचछजझञटठडढणतथदधनपफबभमयरलळवशषसहक़ख़ग़ज़ड़ढ़फ़य़ऱऩ][्])+)([γ])/g, '$3$1');
  s = s.replace(/γ/g, 'र्');

  // Normalize common artifacts
  s = s.replace(/्ा/g, '');
  s = s.replace(/्ो/g, 'े');
  s = s.replace(/्ौ/g, 'ै');
  s = s.replace(/अो/g, 'ओ');
  s = s.replace(/अा/g, 'आ');
  s = s.replace(/आै/g, 'औ');
  s = s.replace(/आे/g, 'ओ');
  s = s.replace(/ाो/g, 'ो');
  s = s.replace(/ाे/g, 'ो');
  s = s.replace(/ंु/g, 'ुं');
  s = s.replace(/ंू/g, 'ूं');
  s = s.replace(/ंे/g, 'ें');
  s = s.replace(/ंै/g, 'ैं');
  s = s.replace(/ंो/g, 'ों');

  return s;
}

export function apsDvToUnicode(str) {
  if (!str) return '';
  let s = str;
  for (const [k, v] of APS_REVERSE_PAIRS) {
    s = s.replaceAll(k, v);
  }
  return applyPostReplacements(s);
}

export function krutiDevToUnicode(str) {
  if (!str) return '';
  let s = str;
  for (const [k, v] of KD_REVERSE_PAIRS) {
    s = s.replaceAll(k, v);
  }
  return applyPostReplacements(s);
}

/**
 * Checks if a string appears to be encoded in legacy ASCII fonts (APS-DV / KrutiDev).
 */
export function isLegacyEncoded(str) {
  if (!str || typeof str !== 'string') return false;
  // If text already has substantial Devanagari Unicode, it's not legacy encoded
  const devaCount = (str.match(/[\u0900-\u097F]/g) || []).length;
  if (devaCount > 10 && devaCount / str.length > 0.4) return false;

  // Typical signature character tokens of APS-DV
  const apsPatterns = /\b(?:keâ|Dee|me|je|ef|Ùe|le|Ce|he|ce|ye|Ye|oeref|«ebL|efmeæ)\b|keâer|kesâ|ceW|nw~|Øe|ef\$e/i;
  // Typical signature character tokens of KrutiDev
  const kdPatterns = /\b(?:vk|vks|vkS|f[a-z]|jk|Hk|\[k|\?k|bZ)\b|dks|ds|esa|gS/i;

  return apsPatterns.test(str) || kdPatterns.test(str);
}

/**
 * Automatically decodes legacy ASCII font text to clean Unicode Devanagari.
 * If already Unicode, returns string as-is.
 */
export function legacyToUnicode(str) {
  if (!str || typeof str !== 'string') return '';
  if (!isLegacyEncoded(str)) return str;

  // Detect whether string is APS-DV or KrutiDev
  // APS-DV uses 'keâ' (क), 'Dee' (आ), 'ef' (ि), 'me' (स), 'je' (र)
  const apsScore = (str.match(/keâ|Dee|ef|Ùe|Me|Ce|ceW|kesâ|keâer|meeO|neLe|jnev/g) || []).length;
  // KrutiDev uses 'd' (क), 'vk' (आ), 'f' (ि), 'l' (स), 'j' (र)
  const kdScore = (str.match(/vk|vks|f[a-z]|\[k|\?k|Hk|bZ/g) || []).length;

  if (apsScore >= kdScore) {
    return apsDvToUnicode(str);
  } else {
    return krutiDevToUnicode(str);
  }
}
