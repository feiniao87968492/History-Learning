import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeStorageMock, mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const FILMS = [
  {
    id: 'book-wanli-shiwu-nian',
    type: 'book',
    title: '万历十五年',
    creator: '黄仁宇 著',
    year: '1981年',
    rating: '9.0',
    ratingCount: '21.2万人评',
    description: '以1587年为切入点，从“大历史观”审视明朝中晚期的政治、经济与文化困境。',
    tags: ['历史', '大历史观'],
    coverStyle: 'linear-gradient(135deg,#5A3E1B,#8B6914)',
    badge: '书籍',
    icon: '📖'
  },
  {
    id: 'film-last-emperor',
    type: 'film',
    title: '末代皇帝',
    creator: '贝纳尔多·贝托鲁奇 导演',
    year: '1987年',
    rating: '9.3',
    ratingCount: '66.6万人评',
    description: '从溥仪三岁登基到成为新中国公民，跨越清末、民国、抗战、新中国四个历史时期。',
    tags: ['清朝', '传记', '奥斯卡'],
    coverStyle: 'linear-gradient(135deg,#1A1A2E,#16213E)',
    badge: '影视',
    icon: '🎬'
  },
  {
    id: 'doc-hexi-zoulang',
    type: 'doc',
    title: '河西走廊',
    creator: '央视纪录片',
    year: '2015年 · 10集',
    rating: '9.7',
    ratingCount: '17.1万人评',
    description: '以河西走廊为线索，探寻汉、三国、隋、唐、元、明、清等朝代中，中国与西域的文明交汇。',
    tags: ['历史', '丝绸之路'],
    coverStyle: 'linear-gradient(135deg,#2E7D4F,#27AE60)',
    badge: '纪录片',
    icon: '📺'
  }
];

const RANKINGS = {
  book: [
    { id: 'book-wanli-shiwu-nian', title: '万历十五年', subtitle: '黄仁宇 著', score: '9.0', rank: 1, icon: '📖' }
  ],
  film: [
    { id: 'film-last-emperor', title: '末代皇帝', subtitle: '贝纳尔多·贝托鲁奇 1987', score: '9.3', rank: 1, icon: '🎬' }
  ],
  doc: [
    { id: 'doc-hexi-zoulang', title: '河西走廊', subtitle: '央视纪录片 2015', score: '9.7', rank: 1, icon: '📺' }
  ]
};

function mountFilmDOM() {
  mountDOM(`
    <div id="film-page">
      <div class="fg2">
        <button class="dtab act" id="filter-all">全部</button>
        <button class="dtab" id="filter-book">书籍</button>
        <button class="dtab" id="filter-film">影视</button>
        <button class="dtab" id="filter-doc">纪录片</button>
      </div>
      <div class="fg3" id="film-grid"></div>
      <div class="rnk" id="film-rank">
        <div class="rnktab">
          <button class="rnkt act" id="rank-book">书籍榜</button>
          <button class="rnkt" id="rank-film">影视榜</button>
          <button class="rnkt" id="rank-doc">纪录片榜</button>
        </div>
        <div class="rnklist" id="rnk-list"></div>
      </div>
      <div class="wlpanel" id="watchlist-panel">
        <div class="wlhead">
          <button class="bk" id="wl-close">←</button>
          <h3>🎬 我的待看栏</h3>
        </div>
        <div class="wltabs">
          <button class="wltab act" id="wl-want">待看</button>
          <button class="wltab" id="wl-watching">在看</button>
          <button class="wltab" id="wl-watched">看过</button>
        </div>
        <div class="wllist" id="wl-list"></div>
      </div>
      <div id="toast"></div>
    </div>
  `);
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  Object.defineProperty(window, 'localStorage', {
    value: makeStorageMock(),
    configurable: true
  });
  window.storageAPI = {
    getStoredJSON(key, fallbackValue) {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallbackValue;
    },
    setStoredJSON(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
  };
  window.navigationAPI = {
    showToast: vi.fn()
  };
  mountFilmDOM();
});

describe('film seed data', () => {
  test('provides 15+ Phase 5 items per content type', () => {
    const data = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/films.json'), 'utf8'));
    const byType = data.reduce(function (acc, item) {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    expect(byType.book).toBeGreaterThanOrEqual(15);
    expect(byType.film).toBeGreaterThanOrEqual(15);
    expect(byType.doc).toBeGreaterThanOrEqual(15);
  });

  test('ranking seed data is sorted by score descending in every category', () => {
    const rankings = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/rankings.json'), 'utf8'));

    ['book', 'film', 'doc'].forEach(function (type) {
      const scores = rankings[type].map(function (item) { return Number(item.score); });
      const sorted = scores.slice().sort(function (a, b) { return b - a; });
      expect(scores).toEqual(sorted);
    });
  });
});

describe('film module rendering', () => {
  test('renders all films, filters by type, and switches ranking tabs', async () => {
    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings(RANKINGS);
    window.filmAPI.initializeFilmModule();

    expect(document.querySelectorAll('#film-grid .fcard')).toHaveLength(3);
    expect(document.getElementById('rnk-list').textContent).toContain('万历十五年');

    window.filmAPI.filterFilms('book', document.getElementById('filter-book'));
    expect(document.querySelectorAll('#film-grid .fcard')).toHaveLength(1);
    expect(document.getElementById('film-grid').textContent).toContain('万历十五年');

    window.filmAPI.switchRankingTab('film', document.getElementById('rank-film'));
    expect(document.getElementById('rnk-list').textContent).toContain('末代皇帝');
    expect(document.getElementById('rank-film').classList.contains('act')).toBe(true);
  });

  test('sorts ranking entries by numeric score descending before rendering', async () => {
    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings({
      book: [
        { id: 'book-low', title: '低分书', subtitle: '测试', score: '8.1', rank: 1, icon: '📖' },
        { id: 'book-high', title: '高分书', subtitle: '测试', score: '9.6', rank: 2, icon: '📖' }
      ],
      film: [],
      doc: []
    });
    window.filmAPI.initializeFilmModule();

    const items = document.querySelectorAll('#rnk-list .rnkitem');
    expect(items[0].textContent).toContain('高分书');
    expect(items[0].querySelector('.rnkidx').textContent).toBe('1');
    expect(items[1].textContent).toContain('低分书');
    expect(items[1].querySelector('.rnkidx').textContent).toBe('2');
  });
});

describe('app wiring for film module', () => {
  test('loads film datasets and initializes film module', async () => {
    vi.resetModules();
    resetGlobals();
    mountDOM('<div id="toast"></div>');
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete'
    });

    window.filmAPI = {
      setFilms: vi.fn(),
      setRankings: vi.fn(),
      initializeFilmModule: vi.fn(),
      filterFilms: vi.fn(),
      switchRankingTab: vi.fn(),
      openWatchlist: vi.fn(),
      closeWatchlist: vi.fn(),
      switchWatchlistTab: vi.fn(),
      toggleWatchlistItem: vi.fn(),
      moveWatchlistItem: vi.fn()
    };

    window.nounAPI = { setNounData: vi.fn() };
    window.timelineAPI = {
      setDynasties: vi.fn(),
      setTimelineEvents: vi.fn(),
      renderTimeline: vi.fn(),
      renderEventList: vi.fn()
    };
    window.podcastAPI = { setPodcasts: vi.fn() };
    window.checkinAPI = { updateCheckinStats: vi.fn() };
    window.navigationAPI = { showToast: vi.fn(), resetAIFab: vi.fn() };
    window.storageAPI = {
      getStoredJSON: vi.fn(),
      setStoredJSON: vi.fn(),
      getStoredString: vi.fn(),
      setStoredString: vi.fn()
    };

    global.fetch = vi.fn(async (path) => {
      if (path.indexOf('nouns.json') !== -1) return { ok: true, json: async () => ({}) };
      if (path.indexOf('timeline.json') !== -1) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
      if (path.indexOf('podcasts.json') !== -1) return { ok: true, json: async () => [] };
      if (path.indexOf('films.json') !== -1) return { ok: true, json: async () => FILMS };
      if (path.indexOf('rankings.json') !== -1) return { ok: true, json: async () => RANKINGS };
      if (path.indexOf('memes.json') !== -1) return { ok: true, json: async () => [] };
      if (path.indexOf('people.json') !== -1) return { ok: true, json: async () => ({ defaultCenter: '武则天', defaultGroup: 'career', centers: {} }) };
      if (path.indexOf('mindmaps.json') !== -1) return { ok: true, json: async () => ({ maps: {} }) };
      if (path.indexOf('questions.json') !== -1) return { ok: true, json: async () => [] };
      if (path.indexOf('discussions.json') !== -1) return { ok: true, json: async () => [] };
      if (path.indexOf('hot-articles.json') !== -1) return { ok: true, json: async () => [] };
      if (path.indexOf('profile-menu.json') !== -1) return { ok: true, json: async () => ({ study: [], settings: [] }) };
      if (path.indexOf('science-tools.json') !== -1) return { ok: true, json: async () => [] };
      if (path.indexOf('feedback-types.json') !== -1) return { ok: true, json: async () => [] };
      throw new Error('Unexpected fetch: ' + path);
    });

    await import('../src/js/app.js');
    await new Promise(function (resolve) { setTimeout(resolve, 0); });

    expect(window.filmAPI.setFilms).toHaveBeenCalledWith(FILMS);
    expect(window.filmAPI.setRankings).toHaveBeenCalledWith(RANKINGS);
    expect(window.filmAPI.initializeFilmModule).toHaveBeenCalledTimes(1);
    expect(window.filterFilms).toBe(window.filmAPI.filterFilms);
    expect(window.openWatchlist).toBe(window.filmAPI.openWatchlist);
  });
});

describe('film rendering safety', () => {
  test('escapes script-like film fields before rendering', async () => {
    await import('../src/js/film.js');

    window.filmAPI.setFilms([
      {
        id: 'xss-film',
        type: 'film',
        title: '<script>window.__filmXss = true</script>影片',
        creator: '<img src=x onerror="window.__filmXss = true">',
        year: '2026年',
        rating: '9.0',
        ratingCount: '<script>bad</script>',
        description: '<script>window.__filmXss = true</script>简介',
        tags: ['<img src=x onerror="window.__filmXss = true">'],
        coverStyle: 'url(javascript:alert(1))',
        badge: '影视',
        icon: '<script>icon</script>'
      }
    ]);
    window.filmAPI.setRankings({ book: [], film: [], doc: [] });
    window.filmAPI.initializeFilmModule();

    expect(document.querySelector('#film-grid script')).toBeNull();
    expect(document.querySelector('#film-grid img')).toBeNull();
    expect(window.__filmXss).toBeUndefined();
    expect(document.getElementById('film-grid').innerHTML).toContain('&lt;script&gt;window.__filmXss = true&lt;/script&gt;影片');
    expect(document.querySelector('#film-grid .fimg').getAttribute('style')).toContain('background:#EDE8E0');
  });
});

describe('watchlist persistence', () => {
  test('adds and removes a film from the want list and syncs card button text', async () => {
    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings(RANKINGS);
    window.filmAPI.initializeFilmModule();

    window.filmAPI.toggleWatchlistItem('film-last-emperor');

    const savedAfterAdd = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    expect(savedAfterAdd.want).toHaveLength(1);
    expect(savedAfterAdd.want[0].id).toBe('film-last-emperor');
    expect(document.querySelector('[data-film-id="film-last-emperor"] .wbtn').textContent).toContain('已添加');
    expect(window.navigationAPI.showToast).toHaveBeenLastCalledWith('已添加到待看栏！');

    window.filmAPI.toggleWatchlistItem('film-last-emperor');

    const savedAfterRemove = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    expect(savedAfterRemove.want).toHaveLength(0);
    expect(document.querySelector('[data-film-id="film-last-emperor"] .wbtn').textContent).toContain('待看');
    expect(window.navigationAPI.showToast).toHaveBeenLastCalledWith('已移出待看栏');
  });
});

describe('watchlist panel flows', () => {
  test('opens the panel on want tab and moves items between statuses without changing addedAt', async () => {
    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings(RANKINGS);
    window.filmAPI.initializeFilmModule();
    window.filmAPI.toggleWatchlistItem('film-last-emperor');

    const firstSaved = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    const originalAddedAt = firstSaved.want[0].addedAt;

    window.filmAPI.openWatchlist();
    expect(document.getElementById('watchlist-panel').classList.contains('act')).toBe(true);
    expect(document.getElementById('wl-want').classList.contains('act')).toBe(true);
    expect(document.getElementById('wl-list').textContent).toContain('末代皇帝');
    expect(document.getElementById('wl-list').textContent).toContain('在看');

    window.filmAPI.moveWatchlistItem('film-last-emperor', 'watching');

    const afterMove = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    expect(afterMove.want).toHaveLength(0);
    expect(afterMove.watching).toHaveLength(1);
    expect(afterMove.watching[0].id).toBe('film-last-emperor');
    expect(afterMove.watching[0].addedAt).toBe(originalAddedAt);
    expect(document.getElementById('wl-watching').classList.contains('act')).toBe(true);
    expect(document.getElementById('wl-list').textContent).toContain('末代皇帝');
  });

  test('cleans invalid stored ids during initialization', async () => {
    window.localStorage.setItem('xds_watchlist', JSON.stringify({
      want: [{ id: 'missing-item', addedAt: '2026-06-08T00:00:00.000Z' }],
      watching: [],
      watched: []
    }));

    await import('../src/js/film.js');

    window.filmAPI.setFilms(FILMS);
    window.filmAPI.setRankings(RANKINGS);
    window.filmAPI.initializeFilmModule();

    const cleaned = JSON.parse(window.localStorage.getItem('xds_watchlist'));
    expect(cleaned.want).toEqual([]);
  });
});
