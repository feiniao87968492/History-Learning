import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const MEMES = [
  {
    id: 'meme-qinshihuang',
    emoji: '🏺',
    title: '秦始皇陵兵马俑',
    origin: '兵马俑考古发现与秦陵修建背景。',
    tag: '#考古发现 #秦朝 #世界遗产'
  },
  {
    id: 'meme-tang-poetry',
    emoji: '📜',
    title: '唐朝公务员写诗内卷',
    origin: '唐代科举与诗赋文化影响。',
    tag: '#科举 #唐朝 #文化史'
  }
];

const FEEDBACK_TYPES = ['功能异常', '内容错误', '功能建议', '其他'];
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

const DISCUSSIONS = [
  {
    id: 'post-keju-neijuan',
    category: 'view',
    author: '长安一片月',
    avatar: '🧑',
    time: '5小时前',
    title: '科举制和高考，跨越千年的内卷',
    body: '从隋唐到明清，科举从取士变成困士。',
    likes: '986',
    comments: '392',
    favorite: '收藏',
    commentsList: [
      { author: '历史小白', avatar: '🧒', body: '真的很像。' }
    ],
    moreCommentsLabel: '展开全部 390 条评论'
  }
];

const PROFILE_MENU = {
  study: [
    { id: 'study-record', icon: '📊', label: '学习记录', action: 'toast', message: '学习记录开发中' }
  ],
  settings: [
    { id: 'feedback', icon: '💬', label: '问题反馈', action: 'openFB' }
  ]
};

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetGlobals();
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
  window.checkinAPI = { updateCheckinStats: vi.fn() };
  window.aiAssistantAPI = {
    togAI: vi.fn(),
    aiAsk: vi.fn(),
    aiSend: vi.fn()
  };
});

describe('app static content data wiring', () => {
  test('does not fetch quiz questions when quiz module is unavailable', async () => {
    global.fetch = vi.fn(async (path) => {
      if (path.endsWith('nouns.json')) return { ok: true, json: async () => ({}) };
      if (path.endsWith('timeline.json')) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
      if (path.endsWith('podcasts.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('films.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('rankings.json')) return { ok: true, json: async () => ({ book: [], film: [], doc: [] }) };
      return { ok: true, json: async () => [] };
    });
    delete window.quizAPI;

    await import('../src/js/app.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('questions.json'));
  });

  test('loads meme and feedback datasets and renders them into the shell containers', async () => {
    global.fetch = vi.fn(async (path) => {
      if (path.endsWith('nouns.json')) return { ok: true, json: async () => ({}) };
      if (path.endsWith('timeline.json')) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
      if (path.endsWith('podcasts.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('films.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('rankings.json')) return { ok: true, json: async () => ({ book: [], film: [], doc: [] }) };
      if (path.endsWith('memes.json')) return { ok: true, json: async () => MEMES };
      if (path.endsWith('feedback-types.json')) return { ok: true, json: async () => FEEDBACK_TYPES };
      return { ok: true, json: async () => [] };
    });

    await import('../src/js/app.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelectorAll('#meme-scroll .meme-card')).toHaveLength(2);
    expect(document.getElementById('feedback-type-list').textContent).toContain('功能异常');
    expect(document.getElementById('feedback-type-list').textContent).toContain('其他');
  });

  test('loads hot articles, discussions, and profile menu datasets into their shell containers', async () => {
    global.fetch = vi.fn(async (path) => {
      if (path.endsWith('nouns.json')) return { ok: true, json: async () => ({}) };
      if (path.endsWith('timeline.json')) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
      if (path.endsWith('podcasts.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('films.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('rankings.json')) return { ok: true, json: async () => ({ book: [], film: [], doc: [] }) };
      if (path.endsWith('memes.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('feedback-types.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('discussions.json')) return { ok: true, json: async () => DISCUSSIONS };
      if (path.endsWith('hot-articles.json')) return { ok: true, json: async () => HOT_ARTICLES };
      if (path.endsWith('profile-menu.json')) return { ok: true, json: async () => PROFILE_MENU };
      return { ok: true, json: async () => [] };
    });

    await import('../src/js/app.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelectorAll('#hot-articles .hl')).toHaveLength(1);
    expect(document.querySelectorAll('#hot-articles .hi')).toHaveLength(1);
    expect(document.querySelector('#discuss-page .pcard h4')?.textContent).toContain('科举制和高考');
    expect(document.querySelectorAll('#profile-page .mg')[0].textContent).toContain('学习记录');
    expect(document.querySelectorAll('#profile-page .mg')[1].textContent).toContain('问题反馈');
  });
});
