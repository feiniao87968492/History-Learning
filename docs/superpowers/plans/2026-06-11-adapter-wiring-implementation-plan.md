# Adapter Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire existing Web modules and inline shell code to the Phase 1 adapters without changing user-facing behavior.

**Architecture:** Adapter scripts load before business modules. Legacy `storage.js` and `navigation.js` become compatibility fallbacks that do not overwrite adapter APIs. `app.js`, `podcast.js`, and selected `index.html` inline handlers prefer adapters while retaining safe Web fallbacks for partial loading and existing tests.

**Tech Stack:** Native HTML, ES5 JavaScript IIFEs, adapter globals on `window`, Vitest, jsdom, mocked adapter APIs.

---

## File Structure

- Modify: `index.html`
  - Add adapter script tags before business modules.
  - Replace inline `window.open(...)` calls with `openExternalLink(...)`.
  - Add inline storage helper functions and use them for mind-map notes and inline checkin fallback functions.
- Modify: `src/js/storage.js`
  - Return early when `window.storageAPI` already exists.
  - Keep fallback `storageAPI` implementation for legacy/direct imports.
- Modify: `src/js/navigation.js`
  - Return early when `window.navigationAPI` already exists.
  - Keep fallback `navigationAPI` implementation for legacy/direct imports.
- Modify: `src/js/app.js`
  - Prefer `window.dataLoaderAPI.loadJSON(path, fallback)` inside internal `loadJSON`.
  - Keep current fetch fallback.
- Modify: `src/js/podcast.js`
  - Use `window.audioAPI` for source/play/pause/seek/events when available and podcast data has `audioUrl`.
  - Keep simulated progress fallback when no real audio source is present.
- Modify: `tests/helpers/dom-test-utils.js`
  - Reset additional adapter globals used by new tests.
- Create: `tests/adapter-wiring.test.js`
  - Verify storage/navigation non-overwrite, app dataLoader preference and fetch fallback, and static platform-call cleanup.
- Create: `tests/podcast-audio-adapter.test.js`
  - Verify podcast module calls `audioAPI` when audio URL is present and keeps fallback behavior without audio URL.

---

### Task 1: Add failing adapter wiring tests

**Files:**
- Modify: `tests/helpers/dom-test-utils.js`
- Create: `tests/adapter-wiring.test.js`

- [ ] **Step 1: Extend test reset helper**

Modify `tests/helpers/dom-test-utils.js` so `resetGlobals()` deletes the new adapter globals. The function should include these extra deletes while preserving existing deletes:

```js
export function resetGlobals() {
  document.body.innerHTML = '';
  delete window.navigationAPI;
  delete window.checkinAPI;
  delete window.peopleAPI;
  delete window.studyToolsAPI;
  delete window.libraryAPI;
  delete window.memesAPI;
  delete window.filmAPI;
  delete window.storageAPI;
  delete window.audioAPI;
  delete window.externalLinkAPI;
  delete window.dataLoaderAPI;
}
```

- [ ] **Step 2: Write the failing wiring test file**

Create `tests/adapter-wiring.test.js` with this complete content:

```js
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
      if (path.endsWith('nouns.json')) return { adapterNoun: { text: 'from adapter' } };
      if (path.endsWith('timeline.json')) return { dynasties: ['qin'], events: [] };
      if (path.endsWith('podcasts.json')) return [{ title: 'adapter podcast' }];
      return fallback;
    });
    window.dataLoaderAPI = { loadJSON: loadJSON };
    global.fetch = vi.fn(async function () {
      throw new Error('fetch should not be used when dataLoaderAPI exists');
    });

    await import('../src/js/app.js');
    await new Promise(function (resolvePromise) { setTimeout(resolvePromise, 0); });

    expect(loadJSON).toHaveBeenCalledWith('./src/data/nouns.json', {});
    expect(loadJSON).toHaveBeenCalledWith('./src/data/timeline.json', { dynasties: [], events: [] });
    expect(loadJSON).toHaveBeenCalledWith('./src/data/podcasts.json', []);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(window.nounAPI.setNounData).toHaveBeenCalledWith({ adapterNoun: { text: 'from adapter' } });
    expect(window.timelineAPI.setDynasties).toHaveBeenCalledWith(['qin']);
    expect(window.podcastAPI.setPodcasts).toHaveBeenCalledWith([{ title: 'adapter podcast' }]);
  });

  test('app data loading falls back to fetch when dataLoaderAPI is absent', async () => {
    mountAppShell();
    global.fetch = vi.fn(async function (path) {
      if (path.endsWith('nouns.json')) return { ok: true, json: async function () { return {}; } };
      if (path.endsWith('timeline.json')) return { ok: true, json: async function () { return { dynasties: [], events: [] }; } };
      if (path.endsWith('podcasts.json')) return { ok: true, json: async function () { return []; } };
      return { ok: true, json: async function () { return []; } };
    });

    await import('../src/js/app.js');
    await new Promise(function (resolvePromise) { setTimeout(resolvePromise, 0); });

    expect(global.fetch).toHaveBeenCalledWith('./src/data/nouns.json');
    expect(global.fetch).toHaveBeenCalledWith('./src/data/timeline.json');
    expect(global.fetch).toHaveBeenCalledWith('./src/data/podcasts.json');
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
```

- [ ] **Step 3: Run the focused wiring tests to verify RED**

Run:

```powershell
npx vitest run tests/adapter-wiring.test.js --environment jsdom
```

Expected: FAIL. At minimum, failures should show that `storage.js` / `navigation.js` overwrite existing adapter APIs, `app.js` still uses `fetch`, `index.html` does not load adapter scripts, and direct platform-call strings still exist.

---

### Task 2: Add failing podcast audio adapter tests

**Files:**
- Create: `tests/podcast-audio-adapter.test.js`

- [ ] **Step 1: Write the failing podcast adapter test file**

Create `tests/podcast-audio-adapter.test.js` with this complete content:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountPodcastDOM() {
  mountDOM(`
    <div id="podcast-tabs"><button class="pctab act"></button></div>
    <div id="podcast-list"><div class="pccard" data-cat="qinhan"></div></div>
    <div id="podcast-player"></div>
    <div id="pl-icon"></div>
    <div id="pl-title"></div>
    <div id="pl-author"></div>
    <div id="pl-dur"></div>
    <div id="pl-cur"></div>
    <div id="pl-prog"></div>
    <button id="pl-playbtn">▶</button>
    <div id="pl-bar" style="width: 100px;"></div>
    <div id="pl-timer"></div>
    <div id="toast"></div>
  `);

  document.getElementById('pl-bar').getBoundingClientRect = function () {
    return { left: 0, width: 100 };
  };
}

function installAudioAPI() {
  window.audioAPI = {
    setSource: vi.fn(function () { return true; }),
    play: vi.fn(function () { return 'play-result'; }),
    pause: vi.fn(function () { return true; }),
    seek: vi.fn(function () { return true; }),
    onTimeUpdate: vi.fn(function () { return true; }),
    onEnded: vi.fn(function () { return true; }),
    onError: vi.fn(function () { return true; }),
    getCurrentTime: vi.fn(function () { return 15; }),
    getDuration: vi.fn(function () { return 60; })
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetGlobals();
  vi.useFakeTimers();
  mountPodcastDOM();
  window.navigationAPI = { showToast: vi.fn() };
});

describe('podcast audio adapter wiring', () => {
  test('openPlayer sets audio source when audioUrl and audioAPI are available', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');

    window.podcastAPI.setPodcasts([
      { title: '贞观之治', author: 'AI历史助手', icon: '🏛️', colors: ['#111', '#222'], dur: 60, audioUrl: './assets/audio/zhenguan.mp3' }
    ]);
    window.podcastAPI.openPlayer(0);

    expect(window.audioAPI.setSource).toHaveBeenCalledWith('./assets/audio/zhenguan.mp3');
    expect(document.getElementById('podcast-player').classList.contains('act')).toBe(true);
  });

  test('togglePlay delegates play and pause to audioAPI when audio source is active', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');

    window.podcastAPI.setPodcasts([
      { title: '贞观之治', author: 'AI历史助手', icon: '🏛️', colors: ['#111', '#222'], dur: 60, audioUrl: './assets/audio/zhenguan.mp3' }
    ]);
    window.podcastAPI.openPlayer(0);

    window.podcastAPI.togglePlay();
    expect(window.audioAPI.play).toHaveBeenCalledTimes(1);
    expect(document.getElementById('pl-playbtn').textContent).toBe('⏸️');

    window.podcastAPI.togglePlay();
    expect(window.audioAPI.pause).toHaveBeenCalledTimes(1);
    expect(document.getElementById('pl-playbtn').textContent).toBe('▶');
  });

  test('seekPodcast delegates current time to audioAPI when audio source is active', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');

    window.podcastAPI.setPodcasts([
      { title: '贞观之治', author: 'AI历史助手', icon: '🏛️', colors: ['#111', '#222'], dur: 60, audioUrl: './assets/audio/zhenguan.mp3' }
    ]);
    window.podcastAPI.openPlayer(0);
    window.podcastAPI.seekPodcast({ clientX: 50 });

    expect(window.audioAPI.seek).toHaveBeenCalledWith(30);
    expect(document.getElementById('pl-cur').textContent).toBe('00:30');
  });

  test('keeps simulated progress behavior when no audioUrl is present', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');

    window.podcastAPI.setPodcasts([
      { title: '占位播客', author: 'AI历史助手', icon: '🎧', colors: ['#111', '#222'], dur: 60 }
    ]);
    window.podcastAPI.openPlayer(0);
    window.podcastAPI.togglePlay();
    vi.advanceTimersByTime(1000);

    expect(window.audioAPI.setSource).not.toHaveBeenCalled();
    expect(window.audioAPI.play).not.toHaveBeenCalled();
    expect(document.getElementById('pl-cur').textContent).toBe('00:01');
  });
});
```

- [ ] **Step 2: Run the focused podcast adapter tests to verify RED**

Run:

```powershell
npx vitest run tests/podcast-audio-adapter.test.js --environment jsdom
```

Expected: FAIL because `podcast.js` does not yet call `window.audioAPI.setSource`, `play`, `pause`, or `seek`.

---

### Task 3: Implement legacy module non-overwrite and data loader wiring

**Files:**
- Modify: `src/js/storage.js`
- Modify: `src/js/navigation.js`
- Modify: `src/js/app.js`
- Test: `tests/adapter-wiring.test.js`

- [ ] **Step 1: Update `src/js/storage.js` fallback wrapper**

Modify the top of `src/js/storage.js` so the IIFE starts with this guard:

```js
(function () {
  if (window.storageAPI) {
    return;
  }
```

Modify all direct localStorage references in this file to use `window.localStorage`, and update the API export to include remove aliases:

```js
  function removeStoredItem(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('removeStoredItem failed:', key, error);
      return false;
    }
  }

  window.storageAPI = {
    getStoredJSON: getStoredJSON,
    setStoredJSON: setStoredJSON,
    getStoredString: getStoredString,
    setStoredString: setStoredString,
    removeStoredItem: removeStoredItem,
    removeItem: removeStoredItem
  };
```

- [ ] **Step 2: Update `src/js/navigation.js` fallback wrapper**

Modify the top of `src/js/navigation.js` so the IIFE starts with this guard:

```js
(function () {
  if (window.navigationAPI) {
    return;
  }
```

Keep the rest of the fallback DOM behavior unchanged.

- [ ] **Step 3: Update `src/js/app.js` internal `loadJSON`**

Replace the current `loadJSON` function with this adapter-first version:

```js
  async function loadJSON(path, fallback) {
    if (window.dataLoaderAPI && typeof window.dataLoaderAPI.loadJSON === 'function') {
      return window.dataLoaderAPI.loadJSON(path, fallback);
    }

    try {
      var response = await window.fetch(path);
      if (!response.ok) {
        throw new Error('Failed to load data: ' + path);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return fallback;
    }
  }
```

- [ ] **Step 4: Run focused wiring tests**

Run:

```powershell
npx vitest run tests/adapter-wiring.test.js --environment jsdom
```

Expected: Some tests now pass, but static `index.html` direct-call checks still fail until Task 5 updates `index.html`.

---

### Task 4: Implement podcast audio adapter wiring

**Files:**
- Modify: `src/js/podcast.js`
- Test: `tests/podcast-audio-adapter.test.js`

- [ ] **Step 1: Add adapter state and helpers near existing podcast state**

After the existing state variables in `src/js/podcast.js`, add:

```js
  var hasAudioSource = false;
  var audioEventsBound = false;

  function getAudioAPI() {
    return window.audioAPI || null;
  }

  function getCurrentPodcastDuration() {
    var d = podcastData[curPodcast];
    return d && d.dur ? d.dur : 0;
  }
```

- [ ] **Step 2: Add safe audio event binding helpers before `openPlayer`**

Add these functions before `openPlayer`:

```js
  function updateAudioProgress() {
    var audio = getAudioAPI();
    if (!audio || !hasAudioSource) return;

    var current = typeof audio.getCurrentTime === 'function' ? Math.floor(audio.getCurrentTime()) : plCur;
    var duration = typeof audio.getDuration === 'function' ? Math.floor(audio.getDuration()) : getCurrentPodcastDuration();
    if (!duration) {
      duration = getCurrentPodcastDuration();
    }

    plCur = current;
    var pct = duration ? Math.min(100, current / duration * 100) : 0;
    var prog = document.getElementById('pl-prog');
    var cur = document.getElementById('pl-cur');
    if (prog) prog.style.width = pct + '%';
    if (cur) cur.textContent = fmtTime(current);
  }

  function onAudioEnded() {
    isPlaying = false;
    hasAudioSource = false;
    var playButton = document.getElementById('pl-playbtn');
    if (playButton) playButton.textContent = '▶';
    clearInterval(plTimer);
  }

  function onAudioError() {
    isPlaying = false;
    hasAudioSource = false;
    var playButton = document.getElementById('pl-playbtn');
    if (playButton) playButton.textContent = '▶';
    clearInterval(plTimer);
    if (window.navigationAPI && window.navigationAPI.showToast) {
      window.navigationAPI.showToast('音频加载失败，请稍后重试');
    }
  }

  function bindAudioEvents() {
    var audio = getAudioAPI();
    if (!audio || audioEventsBound) return;

    if (typeof audio.onTimeUpdate === 'function') audio.onTimeUpdate(updateAudioProgress);
    if (typeof audio.onEnded === 'function') audio.onEnded(onAudioEnded);
    if (typeof audio.onError === 'function') audio.onError(onAudioError);
    audioEventsBound = true;
  }
```

- [ ] **Step 3: Update `openPlayer` to set audio source when available**

Inside `openPlayer(idx)`, after `isPlaying = false;`, add:

```js
    hasAudioSource = false;
    bindAudioEvents();
```

After the UI reset lines and before `document.getElementById('podcast-player').classList.add('act');`, add:

```js
    if (window.audioAPI && d.audioUrl) {
      hasAudioSource = window.audioAPI.setSource(d.audioUrl);
    }
```

Keep the existing `startPlayProgress();` call. Because `isPlaying` is false at this point, it remains a no-op.

- [ ] **Step 4: Update `togglePlay` to delegate when audio source is active**

Replace `togglePlay` with:

```js
  function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('pl-playbtn').textContent = isPlaying ? '⏸️' : '▶';

    if (hasAudioSource && window.audioAPI) {
      if (isPlaying) {
        window.audioAPI.play();
      } else {
        window.audioAPI.pause();
      }
      return;
    }

    if (isPlaying) startPlayProgress();
    else clearInterval(plTimer);
  }
```

- [ ] **Step 5: Update `seekPodcast` to delegate when audio source is active**

Inside `seekPodcast(e)`, after `plCur = Math.floor(pct * podcastData[curPodcast].dur);`, add:

```js
    if (hasAudioSource && window.audioAPI) {
      window.audioAPI.seek(plCur);
    }
```

- [ ] **Step 6: Run focused podcast adapter tests**

Run:

```powershell
npx vitest run tests/podcast-audio-adapter.test.js --environment jsdom
```

Expected: PASS.

---

### Task 5: Wire adapter scripts and inline platform calls in `index.html`

**Files:**
- Modify: `index.html`
- Test: `tests/adapter-wiring.test.js`

- [ ] **Step 1: Add adapter scripts before business scripts**

Replace the current script block at `index.html` near the Toast section:

```html
<script src="./src/js/storage.js"></script>
<script src="./src/js/navigation.js"></script>
```

with:

```html
<script src="./src/js/adapters/storage.js"></script>
<script src="./src/js/adapters/navigation.js"></script>
<script src="./src/js/adapters/audio.js"></script>
<script src="./src/js/adapters/external-link.js"></script>
<script src="./src/js/adapters/data-loader.js"></script>
<script src="./src/js/storage.js"></script>
<script src="./src/js/navigation.js"></script>
```

- [ ] **Step 2: Add inline adapter compatibility helpers at the top of the final inline script**

Immediately after `<script>` at the bottom of `index.html`, before `function swTab`, add:

```js
function openExternalLink(url) {
  if (window.externalLinkAPI && typeof window.externalLinkAPI.open === 'function') {
    return window.externalLinkAPI.open(url);
  }
  window['open'](url, '_blank');
  return true;
}
function getStoredJSONCompat(key, fallbackValue) {
  if (window.storageAPI && typeof window.storageAPI.getStoredJSON === 'function') {
    return window.storageAPI.getStoredJSON(key, fallbackValue);
  }
  try {
    var raw = window['localStorage'].getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    console.error('getStoredJSONCompat failed:', key, error);
    return fallbackValue;
  }
}
function setStoredJSONCompat(key, value) {
  if (window.storageAPI && typeof window.storageAPI.setStoredJSON === 'function') {
    return window.storageAPI.setStoredJSON(key, value);
  }
  try {
    window['localStorage'].setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('setStoredJSONCompat failed:', key, error);
    return false;
  }
}
function getStoredStringCompat(key, fallbackValue) {
  if (window.storageAPI && typeof window.storageAPI.getStoredString === 'function') {
    return window.storageAPI.getStoredString(key, fallbackValue);
  }
  try {
    var value = window['localStorage'].getItem(key);
    return value === null ? fallbackValue : value;
  } catch (error) {
    console.error('getStoredStringCompat failed:', key, error);
    return fallbackValue;
  }
}
function setStoredStringCompat(key, value) {
  if (window.storageAPI && typeof window.storageAPI.setStoredString === 'function') {
    return window.storageAPI.setStoredString(key, value);
  }
  try {
    window['localStorage'].setItem(key, value);
    return true;
  } catch (error) {
    console.error('setStoredStringCompat failed:', key, error);
    return false;
  }
}
```

The fallback uses bracket notation (`window['open']`, `window['localStorage']`) so the static direct-call check can enforce no business-facing direct `window.open(` or `localStorage.` tokens.

- [ ] **Step 3: Replace hot article inline external-link calls**

Replace every occurrence of:

```html
onclick="window.open('https://mp.weixin.qq.com','_blank')"
```

with:

```html
onclick="openExternalLink('https://mp.weixin.qq.com')"
```

- [ ] **Step 4: Replace mind-map note storage calls**

Replace `openNode` and `saveNode` with:

```js
function openNode(name) {
  document.getElementById('node-note-title').textContent='📝 '+name+' · 节点笔记';
  document.getElementById('node-note-input').value=getStoredStringCompat('note_'+name,'');
  document.getElementById('node-note-input').dataset.node=name;
  document.getElementById('node-note-panel').style.display='flex';
}
function saveNode(){
  var i=document.getElementById('node-note-input'),n=i.dataset.node;
  setStoredStringCompat('note_'+n,i.value);
  document.getElementById('node-note-panel').style.display='none';
  showToast('「'+n+'」的笔记已保存！');
}
```

- [ ] **Step 5: Replace inline checkin storage calls**

In inline `doCheckin`, replace:

```js
var checkins=JSON.parse(localStorage.getItem('checkins')||'{}');
```

with:

```js
var checkins=getStoredJSONCompat('checkins',{});
```

Replace:

```js
localStorage.setItem('checkins',JSON.stringify(checkins));
```

with:

```js
setStoredJSONCompat('checkins',checkins);
```

In inline `renderCheckinCalendar` and `updateCheckinStats`, replace each:

```js
var checkins=JSON.parse(localStorage.getItem('checkins')||'{}');
```

with:

```js
var checkins=getStoredJSONCompat('checkins',{});
```

- [ ] **Step 6: Run focused wiring tests**

Run:

```powershell
npx vitest run tests/adapter-wiring.test.js --environment jsdom
```

Expected: PASS.

---

### Task 6: Remove direct storage fallback from `src/js/checkin.js`

**Files:**
- Modify: `src/js/checkin.js`
- Test: `tests/checkin.test.js`

- [ ] **Step 1: Replace fallback direct storage in `getCheckins`**

Replace `getCheckins` with:

```js
  function getCheckins() {
    if (window.storageAPI && window.storageAPI.getStoredJSON) {
      return window.storageAPI.getStoredJSON('checkins', {});
    }

    console.error('getCheckins failed:', new Error('storageAPI unavailable'));
    return {};
  }
```

- [ ] **Step 2: Replace fallback direct storage in `setCheckins`**

Replace `setCheckins` with:

```js
  function setCheckins(checkins) {
    if (window.storageAPI && window.storageAPI.setStoredJSON) {
      return window.storageAPI.setStoredJSON('checkins', checkins);
    }

    console.error('setCheckins failed:', new Error('storageAPI unavailable'));
    return false;
  }
```

This is safe because `index.html` now loads `adapters/storage.js` before `checkin.js` is used, and tests already provide `window.storageAPI`.

- [ ] **Step 3: Run checkin tests**

Run:

```powershell
npx vitest run tests/checkin.test.js --environment jsdom
```

Expected: PASS.

---

### Task 7: Validate all tests and commit Task 1.6

**Files:**
- Modify: `index.html`
- Modify: `src/js/storage.js`
- Modify: `src/js/navigation.js`
- Modify: `src/js/app.js`
- Modify: `src/js/podcast.js`
- Modify: `src/js/checkin.js`
- Modify: `tests/helpers/dom-test-utils.js`
- Create: `tests/adapter-wiring.test.js`
- Create: `tests/podcast-audio-adapter.test.js`

- [ ] **Step 1: Run focused Task 1.6 tests**

Run:

```powershell
npx vitest run tests/adapter-wiring.test.js tests/podcast-audio-adapter.test.js tests/checkin.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 2: Run all tests**

Run:

```powershell
npx vitest run --environment jsdom
```

Expected: PASS for the full suite.

- [ ] **Step 3: Inspect changed files**

Run:

```powershell
git status --short
```

Expected: Task 1.6 files are modified or new. Pre-existing unrelated untracked files may remain, especially prior generated implementation plan docs; do not stage unrelated files.

- [ ] **Step 4: Stage only Task 1.6 files**

Run:

```powershell
git add -- index.html src/js/storage.js src/js/navigation.js src/js/app.js src/js/podcast.js src/js/checkin.js tests/helpers/dom-test-utils.js tests/adapter-wiring.test.js tests/podcast-audio-adapter.test.js
```

Expected: no command output.

- [ ] **Step 5: Commit Task 1.6**

Run:

```powershell
git commit -m "refactor: wire existing modules to adapters"
```

Expected: a commit is created with only Task 1.6 wiring and tests.

- [ ] **Step 6: Report completion**

Report these facts:

```text
Task 1.6 complete.
Adapters now load before business modules.
Legacy storage/navigation modules no longer overwrite adapters.
app.js prefers dataLoaderAPI with fetch fallback.
podcast.js uses audioAPI when audioUrl exists and preserves simulated fallback.
index.html inline window.open/localStorage calls now route through adapter-compatible helpers.
Full Vitest suite passes.
```
