(function () {
  function ensureHtmlUtils() {
    if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
      return;
    }

    window.htmlUtils = {
      escapeHtml: function (value) {
        if (value === null || typeof value === 'undefined') {
          return '';
        }

        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    };
  }

  function escapeHtml(value) {
    ensureHtmlUtils();
    return window.htmlUtils.escapeHtml(value);
  }

  function openExternalLink(url) {
    if (window.externalLinkAPI && typeof window.externalLinkAPI.open === 'function') {
      return window.externalLinkAPI.open(url);
    }
    if (typeof window['open'] === 'function') {
      window['open'](url, '_blank');
      return true;
    }
    return false;
  }

  function exposeGlobals() {
    if (window.storageAPI) {
      window.getStoredJSON = window.storageAPI.getStoredJSON;
      window.setStoredJSON = window.storageAPI.setStoredJSON;
      window.getStoredString = window.storageAPI.getStoredString;
      window.setStoredString = window.storageAPI.setStoredString;
    }

    if (window.navigationAPI) {
      window.resetAIFab = window.navigationAPI.resetAIFab;
      window.showToast = window.navigationAPI.showToast;
      window.login = window.navigationAPI.login;
      window.openSub = window.navigationAPI.openSub;
      window.closeSub = window.navigationAPI.closeSub;
    }

    if (window.nounAPI) {
      window.openNounDet = window.nounAPI.openNounDet;
      window.closeNounDet = window.nounAPI.closeNounDet;
      window.togNounFav = window.nounAPI.togNounFav;
      window.shareNoun = window.nounAPI.shareNoun;
      window.searchNouns = window.nounAPI.searchNouns;
    }

    if (window.favoritesAPI) {
      window.renderFavorites = window.favoritesAPI.renderFavorites;
    }

    if (window.timelineAPI) {
      window.selDyn = window.timelineAPI.selDyn;
      window.prevDyn = window.timelineAPI.prevDyn;
      window.nextDyn = window.timelineAPI.nextDyn;
      window.showTimelineDetail = window.timelineAPI.showTimelineDetail;
      window.showTimelineConn = window.timelineAPI.showTimelineConn;
      window.renderTimeline = window.timelineAPI.renderTimeline;
      window.renderEventList = window.timelineAPI.renderEventList;
      window.zoomTL = window.timelineAPI.zoomTL;
    }

    if (window.mindmapAPI) {
      window.swMind = window.mindmapAPI.swMind;
      window.openNode = window.mindmapAPI.openNode;
      window.saveNode = window.mindmapAPI.saveNode;
      window.closeNodeNote = window.mindmapAPI.closeNodeNote;
    }

    if (window.aiAssistantAPI) {
      window.togAI = window.aiAssistantAPI.togAI;
      window.aiAsk = window.aiAssistantAPI.aiAsk;
      window.aiSend = window.aiAssistantAPI.aiSend;
    }

    if (window.checkinAPI) {
      window.openCheckin = window.checkinAPI.openCheckin;
      window.closeCheckin = window.checkinAPI.closeCheckin;
      window.doCheckin = window.checkinAPI.doCheckin;
      window.renderCheckinCalendar = window.checkinAPI.renderCheckinCalendar;
      window.updateCheckinStats = window.checkinAPI.updateCheckinStats;
    }

    if (window.forumAPI) {
      window.filterForum = window.forumAPI.filterForum;
      window.filterForumByTag = window.forumAPI.filterForumByTag;
      window.toggleComments = window.forumAPI.toggleComments;
      window.openPost = window.forumAPI.openPost;
      window.closePost = window.forumAPI.closePost;
      window.togglePostTag = window.forumAPI.togglePostTag;
      window.submitPost = window.forumAPI.submitPost;
      window.addComment = window.forumAPI.addComment;
      window.addCommentFromInput = window.forumAPI.addCommentFromInput;
    }
  }

  async function loadJSON(path, fallback) {
    if (window.dataLoaderAPI && typeof window.dataLoaderAPI.loadJSON === 'function') {
      return window.dataLoaderAPI.loadJSON(path, fallback);
    }

    try {
      var fetchFn = window['fetch'] || (typeof globalThis !== 'undefined' ? globalThis['fetch'] : null);
      if (typeof fetchFn !== 'function') {
        throw new Error('fetch unavailable: ' + path);
      }
      var response = await fetchFn(path);
      if (!response.ok) {
        throw new Error('Failed to load data: ' + path);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return fallback;
    }
  }

  function renderFeedbackTypes(types) {
    var list = document.getElementById('feedback-type-list');
    if (!list || !Array.isArray(types)) return;

    list.innerHTML = types.map(function (type, index) {
      return '<button class="ft' + (index === 0 ? ' act' : '') + '" onclick="selFT(this)">' + escapeHtml(type) + '</button>';
    }).join('');
  }

  function renderDiscussions(discussions) {
    if (!Array.isArray(discussions)) return;

    if (window.forumAPI && typeof window.forumAPI.setInitialDiscussions === 'function') {
      window.forumAPI.setInitialDiscussions(discussions);
      return;
    }

    var root = document.getElementById('forum-list') || document.getElementById('discussion-list');
    if (!root) return;

    root.innerHTML = discussions.map(function (item) {
      var authorName = (item.author && item.author.name) || item.author || '';
      var avatar = (item.author && item.author.avatar) || item.avatar || '';
      var body = item.content || item.body || '';
      return '<div class="pcard" data-post-id="' + escapeHtml(item.id || '') + '" data-post-type="' + escapeHtml(item.type || 'discussion') + '">' +
        '<div class="pa"><div class="pav">' + escapeHtml(avatar) + '</div><div><div class="nm">' + escapeHtml(authorName) + '</div><div class="ti">' + escapeHtml(item.time || item.createdAt || '') + '</div></div></div>' +
        '<div class="pc"><h4>' + escapeHtml(item.title || '') + '</h4><p>' + escapeHtml(body) + '</p></div>' +
        '<div class="pact"><span>❤️ ' + escapeHtml((item.stats && item.stats.likes) || item.likes || '0') + '</span><span>💬 ' + escapeHtml((item.stats && item.stats.comments) || item.comments || '0') + '</span><span>⭐ 收藏</span></div>' +
      '</div>';
    }).join('');
  }

  function renderProfileMenu(menu) {
    var groups = document.querySelectorAll('#profile-page .mg');
    if (!groups.length || !menu) return;

    function renderItems(items) {
      return (Array.isArray(items) ? items : []).map(function (item) {
        return '<button class="mi"><span>' + escapeHtml(item.icon || '') + '</span><span>' + escapeHtml(item.label || '') + '</span></button>';
      }).join('');
    }

    if (groups[0]) groups[0].innerHTML = renderItems(menu.study);
    if (groups[1]) groups[1].innerHTML = renderItems(menu.settings);
  }

  async function initializeData() {
    var nouns = await loadJSON('./src/data/nouns.json?v=20260612-timeline-fix2', {});
    if (window.nounAPI) window.nounAPI.setNounData(nouns);

    var timeline = await loadJSON('./src/data/timeline.json?v=20260612-timeline-fix2', { dynasties: [], events: [] });
    if (window.timelineAPI) {
      window.timelineAPI.setDynasties(timeline.dynasties);
      window.timelineAPI.setTimelineEvents(timeline.events);
      try { window.timelineAPI.renderTimeline(); } catch (e) { console.error('renderTimeline err:', e); }
      try { window.timelineAPI.renderEventList(); } catch (e) { console.error('renderEventList err:', e); }
    }

    if (window.mindmapAPI) {
      var mindmaps = await loadJSON('./src/data/mindmaps.json?v=20260612-timeline-fix2', { maps: {} });
      window.mindmapAPI.setMindmapData(mindmaps);
      try { window.mindmapAPI.renderAllMindmaps(); } catch (e) { console.error('renderAllMindmaps err:', e); }
    }

    if (document.getElementById('feedback-type-list')) {
      renderFeedbackTypes(await loadJSON('./src/data/feedback-types.json?v=20260612-timeline-fix2', []));
    }
    if (document.getElementById('forum-list') || document.querySelector('#discuss-page .dp') || document.querySelector('#forum-page')) {
      renderDiscussions(await loadJSON('./src/data/discussions.json?v=20260613-forum-v1', []));
    }
    if (document.querySelector('#profile-page .mg')) {
      renderProfileMenu(await loadJSON('./src/data/profile-menu.json?v=20260612-timeline-fix2', { study: [], settings: [] }));
    }
  }

  function registerGlobalErrorToast() {
    window.onerror = function (msg) {
      var message = 'JS错误:' + String(msg).slice(0, 40);

      if (window.navigationAPI && window.navigationAPI.showToast) {
        window.navigationAPI.showToast(message);
      } else {
        var toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = message;
          toast.classList.add('sh');
          setTimeout(function () {
            toast.classList.remove('sh');
          }, 4000);
        }
      }

      return false;
    };
  }

  function initializeApp() {
    ensureHtmlUtils();
    registerGlobalErrorToast();
    exposeGlobals();
    initializeData().catch(function (err) {
      console.error('Data initialization failed:', err);
    });
  }

  initializeApp();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  }
})();
