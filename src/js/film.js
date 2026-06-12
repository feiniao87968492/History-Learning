(function () {
  var films = [];
  var rankings = { book: [], film: [], doc: [] };
  var currentFilmType = 'all';
  var currentRankingType = 'book';
  var currentWatchlistType = 'want';
  var WATCHLIST_KEY = 'xds_watchlist';

  function escapeHtml(value) {
    if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
      return window.htmlUtils.escapeHtml(value);
    }

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

  function sanitizeInlineStyle(value, fallbackValue) {
    var text = value == null ? '' : String(value);
    if (/^(linear-gradient|radial-gradient|#|rgb|rgba|hsl|hsla)/.test(text)) {
      return text;
    }
    return fallbackValue;
  }

  function getDefaultWatchlist() {
    return {
      want: [],
      watching: [],
      watched: []
    };
  }

  function normalizeWatchlist(raw) {
    return {
      want: Array.isArray(raw && raw.want) ? raw.want : [],
      watching: Array.isArray(raw && raw.watching) ? raw.watching : [],
      watched: Array.isArray(raw && raw.watched) ? raw.watched : []
    };
  }

  function readWatchlist() {
    if (!window.storageAPI || !window.storageAPI.getStoredJSON) {
      return getDefaultWatchlist();
    }

    return normalizeWatchlist(
      window.storageAPI.getStoredJSON(WATCHLIST_KEY, getDefaultWatchlist())
    );
  }

  function writeWatchlist(data) {
    if (!window.storageAPI || !window.storageAPI.setStoredJSON) {
      return false;
    }

    return window.storageAPI.setStoredJSON(WATCHLIST_KEY, normalizeWatchlist(data));
  }

  function setFilms(data) {
    films = Array.isArray(data) ? data : [];
  }

  function setRankings(data) {
    rankings = data && typeof data === 'object'
      ? {
          book: Array.isArray(data.book) ? data.book : [],
          film: Array.isArray(data.film) ? data.film : [],
          doc: Array.isArray(data.doc) ? data.doc : []
        }
      : { book: [], film: [], doc: [] };
  }

  function getFilmById(filmId) {
    return films.find(function (item) {
      return item.id === filmId;
    }) || null;
  }

  function getFilteredFilms() {
    if (currentFilmType === 'all') {
      return films;
    }

    return films.filter(function (item) {
      return item.type === currentFilmType;
    });
  }

  function findWatchlistStatus(filmId) {
    var watchlist = readWatchlist();

    if (watchlist.want.some(function (item) { return item.id === filmId; })) return 'want';
    if (watchlist.watching.some(function (item) { return item.id === filmId; })) return 'watching';
    if (watchlist.watched.some(function (item) { return item.id === filmId; })) return 'watched';

    return null;
  }

  function showToast(message) {
    if (window.navigationAPI && window.navigationAPI.showToast) {
      window.navigationAPI.showToast(message);
    }
  }

  function syncFilmButtons() {
    document.querySelectorAll('#film-grid .fcard').forEach(function (card) {
      var filmId = card.getAttribute('data-film-id');
      var button = card.querySelector('.wbtn');
      if (!button) return;

      if (findWatchlistStatus(filmId)) {
        button.classList.add('add');
        button.textContent = '✓ 已添加';
      } else {
        button.classList.remove('add');
        button.textContent = '＋ 待看';
      }
    });
  }

  function bindFilmGridButtons() {
    document.querySelectorAll('#film-grid .wbtn').forEach(function (button) {
      button.onclick = function () {
        toggleWatchlistItem(button.getAttribute('data-film-id'));
      };
    });
  }

  function bindWatchlistButtons() {
    document.querySelectorAll('#wl-list .wlmove').forEach(function (button) {
      button.onclick = function () {
        moveWatchlistItem(
          button.getAttribute('data-film-id'),
          button.getAttribute('data-next-status')
        );
      };
    });

    document.querySelectorAll('#wl-list .wldel').forEach(function (button) {
      button.onclick = function () {
        toggleWatchlistItem(button.getAttribute('data-film-id'));
      };
    });
  }

  function renderFilmCard(item) {
    var meta = [item.creator, item.year].filter(Boolean).map(escapeHtml).join(' · ');
    var rating = item.rating
      ? '<div class="rt">★★★★★ ' + escapeHtml(item.rating) + (item.ratingCount ? ' <span style="color:#B5ADA5;font-size:11px">(' + escapeHtml(item.ratingCount) + ')</span>' : '') + '</div>'
      : '';
    var tags = (item.tags || []).map(function (tag) {
      return '<span style="font-size:10px;padding:2px 8px;background:#F5F0E8;border-radius:6px;color:#8A8279">' + escapeHtml(tag) + '</span>';
    }).join('');

    return '' +
      '<div class="fcard" data-type="' + escapeHtml(item.type) + '" data-film-id="' + escapeHtml(item.id) + '">' +
        '<div class="fimg" style="background:' + sanitizeInlineStyle(item.coverStyle, '#EDE8E0') + '">' +
          '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff">' +
            '<div>' + escapeHtml(item.icon || '') + '</div>' +
            '<span style="background:rgba(0,0,0,.5);padding:2px 8px;border-radius:4px;font-size:11px">' + escapeHtml(item.badge || '') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="fin">' +
          '<h4>' + escapeHtml(item.title || '') + '</h4>' +
          (meta ? '<div style="font-size:11px;color:#8A8279;margin-bottom:4px">' + meta + '</div>' : '') +
          rating +
          '<p class="desc">' + escapeHtml(item.description || '') + '</p>' +
          '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' + tags + '</div>' +
        '</div>' +
        '<button class="wbtn" data-film-id="' + escapeHtml(item.id) + '">＋ 待看</button>' +
      '</div>';
  }

  function renderFilmGrid() {
    var grid = document.getElementById('film-grid');
    if (!grid) return;

    var list = getFilteredFilms();
    grid.innerHTML = list.length
      ? list.map(renderFilmCard).join('')
      : '<div class="wlempty">暂无影视内容</div>';

    bindFilmGridButtons();
    syncFilmButtons();
  }

  function renderRanking(type) {
    var target = document.getElementById('rnk-list');
    if (!target) return;

    var list = (rankings[type] || []).slice().sort(function (a, b) {
      return Number(b.score || 0) - Number(a.score || 0);
    });
    if (!list.length) {
      target.innerHTML = '<div class="wlempty">暂无榜单内容</div>';
      return;
    }

    target.innerHTML = list.map(function (item, index) {
      return '' +
        '<div class="rnkitem">' +
          '<div class="rnkidx">' + escapeHtml(index + 1) + '</div>' +
          '<div class="rnkimg" style="background:#EDE8E0">' + escapeHtml(item.icon || '📖') + '</div>' +
          '<div class="rnkname">' +
            '<h5>' + escapeHtml(item.title || '') + '</h5>' +
            '<p>' + escapeHtml(item.subtitle || '') + ' · ★ ' + escapeHtml(item.score || '') + '</p>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function filterFilms(type, btn) {
    currentFilmType = type;
    document.querySelectorAll('#film-page .fg2 .dtab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    renderFilmGrid();
  }

  function switchRankingTab(type, btn) {
    currentRankingType = type;
    document.querySelectorAll('#film-rank .rnkt').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    renderRanking(type);
  }

  function addToWantList(filmId) {
    var watchlist = readWatchlist();

    watchlist.want = watchlist.want.filter(function (entry) { return entry.id !== filmId; });
    watchlist.watching = watchlist.watching.filter(function (entry) { return entry.id !== filmId; });
    watchlist.watched = watchlist.watched.filter(function (entry) { return entry.id !== filmId; });
    watchlist.want.unshift({ id: filmId, addedAt: new Date().toISOString() });

    return writeWatchlist(watchlist);
  }

  function removeFromWatchlist(filmId) {
    var watchlist = readWatchlist();

    watchlist.want = watchlist.want.filter(function (entry) { return entry.id !== filmId; });
    watchlist.watching = watchlist.watching.filter(function (entry) { return entry.id !== filmId; });
    watchlist.watched = watchlist.watched.filter(function (entry) { return entry.id !== filmId; });

    return writeWatchlist(watchlist);
  }

  function syncWatchlistTabs() {
    document.querySelectorAll('#watchlist-panel .wltab').forEach(function (tab) {
      tab.classList.remove('act');
      if (tab.id === 'wl-' + currentWatchlistType) {
        tab.classList.add('act');
      }
    });
  }

  function cleanInvalidWatchlistIds() {
    var watchlist = readWatchlist();
    var validIds = films.map(function (item) {
      return item.id;
    });

    ['want', 'watching', 'watched'].forEach(function (status) {
      watchlist[status] = watchlist[status].filter(function (entry) {
        return validIds.indexOf(entry.id) >= 0;
      });
    });

    writeWatchlist(watchlist);
  }

  function renderWatchlist() {
    var listRoot = document.getElementById('wl-list');
    if (!listRoot) return;

    var watchlist = readWatchlist();
    var list = watchlist[currentWatchlistType] || [];

    if (!list.length) {
      listRoot.innerHTML = '<div class="wlempty">暂无内容，去添加吧～</div>';
      return;
    }

    listRoot.innerHTML = list.map(function (entry) {
      var film = getFilmById(entry.id);
      if (!film) return '';

      var actions = [
        { key: 'want', label: '待看' },
        { key: 'watching', label: '在看' },
        { key: 'watched', label: '看过' }
      ].map(function (action) {
        return '<button class="wlmove' + (action.key === currentWatchlistType ? ' act' : '') + '" data-film-id="' + escapeHtml(film.id) + '" data-next-status="' + action.key + '">' + action.label + '</button>';
      }).join('');

      return '' +
        '<div class="wlitem" data-watchlist-id="' + escapeHtml(film.id) + '">' +
          '<div class="wlthumb" style="background:' + sanitizeInlineStyle(film.coverStyle, '#EDE8E0') + '">' + escapeHtml(film.icon || '') + '</div>' +
          '<div class="wlinfo">' +
            '<h5>' + escapeHtml(film.title || '') + '</h5>' +
            '<p>' + [film.creator, film.year].filter(Boolean).map(escapeHtml).join(' · ') + '</p>' +
            '<p>' + escapeHtml(film.description || '') + '</p>' +
            '<div class="wlops">' + actions + '</div>' +
          '</div>' +
          '<button class="wldel" data-film-id="' + escapeHtml(film.id) + '">×</button>' +
        '</div>';
    }).join('');
    bindWatchlistButtons();
  }

  function toggleWatchlistItem(filmId) {
    var currentStatus = findWatchlistStatus(filmId);
    var saved = currentStatus ? removeFromWatchlist(filmId) : addToWantList(filmId);

    if (!saved) {
      showToast('保存失败，请稍后再试');
      return;
    }

    syncFilmButtons();
    renderWatchlist();
    showToast(currentStatus ? '已移出待看栏' : '已添加到待看栏！');
  }

  function openWatchlist() {
    var panel = document.getElementById('watchlist-panel');
    currentWatchlistType = 'want';
    if (panel) {
      panel.classList.add('act');
    }
    syncWatchlistTabs();
    renderWatchlist();
  }

  function closeWatchlist() {
    var panel = document.getElementById('watchlist-panel');
    if (panel) {
      panel.classList.remove('act');
    }
  }

  function switchWatchlistTab(type, btn) {
    currentWatchlistType = type;
    document.querySelectorAll('#watchlist-panel .wltab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) {
      btn.classList.add('act');
    } else {
      syncWatchlistTabs();
    }
    renderWatchlist();
  }

  function moveWatchlistItem(filmId, nextStatus) {
    var currentStatus = findWatchlistStatus(filmId);
    var watchlist;
    var existing = null;

    if (!currentStatus || currentStatus === nextStatus) {
      currentWatchlistType = nextStatus;
      syncWatchlistTabs();
      renderWatchlist();
      return;
    }

    watchlist = readWatchlist();
    ['want', 'watching', 'watched'].forEach(function (status) {
      watchlist[status] = watchlist[status].filter(function (entry) {
        if (entry.id === filmId) {
          existing = entry;
        }
        return entry.id !== filmId;
      });
    });

    watchlist[nextStatus].unshift({
      id: filmId,
      addedAt: existing ? existing.addedAt : new Date().toISOString()
    });

    if (!writeWatchlist(watchlist)) {
      showToast('保存失败，请稍后再试');
      return;
    }

    currentWatchlistType = nextStatus;
    syncWatchlistTabs();
    renderWatchlist();
    syncFilmButtons();
  }

  function initializeFilmModule() {
    cleanInvalidWatchlistIds();
    renderFilmGrid();
    renderRanking(currentRankingType);
    renderWatchlist();
  }

  window.filmAPI = {
    setFilms: setFilms,
    setRankings: setRankings,
    initializeFilmModule: initializeFilmModule,
    filterFilms: filterFilms,
    renderFilmGrid: renderFilmGrid,
    switchRankingTab: switchRankingTab,
    renderRanking: renderRanking,
    openWatchlist: openWatchlist,
    closeWatchlist: closeWatchlist,
    switchWatchlistTab: switchWatchlistTab,
    toggleWatchlistItem: toggleWatchlistItem,
    moveWatchlistItem: moveWatchlistItem,
    renderWatchlist: renderWatchlist
  };

  window.filterFilms = filterFilms;
  window.switchRankingTab = switchRankingTab;
  window.openWatchlist = openWatchlist;
  window.closeWatchlist = closeWatchlist;
  window.switchWatchlistTab = switchWatchlistTab;
  window.toggleWatchlistItem = toggleWatchlistItem;
  window.moveWatchlistItem = moveWatchlistItem;
})();
