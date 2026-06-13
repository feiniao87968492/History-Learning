import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

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
    </div>
    <div id="toast"></div>
  `);
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
  resetGlobals();
  mountForumDOM();
  installHtmlUtils();
  window.storageAPI = {
    getStoredJSON: vi.fn(function (key, fallback) { return fallback; }),
    setStoredJSON: vi.fn(function () { return true; })
  };
  window.navigationAPI = { showToast: vi.fn() };
});

describe('forum post types', () => {
  var TYPES = ['discussion', 'article', 'person', 'media', 'resource'];

  test('API exposes getPostTypes and getTypeLabels', async () => {
    var api = await importForum();
    expect(api.getPostTypes()).toEqual(TYPES);
    expect(api.getTypeLabels().discussion).toBe('讨论');
    expect(api.getTypeLabels().article).toBe('文章');
    expect(api.getTypeLabels().person).toBe('人物');
    expect(api.getTypeLabels().media).toBe('书影');
    expect(api.getTypeLabels().resource).toBe('资源');
  });

  TYPES.forEach(function (type) {
    test('renders ' + type + ' post with data-post-type attribute', async () => {
      var api = await importForum();
      api.setInitialDiscussions([{
        id: 'test-' + type, type: type, title: type + ' title',
        content: 'Body for ' + type,
        author: { id: 'u_test', name: 'Test', avatar: '🙂' },
        tags: ['唐'], metadata: { dynasty: '唐朝', role: '皇帝', mediaType: type === 'media' ? '书籍' : null, rating: type === 'media' ? '9.0' : null },
        stats: { views: 100, likes: 10, comments: 3, favorites: 5 },
        createdAt: '2026-06-13T00:00:00Z', commentsList: []
      }]);
      expect(document.querySelector('[data-post-id="test-' + type + '"]')).not.toBeNull();
      expect(document.querySelector('[data-post-id="test-' + type + '"]').getAttribute('data-post-type')).toBe(type);
    });
  });

  test('article posts show external link when url present', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'art-link', type: 'article', title: 'Article with link',
      content: 'Has external url', author: { id: 'u_test', name: 'Test', avatar: '🙂' },
      tags: ['宋'], metadata: { externalUrl: 'https://example.com/article' },
      stats: { views: 1, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z', commentsList: []
    }]);
    expect(document.getElementById('forum-list').innerHTML).toContain('阅读原文');
  });

  test('person posts show dynasty and role metadata', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'per-test', type: 'person', title: 'Confucius',
      content: 'Great sage', author: { id: 'u_test', name: 'Test', avatar: '🙂' },
      tags: ['先秦', '文化'], metadata: { dynasty: '春秋', role: '思想家·教育家' },
      stats: { views: 1, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z', commentsList: []
    }]);
    expect(document.getElementById('forum-list').innerHTML).toContain('春秋');
    expect(document.getElementById('forum-list').innerHTML).toContain('思想家·教育家');
  });

  test('media posts show rating when present', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'med-test', type: 'media', title: 'Great Book',
      content: 'Must read', author: { id: 'u_test', name: 'Test', avatar: '🙂' },
      tags: ['明'], metadata: { mediaType: '书籍', rating: '9.5' },
      stats: { views: 1, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z', commentsList: []
    }]);
    expect(document.getElementById('forum-list').innerHTML).toContain('9.5');
    expect(document.getElementById('forum-list').innerHTML).toContain('书籍');
  });

  test('getDynastyTags and getTopicTags return expected arrays', async () => {
    var api = await importForum();
    expect(api.getDynastyTags()).toContain('唐');
    expect(api.getDynastyTags()).toContain('近代');
    expect(api.getTopicTags()).toContain('政治');
    expect(api.getTopicTags()).toContain('制度');
  });
});
