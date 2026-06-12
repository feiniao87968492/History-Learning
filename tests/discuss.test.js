import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

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
      { author: '历史小白', avatar: '🧒', body: '真的很像。' },
      { author: '教书匠', avatar: '🧓', body: '阶层跃升的机制很值得比较。' }
    ],
    moreCommentsLabel: '展开全部 390 条评论'
  },
  {
    id: 'post-wangmang',
    category: 'cold',
    author: '故纸堆里的人',
    avatar: '🧔',
    time: '8小时前',
    title: '历史课本里被一笔带过的小事',
    body: '王莽改制细看很有意思。',
    likes: '103',
    comments: '28',
    favorite: '收藏',
    commentsList: []
  }
];

const FILTER_DISCUSSIONS = DISCUSSIONS.concat([
  {
    id: 'post-help-liangzhou',
    category: 'help',
    author: '边塞新手',
    avatar: '🙋',
    time: '刚刚',
    title: '凉州词应该放在哪个专题里？',
    body: '求助唐诗与边塞史的关联资料。',
    likes: '0',
    comments: '1',
    favorite: '收藏',
    commentsList: [
      { author: '助教', avatar: '🧑‍🏫', body: '可以先放入隋唐边疆专题。' }
    ]
  },
  {
    id: 'post-resource-map',
    category: 'resource',
    author: '资料整理员',
    avatar: '📚',
    time: '1分钟前',
    title: '分享一份古代都城地图资料',
    body: '适合做朝代迁都时间线。',
    likes: '4',
    comments: '0',
    favorite: '收藏',
    commentsList: []
  }
]);

function mountDiscussDOM() {
  mountDOM(`
    <div id="discuss-page" class="page">
      <div class="hh"><h2>讨论区</h2><div class="sch">🔍</div></div>
      <div class="dp">
        <div class="discuss-stats"><span>🔥 1.2k 讨论</span><span>⭐ 486 收藏</span></div>
        <div class="htabs" id="discuss-tabs">
          <button class="htab act" onclick="filterDiscuss('all',this)">全部</button>
          <button class="htab" onclick="filterDiscuss('view',this)">史观</button>
          <button class="htab" onclick="filterDiscuss('cold',this)">冷知识</button>
          <button class="htab" onclick="filterDiscuss('help',this)">求助</button>
          <button class="htab" onclick="filterDiscuss('resource',this)">资源</button>
        </div>
        <div id="discussion-list"></div>
      </div>
      <button class="fab" onclick="openPost()">＋</button>
    </div>
    <div class="fov" id="post-overlay" onclick="closePost(event)">
      <div class="fp" onclick="event.stopPropagation()">
        <input type="text" id="post-title">
        <textarea id="post-body"></textarea>
        <div id="post-tag-list">
          <button class="ft" onclick="togglePostTag(this,'史观')">史观</button>
          <button class="ft" onclick="togglePostTag(this,'冷知识')">冷知识</button>
          <button class="ft" onclick="togglePostTag(this,'求助')">求助</button>
          <button class="ft" onclick="togglePostTag(this,'资源')">资源</button>
        </div>
        <button class="fsub" onclick="submitPost()">发布帖子</button>
      </div>
    </div>
    <div id="toast"></div>
  `);
}

function createStorageMock(initialValue) {
  var saved = initialValue || null;
  return {
    getStoredJSON: vi.fn(function (key, fallback) {
      if (key === 'xds_discussions' && saved) return saved;
      return fallback;
    }),
    setStoredJSON: vi.fn(function (key, value) {
      if (key === 'xds_discussions') saved = value;
      return true;
    }),
    getSaved: function () { return saved; }
  };
}

function installHtmlUtils() {
  window.htmlUtils = {
    escapeHtml: function (value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };
}

async function importDiscuss() {
  await import('../src/js/discuss.js');
  return window.discussAPI;
}

function installAppFetchMock(discussions) {
  global.fetch = vi.fn(async function (path) {
    if (path.indexOf('nouns.json') !== -1) return { ok: true, json: async function () { return {}; } };
    if (path.indexOf('timeline.json') !== -1) return { ok: true, json: async function () { return { dynasties: [], events: [] }; } };
    if (path.indexOf('podcasts.json') !== -1) return { ok: true, json: async function () { return []; } };
    if (path.indexOf('films.json') !== -1) return { ok: true, json: async function () { return []; } };
    if (path.indexOf('rankings.json') !== -1) return { ok: true, json: async function () { return { book: [], film: [], doc: [] }; } };
    if (path.indexOf('discussions.json') !== -1) return { ok: true, json: async function () { return discussions; } };
    if (path.indexOf('profile-menu.json') !== -1) return { ok: true, json: async function () { return { study: [], settings: [] }; } };
    return { ok: true, json: async function () { return []; } };
  });
}

async function importAppAndFlush() {
  var i;
  await import('../src/js/app.js');
  for (i = 0; i < 20; i += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
  resetGlobals();
  mountDiscussDOM();
  installHtmlUtils();
  window.storageAPI = createStorageMock();
  window.navigationAPI = { showToast: vi.fn() };
});

describe('discussion module', () => {
  test('index shell keeps discussion posts data-driven', () => {
    var html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    var sectionMatch = html.match(/<div id="discuss-page" class="page">([\s\S]*?)<!-- 发布弹窗 -->/);
    var discussScriptIndex = html.indexOf('./src/js/discuss.js');
    var appScriptIndex = html.indexOf('./src/js/app.js');

    expect(sectionMatch).not.toBeNull();
    expect(sectionMatch[1]).toContain('id="discussion-list"');
    expect(sectionMatch[1]).not.toContain('class="pcard"');
    expect(sectionMatch[1]).not.toContain('科举制和高考，跨越千年的「内卷」');
    expect(discussScriptIndex).toBeGreaterThan(-1);
    expect(appScriptIndex).toBeGreaterThan(discussScriptIndex);
  });

  test('app delegates discussion data to discussAPI and exposes inline globals', async () => {
    var discussAPI = {
      setInitialDiscussions: vi.fn(),
      filterDiscuss: vi.fn(),
      toggleComments: vi.fn(),
      openPost: vi.fn(),
      closePost: vi.fn(),
      togglePostTag: vi.fn(),
      submitPost: vi.fn(),
      addComment: vi.fn(),
      addCommentFromInput: vi.fn()
    };
    window.discussAPI = discussAPI;
    window.nounAPI = { setNounData: vi.fn() };
    window.timelineAPI = { setDynasties: vi.fn(), setTimelineEvents: vi.fn(), renderTimeline: vi.fn(), renderEventList: vi.fn() };
    window.podcastAPI = { setPodcasts: vi.fn() };
    window.filmAPI = { setFilms: vi.fn(), setRankings: vi.fn(), initializeFilmModule: vi.fn() };
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete'
    });
    installAppFetchMock(DISCUSSIONS);

    await importAppAndFlush();

    expect(discussAPI.setInitialDiscussions).toHaveBeenCalledWith(DISCUSSIONS);
    expect(window.filterDiscuss).toBe(discussAPI.filterDiscuss);
    expect(window.toggleComments).toBe(discussAPI.toggleComments);
    expect(window.openPost).toBe(discussAPI.openPost);
    expect(window.closePost).toBe(discussAPI.closePost);
    expect(window.togglePostTag).toBe(discussAPI.togglePostTag);
    expect(window.submitPost).toBe(discussAPI.submitPost);
    expect(window.addComment).toBe(discussAPI.addComment);
  });

  test('renders initial discussions with data-post-id and comments', async () => {
    var api = await importDiscuss();

    api.setInitialDiscussions(DISCUSSIONS);

    expect(document.querySelectorAll('#discussion-list .pcard')).toHaveLength(2);
    expect(document.querySelector('[data-post-id="post-keju-neijuan"] h4').textContent).toContain('科举制和高考');
    expect(document.querySelector('[data-post-id="post-keju-neijuan"]').getAttribute('data-discuss-cat')).toBe('view');
    expect(document.getElementById('discussion-list').textContent).toContain('历史小白');
    expect(document.getElementById('discussion-list').textContent).toContain('展开全部 390 条评论');
  });

  test('renders an empty state when there are no discussions', async () => {
    var api = await importDiscuss();

    api.setInitialDiscussions([]);

    expect(document.getElementById('discussion-list').textContent).toContain('暂无讨论');
  });

  test('filters discussion cards by all exposed categories and updates active tab', async () => {
    var api = await importDiscuss();
    var tabs = document.querySelectorAll('#discuss-tabs .htab');
    var cases = [
      { category: 'all', button: tabs[0], visible: ['post-keju-neijuan', 'post-wangmang', 'post-help-liangzhou', 'post-resource-map'], hidden: [] },
      { category: 'view', button: tabs[1], visible: ['post-keju-neijuan'], hidden: ['post-wangmang', 'post-help-liangzhou', 'post-resource-map'] },
      { category: 'cold', button: tabs[2], visible: ['post-wangmang'], hidden: ['post-keju-neijuan', 'post-help-liangzhou', 'post-resource-map'] },
      { category: 'help', button: tabs[3], visible: ['post-help-liangzhou'], hidden: ['post-keju-neijuan', 'post-wangmang', 'post-resource-map'] },
      { category: 'resource', button: tabs[4], visible: ['post-resource-map'], hidden: ['post-keju-neijuan', 'post-wangmang', 'post-help-liangzhou'] }
    ];

    api.setInitialDiscussions(FILTER_DISCUSSIONS);

    cases.forEach(function (item) {
      api.filterDiscuss(item.category, item.button);

      expect(item.button.classList.contains('act')).toBe(true);
      item.visible.forEach(function (postId) {
        expect(document.querySelector('[data-post-id="' + postId + '"]').style.display).toBe('block');
      });
      item.hidden.forEach(function (postId) {
        expect(document.querySelector('[data-post-id="' + postId + '"]').style.display).toBe('none');
      });
    });
  });

  test('toggleComments expands and collapses only the target post comments', async () => {
    var api = await importDiscuss();
    api.setInitialDiscussions(DISCUSSIONS);

    api.toggleComments('post-keju-neijuan');

    expect(document.querySelector('[data-post-id="post-keju-neijuan"] .cmt-list').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="post-wangmang"] .cmt-list').style.display).toBe('none');

    api.toggleComments('post-keju-neijuan');

    expect(document.querySelector('[data-post-id="post-keju-neijuan"] .cmt-list').style.display).toBe('none');
  });

  test('toggleComments targets the third post by exact post id', async () => {
    var api = await importDiscuss();
    api.setInitialDiscussions(FILTER_DISCUSSIONS);

    api.toggleComments('post-help-liangzhou');

    expect(document.querySelector('[data-post-id="post-keju-neijuan"] .cmt-list').style.display).toBe('none');
    expect(document.querySelector('[data-post-id="post-wangmang"] .cmt-list').style.display).toBe('none');
    expect(document.querySelector('[data-post-id="post-help-liangzhou"] .cmt-list').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="post-resource-map"] .cmt-list').style.display).toBe('none');
  });

  test('toggleComments ignores missing cards without changing saved expanded state', async () => {
    var api = await importDiscuss();
    var targetCard;
    api.setInitialDiscussions(DISCUSSIONS);
    api.toggleComments('post-keju-neijuan');
    targetCard = document.querySelector('[data-post-id="post-keju-neijuan"]');

    expect(targetCard.querySelector('.cmt-list').style.display).toBe('block');

    targetCard.remove();
    api.toggleComments('post-keju-neijuan');
    api.renderDiscussions();

    expect(document.querySelector('[data-post-id="post-keju-neijuan"] .cmt-list').style.display).toBe('block');
  });

  test('comment input lookup handles unusual post ids without selector interpolation', async () => {
    var api = await importDiscuss();
    api.setInitialDiscussions([
      {
        id: 'post.special"id\\demo',
        category: 'help',
        author: '边塞新手',
        avatar: '🙋',
        time: '刚刚',
        title: '特殊 ID 讨论帖',
        body: '用于验证评论输入定位。',
        likes: '0',
        comments: '0',
        favorite: '收藏',
        commentsList: []
      }
    ]);

    document.querySelector('[data-comment-input]').value = '特殊 ID 评论';
    expect(api.addCommentFromInput('post.special"id\\demo')).toBe(true);

    expect(document.querySelector('[data-post-id] .cmt-list').style.display).toBe('block');
    expect(document.getElementById('discussion-list').textContent).toContain('特殊 ID 评论');
  });

  test('expanded comments stay expanded after filtering and re-rendering', async () => {
    var api = await importDiscuss();
    var viewButton = document.querySelectorAll('#discuss-tabs .htab')[1];
    api.setInitialDiscussions(DISCUSSIONS);

    api.toggleComments('post-keju-neijuan');
    api.filterDiscuss('view', viewButton);
    api.renderDiscussions();

    expect(document.querySelector('[data-post-id="post-keju-neijuan"] .cmt-list').style.display).toBe('block');
  });

  test('submitPost validates input, persists a new post, and clears the overlay', async () => {
    var api = await importDiscuss();
    api.setInitialDiscussions(DISCUSSIONS);

    api.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请输入帖子标题');

    document.getElementById('post-title').value = '新帖标题';
    api.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请输入帖子内容');

    document.getElementById('post-overlay').classList.add('act');
    document.getElementById('post-title').value = '张骞出使西域的新问题';
    document.getElementById('post-body').value = '大家怎么看凿空西域？';
    api.togglePostTag(document.querySelectorAll('#post-tag-list .ft')[2], '求助');
    api.submitPost();

    expect(document.querySelectorAll('#discussion-list .pcard')).toHaveLength(3);
    expect(document.querySelector('#discussion-list .pcard h4').textContent).toContain('张骞出使西域的新问题');
    expect(document.querySelector('#discussion-list .pcard').getAttribute('data-discuss-cat')).toBe('help');
    expect(document.getElementById('post-title').value).toBe('');
    expect(document.getElementById('post-body').value).toBe('');
    expect(document.getElementById('post-overlay').classList.contains('act')).toBe(false);
    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_discussions', expect.arrayContaining([
      expect.objectContaining({ title: '张骞出使西域的新问题', category: 'help' })
    ]));
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('帖子发布成功！');
  });

  test('addComment validates empty input, persists comment, increments count, and keeps comments visible', async () => {
    var api = await importDiscuss();
    api.setInitialDiscussions(DISCUSSIONS);

    api.addComment('post-wangmang', '');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请输入评论内容');

    api.addComment('post-wangmang', '这个角度很有意思');

    expect(document.querySelector('[data-post-id="post-wangmang"] .cmt-list').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="post-wangmang"]').textContent).toContain('这个角度很有意思');
    expect(document.querySelector('[data-post-id="post-wangmang"] .pact').textContent).toContain('💬 29');
    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_discussions', expect.arrayContaining([
      expect.objectContaining({
        id: 'post-wangmang',
        commentsList: expect.arrayContaining([
          expect.objectContaining({ body: '这个角度很有意思' })
        ])
      })
    ]));
  });

  test('loads stored discussions before seed discussions', async () => {
    window.storageAPI = createStorageMock([
      {
        id: 'stored-post',
        category: 'resource',
        author: '本地用户',
        avatar: '🙂',
        time: '刚刚',
        title: '本地保存的资料帖',
        body: '刷新后仍然存在。',
        likes: '0',
        comments: '0',
        favorite: '收藏',
        commentsList: []
      }
    ]);
    var api = await importDiscuss();

    api.setInitialDiscussions(DISCUSSIONS);

    expect(document.querySelectorAll('#discussion-list .pcard')).toHaveLength(1);
    expect(document.getElementById('discussion-list').textContent).toContain('本地保存的资料帖');
    expect(document.getElementById('discussion-list').textContent).not.toContain('科举制和高考');
  });

  test('persists created posts and comments through a simulated reload', async () => {
    var storage = createStorageMock();
    var api;
    window.storageAPI = storage;

    api = await importDiscuss();
    api.setInitialDiscussions(DISCUSSIONS);
    document.getElementById('post-title').value = '刷新后仍保留的新帖子';
    document.getElementById('post-body').value = '这是发布后保存的内容。';
    api.togglePostTag(document.querySelectorAll('#post-tag-list .ft')[3], '资源');
    api.submitPost();
    api.addComment('post-user-1781179200000-3', '刷新后仍保留的评论');

    vi.resetModules();
    resetGlobals();
    mountDiscussDOM();
    installHtmlUtils();
    window.storageAPI = storage;
    window.navigationAPI = { showToast: vi.fn() };

    api = await importDiscuss();
    api.setInitialDiscussions(DISCUSSIONS);
    api.toggleComments('post-user-1781179200000-3');

    expect(document.getElementById('discussion-list').textContent).toContain('刷新后仍保留的新帖子');
    expect(document.querySelector('[data-post-id="post-user-1781179200000-3"]').getAttribute('data-discuss-cat')).toBe('resource');
    expect(document.querySelector('[data-post-id="post-user-1781179200000-3"] .pact').textContent).toContain('💬 1');
    expect(document.getElementById('discussion-list').textContent).toContain('刷新后仍保留的评论');
  });

  test('escapes script-like post and comment fields before rendering', async () => {
    var api = await importDiscuss();
    api.setInitialDiscussions([
      {
        id: 'xss-post',
        category: 'view',
        author: '<img src=x onerror="window.__discussXss = true">',
        avatar: '<script>window.__discussXss = true</script>',
        time: '刚刚',
        title: '<script>window.__discussXss = true</script>标题',
        body: '<img src=x onerror="window.__discussXss = true">正文',
        likes: '0',
        comments: '1',
        favorite: '收藏',
        commentsList: [
          { author: '评论者', avatar: '🙂', body: '<script>window.__discussXss = true</script>评论' }
        ]
      }
    ]);
    api.toggleComments('xss-post');

    expect(document.querySelector('#discussion-list script')).toBeNull();
    expect(document.querySelector('#discussion-list img')).toBeNull();
    expect(window.__discussXss).toBeUndefined();
    expect(document.getElementById('discussion-list').innerHTML).toContain('&lt;script&gt;window.__discussXss = true&lt;/script&gt;标题');
    expect(document.getElementById('discussion-list').innerHTML).toContain('&lt;script&gt;window.__discussXss = true&lt;/script&gt;评论');
  });

  test('escapes script-like user post and comment input before rendering', async () => {
    var api = await importDiscuss();
    api.setInitialDiscussions(DISCUSSIONS);

    document.getElementById('post-title').value = '<script>window.__userDiscussXss = true</script>用户标题';
    document.getElementById('post-body').value = '<img src=x onerror="window.__userDiscussXss = true">用户正文';
    api.submitPost();
    api.addComment('post-user-1781179200000-3', '<script>window.__userDiscussXss = true</script>用户评论');
    api.toggleComments('post-user-1781179200000-3');

    expect(document.querySelector('#discussion-list script')).toBeNull();
    expect(document.querySelector('#discussion-list img')).toBeNull();
    expect(window.__userDiscussXss).toBeUndefined();
    expect(document.getElementById('discussion-list').innerHTML).toContain('&lt;script&gt;window.__userDiscussXss = true&lt;/script&gt;用户标题');
    expect(document.getElementById('discussion-list').innerHTML).toContain('&lt;script&gt;window.__userDiscussXss = true&lt;/script&gt;用户评论');
    expect(document.getElementById('discussion-list').innerHTML).toContain('&lt;img src=x onerror="window.__userDiscussXss = true"&gt;用户正文');
  });
});
