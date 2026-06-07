(function () {
  var nounData = {};

  function setNounData(data) {
    nounData = data && typeof data === 'object' ? data : {};
  }

  function getNoun(name) {
    return nounData[name] || null;
  }

  function openNounDet(name) {
    document.getElementById('nd-title').textContent = name;
    var d = getNoun(name);
    document.getElementById('nd-text').textContent = (d && d.text) || '暂无详细解释。';
    var rel = document.getElementById('nd-related');
    rel.innerHTML = '';
    if (d && Array.isArray(d.related) && d.related.length) {
      d.related.forEach(function (r) {
        rel.innerHTML += '<button class="nrtag" onclick="openNounDet(\'' + r + '\')">' + r + '</button>';
      });
    } else {
      rel.innerHTML = '<span style="font-size:12px;color:#B5ADA5">暂无相关名词</span>';
    }
    document.getElementById('noun-detail').classList.add('act');
  }

  function closeNounDet() {
    document.getElementById('noun-detail').classList.remove('act');
  }

  function togNounFav(btn, name) {
    btn.classList.toggle('faved');
    if (btn.classList.contains('faved')) {
      btn.textContent = '★';
      window.navigationAPI.showToast('已收藏「' + name + '」');
    } else {
      btn.textContent = '☆';
      window.navigationAPI.showToast('已取消收藏「' + name + '」');
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
    var q = document.getElementById('noun-search-input').value.trim().toLowerCase();
    var grid = document.getElementById('noun-grid');
    if (!grid) return;
    var cards = grid.querySelectorAll('.ncard');
    cards.forEach(function (c) {
      var name = c.querySelector('h4').textContent;
      var desc = c.querySelector('p').textContent;
      var matched = !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      c.style.display = matched ? 'block' : 'none';
    });
  }

  window.nounAPI = {
    setNounData: setNounData,
    getNoun: getNoun,
    openNounDet: openNounDet,
    closeNounDet: closeNounDet,
    togNounFav: togNounFav,
    shareNoun: shareNoun,
    searchNouns: searchNouns
  };
})();
