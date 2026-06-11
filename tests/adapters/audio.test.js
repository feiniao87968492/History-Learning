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
