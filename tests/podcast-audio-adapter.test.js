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
    <button id="pl-speed">1.0x</button>
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
    setPlaybackRate: vi.fn(function () { return true; }),
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

  test('toggleSpeed delegates playback rate to audioAPI for active audio', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');

    window.podcastAPI.setPodcasts([
      { title: '贞观之治', author: 'AI历史助手', icon: '🏛️', colors: ['#111', '#222'], dur: 60, audioUrl: './assets/audio/zhenguan.mp3' }
    ]);
    window.podcastAPI.openPlayer(0);
    window.podcastAPI.toggleSpeed();

    expect(window.audioAPI.setPlaybackRate).toHaveBeenLastCalledWith(1.25);
  });

  test('closePlayer pauses active audio and resets playing state', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');

    window.podcastAPI.setPodcasts([
      { title: '贞观之治', author: 'AI历史助手', icon: '🏛️', colors: ['#111', '#222'], dur: 60, audioUrl: './assets/audio/zhenguan.mp3' }
    ]);
    window.podcastAPI.openPlayer(0);
    window.podcastAPI.togglePlay();
    window.podcastAPI.closePlayer();

    expect(window.audioAPI.pause).toHaveBeenCalledTimes(1);
    expect(document.getElementById('pl-playbtn').textContent).toBe('▶');
    expect(document.getElementById('podcast-player').classList.contains('act')).toBe(false);
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
