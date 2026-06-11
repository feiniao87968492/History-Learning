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

    if (window.podcastAPI) {
      window.filterPodcast = window.podcastAPI.filterPodcast;
      window.openPlayer = window.podcastAPI.openPlayer;
      window.closePlayer = window.podcastAPI.closePlayer;
      window.togglePlay = window.podcastAPI.togglePlay;
      window.seekPodcast = window.podcastAPI.seekPodcast;
      window.setTimer = window.podcastAPI.setTimer;
      window.showTimer = window.podcastAPI.showTimer;
      window.prevPodcast = window.podcastAPI.prevPodcast;
      window.nextPodcast = window.podcastAPI.nextPodcast;
    }

    if (window.filmAPI) {
      window.filterFilms = window.filmAPI.filterFilms;
      window.switchRankingTab = window.filmAPI.switchRankingTab;
      window.openWatchlist = window.filmAPI.openWatchlist;
      window.closeWatchlist = window.filmAPI.closeWatchlist;
      window.switchWatchlistTab = window.filmAPI.switchWatchlistTab;
      window.toggleWatchlistItem = window.filmAPI.toggleWatchlistItem;
      window.moveWatchlistItem = window.filmAPI.moveWatchlistItem;
    }

    if (window.aiAssistantAPI) {
      window.togAI = window.aiAssistantAPI.togAI;
      window.aiAsk = window.aiAssistantAPI.aiAsk;
      window.aiSend = window.aiAssistantAPI.aiSend;
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

  function renderMemes(memes) {
    var scroll = document.getElementById('meme-scroll');
    var dots = document.getElementById('meme-dots');
    if (!scroll || !Array.isArray(memes)) return;

    scroll.innerHTML = memes.map(function (item, index) {
      return '<div class="meme-card" onclick="openMeme(' + index + ')">' +
        '<span style="font-size:64px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">' + escapeHtml(item.emoji || '') + '</span>' +
        '<div class="meme-cap">' + escapeHtml(item.title || '') + '</div>' +
      '</div>';
    }).join('');

    if (dots) {
      dots.innerHTML = memes.map(function (_, index) {
        return '<span class="meme-dot' + (index === 0 ? ' act' : '') + '"></span>';
      }).join('');
    }
  }

  function renderFeedbackTypes(types) {
    var list = document.getElementById('feedback-type-list');
    if (!list || !Array.isArray(types)) return;

    list.innerHTML = types.map(function (type, index) {
      return '<button class="ft' + (index === 0 ? ' act' : '') + '" onclick="selFT(this)">' + escapeHtml(type) + '</button>';
    }).join('');
  }

  function renderHotArticles(articles) {
    var root = document.getElementById('hot-articles');
    if (!root || !Array.isArray(articles)) return;

    root.innerHTML = articles.map(function (item) {
      var meta = Array.isArray(item.meta) ? item.meta.join(' ') : (item.meta || '');
      if (item.kind === 'headline') {
        return '<div class="hl" data-dynasty="' + escapeHtml(item.dynasty || '') + '">' +
          '<div class="hl-img" style="background:' + escapeHtml(item.background || '#C9A96E') + '">' + escapeHtml(item.icon || '') + '</div>' +
          '<div class="inf"><div style="margin-bottom:6px"><span class="tg ' + escapeHtml(item.tagClass || 'hot') + '">' + escapeHtml(item.tag || '') + '</span><span style="font-size:12px;color:#8A8279">' + escapeHtml(item.label || '') + '</span></div>' +
          '<h3>' + escapeHtml(item.title || '') + '</h3><div class="ad"><span>' + escapeHtml(meta) + '</span></div></div></div>';
      }

      return '<div class="hi" data-dynasty="' + escapeHtml(item.dynasty || '') + '">' +
        '<div class="hi-img" style="background:' + escapeHtml(item.background || '#D4C0A0') + '">' + escapeHtml(item.icon || '') + '</div>' +
        '<div class="tx"><h4>' + escapeHtml(item.title || '') + '</h4><div class="meta">' + escapeHtml(meta) + '</div><div class="lk">' + escapeHtml(item.cta || '🔗 阅读原文') + '</div></div></div>';
    }).join('');

    root.querySelectorAll('.hl, .hi').forEach(function (card, index) {
      card.onclick = function () {
        openExternalLink(articles[index].url || '#');
      };
    });
  }

  function renderDiscussions(discussions) {
    var root = document.querySelector('#discuss-page .dp');
    if (!root || !Array.isArray(discussions)) return;

    root.innerHTML = discussions.map(function (item) {
      return '<div class="pcard" data-discuss-cat="' + escapeHtml(item.category || '') + '">' +
        '<div class="pa"><div class="pav">' + escapeHtml(item.avatar || '') + '</div><div><div class="nm">' + escapeHtml(item.author || '') + '</div><div class="ti">' + escapeHtml(item.time || '') + '</div></div></div>' +
        '<div class="pc"><h4>' + escapeHtml(item.title || '') + '</h4><p>' + escapeHtml(item.body || '') + '</p></div>' +
        '<div class="pact"><span>❤️ ' + escapeHtml(item.likes || '0') + '</span><span>💬 ' + escapeHtml(item.comments || '0') + '</span><span>⭐ ' + escapeHtml(item.favorite || '收藏') + '</span></div>' +
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
    var nouns = await loadJSON('./src/data/nouns.json', {});
    if (window.nounAPI) window.nounAPI.setNounData(nouns);

    var timeline = await loadJSON('./src/data/timeline.json', { dynasties: [], events: [] });
    if (window.timelineAPI) {
      window.timelineAPI.setDynasties(timeline.dynasties);
      window.timelineAPI.setTimelineEvents(timeline.events);
      try { window.timelineAPI.renderTimeline(); } catch (e) { console.error('renderTimeline err:', e); }
      try { window.timelineAPI.renderEventList(); } catch (e) { console.error('renderEventList err:', e); }
    }

    var podcasts = await loadJSON('./src/data/podcasts.json', []);
    if (window.podcastAPI) window.podcastAPI.setPodcasts(podcasts);

    var films = await loadJSON('./src/data/films.json', []);
    var rankings = await loadJSON('./src/data/rankings.json', { book: [], film: [], doc: [] });
    if (window.filmAPI) {
      window.filmAPI.setFilms(films);
      window.filmAPI.setRankings(rankings);
      if (typeof window.filmAPI.initializeFilmModule === 'function') {
        window.filmAPI.initializeFilmModule();
      }
    }

    if (document.getElementById('meme-scroll')) {
      renderMemes(await loadJSON('./src/data/memes.json', []));
    }
    if (document.getElementById('feedback-type-list')) {
      renderFeedbackTypes(await loadJSON('./src/data/feedback-types.json', []));
    }
    if (document.getElementById('hot-articles')) {
      renderHotArticles(await loadJSON('./src/data/hot-articles.json', []));
    }
    if (document.querySelector('#discuss-page .dp')) {
      renderDiscussions(await loadJSON('./src/data/discussions.json', []));
    }
    if (document.querySelector('#profile-page .mg')) {
      renderProfileMenu(await loadJSON('./src/data/profile-menu.json', { study: [], settings: [] }));
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
