import { test, describe, it, before } from 'node:test';
import assert from 'node:assert';

// Mock localStorage
let storage = { 'sd-lang': 'hi' };
globalThis.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => storage[k] = v,
};

globalThis.window = {};

globalThis.location = {
  reload: () => {}
};

class MockElement {
  constructor(attrs = {}) {
    this.attrs = attrs;
    this.innerHTML = '';
    this.value = attrs.value || '';
    this.listeners = {};
  }
  getAttribute(name) {
    return this.attrs[name] || null;
  }
  setAttribute(name, val) {
    this.attrs[name] = val;
  }
  addEventListener(event, cb) {
    this.listeners[event] = cb;
  }
}

const htmlElement = new MockElement();
let elements = [];

globalThis.document = {
  documentElement: htmlElement,
  querySelectorAll(sel) {
    if (sel === '[data-i18n]') return elements.filter(e => 'data-i18n' in e.attrs);
    if (sel === '[data-i18n-ph]') return elements.filter(e => 'data-i18n-ph' in e.attrs);
    if (sel === '[data-dv]') return elements.filter(e => 'data-dv' in e.attrs);
    return [];
  },
  getElementById(id) {
    return elements.find(e => e.attrs.id === id) || null;
  }
};

describe('i18n', () => {
  let i18n;

  before(async () => {
    // Setup elements before importing so apply() modifies them
    elements.push(new MockElement({ 'data-i18n': 'ui.toc' }));
    elements.push(new MockElement({ 'data-i18n-ph': 'ui.search_ph' }));
    elements.push(new MockElement({ 'data-dv': 'समयसार' }));
    elements.push(new MockElement({ id: 'langSel' }));

    // Import i18n dynamically so globals are ready
    i18n = await import('../../js/i18n.js');
  });

  it('exports lang correctly', () => {
    assert.strictEqual(i18n.lang, 'hi'); // default/localStorage
  });

  it('t() translates correctly', () => {
    assert.strictEqual(i18n.t('ui.toc'), 'विषय-सूची');
    assert.strictEqual(i18n.t('unknown.key'), 'unknown.key');
  });

  it('tName() uses translit for en, else returns original', () => {
    // lang is hi currently
    assert.strictEqual(i18n.tName('समयसार'), 'समयसार');
  });

  it('apply() works correctly on DOM', () => {
    // apply() runs on import
    assert.strictEqual(htmlElement.attrs['data-lang'], 'hi');
    assert.strictEqual(htmlElement.attrs['lang'], 'hi');
    
    const i18nEl = elements.find(e => 'data-i18n' in e.attrs);
    assert.strictEqual(i18nEl.innerHTML, 'विषय-सूची');

    const phEl = elements.find(e => 'data-i18n-ph' in e.attrs);
    assert.strictEqual(phEl.attrs['placeholder'], 'खोजें — समयसार, कुन्दकुन्द, टोडरमल… या रोमन में ‘samaysar’');

    const dvEl = elements.find(e => 'data-dv' in e.attrs);
    assert.strictEqual(dvEl.innerHTML, 'समयसार');

    const selEl = elements.find(e => e.attrs.id === 'langSel');
    assert.strictEqual(selEl.value, 'hi');
  });
  
  it('handles window assignments', () => {
    assert.strictEqual(globalThis.window.sdT, i18n.t);
    assert.strictEqual(globalThis.window.sdName, i18n.tName);
  });
});
