import { nameKey } from '../js/translit.js';

export function createResolvers(acharyas, bhattarak) {
  const regByKey = new Map();
  for (const a of acharyas) {
    const k = nameKey(a.name);
    if (k && !regByKey.has(k)) regByKey.set(k, a);
  }
  const bhatByKey = new Map();
  for (const b of bhattarak) {
    const k = nameKey(b.name);
    if (k && !bhatByKey.has(k)) bhatByKey.set(k, b);
  }
  const bhattarakByKey = bhatByKey;

  function resolveGuru(guru) {
    const k = nameKey(guru);
    if (!k) return null;
    if (regByKey.has(k)) return regByKey.get(k);
    if (bhattarakByKey.has(k)) return { ...bhattarakByKey.get(k), isBhattarak: true };

    for (const a of acharyas) {
      const ak = nameKey(a.name);
      if (!ak) continue;
      if (ak.startsWith(k) || k.startsWith(ak) || ak.includes(k) || k.includes(ak)) return a;
    }
    for (const a of acharyas) {
      const ak = nameKey(a.name);
      if (!ak) continue;
      if (ak.length >= 4 && k.length >= 4 && (ak.slice(0, 4) === k.slice(0, 4) || ak.slice(0, 5) === k.slice(0, 5))) return a;
    }

    for (const b of bhattarak) {
      const bk = nameKey(b.name);
      if (!bk) continue;
      if (bk.startsWith(k) || k.startsWith(bk) || bk.includes(k) || k.includes(bk)) return { ...b, isBhattarak: true };
    }
    for (const b of bhattarak) {
      const bk = nameKey(b.name);
      if (!bk) continue;
      if (bk.length >= 4 && k.length >= 4 && (bk.slice(0, 4) === k.slice(0, 4) || bk.slice(0, 5) === k.slice(0, 5))) return { ...b, isBhattarak: true };
    }

    return null;
  }

  /* author → acharya/bhattarak record: exact key, then prefix, then containment (len ≥ 6) */
  function resolveAcharya(author) {
    const k = nameKey(author);
    if (!k) return null;
    if (regByKey.has(k)) return regByKey.get(k);
    if (k.length >= 6) {
      for (const a of acharyas) {
        const ak = nameKey(a.name);
        if (ak.startsWith(k) || k.startsWith(ak)) return a;
      }
      for (const a of acharyas) {
        if (nameKey(a.name).includes(k)) return a;
      }
    }
    if (bhatByKey.has(k)) return { ...bhatByKey.get(k), isBhattarak: true };
    if (k.length >= 6) {
      for (const b of bhattarak) {
        const bk = nameKey(b.name);
        if (bk.startsWith(k) || k.startsWith(bk)) return { ...b, isBhattarak: true };
      }
      for (const b of bhattarak) {
        if (nameKey(b.name).includes(k)) return { ...b, isBhattarak: true };
      }
    }
    return null;
  }

  return { resolveGuru, resolveAcharya, regByKey, bhatByKey };
}

export const centuryOf = (g) => {
  const m = String(g.century || '').match(/(\d{1,2})/);
  return m ? m[1] : '?';
};
