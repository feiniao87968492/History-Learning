import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountForumDOM() {
  mountDOM(`
    <div id="forum-page" class="page active"><div id="forum-list"></div></div>
    <div class="fov" id="post-overlay" onclick="closePost(event)">
      <div class="fp" onclick="event.stopPropagation()">
        <input type="text" id="post-title"><textarea id="post-body"></textarea>
        <select id="post-type-select"><option value="discussion">讨论</option></select>
        <div id="post-tag-list"><button class="ft" onclick="togglePostTag(this,'唐')">唐</button></div>
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

describe('forum XSS safety', () => {
  test('escapes script tags in post title and content', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'xss-1', type: 'discussion', title: '<script>alert("xss")</script>Title',
      content: '<img src=x onerror="alert(1)">Body',
      author: { id: 'u1', name: '<b>Hacker</b>', avatar: '<script>' },
      tags: ['唐'], metadata: {},
      stats: { views: 0, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z', commentsList: [{
        author: 'Commenter', avatar: '🙂', body: '<script>alert("comment xss")</script>'
      }]
    }]);
    api.toggleComments('xss-1');

    expect(document.querySelector('#forum-list script')).toBeNull();
    expect(document.querySelector('#forum-list img')).toBeNull();
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;script&gt;');
  });

  test('escapes user input in post creation', async () => {
    var api = await importForum();
    api.setInitialDiscussions([]);

    document.getElementById('post-title').value = '<script>bad</script>User title';
    document.getElementById('post-body').value = '<img onerror="xss">User body';
    api.togglePostTag(document.querySelector('#post-tag-list .ft'), '唐');
    api.submitPost();

    expect(document.querySelector('#forum-list script')).toBeNull();
    expect(document.querySelector('#forum-list img')).toBeNull();
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;script&gt;bad&lt;/script&gt;');
  });

  test('escapes script-like content in comments', async () => {
    var api = await importForum();
    api.setInitialDiscussions([{
      id: 'xss-2', type: 'discussion', title: 'Test', content: 'Body',
      author: { id: 'u1', name: 'A', avatar: '🙂' },
      tags: ['唐'], metadata: {},
      stats: { views: 0, likes: 0, comments: 0, favorites: 0 },
      createdAt: '2026-06-13T00:00:00Z', commentsList: []
    }]);

    api.addComment('xss-2', '<script>alert("bad")</script>Comment');
    expect(document.getElementById('forum-list').innerHTML).toContain('&lt;script&gt;');
    expect(document.querySelector('#forum-list script')).toBeNull();
  });
});
