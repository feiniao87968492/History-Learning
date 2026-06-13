import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const DISCUSSIONS = [
  {
    id: 'post-keju-neijuan', type: 'discussion', title: '科举制和高考，跨越千年的内卷',
    content: '从隋唐到明清，科举从取士变成困士。',
    author: { id: 'u_system', name: '长安一片月', avatar: '🧑' },
    tags: ['隋', '唐', '制度'], metadata: {},
    stats: { views: 100, likes: 986, comments: 392, favorites: 86 },
    createdAt: '2026-06-10T08:00:00Z', time: '5小时前', likes: '986', comments: '392', favorite: '收藏',
    commentsList: [
      { author: '历史小白', avatar: '🧒', body: '真的很像。' },
      { author: '教书匠', avatar: '🧓', body: '阶层跃升的机制很值得比较。' }
    ], moreCommentsLabel: '展开全部 390 条评论'
  },
  {
    id: 'post-wangmang', type: 'discussion', title: '历史课本里被一笔带过的小事',
    content: '王莽改制细看很有意思。',
    author: { id: 'u_system', name: '故纸堆里的人', avatar: '🧔' },
    tags: ['汉', '制度'], metadata: {},
    stats: { views: 50, likes: 103, comments: 28, favorites: 15 },
    createdAt: '2026-06-09T14:00:00Z', time: '8小时前', likes: '103', comments: '28', favorite: '收藏',
    commentsList: []
  }
];

const FILTER_DISCUSSIONS = DISCUSSIONS.concat([
  {
    id: 'post-help-liangzhou', type: 'discussion', title: '凉州词应该放在哪个专题里？',
    content: '求助唐诗与边塞史的关联资料。',
    author: { id: 'u_system', name: '边塞新手', avatar: '🙋' },
    tags: ['唐', '文化'], metadata: {},
    stats: { views: 10, likes: 0, comments: 1, favorites: 0 },
    createdAt: '2026-06-12T10:00:00Z', time: '刚刚', likes: '0', comments: '1', favorite: '收藏',
    commentsList: [{ author: '助教', avatar: '🧑‍🏫', body: '可以先放入隋唐边疆专题。' }]
  },
  {
    id: 'post-resource-map', type: 'resource', title: '分享一份古代都城地图资料',
    content: '适合做朝代迁都时间线。',
    author: { id: 'u_system', name: '资料整理员', avatar: '📚' },
    tags: ['跨朝代', '地理'], metadata: {},
    stats: { views: 5, likes: 4, comments: 0, favorites: 2 },
    createdAt: '2026-06-12T10:01:00Z', time: '1分钟前', likes: '4', comments: '0', favorite: '收藏',
    commentsList: []
  }
]);

function mountForumDOM() {
  mountDOM(`
    <div id="forum-page" class="page active">
      <div class="htabs" id="forum-tabs">
        <button class="htab act" onclick="filterForum('all',this)">全部</button>
        <button class="htab" onclick="filterForum('discussion',this)">讨论</button>
        <button class="htab" onclick="filterForum('article',this)">文章</button>
        <button class="htab" onclick="filterForum('person',this)">人物</button>
        <button class="htab" onclick="filterForum('media',this)">书影</button>
        <button class="htab" onclick="filterForum('resource',this)">资源</button>
      </div>
      <div id="forum-list"></div>
      <button class="fab" onclick="openPost()">＋</button>
    </div>
    <div class="fov" id="post-overlay" onclick="closePost(event)">
      <div class="fp" onclick="event.stopPropagation()">
        <input type="text" id="post-title">
        <textarea id="post-body"></textarea>
        <select id="post-type-select">
          <option value="discussion">💬 讨论</option>
          <option value="article">📄 文章</option>
          <option value="person">👤 人物</option>
          <option value="media">🎬 书影</option>
          <option value="resource">📦 资源</option>
        </select>
        <div id="post-tag-list">
          <button class="ft" onclick="togglePostTag(this,'唐')">唐</button>
          <button class="ft" onclick="togglePostTag(this,'宋')">宋</button>
          <button class="ft" onclick="togglePostTag(this,'政治')">政治</button>
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
      if (key === 'xds_forum_posts' && saved) return saved;
      return fallback;
    }),
    setStoredJSON: vi.fn(function (key, value) {
      if (key === 'xds_forum_posts') saved = value;
      return true;
    }),
    getSaved: function () { return saved; }
  };
}

function installHtmlUtils() {
  window.htmlUtils = {
    escapeHtml: function (value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
    }
  };
}

async function importForum() {
  await import('../src/js/forum.js');
  return window.forumAPI;
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-13T12:00:00.000Z'));
  resetGlobals();
  mountForumDOM();
  installHtmlUtils();
  window.storageAPI = createStorageMock();
  window.navigationAPI = { showToast: vi.fn() };
});

describe('forum module', () => {
  test('renders initial discussions with data-post-id and data-post-type', async () => {
    var api = await importForum();
    api.setInitialDiscussions(DISCUSSIONS);

    expect(document.querySelectorAll('#forum-list .pcard')).toHaveLength(2);
    expect(document.querySelector('[data-post-id="post-keju-neijuan"] h4').textContent).toContain('科举制和高考');
    expect(document.querySelector('[data-post-id="post-keju-neijuan"]').getAttribute('data-post-type')).toBe('discussion');
    expect(document.getElementById('forum-list').textContent).toContain('历史小白');
    expect(document.getElementById('forum-list').textContent).toContain('展开全部 390 条评论');
  });

  test('renders an empty state when there are no discussions', async () => {
    var api = await importForum();
    api.setInitialDiscussions([]);
    expect(document.getElementById('forum-list').textContent).toContain('还没有帖子');
  });

  test('filters discussion cards by type and updates active tab', async () => {
    var api = await importForum();
    var tabs = document.querySelectorAll('#forum-tabs .htab');

    api.setInitialDiscussions(FILTER_DISCUSSIONS);

    api.filterForum('discussion', tabs[1]);
    expect(tabs[1].classList.contains('act')).toBe(true);
    expect(document.querySelector('[data-post-id="post-keju-neijuan"]').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="post-resource-map"]').style.display).toBe('none');

    api.filterForum('resource', tabs[5]);
    expect(document.querySelector('[data-post-id="post-resource-map"]').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="post-keju-neijuan"]').style.display).toBe('none');

    api.filterForum('all', tabs[0]);
    expect(document.querySelectorAll('#forum-list .pcard')).toHaveLength(4);
  });

  test('filterForumByTag filters posts by tag', async () => {
    var api = await importForum();
    api.setInitialDiscussions([
      { id: 'p1', type: 'discussion', title: 'Tang topic', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['唐'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] },
      { id: 'p2', type: 'discussion', title: 'Song topic', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['宋'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] }
    ]);

    expect(document.querySelectorAll('#forum-list .pcard')).toHaveLength(2);
  });

  test('toggleComments expands and collapses comments', async () => {
    var api = await importForum();
    api.setInitialDiscussions(DISCUSSIONS);

    api.toggleComments('post-keju-neijuan');
    expect(document.querySelector('[data-post-id="post-keju-neijuan"] .cmt-list').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="post-wangmang"] .cmt-list').style.display).toBe('none');

    api.toggleComments('post-keju-neijuan');
    expect(document.querySelector('[data-post-id="post-keju-neijuan"] .cmt-list').style.display).toBe('none');
  });

  test('submitPost validates input, persists a new post, and clears the overlay', async () => {
    var api = await importForum();
    api.setInitialDiscussions(DISCUSSIONS);

    api.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请输入帖子标题');

    document.getElementById('post-title').value = '新帖标题';
    api.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请输入帖子内容');

    document.getElementById('post-title').value = 'Blank tags';
    document.getElementById('post-body').value = 'Content';
    api.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请至少选择一个标签');

    document.getElementById('post-overlay').classList.add('act');
    document.getElementById('post-title').value = '张骞出使西域的新问题';
    document.getElementById('post-body').value = '大家怎么看凿空西域？';
    document.getElementById('post-type-select').value = 'discussion';
    api.togglePostTag(document.querySelectorAll('#post-tag-list .ft')[0], '唐');
    api.submitPost();

    expect(document.querySelectorAll('#forum-list .pcard')).toHaveLength(3);
    expect(document.querySelector('#forum-list .pcard h4').textContent).toContain('张骞出使西域的新问题');
    expect(document.querySelector('#forum-list .pcard').getAttribute('data-post-type')).toBe('discussion');
    expect(document.getElementById('post-title').value).toBe('');
    expect(document.getElementById('post-body').value).toBe('');
    expect(document.getElementById('post-overlay').classList.contains('act')).toBe(false);
    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_forum_posts', expect.arrayContaining([
      expect.objectContaining({ title: '张骞出使西域的新问题', type: 'discussion' })
    ]));
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('帖子发布成功！');
  });

  test('addComment validates empty input, persists comment, increments count', async () => {
    var api = await importForum();
    api.setInitialDiscussions(DISCUSSIONS);

    api.addComment('post-wangmang', '');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请输入评论内容');

    api.addComment('post-wangmang', '这个角度很有意思');

    expect(document.querySelector('[data-post-id="post-wangmang"] .cmt-list').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="post-wangmang"]').textContent).toContain('这个角度很有意思');
    expect(document.querySelector('[data-post-id="post-wangmang"] .pact').textContent).toContain('💬 29');
  });

  test('loads stored discussions before seed discussions', async () => {
    window.storageAPI = createStorageMock([
      {
        id: 'stored-post', type: 'resource', title: '本地保存的资料帖',
        content: '刷新后仍然存在。', author: { id: 'u_local', name: '本地用户', avatar: '🙂' },
        tags: ['跨朝代'], metadata: {},
        stats: { views: 0, likes: 0, comments: 0, favorites: 0 },
        createdAt: '2026-06-13T00:00:00Z', commentsList: [],
        time: '刚刚', likes: '0', comments: '0', favorite: '收藏'
      }
    ]);
    var api = await importForum();
    api.setInitialDiscussions(DISCUSSIONS);

    expect(document.querySelectorAll('#forum-list .pcard')).toHaveLength(1);
    expect(document.getElementById('forum-list').textContent).toContain('本地保存的资料帖');
  });

  test('persists created posts through a simulated reload', async () => {
    var storage = createStorageMock();
    window.storageAPI = storage;

    var api = await importForum();
    api.setInitialDiscussions(DISCUSSIONS);
    document.getElementById('post-title').value = '刷新后仍保留的新帖子';
    document.getElementById('post-body').value = '这是发布后保存的内容。';
    api.togglePostTag(document.querySelectorAll('#post-tag-list .ft')[0], '唐');
    var created = api.submitPost();
    var createdId = created ? created.id : 'post-user-1781179200000-3';
    api.addComment(createdId, '刷新后仍保留的评论');

    vi.resetModules();
    resetGlobals();
    mountForumDOM();
    installHtmlUtils();
    window.storageAPI = storage;
    window.navigationAPI = { showToast: vi.fn() };

    api = await importForum();
    api.setInitialDiscussions(DISCUSSIONS);
    api.toggleComments(createdId);

    expect(document.getElementById('forum-list').textContent).toContain('刷新后仍保留的新帖子');
    expect(document.getElementById('forum-list').textContent).toContain('刷新后仍保留的评论');
  });

  test('escapes script-like post and comment fields before rendering', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'xss-post', type: 'discussion', title: '<script>window.__forumXss = true</script>标题',
      content: '<img src=x onerror="window.__forumXss = true">正文',
      author: { id: 'u_test', name: '<img src=x>', avatar: '<script>' },
      tags: ['唐'], metadata: {},
      stats: { views: 0, likes: 0, comments: 1, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z', commentsList: [
        { author: '评论者', avatar: '🙂', body: '<script>window.__forumXss = true</script>评论' }
      ], time: '刚刚', likes: '0', comments: '1', favorite: '收藏'
    }]);
    api.toggleComments('xss-post');

    expect(document.querySelector('#forum-list script')).toBeNull();
    expect(document.querySelector('#forum-list img')).toBeNull();
    expect(window.__forumXss).toBeUndefined();
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;script&gt;');
  });

  test('escapes script-like user post and comment input before rendering', async () => {
    var api = await importForum();
    api.setInitialDiscussions(DISCUSSIONS);

    document.getElementById('post-title').value = '<script>window.__userForumXss = true</script>用户标题';
    document.getElementById('post-body').value = '<img src=x onerror="window.__userForumXss = true">用户正文';
    api.togglePostTag(document.querySelectorAll('#post-tag-list .ft')[0], '唐');
    api.submitPost();
    api.addComment('post-user-1781179200000-3', '<script>window.__userForumXss = true</script>用户评论');
    api.toggleComments('post-user-1781179200000-3');

    expect(document.querySelector('#forum-list script')).toBeNull();
    expect(document.querySelector('#forum-list img')).toBeNull();
    expect(window.__userForumXss).toBeUndefined();
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;script&gt;');
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;img src=x onerror="window.__userForumXss = true"&gt;用户正文');
  });

  test('discussAPI backward compatibility alias works', async () => {
    await importForum();
    expect(window.discussAPI).toBe(window.forumAPI);
    expect(window.filterDiscuss).toBe(window.forumAPI.filterForum);
  });

  test('getPostTypes returns all 5 types', async () => {
    var api = await importForum();
    expect(api.getPostTypes()).toEqual(['discussion', 'article', 'person', 'media', 'resource']);
  });
});
