import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toKrutiDev,
  toApsDv,
  unicodeToLegacyVariants,
  legacyToUnicode,
  isLegacyEncoded,
  apsDvToUnicode,
  krutiDevToUnicode,
} from '../../js/font-converter.js';

describe('font-converter.js', () => {
  describe('toKrutiDev()', () => {
    it('converts basic words to KrutiDev 010', () => {
      assert.strictEqual(toKrutiDev('राग'), 'jkx');
      assert.strictEqual(toKrutiDev('आप्त'), 'vkIr');
      assert.strictEqual(toKrutiDev('समयसार'), 'le;lkj');
    });

    it('correctly shifts short-i matra before the consonant', () => {
      assert.strictEqual(toKrutiDev('जिन'), 'ftu');
    });
  });

  describe('toApsDv()', () => {
    it('converts basic words to APS-DV encoding', () => {
      assert.strictEqual(toApsDv('राग'), 'jeie');
      assert.strictEqual(toApsDv('आप्त'), 'Deehle');
      assert.strictEqual(toApsDv('समयसार'), 'meceÙemeej');
    });

    it('correctly shifts short-i matra before consonant', () => {
      assert.strictEqual(toApsDv('जिन'), 'efpeve');
    });
  });

  describe('unicodeToLegacyVariants()', () => {
    it('generates multi-variant array for "राग"', () => {
      const variants = unicodeToLegacyVariants('राग');
      assert.ok(variants.includes('राग'), 'Should include original Unicode');
      assert.ok(variants.includes('jeie'), 'Should include APS-DV full representation');
      assert.ok(variants.includes('jei'), 'Should include APS-DV stem representation');
      assert.ok(variants.includes('jkx'), 'Should include KrutiDev representation');
    });

    it('generates variants for "आप्त"', () => {
      const variants = unicodeToLegacyVariants('आप्त');
      assert.ok(variants.includes('आप्त'));
      assert.ok(variants.includes('Deehle') || variants.includes('Deehl'));
      assert.ok(variants.includes('vkIr'));
    });

    it('generates variants for "समयसार"', () => {
      const variants = unicodeToLegacyVariants('समयसार');
      assert.ok(variants.includes('समयसार'));
      assert.ok(variants.includes('meceÙemeej'));
      assert.ok(variants.includes('le;lkj'));
    });

    it('returns original input when given empty or non-Devanagari text', () => {
      assert.deepStrictEqual(unicodeToLegacyVariants(''), []);
      assert.deepStrictEqual(unicodeToLegacyVariants('Samayasara'), ['Samayasara']);
    });
  });

  describe('legacyToUnicode()', () => {
    it('decodes KrutiDev "jkx" to "राग"', () => {
      assert.strictEqual(krutiDevToUnicode('jkx'), 'राग');
    });

    it('decodes KrutiDev "vkIr" to "आप्त"', () => {
      assert.strictEqual(krutiDevToUnicode('vkIr'), 'आप्त');
    });

    it('decodes APS-DV "Deehleceerceebmee" to "आप्तमीमांसा"', () => {
      const decoded = apsDvToUnicode('Deehleceerceebmee');
      assert.ok(decoded.includes('आप्तमीमांसा'), `Expected आप्तमीमांसा, got ${decoded}`);
    });

    it('decodes APS-DV sample text into clean Hindi', () => {
      const sample = 'ceepe keâer meJeexÛÛe meeOJeer, Jele&ceeve ceW 1200 heerÛÚerOeejer meeOegDeeW ceW meyemes ØeeÛeerve oeref#ele';
      const decoded = legacyToUnicode(sample);
      assert.ok(decoded.includes('साध्वी'), `Expected साध्वी, got: ${decoded}`);
      assert.ok(decoded.includes('१२००'), `Expected १२00, got: ${decoded}`);
      assert.ok(decoded.includes('प्राचीन'), `Expected प्राचीन, got: ${decoded}`);
      assert.ok(decoded.includes('दीक्षित'), `Expected दीक्षित, got: ${decoded}`);
    });

    it('leaves clean Unicode Devanagari text intact', () => {
      const clean = 'समयसार गाथा १';
      assert.strictEqual(legacyToUnicode(clean), clean);
    });
  });

  describe('isLegacyEncoded()', () => {
    it('identifies legacy APS-DV strings', () => {
      assert.strictEqual(isLegacyEncoded('ceepe keâer meJeexÛÛe meeOJeer'), true);
      assert.strictEqual(isLegacyEncoded('efmeæevle JeeÛemheefle'), true);
    });

    it('identifies normal Unicode text as not legacy', () => {
      assert.strictEqual(isLegacyEncoded('समयसार प्राभृत'), false);
    });
  });
});
