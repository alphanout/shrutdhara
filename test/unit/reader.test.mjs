import { test, describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mocking globals
globalThis.window = {
  location: { hash: '', pathname: '/book/chapter1', href: 'http://localhost/book/chapter1' },
  history: {
    replaceState: mock.fn(),
  },
  localStorage: {
    getItem: mock.fn(),
    setItem: mock.fn(),
  },
  sdT: (k) => k,
  fetch: mock.fn(),
};

globalThis.location = globalThis.window.location;
globalThis.history = globalThis.window.history;
globalThis.localStorage = globalThis.window.localStorage;
globalThis.fetch = globalThis.window.fetch;

globalThis.document = {
  getElementById: mock.fn(),
  querySelector: mock.fn(),
  createElement: mock.fn(),
  body: {
    appendChild: mock.fn(),
    setAttribute: mock.fn(),
    classList: {
      contains: mock.fn(),
      toggle: mock.fn(),
      add: mock.fn(),
      remove: mock.fn()
    }
  }
};

globalThis.IntersectionObserver = class {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.caches = {
  keys: mock.fn(),
  open: mock.fn(),
  match: mock.fn()
};
globalThis.window.caches = globalThis.caches;

// Import reader functions dynamically after mocks
let reader;
// Using a top-level await to load it
reader = await import('../../js/reader.js');
const { syncHash, saveLastReadPosition, toggleBookmark, getCache, checkAudioCache, downloadOfflineAudio } = reader;

describe('Reader.js Unit Tests', () => {

  beforeEach(() => {
    mock.restoreAll();
    window.location.hash = '';
    window.location.pathname = '/book/chapter1';
    window.history.replaceState.mock.resetCalls();
    window.localStorage.getItem.mock.resetCalls();
    window.localStorage.setItem.mock.resetCalls();
    globalThis.caches.keys.mock.resetCalls();
    globalThis.caches.open.mock.resetCalls();
    globalThis.caches.match.mock.resetCalls();
  });

  describe('URL Hash Sync', () => {
    it('should replace state and save last read position when intersecting', () => {
      globalThis.document.querySelector = mock.fn(() => ({
        getAttribute: () => 'false',
        textContent: 'Test Book'
      }));

      const entries = [
        { isIntersecting: true, target: { dataset: { n: '42' } } },
        { isIntersecting: false, target: { dataset: { n: '43' } } }
      ];

      syncHash(entries);

      assert.strictEqual(window.history.replaceState.mock.calls.length, 1);
      assert.deepStrictEqual(window.history.replaceState.mock.calls[0].arguments, [null, '', '#v42']);
      assert.strictEqual(window.localStorage.setItem.mock.calls.length, 1);
      const setCallArgs = window.localStorage.setItem.mock.calls[0].arguments;
      assert.strictEqual(setCallArgs[0], 'sd-last-read');
      const savedData = JSON.parse(setCallArgs[1]);
      assert.ok(savedData.book);
      assert.strictEqual(savedData.book.n, '42');
    });

    it('should not sync if already on the correct hash', () => {
      window.location.hash = '#v42';
      const entries = [
        { isIntersecting: true, target: { dataset: { n: '42' } } }
      ];
      syncHash(entries);
      assert.strictEqual(window.history.replaceState.mock.calls.length, 0);
    });
  });

  describe('Bookmark Logic', () => {
    it('should add a bookmark when none exists', () => {
      globalThis.document.getElementById = mock.fn((id) => {
        if (id === 'vpanel') return { dataset: { n: '42' } };
        if (id === 'vpBookmark') return { classList: { add: mock.fn(), remove: mock.fn() } };
        if (id === 'v42') return { 
          classList: { add: mock.fn(), remove: mock.fn() },
          querySelector: () => ({ textContent: 'Verse text' }) 
        };
        return null;
      });

      window.localStorage.getItem.mock.mockImplementation(() => JSON.stringify([]));

      toggleBookmark();

      assert.strictEqual(window.localStorage.setItem.mock.calls.length, 1);
      const bookmarks = JSON.parse(window.localStorage.setItem.mock.calls[0].arguments[1]);
      assert.strictEqual(bookmarks.length, 1);
      assert.strictEqual(bookmarks[0].id, 'book#v42');
      assert.strictEqual(bookmarks[0].n, '42');
      assert.strictEqual(bookmarks[0].text, 'Verse text');
    });

    it('should remove a bookmark when it already exists', () => {
      globalThis.document.getElementById = mock.fn((id) => {
        if (id === 'vpanel') return { dataset: { n: '42' } };
        if (id === 'vpBookmark') return { classList: { add: mock.fn(), remove: mock.fn() } };
        if (id === 'v42') return { 
          classList: { add: mock.fn(), remove: mock.fn() },
          querySelector: () => null
        };
        return null;
      });

      window.localStorage.getItem.mock.mockImplementation(() => JSON.stringify([
        { id: 'book#v42', n: '42' }
      ]));

      toggleBookmark();

      assert.strictEqual(window.localStorage.setItem.mock.calls.length, 1);
      const bookmarks = JSON.parse(window.localStorage.setItem.mock.calls[0].arguments[1]);
      assert.strictEqual(bookmarks.length, 0);
    });
  });

  describe('Offline Audio Caching', () => {
    it('checkAudioCache updates button if all files are cached', async () => {
      const mockCache = {
        match: mock.fn(async () => true)
      };
      globalThis.caches.keys.mock.mockImplementation(async () => ['shrutdhara-audio']);
      globalThis.caches.open.mock.mockImplementation(async () => mockCache);

      const dlBtn = { textContent: '', disabled: false };
      
      await checkAudioCache(3, '/audio/', dlBtn);

      assert.strictEqual(dlBtn.textContent, '✓ ऑफ़लाइन उपलब्ध');
      assert.strictEqual(dlBtn.disabled, true);
    });

    it('downloadOfflineAudio downloads and caches all files', async () => {
      const mockCache = {
        put: mock.fn(async () => {})
      };
      globalThis.caches.keys.mock.mockImplementation(async () => ['shrutdhara-audio']);
      globalThis.caches.open.mock.mockImplementation(async () => mockCache);
      
      window.fetch.mock.mockImplementation(async () => ({
        ok: true,
        clone: () => ({})
      }));

      const dlBtn = { textContent: '', disabled: false };

      await downloadOfflineAudio(2, '/audio/', dlBtn);

      assert.strictEqual(window.fetch.mock.calls.length, 2);
      assert.strictEqual(mockCache.put.mock.calls.length, 4); // 2 per file (reqUrl + fileUrl)
      assert.strictEqual(dlBtn.textContent, '✓ ऑफ़लाइन उपलब्ध');
    });

    it('downloadOfflineAudio handles missing cache API gracefully', async () => {
      const oldCaches = globalThis.caches;
      delete window.caches;
      delete globalThis.caches;

      const dlBtn = { textContent: '', disabled: false };
      await downloadOfflineAudio(2, '/audio/', dlBtn);

      assert.strictEqual(dlBtn.textContent, 'ब्राउज़र समर्थित नहीं');

      globalThis.caches = oldCaches;
      window.caches = oldCaches;
    });
  });

});
