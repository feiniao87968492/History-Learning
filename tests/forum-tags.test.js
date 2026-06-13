import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountForumDOM() {
  mountDOM(`
    <div id="forum-page" class="page active">
      <div class="htabs" id="forum-tag-tabs">
        <button class="htab act" onclick="filterForumByTag('all',this)">全部标签</button>
        <button class="htab" onclick="filterForumByTag('唐',this)">唐</button>
        <button class="htab" onclick="filterForumByTag('政治',this)">政治</button>
      </div>
      <div id="forum-list"></div>
    </div>
    <div class="fov" id="post-overlay" onclick="closePost(event)">
      <div class="fp" onclick="event.stopPropagation()">
        <input type="text" id="post-title"><textarea id="post-body"></textarea>
        <select id="post-type-select"><option value="discussion">讨论</option></select>
        <div id="post-tag-list">
          <button class="ft" onclick="togglePostTag(this,'唐')">唐</button>
          <button class="ft" onclick="togglePostTag(this,'宋')">宋</button>
          <button class="ft" onclick="togglePostTag(this,'政治')">政治</button>
          <button class="ft" onclick="togglePostTag(this,'文化')">文化</button>
          <button class="ft" onclick="togglePostTag(this,'经济')">经济</button>
          <button class="ft" onclick="togglePostTag(this,'军事')">军事</button>
        </div>
        <button class="fsub" onclick="submitPost()">发布帖子</button>
      </div>
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
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-13T12:00:00.000Z'));
  resetGlobals();
  mountForumDOM();
  installHtmlUtils();
  window.storageAPI = {
    getStoredJSON: vi.fn(function (key, fallback) { return fallback; }),
    setStoredJSON: vi.fn(function () { return true; })
  };
  window.navigationAPI = { showToast: vi.fn() };
});

describe('forum tags', () => {
  test('filterForumByTag hides posts without matching tag', async () => {
    var api = await importForum();
    api.setInitialDiscussions([
      { id: 'p1', type: 'discussion', title: 'Tang topic', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['唐'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] },
      { id: 'p2', type: 'discussion', title: 'Song topic', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['宋'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] }
    ]);

    var tagButton = document.querySelectorAll('#forum-tag-tabs .htab')[1];
    api.filterForumByTag('唐', tagButton);

    expect(document.querySelector('[data-post-id="p1"]').style.display).toBe('block');
    expect(document.querySelector('[data-post-id="p2"]').style.display).toBe('none');
    expect(tagButton.classList.contains('act')).toBe(true);
  });

  test('filterForumByTag "all" shows all posts', async () => {
    var api = await importForum();
    api.setInitialDiscussions([
      { id: 'p1', type: 'discussion', title: 'A', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['唐'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] },
      { id: 'p2', type: 'discussion', title: 'B', content: '...', author: { id: 'u1', name: 'A', avatar: '🙂' }, tags: ['宋'], metadata: {}, stats: { views: 0, likes: 0, comments: 0, favorites: 0 }, createdAt: '2026-06-13T00:00:00Z', commentsList: [] }
    ]);

    var allButton = document.querySelectorAll('#forum-tag-tabs .htab')[0];
    api.filterForumByTag('all', allButton);
    expect(document.querySelectorAll('#forum-list .pcard')).toHaveLength(2);
  });

  test('submitPost requires at least one tag', async () => {
    var api = await importForum();
    api.setInitialDiscussions([]);
    document.getElementById('post-title').value = 'No tags';
    document.getElementById('post-body').value = 'Content';
    api.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('请至少选择一个标签');
  });

  test('togglePostTag adds and removes tags', async () => {
    var api = await importForum();
    api.setInitialDiscussions([]);

    var btn = document.querySelectorAll('#post-tag-list .ft')[0];
    api.togglePostTag(btn, '唐');
    expect(btn.classList.contains('act')).toBe(true);

    api.togglePostTag(btn, '唐');
    expect(btn.classList.contains('act')).toBe(false);
  });

  test('submitPost rejects more than 5 tags', async () => {
    var api = await importForum();
    api.setInitialDiscussions([]);
    document.getElementById('post-title').value = 'Many tags';
    document.getElementById('post-body').value = 'Content';

    var buttons = document.querySelectorAll('#post-tag-list .ft');
    api.togglePostTag(buttons[0], '唐');
    api.togglePostTag(buttons[1], '宋');
    api.togglePostTag(buttons[2], '政治');
    api.togglePostTag(buttons[3], '文化');
    api.togglePostTag(buttons[4], '经济');
    api.togglePostTag(buttons[5], '军事');
    api.submitPost();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('最多选择5个标签');
  });
});
