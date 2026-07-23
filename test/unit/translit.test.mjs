import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import {
  translit,
  romanKey,
  skeleton,
  slugify,
  nameKey,
  devaNum
} from '../../js/translit.js';

describe('translit.js', () => {
  describe('translit()', () => {
    it('transliterates consonants and adds inherent schwa', () => {
      assert.strictEqual(translit('क'), 'ka');
      assert.strictEqual(translit('ख'), 'kha');
      assert.strictEqual(translit('य'), 'ya');
      assert.strictEqual(translit('ह'), 'ha');
    });

    it('transliterates vowels', () => {
      assert.strictEqual(translit('अ'), 'a');
      assert.strictEqual(translit('आ'), 'aa');
      assert.strictEqual(translit('इ'), 'i');
      assert.strictEqual(translit('ऋ'), 'ri');
      assert.strictEqual(translit('ऑ'), 'o');
    });

    it('handles matras', () => {
      assert.strictEqual(translit('का'), 'kaa');
      assert.strictEqual(translit('कि'), 'ki');
      assert.strictEqual(translit('कु'), 'ku');
      assert.strictEqual(translit('कृ'), 'kri');
      assert.strictEqual(translit('कॅ'), 'ke'); // matra ॅ is e
    });

    it('handles halant (conjuncts)', () => {
      assert.strictEqual(translit('क्'), 'k'); 
      assert.strictEqual(translit('क्या'), 'kyaa');
      assert.strictEqual(translit('सत्य'), 'satya');
    });

    it('handles nukta combined', () => {
      // test character followed by nukta
      assert.strictEqual(translit('क' + '़'), 'qa'); 
      assert.strictEqual(translit('ख़'), 'kha'); // pre-combined
      assert.strictEqual(translit('ड' + '़'), 'da'); 
      assert.strictEqual(translit('ढ़'), 'rha'); 
    });

    it('handles devanagari digits', () => {
      assert.strictEqual(translit('०१२३४५६७८९'), '0123456789');
    });

    it('handles anusvara, chandrabindu, and visarga', () => {
      assert.strictEqual(translit('कंस'), 'kansa');
      assert.strictEqual(translit('हँस'), 'hansa');
      assert.strictEqual(translit('दुःख'), 'duhkha'); 
      assert.strictEqual(translit('दुः'), 'duh'); 
    });

    it('ignores certain characters (halant without consonant, standalone nukta, etc)', () => {
      assert.strictEqual(translit('ऽ'), '');
      assert.strictEqual(translit('॰'), '');
      assert.strictEqual(translit('्'), ''); // standalone halant
      assert.strictEqual(translit('़'), ''); // standalone nukta
    });

    it('leaves non-devanagari characters unchanged', () => {
      assert.strictEqual(translit('abc'), 'abc');
      assert.strictEqual(translit(' 123 '), ' 123 ');
    });

    it('handles falsy input safely', () => {
      assert.strictEqual(translit(null), '');
      assert.strictEqual(translit(undefined), '');
      assert.strictEqual(translit(''), '');
    });
  });

  describe('romanKey()', () => {
    it('lowercases and strips non-alphanumeric characters', () => {
      assert.strictEqual(romanKey('सत्य !@# 123'), 'satya123');
      assert.strictEqual(romanKey('श्रीमान्'), 'shrimaan');
    });
  });

  describe('skeleton()', () => {
    it('removes schwas flexibly to tolerate differences', () => {
      assert.strictEqual(skeleton('समयसार'), 'smysr'); 
      assert.strictEqual(skeleton('समयासार'), 'smysr'); 
    });
  });

  describe('slugify()', () => {
    it('creates url-safe slugs from devanagari', () => {
      assert.strictEqual(slugify('समयसार ग्रन्थ'), 'samayasaara-grantha');
      assert.strictEqual(slugify('!@#$'), 'granth'); // fallback
    });

    it('creates url-safe slugs from english', () => {
      assert.strictEqual(slugify('  Hello World  '), 'hello-world');
      assert.strictEqual(slugify('test_case'), 'test-case');
    });
  });

  describe('nameKey()', () => {
    it('drops honorifics and parentheticals', () => {
      assert.strictEqual(nameKey('श्री कुन्दकुन्द आचार्य'), 'kundakunda'); 
      assert.strictEqual(nameKey('आ. कुन्दकुन्द'), 'kundakunda');
      assert.strictEqual(nameKey('कुन्दकुन्द (प्राकृत)'), 'kundakunda');
    });
    
    it('removes digits and dashes', () => {
      assert.strictEqual(nameKey('कुन्दकुन्द 123'), 'kundakunda'); 
      assert.strictEqual(nameKey('कुन्द-कुन्द०९'), 'kundakunda');
    });

    it('handles empty names', () => {
      assert.strictEqual(nameKey(null), '');
    });
  });

  describe('devaNum()', () => {
    it('converts western digits to devanagari', () => {
      assert.strictEqual(devaNum('123'), '१२३');
      assert.strictEqual(devaNum(456), '४५६');
      assert.strictEqual(devaNum('1a2b'), '१a२b');
      assert.strictEqual(devaNum('०1'), '०१');
    });
  });
});
