import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICT } from '../../js/i18n.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

describe('i18n Coverage & Parity Guardrails', () => {
  const languages = ['hi', 'en', 'sa', 'pra'];

  it('all 4 languages have exactly symmetrical keys with no missing translations', () => {
    const hiKeys = Object.keys(DICT.hi).sort();
    assert.ok(hiKeys.length >= 60, `Expected at least 60 translation keys, found ${hiKeys.length}`);

    for (const lang of languages) {
      assert.ok(DICT[lang], `Language "${lang}" must exist in DICT`);
      const langKeys = Object.keys(DICT[lang]).sort();
      
      const missing = hiKeys.filter(k => !(k in DICT[lang]));
      const extra = langKeys.filter(k => !(k in DICT.hi));

      assert.deepStrictEqual(
        missing,
        [],
        `Language "${lang}" is missing ${missing.length} keys present in "hi": ${missing.join(', ')}`
      );
      assert.deepStrictEqual(
        extra,
        [],
        `Language "${lang}" has ${extra.length} extra keys not present in "hi": ${extra.join(', ')}`
      );
    }
  });

  it('all data-i18n, data-i18n-ph, data-i18n-title and data-i18n-aria attributes across all HTML files reference valid DICT keys', () => {
    const htmlFiles = [
      'index.html',
      'granths.html',
      'sources.html',
      'viewer.html',
      'about.html',
      'kaal.html',
      'acharya.html',
      'bhattarak.html',
      '404.html',
    ];

    const i18nRegex = /data-i18n(?:-ph|-title|-aria)?="([^"]+)"/g;
    const missingKeys = [];

    for (const file of htmlFiles) {
      const filePath = join(ROOT, file);
      const content = readFileSync(filePath, 'utf-8');
      let match;
      while ((match = i18nRegex.exec(content)) !== null) {
        const key = match[1];
        if (!(key in DICT.hi)) {
          missingKeys.push(`${file} -> "${key}"`);
        }
      }
    }

    assert.deepStrictEqual(
      missingKeys,
      [],
      `HTML files contain invalid/unregistered data-i18n keys:\n${missingKeys.join('\n')}`
    );
  });

  it('all dynamic templates in build/build.mjs reference valid DICT keys', () => {
    const buildPath = join(ROOT, 'build/build.mjs');
    const content = readFileSync(buildPath, 'utf-8');
    const i18nRegex = /data-i18n(?:-ph|-title|-aria)?="([^"]+)"/g;
    const missingKeys = [];

    let match;
    while ((match = i18nRegex.exec(content)) !== null) {
      const key = match[1];
      if (key.includes('${')) continue; // Skip template interpolation variables like ${key}
      if (!(key in DICT.hi)) {
        missingKeys.push(`build.mjs -> "${key}"`);
      }
    }

    assert.deepStrictEqual(
      missingKeys,
      [],
      `build.mjs contains invalid/unregistered data-i18n keys:\n${missingKeys.join('\n')}`
    );
  });

  it('all t("...") calls in JS code reference valid DICT keys', () => {
    const jsFiles = [
      'js/app.js',
      'js/reader.js',
      'js/pdf-viewer.js',
    ];

    const tRegex = /\bt\(['"]([a-zA-Z0-9_.]+)['"]/g;
    const missingKeys = [];

    for (const file of jsFiles) {
      const filePath = join(ROOT, file);
      const content = readFileSync(filePath, 'utf-8');
      let match;
      while ((match = tRegex.exec(content)) !== null) {
        const key = match[1];
        if (!(key in DICT.hi)) {
          missingKeys.push(`${file} -> "${key}"`);
        }
      }
    }

    assert.deepStrictEqual(
      missingKeys,
      [],
      `JS files contain unregistered t(...) keys:\n${missingKeys.join('\n')}`
    );
  });
});
