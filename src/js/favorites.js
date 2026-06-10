(function () {
  var FAV_KEY = 'xds_favorites';

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

  function getFavorites() {
    return window.storageAPI ? window.storageAPI.getStoredJSON(FAV_KEY, []) : [];
  }

  function setFavorites(list) {
    if (window.storageAPI) window.storageAPI.setStoredJSON(FAV_KEY, list);
  }

  function addFavorite(item) {
    var list = getFavorites();
    var exists = list.some(function (f) { return f.id === item.id; });
    if (!exists) {
      list.push(item);
      setFavorites(list);
    }
  }

  function removeFavoriteById(id) {
    var list = getFavorites().filter(function (f) { return f.id !== id; });
    setFavorites(list);
    return list;
  }

  function renderFavorites() {
    var container = document.getElementById('fav-list');
    if (!container) return;
    var list = getFavorites();
    if (!list.length) {
      container.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5;font-size:13px">暂无收藏内容</div>';
      return;
    }
    var html = '';
    list.forEach(function (item) {
      html += '<div class="wlitem">' +
        '<div class="wlthumb">' + escapeHtml(item.icon || '📖') + '</div>' +
        '<div class="wlinfo"><h5>' + escapeHtml(item.title || '') + '</h5><p>' + escapeHtml(item.subtitle || '') + '</p></div>' +
        '<button class="wldel" data-favorite-id="' + escapeHtml(item.id || '') + '">×</button>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.wldel').forEach(function (button) {
      button.onclick = function () {
        removeFav(button.getAttribute('data-favorite-id'));
      };
    });
  }

  function removeFav(id) {
    removeFavoriteById(id);
    renderFavorites();
    if (window.navigationAPI) window.navigationAPI.showToast('已移除收藏项');
  }

  window.favoritesAPI = {
    getFavorites: getFavorites,
    setFavorites: setFavorites,
    addFavorite: addFavorite,
    removeFavoriteById: removeFavoriteById,
    renderFavorites: renderFavorites,
    removeFav: removeFav
  };
})();
