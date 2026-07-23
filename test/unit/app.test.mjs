import { test, describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock DOM environment
globalThis.window = {};
globalThis.localStorage = {
  data: {},
  getItem: (key) => globalThis.localStorage.data[key] || null,
  setItem: (key, value) => { globalThis.localStorage.data[key] = String(value); },
  removeItem: (key) => { delete globalThis.localStorage.data[key]; },
};

class DOMElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tag = tag;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.attributes = {};
    this.classList = new Set();
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this.style = {};
  }
  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }
  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event.type;
    (this.listeners[type] || []).forEach(cb => cb(event));
  }
  focus() {}
  blur() {}
  scrollIntoView() {}
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
  }
  insertBefore(newNode, refNode) {
    newNode.parentNode = this;
    if (!refNode) {
      this.children.push(newNode);
      return;
    }
    const idx = this.children.indexOf(refNode);
    if (idx >= 0) this.children.splice(idx, 0, newNode);
  }
  get nextSibling() {
    if (!this.parentNode) return null;
    const idx = this.parentNode.children.indexOf(this);
    if (idx >= 0 && idx < this.parentNode.children.length - 1) return this.parentNode.children[idx + 1];
    return null;
  }
  get firstChild() {
    return this.children[0] || null;
  }
  querySelector(sel) {
    if (sel === '.site-head .tools') {
      if (this.classList.has('tools')) return this;
    }
    return null;
  }
  querySelectorAll(sel) {
    return [];
  }
  closest(sel) {
    if (sel.includes('button[data-c]')) return this.attributes['data-c'] !== undefined ? this : null;
    return null;
  }
}

globalThis.document = {
  documentElement: new DOMElement('html', 'html'),
  body: new DOMElement('body', 'body'),
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = new DOMElement(id);
      // Give elements classList methods
      const el = this.elements[id];
      el.classList.add = function(cls) { Set.prototype.add.call(this, cls); };
      el.classList.remove = function(cls) { Set.prototype.delete.call(this, cls); };
      el.classList.toggle = function(cls, force) {
        if (force !== undefined) {
          if (force) this.add(cls); else this.remove(cls);
        } else {
          if (this.has(cls)) this.remove(cls); else this.add(cls);
        }
      };
    }
    return this.elements[id];
  },
  querySelector(sel) { return null; },
  querySelectorAll(sel) { return []; },
  createElement(tag) {
    const el = new DOMElement('', tag);
    el.classList.add = function(cls) { Set.prototype.add.call(this, cls); };
    el.classList.remove = function(cls) { Set.prototype.delete.call(this, cls); };
    el.classList.toggle = function(cls, force) {
      if (force !== undefined) {
        if (force) this.add(cls); else this.remove(cls);
      } else {
        if (this.has(cls)) this.remove(cls); else this.add(cls);
      }
    };
    return el;
  },
  addEventListener(event, cb) {
    if (!this.listeners) this.listeners = {};
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  },
  dispatchEvent(event) {
    if (!this.listeners) return;
    const type = typeof event === 'string' ? event : event.type;
    (this.listeners[type] || []).forEach(cb => cb(event));
  },
  activeElement: null
};

// Also give original elements classList methods
for (const el of [globalThis.document.documentElement, globalThis.document.body]) {
  el.classList.add = function(cls) { Set.prototype.add.call(this, cls); };
  el.classList.remove = function(cls) { Set.prototype.delete.call(this, cls); };
}

globalThis.matchMedia = () => ({ matches: false });
globalThis.fetch = async (url) => {
  if (url.includes('granths-90.json')) {
    return { ok: true, json: async () => [{ id: 1, name: 'Test Granth', author: 'Test Author', century: '12', slug: 'test' }] };
  }
  if (url.includes('acharyas-420.json')) {
    return { ok: true, json: async () => [{ id: 1, name: 'Acharya 1', centurySection: '10' }] };
  }
  if (url.includes('bhattarak-172.json')) {
    return { ok: true, json: async () => [] };
  }
  if (url.includes('verse-index.json')) {
    return { ok: true, json: async () => [] };
  }
  return { ok: false, json: async () => [] };
};
globalThis.location = { hash: '', pathname: '', protocol: 'http:' };
globalThis.addEventListener = globalThis.document.addEventListener.bind(globalThis.document);
globalThis.setTimeout = (cb) => { cb(); return 1; };
globalThis.clearTimeout = () => {};
globalThis.requestAnimationFrame = (cb) => cb();

// Before importing, set up initial state
globalThis.document.documentElement.setAttribute('data-root', '/');
globalThis.document.body.setAttribute('data-page', 'test');

const app = await import('../../js/app.js');

describe('App module', () => {
  beforeEach(() => {
    globalThis.document.elements = {};
    globalThis.document.listeners = {};
    globalThis.localStorage.data = {};
    globalThis.document.documentElement.attributes = {};
  });

  test('initTheme toggles theme properly', () => {
    globalThis.localStorage.setItem('sd-theme', 'dark');
    const btn = globalThis.document.getElementById('themeBtn');
    app.initTheme();
    assert.strictEqual(globalThis.document.documentElement.getAttribute('data-theme'), 'dark');
    
    btn.dispatchEvent('click');
    assert.strictEqual(globalThis.document.documentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(globalThis.localStorage.getItem('sd-theme'), 'light');
  });

  test('initSearch runs a search query', async () => {
    const input = globalThis.document.getElementById('q');
    const out = globalThis.document.getElementById('hits');
    app.initSearch();
    
    input.value = 'Test';
    input.dispatchEvent('input');
    
    // Wait for the async search to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => process.nextTick(resolve));
    await new Promise(resolve => process.nextTick(resolve));
    
    assert.ok(out.innerHTML.includes('Test Granth'), "Search results should include Test Granth");
  });

  test('renderStrata generates timeline layout', async () => {
    const mount = globalThis.document.getElementById('strata');
    await app.renderStrata({ withGranths: true });
    
    assert.ok(mount.innerHTML.includes('cent-10'), "Timeline should have century 10");
    assert.ok(mount.innerHTML.includes('cent-12'), "Timeline should have century 12");
    assert.ok(mount.innerHTML.includes('Test Granth'), "Timeline should include Test Granth");
  });
});
