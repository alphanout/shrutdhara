/* Devanagari → Roman transliteration (lossy, consistent) — shared by
   browser search (js/app.js) and the build's slug generator (build/build.mjs). */

const CONS = {
  'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n',
  'ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n',
  'प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','ळ':'l',
  'श':'sh','ष':'sh','स':'s','ह':'h',
  'क़':'q','ख़':'kh','ग़':'g','ज़':'z','ड़':'d','ढ़':'rh','फ़':'f','य़':'y'
};
const VOW = {
  'अ':'a','आ':'aa','इ':'i','ई':'i','उ':'u','ऊ':'u','ऋ':'ri','ॠ':'ri',
  'ए':'e','ऐ':'ai','ओ':'o','औ':'au','ऑ':'o','ॲ':'a','ऍ':'e'
};
const MATRA = {
  'ा':'aa','ि':'i','ी':'i','ु':'u','ू':'u','ृ':'ri','ॄ':'ri',
  'े':'e','ै':'ai','ो':'o','ौ':'au','ॉ':'o','ॅ':'e'
};
const DIGIT = { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' };
const HALANT = '्', ANUSVARA = 'ं', CHANDRABINDU = 'ँ', VISARGA = 'ः', NUKTA = '़';

export function translit(str) {
  let out = '';
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    let ch = s[i];
    if (s[i + 1] === NUKTA) { ch = ch + NUKTA; i++; } // combined nukta form
    if (CONS[ch] != null) {
      out += CONS[ch];
      const next = s[i + 1];
      if (next === HALANT) { i++; continue; }          // conjunct: no schwa
      if (next != null && MATRA[next] != null) { out += MATRA[next]; i++; continue; }
      out += 'a';                                       // inherent schwa
      continue;
    }
    if (VOW[ch] != null) { out += VOW[ch]; continue; }
    if (DIGIT[ch] != null) { out += DIGIT[ch]; continue; }
    if (ch === ANUSVARA || ch === CHANDRABINDU) { out += 'n'; continue; }
    if (ch === VISARGA) { out += 'h'; continue; }
    if (ch === HALANT || ch === NUKTA || ch === '॰' || ch === 'ऽ') continue;
    out += ch;
  }
  return out;
}

/* lowercase roman, strip everything but letters+digits */
export function romanKey(str) {
  return translit(str).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/* consonant skeleton: tolerant of schwa differences (samaysar ~ samayasaara) */
export function skeleton(str) {
  return romanKey(str).replace(/a+/g, 'a').replace(/([a-z0-9])a(?=[a-z0-9])/g, '$1').replace(/a$/, '');
}

/* url-safe slug for a Devanagari title */
export function slugify(str) {
  return translit(str).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'granth';
}

/* canonical key for matching person names across lists:
   drops honorifics (श्री, आ., स्वामी, पं., …), आचार्य suffixes, parentheticals, digits */
export function nameKey(name) {
  const clean = String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/आचार्या?|ाचार्य/g, '')
    // श्री only as standalone honorific (followed by space) — NOT inside compound
    // names like श्रीधर / श्रीचन्द / श्रीपाल
    .replace(/श्रीमान(?=\s|$)|श्री(?=\s)|सूरि|स्वामी|महाराज|ब्र\.|पं\.|आ\.|जी\b/g, ' ')
    .replace(/[0-9०-९–\-.]/g, ' ');
  return romanKey(clean);
}

export const DEVA_DIGITS = ['०','१','२','३','४','५','६','७','८','९'];
export function devaNum(n) {
  return String(n).split('').map(c => (/[0-9]/.test(c) ? DEVA_DIGITS[+c] : c)).join('');
}
