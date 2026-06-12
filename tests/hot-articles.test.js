import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const HOT_ARTICLES = [
  {
    id: 'hot-zhenguan',
    kind: 'headline',
    dynasty: 'qinhan',
    icon: '📜',
    background: '#C9A96E',
    tag: '热门',
    tagClass: 'hot',
    label: '贞观之治',
    title: '唐太宗李世民在位期间的清明政治局面。',
    meta: ['📖 2.3k 阅读', '❤️ 892 收藏'],
    url: 'https://example.com/zhenguan'
  },
  {
    id: 'hot-keju',
    kind: 'headline',
    dynasty: 'suitang',
    icon: '🏜️',
    background: '#E8D5B0',
    tag: '制度',
    tagClass: 'sys',
    label: '科举制',
    title: '隋朝创立的分科考试选拔官员的制度。',
    meta: ['📖 1.6k 阅读', '❤️ 467 收藏'],
    url: 'https://example.com/keju'
  },
  {
    id: 'hot-song-economy',
    kind: 'item',
    dynasty: 'song',
    icon: '🏯',
    background: '#D4C0A0',
    title: '宋朝：被误解的弱宋实为经济革命',
    meta: '💰 经济史 · 10分钟阅读',
    cta: '🔗 阅读原文',
    url: 'https://example.com/song'
  }
];

function mountHotDOM() {
  mountDOM(`
    <div class="htabs" id="hot-tabs">
      <button class="htab act" onclick="filterHot('all',this)">全部</button>
      <button class="htab" onclick="filterHot('qinhan',this)">秦汉</button>
      <button class="htab" onclick="filterHot('suitang',this)">隋唐</button>
      <button class="htab" onclick="filterHot('song',this)">宋元</button>
    </div>
    <div class="ha" id="hot-articles"></div>
    <div id="toast"></div>
  `);
}

function installFetchMock(articles) {
  global.fetch = vi.fn(async (path) => {
    if (path.endsWith('nouns.json')) return { ok: true, json: async () => ({}) };
    if (path.endsWith('timeline.json')) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
    if (path.endsWith('podcasts.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('films.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('rankings.json')) return { ok: true, json: async () => ({ book: [], film: [], doc: [] }) };
    if (path.endsWith('memes.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('feedback-types.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('hot-articles.json')) return { ok: true, json: async () => articles };
    if (path.endsWith('discussions.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('profile-menu.json')) return { ok: true, json: async () => ({ study: [], settings: [] }) };
    return { ok: true, json: async () => [] };
  });
}

async function importAppAndFlush() {
  await import('../src/js/app.js');
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetGlobals();
  mountHotDOM();
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: 'complete'
  });
  window.navigationAPI = { showToast: vi.fn(), resetAIFab: vi.fn(), login: vi.fn(), openSub: vi.fn(), closeSub: vi.fn() };
  window.storageAPI = { getStoredJSON: vi.fn(), setStoredJSON: vi.fn(), getStoredString: vi.fn(), setStoredString: vi.fn() };
  window.externalLinkAPI = { open: vi.fn() };
  window.nounAPI = { setNounData: vi.fn() };
  window.timelineAPI = { setDynasties: vi.fn(), setTimelineEvents: vi.fn(), renderTimeline: vi.fn(), renderEventList: vi.fn() };
  window.podcastAPI = { setPodcasts: vi.fn() };
});

describe('hot articles module', () => {
  test('index shell keeps hot article container empty for data-driven rendering', () => {
    var html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    var containerMatch = html.match(/<div class="ha" id="hot-articles">([\s\S]*?)<\/div>\s*<\/div>\s*<!-- ===== 名词解释 ===== -->/);

    expect(containerMatch).not.toBeNull();
    expect(containerMatch[1]).not.toContain('class="hl"');
    expect(containerMatch[1]).not.toContain('class="hi"');
  });

  test('renders headline and item cards from hot-articles.json', async () => {
    installFetchMock(HOT_ARTICLES);

    await importAppAndFlush();

    expect(document.querySelectorAll('#hot-articles .hl')).toHaveLength(2);
    expect(document.querySelectorAll('#hot-articles .hi')).toHaveLength(1);
    expect(document.getElementById('hot-articles').textContent).toContain('贞观之治');
    expect(document.getElementById('hot-articles').textContent).toContain('宋朝：被误解的弱宋实为经济革命');
  });

  test('filterHot filters cards by dynasty and updates active tab', async () => {
    installFetchMock(HOT_ARTICLES);
    await importAppAndFlush();

    var songButton = document.querySelectorAll('#hot-tabs .htab')[3];
    window.filterHot('song', songButton);

    expect(songButton.classList.contains('act')).toBe(true);
    expect(document.querySelector('[data-article-id="hot-song-economy"]').style.display).toBe('block');
    expect(document.querySelector('[data-article-id="hot-zhenguan"]').style.display).toBe('none');
    expect(document.querySelector('[data-article-id="hot-keju"]').style.display).toBe('none');
  });

  test('clicking a hot article opens its url through externalLinkAPI', async () => {
    installFetchMock(HOT_ARTICLES);
    await importAppAndFlush();

    document.querySelector('[data-article-id="hot-zhenguan"]').click();

    expect(window.externalLinkAPI.open).toHaveBeenCalledWith('https://example.com/zhenguan');
  });

  test('renders an empty state when there are no hot articles', async () => {
    installFetchMock([]);
    await importAppAndFlush();

    expect(document.getElementById('hot-articles').textContent).toContain('暂无热点文章');
  });

  test('escapes script-like hot article fields before rendering', async () => {
    installFetchMock([
      {
        id: 'xss',
        kind: 'headline',
        dynasty: 'qinhan',
        icon: '<img src=x onerror="window.__hotXss = true">',
        background: '#C9A96E',
        tag: '<script>window.__hotXss = true</script>',
        tagClass: 'hot',
        label: '测试',
        title: '<script>window.__hotXss = true</script>热点',
        meta: ['<img src=x onerror="window.__hotXss = true">'],
        url: 'https://example.com/xss'
      }
    ]);

    await importAppAndFlush();

    expect(document.querySelector('#hot-articles script')).toBeNull();
    expect(document.querySelector('#hot-articles img')).toBeNull();
    expect(window.__hotXss).toBeUndefined();
    expect(document.getElementById('hot-articles').innerHTML).toContain('&lt;script&gt;window.__hotXss = true&lt;/script&gt;热点');
  });
});
