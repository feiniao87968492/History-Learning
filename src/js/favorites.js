(function () {
  var FAV_KEY = 'xds_favorites';

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
        '<div class="wlthumb">' + (item.icon || '📖') + '</div>' +
        '<div class="wlinfo"><h5>' + item.title + '</h5><p>' + (item.subtitle || '') + '</p></div>' +
        '<button class="wldel" onclick="window.favoritesAPI.removeFav(\'' + item.id + '\')">×</button>' +
        '</div>';
    });
    container.innerHTML = html;
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
