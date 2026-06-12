(function () {
  var nounData = {};
  var FAV_KEY = 'xds_favorites';
  var LEARNED_KEY = 'xds_learned';

  function showToast(message) {
    if (window.navigationAPI && typeof window.navigationAPI.showToast === 'function') {
      window.navigationAPI.showToast(message);
    }
  }

  function recordLearningEvent(type, sourceId) {
    if (window.learningStatsAPI && typeof window.learningStatsAPI.recordLearningEvent === 'function') {
      window.learningStatsAPI.recordLearningEvent(type, sourceId);
    }
  }

  function readStoredJSON(key, fallbackValue) {
    if (!window.storageAPI || typeof window.storageAPI.getStoredJSON !== 'function') {
      return fallbackValue;
    }

    return window.storageAPI.getStoredJSON(key, fallbackValue);
  }

  function writeStoredJSON(key, value) {
    if (!window.storageAPI || typeof window.storageAPI.setStoredJSON !== 'function') {
      return false;
    }

    return window.storageAPI.setStoredJSON(key, value);
  }

  function normalizeFavoriteList(value) {
    return Array.isArray(value) ? value.filter(function (item, index, list) {
      return item && list.indexOf(item) === index;
    }) : [];
  }

  function normalizeLearnedMap(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function getFavoriteNouns() {
    return normalizeFavoriteList(readStoredJSON(FAV_KEY, []));
  }

  function setFavoriteNouns(list) {
    return writeStoredJSON(FAV_KEY, normalizeFavoriteList(list));
  }

  function isNounFavorite(name) {
    return getFavoriteNouns().indexOf(name) !== -1;
  }

  function getLearnedNouns() {
    return normalizeLearnedMap(readStoredJSON(LEARNED_KEY, {}));
  }

  function setLearnedNouns(map) {
    return writeStoredJSON(LEARNED_KEY, normalizeLearnedMap(map));
  }

  function isNounLearned(name) {
    return !!getLearnedNouns()[name];
  }

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

  function escapeJSString(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/</g, '\\x3c')
      .replace(/>/g, '\\x3e');
  }

  function getNounNames() {
    return Object.keys(nounData);
  }

  function setNounData(data) {
    nounData = data && typeof data === 'object' ? data : {};
    renderNounCards();
  }

  function getNoun(name) {
    return nounData[name] || null;
  }

  function expandSearchValue(value) {
    var text = String(value || '');
    if (text.indexOf('隋唐') !== -1) {
      text += ' 隋朝 唐朝';
    }
    if (text.indexOf('秦汉') !== -1) {
      text += ' 秦朝 汉朝';
    }
    if (text.indexOf('宋元') !== -1) {
      text += ' 宋朝 元朝';
    }
    if (text.indexOf('明清') !== -1) {
      text += ' 明朝 清朝';
    }
    return text;
  }

  function matchesFilter(name, filter) {
    if (!filter) return true;

    var d = getNoun(name) || {};
    var query = String(filter).toLowerCase();
    var values = [
      name,
      d.text,
      d.dynasty,
      d.category,
      d.year
    ];

    return values.some(function (value) {
      return expandSearchValue(value).toLowerCase().indexOf(query) !== -1;
    });
  }

  function renderNounCards(filter) {
    var grid = document.getElementById('noun-grid');
    if (!grid) return;

    var names = getNounNames().filter(function (name) {
      return matchesFilter(name, filter);
    });

    if (!names.length) {
      grid.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无匹配名词</div>';
      return;
    }

    grid.innerHTML = names.map(function (name) {
      var d = getNoun(name) || {};
      var summary = d.text ? String(d.text).slice(0, 50) + (String(d.text).length > 50 ? '...' : '') : '暂无简介';
      var tags = [d.dynasty, d.category].filter(Boolean).map(function (tag, index) {
        return '<span class="tg ' + (index === 0 ? 'hot' : 'sys') + '" style="font-size:10px">' + escapeHtml(tag) + '</span>';
      }).join('');
      var safeName = escapeJSString(name);
      var favorite = isNounFavorite(name);
      var favClass = favorite ? 'nfav faved' : 'nfav';
      var favText = favorite ? '★' : '☆';

      return '<div class="ncard" onclick="openNounDet(\'' + safeName + '\')">' +
        '<div class="nmeta">' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap">' + tags + '</div>' +
          '<div class="nact">' +
            '<button class="' + favClass + '" onclick="event.stopPropagation();togNounFav(this,\'' + safeName + '\')">' + favText + '</button>' +
            '<button class="nshr" onclick="event.stopPropagation();shareNoun(\'' + safeName + '\')">↗</button>' +
          '</div>' +
        '</div>' +
        '<h4>' + escapeHtml(name) + '</h4>' +
        '<p>' + escapeHtml(summary) + '</p>' +
      '</div>';
    }).join('');
  }

  function renderMeta(d) {
    var meta = document.getElementById('nd-meta');
    if (!meta) return;

    var parts = [];
    if (d && d.dynasty) parts.push('<span class="tg hot" style="font-size:10px;margin-right:6px">' + escapeHtml(d.dynasty) + '</span>');
    if (d && d.category) parts.push('<span class="tg sys" style="font-size:10px;margin-right:6px">' + escapeHtml(d.category) + '</span>');
    if (d && d.year) parts.push('<span class="tg" style="font-size:10px">' + escapeHtml(d.year) + '</span>');
    meta.innerHTML = parts.join('');
  }

  function getDetailActionsContainer() {
    var meta = document.getElementById('nd-meta');
    var container = document.getElementById('nd-actions');

    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.id = 'nd-actions';
    container.style.padding = '0 16px 12px';

    if (meta && meta.parentNode) {
      meta.parentNode.insertBefore(container, meta.nextSibling);
    }

    return container;
  }

  function renderLearnedAction(name) {
    var container = getDetailActionsContainer();
    var learned = isNounLearned(name);

    if (!container) return;

    container.innerHTML = '';

    var button = document.createElement('button');
    button.id = 'nd-learned-btn';
    button.className = learned ? 'learned' : '';
    button.textContent = learned ? '已学' : '标记已学';
    button.style.padding = '8px 14px';
    button.style.border = 'none';
    button.style.borderRadius = '999px';
    button.style.background = learned ? '#7EBDA6' : '#C9A96E';
    button.style.color = '#fff';
    button.style.fontSize = '13px';
    button.style.cursor = learned ? 'default' : 'pointer';
    button.onclick = function () {
      markNounLearned(name);
    };

    container.appendChild(button);
  }

  function markNounLearned(name) {
    var learned = getLearnedNouns();

    if (!learned[name]) {
      learned[name] = {
        name: name,
        learnedAt: new Date().toISOString()
      };
      setLearnedNouns(learned);
      recordLearningEvent('noun_learned', name);
      showToast('已标记「' + name + '」为已学');
    }

    renderLearnedAction(name);
    return learned[name];
  }

  function openNounDet(name) {
    var title = document.getElementById('nd-title');
    if (title) title.textContent = name;

    var d = getNoun(name);
    var text = document.getElementById('nd-text');
    if (text) text.textContent = (d && d.text) || '暂无详细解释。';

    renderMeta(d);
    renderLearnedAction(name);

    var map = document.querySelector('#noun-detail .mp');
    if (map) {
      map.textContent = d && d.map ? '🗺️ ' + d.map : '🗺️ 暂无相关地图';
    }

    var rel = document.getElementById('nd-related');
    if (rel) {
      rel.innerHTML = '';
      if (d && Array.isArray(d.related) && d.related.length) {
        d.related.forEach(function (r) {
          var button = document.createElement('button');
          button.className = 'nrtag';
          button.textContent = r;
          button.onclick = function () {
            openNounDet(r);
          };
          rel.appendChild(button);
        });
      } else {
        rel.innerHTML = '<span style="font-size:12px;color:#B5ADA5">暂无相关名词</span>';
      }
    }

    var detail = document.getElementById('noun-detail');
    if (detail) detail.classList.add('act');
  }

  function closeNounDet() {
    var detail = document.getElementById('noun-detail');
    if (detail) detail.classList.remove('act');
  }

  function toggleNounFavorite(name) {
    var list = getFavoriteNouns();
    var index = list.indexOf(name);
    var added;

    if (index === -1) {
      list.push(name);
      added = true;
    } else {
      list.splice(index, 1);
      added = false;
    }

    setFavoriteNouns(list);
    return added;
  }

  function updateFavoriteButton(btn, name) {
    if (!btn) return;

    if (isNounFavorite(name)) {
      btn.classList.add('faved');
      btn.textContent = '★';
    } else {
      btn.classList.remove('faved');
      btn.textContent = '☆';
    }
  }

  function togNounFav(btn, name) {
    var added = toggleNounFavorite(name);
    updateFavoriteButton(btn, name);

    if (added) {
      showToast('已收藏「' + name + '」');
    } else {
      showToast('已取消收藏「' + name + '」');
    }
  }

  function shareNoun(name) {
    if (navigator.share) {
      navigator.share({
        title: '学的是史 - ' + name,
        text: '来「学的是史」查看「' + name + '」的详细解释！',
        url: location.href
      }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText('来「学的是史」查看「' + name + '」的详细解释！')
        .then(function () {
          window.navigationAPI.showToast('链接已复制，快去分享给好友吧！');
        });
    }
  }

  function searchNouns() {
    var input = document.getElementById('noun-search-input');
    var q = input ? input.value.trim() : '';
    renderNounCards(q);
  }

  window.nounAPI = {
    setNounData: setNounData,
    getNoun: getNoun,
    getNounNames: getNounNames,
    renderNounCards: renderNounCards,
    getFavoriteNouns: getFavoriteNouns,
    toggleNounFavorite: toggleNounFavorite,
    isNounFavorite: isNounFavorite,
    getLearnedNouns: getLearnedNouns,
    markNounLearned: markNounLearned,
    isNounLearned: isNounLearned,
    openNounDet: openNounDet,
    closeNounDet: closeNounDet,
    togNounFav: togNounFav,
    shareNoun: shareNoun,
    searchNouns: searchNouns
  };
})();
