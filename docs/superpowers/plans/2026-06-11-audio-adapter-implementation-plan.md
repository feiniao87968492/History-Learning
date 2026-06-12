# Audio Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Task 1.3 by adding a tested Web audio adapter at `src/js/adapters/audio.js` without changing podcast business code.

**Architecture:** The adapter owns a single HTML5 `Audio` instance and exposes a small `window.audioAPI` boundary. Business modules will later use this boundary instead of platform audio APIs; this task only creates and tests the boundary.

**Tech Stack:** Native ES5 JavaScript, IIFE modules, `window.audioAPI`, Vitest, jsdom, mocked `window.Audio`.

---

## File Structure

- Create: `src/js/adapters/audio.js`
  - Responsibility: wrap one HTML5 `Audio` object and expose `window.audioAPI` methods.
  - Public API: `setSource`, `play`, `pause`, `seek`, `onTimeUpdate`, `onEnded`, `onError`, `getCurrentTime`, `getDuration`, `isPaused`.
- Create: `tests/adapters/audio.test.js`
  - Responsibility: mock `window.Audio`, import the adapter, and verify the public API behavior.
- Do not modify: `src/js/podcast.js`
  - Reason: Task 1.3 is adapter creation only. Business integration is later work.

---

### Task 1: Add failing audio adapter tests

**Files:**
- Create: `tests/adapters/audio.test.js`

- [ ] **Step 1: Write the failing test file**

Create `tests/adapters/audio.test.js` with this complete content:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetGlobals } from '../helpers/dom-test-utils.js';

function createMockAudioClass(options) {
  var instances = [];
  var opts = options || {};

  function MockAudio() {
    this.src = '';
    this.currentTime = 0;
    this.duration = 120;
    this.paused = true;
    this.load = vi.fn();
    this.play = vi.fn(() => {
      if (opts.playThrows) {
        throw new Error('play blocked');
      }
      this.paused = false;
      return 'play-result';
    });
    this.pause = vi.fn(() => {
      if (opts.pauseThrows) {
        throw new Error('pause blocked');
      }
      this.paused = true;
    });
    this.addEventListener = vi.fn((eventName, handler) => {
      if (opts.addEventListenerThrows) {
        throw new Error('listener blocked');
      }
      this.listeners[eventName] = handler;
    });
    this.listeners = {};
    instances.push(this);
  }

  MockAudio.instances = instances;
  return MockAudio;
}

function installMockAudio(options) {
  var MockAudio = createMockAudioClass(options);
  Object.defineProperty(window, 'Audio', {
    value: MockAudio,
    configurable: true
  });
  return MockAudio;
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  installMockAudio();
});

describe('audio adapter', () => {
  test('exposes the expected audio API methods', async () => {
    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI).toEqual({
      setSource: expect.any(Function),
      play: expect.any(Function),
      pause: expect.any(Function),
      seek: expect.any(Function),
      onTimeUpdate: expect.any(Function),
      onEnded: expect.any(Function),
      onError: expect.any(Function),
      getCurrentTime: expect.any(Function),
      getDuration: expect.any(Function),
      isPaused: expect.any(Function)
    });
  });

  test('sets the audio source and calls load', async () => {
    var MockAudio = installMockAudio();

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.setSource('./assets/audio/test.mp3')).toBe(true);
    expect(MockAudio.instances[0].src).toBe('./assets/audio/test.mp3');
    expect(MockAudio.instances[0].load).toHaveBeenCalledTimes(1);
  });

  test('plays and pauses through the underlying audio object', async () => {
    var MockAudio = installMockAudio();

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.play()).toBe('play-result');
    expect(MockAudio.instances[0].play).toHaveBeenCalledTimes(1);
    expect(window.audioAPI.isPaused()).toBe(false);

    expect(window.audioAPI.pause()).toBe(true);
    expect(MockAudio.instances[0].pause).toHaveBeenCalledTimes(1);
    expect(window.audioAPI.isPaused()).toBe(true);
  });

  test('seeks to a valid second value', async () => {
    var MockAudio = installMockAudio();

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.seek(35)).toBe(true);
    expect(MockAudio.instances[0].currentTime).toBe(35);
    expect(window.audioAPI.getCurrentTime()).toBe(35);
  });

  test('clamps invalid seek values to zero', async () => {
    var MockAudio = installMockAudio();

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.seek(-10)).toBe(true);
    expect(MockAudio.instances[0].currentTime).toBe(0);

    expect(window.audioAPI.seek('not a number')).toBe(true);
    expect(MockAudio.instances[0].currentTime).toBe(0);
  });

  test('returns duration from the underlying audio object', async () => {
    var MockAudio = installMockAudio();

    await import('../../src/js/adapters/audio.js');
    MockAudio.instances[0].duration = 240;

    expect(window.audioAPI.getDuration()).toBe(240);
  });

  test('registers and triggers timeupdate, ended, and error callbacks', async () => {
    var MockAudio = installMockAudio();
    var onTimeUpdate = vi.fn();
    var onEnded = vi.fn();
    var onError = vi.fn();

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.onTimeUpdate(onTimeUpdate)).toBe(true);
    expect(window.audioAPI.onEnded(onEnded)).toBe(true);
    expect(window.audioAPI.onError(onError)).toBe(true);

    MockAudio.instances[0].listeners.timeupdate({ type: 'timeupdate' });
    MockAudio.instances[0].listeners.ended({ type: 'ended' });
    MockAudio.instances[0].listeners.error({ type: 'error' });

    expect(onTimeUpdate).toHaveBeenCalledWith({ type: 'timeupdate' });
    expect(onEnded).toHaveBeenCalledWith({ type: 'ended' });
    expect(onError).toHaveBeenCalledWith({ type: 'error' });
  });

  test('ignores non-function event handlers', async () => {
    var MockAudio = installMockAudio();

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.onTimeUpdate('not a function')).toBe(false);
    expect(window.audioAPI.onEnded(null)).toBe(false);
    expect(window.audioAPI.onError(undefined)).toBe(false);
    expect(MockAudio.instances[0].addEventListener).not.toHaveBeenCalled();
  });

  test('logs and returns false when play throws synchronously', async () => {
    installMockAudio({ playThrows: true });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.play()).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('audioAdapter.play failed:', expect.any(Error));

    errorSpy.mockRestore();
  });

  test('logs and returns false when pause throws synchronously', async () => {
    installMockAudio({ pauseThrows: true });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.pause()).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('audioAdapter.pause failed:', expect.any(Error));

    errorSpy.mockRestore();
  });

  test('logs and returns false when listener registration throws', async () => {
    installMockAudio({ addEventListenerThrows: true });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/audio.js');

    expect(window.audioAPI.onError(function () {})).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('audioAdapter.addEventListener failed:', 'error', expect.any(Error));

    errorSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```powershell
npx vitest run tests/adapters/audio.test.js --environment jsdom
```

Expected: FAIL because `../../src/js/adapters/audio.js` does not exist yet.

---

### Task 2: Implement the audio adapter

**Files:**
- Create: `src/js/adapters/audio.js`
- Test: `tests/adapters/audio.test.js`

- [ ] **Step 1: Write the minimal adapter implementation**

Create `src/js/adapters/audio.js` with this complete content:

```js
(function () {
  var audio = new window.Audio();

  function setSource(src) {
    try {
      audio.src = src || '';
      if (typeof audio.load === 'function') {
        audio.load();
      }
      return true;
    } catch (error) {
      console.error('audioAdapter.setSource failed:', error);
      return false;
    }
  }

  function play() {
    try {
      return audio.play();
    } catch (error) {
      console.error('audioAdapter.play failed:', error);
      return false;
    }
  }

  function pause() {
    try {
      audio.pause();
      return true;
    } catch (error) {
      console.error('audioAdapter.pause failed:', error);
      return false;
    }
  }

  function seek(seconds) {
    try {
      var nextTime = Number(seconds);
      if (!isFinite(nextTime) || nextTime < 0) {
        nextTime = 0;
      }
      audio.currentTime = nextTime;
      return true;
    } catch (error) {
      console.error('audioAdapter.seek failed:', error);
      return false;
    }
  }

  function addAudioListener(eventName, handler) {
    if (typeof handler !== 'function') {
      return false;
    }

    try {
      audio.addEventListener(eventName, handler);
      return true;
    } catch (error) {
      console.error('audioAdapter.addEventListener failed:', eventName, error);
      return false;
    }
  }

  function onTimeUpdate(handler) {
    return addAudioListener('timeupdate', handler);
  }

  function onEnded(handler) {
    return addAudioListener('ended', handler);
  }

  function onError(handler) {
    return addAudioListener('error', handler);
  }

  function getCurrentTime() {
    return audio.currentTime || 0;
  }

  function getDuration() {
    return audio.duration || 0;
  }

  function isPaused() {
    return audio.paused;
  }

  window.audioAPI = {
    setSource: setSource,
    play: play,
    pause: pause,
    seek: seek,
    onTimeUpdate: onTimeUpdate,
    onEnded: onEnded,
    onError: onError,
    getCurrentTime: getCurrentTime,
    getDuration: getDuration,
    isPaused: isPaused
  };
})();
```

- [ ] **Step 2: Run the focused audio adapter test**

Run:

```powershell
npx vitest run tests/adapters/audio.test.js --environment jsdom
```

Expected: PASS for all tests in `tests/adapters/audio.test.js`.

- [ ] **Step 3: Run existing adapter tests**

Run:

```powershell
npx vitest run tests/adapters/storage.test.js tests/adapters/navigation.test.js tests/adapters/audio.test.js --environment jsdom
```

Expected: PASS for storage, navigation, and audio adapter tests.

---

### Task 3: Validate and commit Task 1.3

**Files:**
- Create: `src/js/adapters/audio.js`
- Create: `tests/adapters/audio.test.js`

- [ ] **Step 1: Check that only Task 1.3 files are staged for this commit**

Run:

```powershell
git status --short
```

Expected: `src/js/adapters/audio.js` and `tests/adapters/audio.test.js` are new files. Other pre-existing working tree changes may exist, but do not stage them for this commit.

- [ ] **Step 2: Run the focused acceptance test**

Run:

```powershell
npx vitest run tests/adapters/audio.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 3: Stage only Task 1.3 files**

Run:

```powershell
git add -- src/js/adapters/audio.js tests/adapters/audio.test.js
```

Expected: no command output.

- [ ] **Step 4: Commit the adapter**

Run:

```powershell
git commit -m "feat: add audio adapter with tests"
```

Expected: a commit is created with exactly the new audio adapter and its test file.

- [ ] **Step 5: Report completion**

Report these facts:

```text
Task 1.3 complete.
Created src/js/adapters/audio.js and tests/adapters/audio.test.js.
Focused audio adapter tests pass.
Podcast business integration was intentionally not changed.
```
