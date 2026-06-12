import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const PODCASTS = [
  {
    id: 'podcast-zhenguan',
    title: '贞观之治：盛世背后的智慧',
    category: 'suitang',
    dur: 1680,
    icon: '🏛️',
    colors: ['#5A3E1B', '#8B6914'],
    author: 'AI历史助手',
    audioUrl: './assets/audio/zhenguan.mp3',
    listens: '2.3万人收听'
  },
  {
    id: 'podcast-shangyang',
    title: '商鞅变法：战国变局的破局者',
    category: 'qin',
    dur: 1320,
    icon: '⚔️',
    colors: ['#C0392B', '#E74C3C'],
    author: 'AI历史助手',
    audioUrl: './assets/audio/shangyang.mp3',
    listens: '1.8万人收听'
  }
];

function mountPodcastDOM() {
  mountDOM(`
    <div id="podcast-tabs">
      <button class="pctab act" id="pctab-all">全部</button>
      <button class="pctab" id="pctab-qin">先秦</button>
      <button class="pctab" id="pctab-suitang">隋唐</button>
    </div>
    <div id="podcast-list"></div>
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

function installAudioAPI(options) {
  var opts = options || {};
  var handlers = {};

  window.audioAPI = {
    setSource: vi.fn(function () { return opts.setSourceResult !== false; }),
    play: vi.fn(function () { return opts.playResult !== false; }),
    pause: vi.fn(function () { return true; }),
    seek: vi.fn(function () { return true; }),
    setPlaybackRate: vi.fn(function () { return true; }),
    onTimeUpdate: vi.fn(function (handler) { handlers.timeupdate = handler; return true; }),
    onEnded: vi.fn(function (handler) { handlers.ended = handler; return true; }),
    onError: vi.fn(function (handler) { handlers.error = handler; return true; }),
    getCurrentTime: vi.fn(function () { return 15; }),
    getDuration: vi.fn(function () { return 60; }),
    handlers: handlers
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetGlobals();
  vi.useFakeTimers();
  mountPodcastDOM();
  window.navigationAPI = { showToast: vi.fn() };
  window.showToast = vi.fn();
  window.htmlUtils = {
    escapeHtml(value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };
});

describe('podcast seed data', () => {
  test('provides 5+ Phase 5 podcast items with reachable local audio', () => {
    const data = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/podcasts.json'), 'utf8'));

    expect(data.length).toBeGreaterThanOrEqual(5);
    data.forEach(function (item) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.dur).toBeGreaterThan(0);
      expect(item.audioUrl).toBeTruthy();
      expect(readFileSync(resolve(process.cwd(), item.audioUrl.replace(/^\.\//, ''))).length).toBeGreaterThan(0);
    });
  });
});

describe('podcast list rendering', () => {
  test('renders podcast cards from data and filters by category', async () => {
    await import('../src/js/podcast.js');

    window.podcastAPI.setPodcasts(PODCASTS);

    expect(document.querySelectorAll('#podcast-list .pccard')).toHaveLength(2);
    expect(document.getElementById('podcast-list').textContent).toContain('贞观之治：盛世背后的智慧');

    window.podcastAPI.filterPodcast('qin', document.getElementById('pctab-qin'));

    expect(document.getElementById('pctab-qin').classList.contains('act')).toBe(true);
    expect(document.querySelector('[data-podcast-id="podcast-shangyang"]').style.display).toBe('flex');
    expect(document.querySelector('[data-podcast-id="podcast-zhenguan"]').style.display).toBe('none');
  });

  test('renders empty state when podcast data is empty', async () => {
    await import('../src/js/podcast.js');

    window.podcastAPI.setPodcasts([]);

    expect(document.getElementById('podcast-list').textContent).toContain('暂无播客内容');
  });
});

describe('podcast player via audioAPI', () => {
  test('openPlayer sets audio source and togglePlay delegates play and pause', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');
    window.podcastAPI.setPodcasts(PODCASTS);

    window.podcastAPI.openPlayer(0);
    window.podcastAPI.togglePlay();
    window.podcastAPI.togglePlay();

    expect(window.audioAPI.setSource).toHaveBeenCalledWith('./assets/audio/zhenguan.mp3');
    expect(window.audioAPI.play).toHaveBeenCalledTimes(1);
    expect(window.audioAPI.pause).toHaveBeenCalledTimes(1);
    expect(document.getElementById('pl-playbtn').textContent).toBe('▶');
  });

  test('seekPodcast delegates seek to audioAPI and updates progress text', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');
    window.podcastAPI.setPodcasts(PODCASTS);

    window.podcastAPI.openPlayer(0);
    window.podcastAPI.seekPodcast({ clientX: 50 });

    expect(window.audioAPI.seek).toHaveBeenCalledWith(840);
    expect(document.getElementById('pl-cur').textContent).toBe('14:00');
  });

  test('toggleSpeed cycles speed button text and delegates playback rate', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');
    window.podcastAPI.setPodcasts(PODCASTS);
    window.podcastAPI.openPlayer(0);

    window.podcastAPI.toggleSpeed();
    expect(document.getElementById('pl-speed').textContent).toBe('1.25x');
    expect(window.audioAPI.setPlaybackRate).toHaveBeenLastCalledWith(1.25);
    window.podcastAPI.toggleSpeed();
    expect(document.getElementById('pl-speed').textContent).toBe('1.5x');
    expect(window.audioAPI.setPlaybackRate).toHaveBeenLastCalledWith(1.5);
  });

  test('setTimer pauses audio, closes the player and shows toast when timer fires', async () => {
    installAudioAPI();
    await import('../src/js/podcast.js');
    window.podcastAPI.setPodcasts(PODCASTS);
    window.podcastAPI.openPlayer(0);
    window.podcastAPI.togglePlay();

    window.podcastAPI.setTimer(15);
    vi.advanceTimersByTime(15 * 60000);

    expect(window.audioAPI.pause).toHaveBeenCalled();
    expect(document.getElementById('podcast-player').classList.contains('act')).toBe(false);
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('定时关闭已触发');
  });

  test('rejected play promise shows toast and resets UI state', async () => {
    installAudioAPI();
    window.audioAPI.play = vi.fn(function () { return Promise.reject(new Error('blocked')); });
    await import('../src/js/podcast.js');
    window.podcastAPI.setPodcasts(PODCASTS);
    window.podcastAPI.openPlayer(0);

    window.podcastAPI.togglePlay();
    await Promise.resolve();

    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('音频加载失败，请稍后重试');
    expect(document.getElementById('pl-playbtn').textContent).toBe('▶');
  });

  test('shows toast when audio source loading fails or audioAPI reports error', async () => {
    installAudioAPI({ setSourceResult: false });
    await import('../src/js/podcast.js');
    window.podcastAPI.setPodcasts(PODCASTS);

    window.podcastAPI.openPlayer(0);
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('音频加载失败，请稍后重试');

    window.audioAPI.handlers.error({ type: 'error' });
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('音频加载失败，请稍后重试');
  });

  test('escapes script-like podcast data before rendering', async () => {
    await import('../src/js/podcast.js');
    window.podcastAPI.setPodcasts([
      {
        id: 'xss',
        title: '<script>window.__podcastXss = true</script>播客',
        category: 'qin',
        dur: 60,
        icon: '<img src=x onerror="window.__podcastXss = true">',
        colors: ['#111', '#222'],
        author: '<script>bad</script>',
        audioUrl: ''
      }
    ]);

    expect(document.querySelector('#podcast-list script')).toBeNull();
    expect(document.querySelector('#podcast-list img')).toBeNull();
    expect(window.__podcastXss).toBeUndefined();
    expect(document.getElementById('podcast-list').innerHTML).toContain('&lt;script&gt;window.__podcastXss = true&lt;/script&gt;播客');
  });
});
