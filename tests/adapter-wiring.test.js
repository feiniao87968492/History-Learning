import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountAppShell() {
  mountDOM(`
    <div id="meme-scroll"></div>
    <div id="meme-dots"></div>
    <div id="meme-overlay"></div>
    <span id="meme-emoji"></span>
    <h3 id="meme-title"></h3>
    <p id="meme-origin"></p>
    <p id="meme-tag"></p>
    <div id="science-page"><div class="sg"></div></div>
    <div id="hot-articles"></div>
    <div id="discuss-page"><div class="dp"></div></div>
    <div id="profile-page"><div class="mg"></div><div class="mg"></div></div>
    <div id="feedback-overlay"><div class="fty" id="feedback-type-list"></div></div>
    <div id="toast"></div>
  `);

  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: 'complete'
  });

  window.navigationAPI = {
    showToast: vi.fn(),
    resetAIFab: vi.fn(),
    login: vi.fn(),
    openSub: vi.fn(),
    closeSub: vi.fn()
  };
  window.storageAPI = {
    getStoredJSON: vi.fn(),
    setStoredJSON: vi.fn(),
    getStoredString: vi.fn(),
    setStoredString: vi.fn()
  };
  window.nounAPI = { setNounData: vi.fn() };
  window.timelineAPI = {
    setDynasties: vi.fn(),
    setTimelineEvents: vi.fn(),
    renderTimeline: vi.fn(),
    renderEventList: vi.fn()
  };
  window.podcastAPI = { setPodcasts: vi.fn() };
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetGlobals();
});

describe('adapter wiring', () => {
  test('legacy storage module does not overwrite an existing adapter API', async () => {
    var adapterAPI = {
      getStoredJSON: vi.fn(),
      setStoredJSON: vi.fn(),
      getStoredString: vi.fn(),
      setStoredString: vi.fn(),
      removeStoredItem: vi.fn(),
      removeItem: vi.fn()
    };
    window.storageAPI = adapterAPI;

    await import('../src/js/storage.js');

    expect(window.storageAPI).toBe(adapterAPI);
  });

  test('legacy navigation module does not overwrite an existing adapter API', async () => {
    var adapterAPI = {
      resetAIFab: vi.fn(),
      showToast: vi.fn(),
      login: vi.fn(),
      openSub: vi.fn(),
      closeSub: vi.fn()
    };
    window.navigationAPI = adapterAPI;

    await import('../src/js/navigation.js');

    expect(window.navigationAPI).toBe(adapterAPI);
  });

  test('app data loading prefers dataLoaderAPI when present', async () => {
    mountAppShell();
    var loadJSON = vi.fn(async function (path, fallback) {
      if (path.indexOf('nouns.json') !== -1) return { adapterNoun: { text: 'from adapter' } };
      if (path.indexOf('timeline.json') !== -1) return { dynasties: ['qin'], events: [] };
      if (path.indexOf('podcasts.json') !== -1) return [{ title: 'adapter podcast' }];
      return fallback;
    });
    window.dataLoaderAPI = { loadJSON: loadJSON };
    global.fetch = vi.fn(async function () {
      throw new Error('fetch should not be used when dataLoaderAPI exists');
    });

    await import('../src/js/app.js');
    await new Promise(function (resolvePromise) { setTimeout(resolvePromise, 0); });

    expect(loadJSON).toHaveBeenCalledWith('./src/data/nouns.json?v=20260612-phase4-fix1', {});
    expect(loadJSON).toHaveBeenCalledWith('./src/data/timeline.json?v=20260612-phase4-fix1', { dynasties: [], events: [] });
    expect(loadJSON).toHaveBeenCalledWith('./src/data/podcasts.json?v=20260612-phase4-fix1', []);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(window.nounAPI.setNounData).toHaveBeenCalledWith({ adapterNoun: { text: 'from adapter' } });
    expect(window.timelineAPI.setDynasties).toHaveBeenCalledWith(['qin']);
    expect(window.podcastAPI.setPodcasts).toHaveBeenCalledWith([{ title: 'adapter podcast' }]);
  });

  test('app data loading falls back to fetch when dataLoaderAPI is absent', async () => {
    mountAppShell();
    global.fetch = vi.fn(async function (path) {
      if (path.indexOf('nouns.json') !== -1) return { ok: true, json: async function () { return {}; } };
      if (path.indexOf('timeline.json') !== -1) return { ok: true, json: async function () { return { dynasties: [], events: [] }; } };
      if (path.indexOf('podcasts.json') !== -1) return { ok: true, json: async function () { return []; } };
      return { ok: true, json: async function () { return []; } };
    });

    await import('../src/js/app.js');
    await new Promise(function (resolvePromise) { setTimeout(resolvePromise, 0); });

    expect(global.fetch).toHaveBeenCalledWith('./src/data/nouns.json?v=20260612-phase4-fix1');
    expect(global.fetch).toHaveBeenCalledWith('./src/data/timeline.json?v=20260612-phase4-fix1');
    expect(global.fetch).toHaveBeenCalledWith('./src/data/podcasts.json?v=20260612-phase4-fix1');
  });

  test('index loads adapters before business modules', () => {
    var html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    var storageAdapterIndex = html.indexOf('./src/js/adapters/storage.js');
    var dataLoaderIndex = html.indexOf('./src/js/adapters/data-loader.js');
    var legacyStorageIndex = html.indexOf('./src/js/storage.js');
    var appIndex = html.indexOf('./src/js/app.js');

    expect(storageAdapterIndex).toBeGreaterThan(-1);
    expect(dataLoaderIndex).toBeGreaterThan(-1);
    expect(storageAdapterIndex).toBeLessThan(legacyStorageIndex);
    expect(dataLoaderIndex).toBeLessThan(appIndex);
  });

  test('business-facing source avoids direct platform calls after wiring', () => {
    var indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    var appJs = readFileSync(resolve(process.cwd(), 'src/js/app.js'), 'utf8');
    var storageJs = readFileSync(resolve(process.cwd(), 'src/js/storage.js'), 'utf8');
    var checkinJs = readFileSync(resolve(process.cwd(), 'src/js/checkin.js'), 'utf8');
    var podcastJs = readFileSync(resolve(process.cwd(), 'src/js/podcast.js'), 'utf8');

    expect(indexHtml).not.toContain('window.open(');
    expect(indexHtml).not.toContain('localStorage.');
    expect(appJs).not.toContain('fetch(');
    expect(storageJs).not.toContain('localStorage.');
    expect(checkinJs).not.toContain('localStorage.');
    expect(podcastJs).not.toContain('new Audio');
  });
});
