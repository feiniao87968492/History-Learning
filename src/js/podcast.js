(function () {
  var podcastData = [];
  var curPodcast = 0;
  var isPlaying = false;
  var plTimer = null;
  var plCur = 0;
  var plSpeed = 1.0;
  var timerID = null;
  var hasAudioSource = false;
  var audioEventsBound = false;
  var SPEEDS = [1.0, 1.25, 1.5, 2.0];

  function getAudioAPI() {
    return window.audioAPI || null;
  }

  function getCurrentPodcastDuration() {
    var d = podcastData[curPodcast];
    return d && d.dur ? d.dur : 0;
  }

  function setPodcasts(list) {
    podcastData = Array.isArray(list) ? list : [];
    renderPodcastList();
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
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeColor(value, fallbackValue) {
    var text = value == null ? '' : String(value);
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text) || /^(rgb|rgba|hsl|hsla)\(/.test(text)) {
      return text;
    }
    return fallbackValue;
  }

  function showToast(message) {
    if (window.navigationAPI && typeof window.navigationAPI.showToast === 'function') {
      window.navigationAPI.showToast(message);
    } else if (typeof window.showToast === 'function') {
      window.showToast(message);
    }
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60), ss = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  function renderPodcastList() {
    var list = document.getElementById('podcast-list');
    if (!list) return;

    if (!podcastData.length) {
      list.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无播客内容</div>';
      return;
    }

    list.innerHTML = podcastData.map(function (item, index) {
      var colors = Array.isArray(item.colors) ? item.colors : [];
      var colorA = sanitizeColor(colors[0], '#5A3E1B');
      var colorB = sanitizeColor(colors[1], '#8B6914');
      var label = item.categoryLabel || item.category || '';
      var info = [label, fmtTime(item.dur || 0), item.listens].filter(Boolean).map(escapeHtml).join(' · ');

      return '<div class="pccard" data-podcast-id="' + escapeHtml(item.id || '') + '" data-cat="' + escapeHtml(item.category || '') + '">' +
        '<div class="pcicon" style="background:linear-gradient(135deg,' + colorA + ',' + colorB + ')">' + escapeHtml(item.icon || '') + '</div>' +
        '<div class="pctxt"><h4>' + escapeHtml(item.title || '') + '</h4><div class="pcinfo">' + info + '</div></div>' +
        '<div class="pcplay">▶</div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('.pccard').forEach(function (card, index) {
      card.onclick = function () {
        openPlayer(index);
      };
    });
  }

  function filterPodcast(cat, btn) {
    document.querySelectorAll('#podcast-tabs .pctab').forEach(function (t) { t.classList.remove('act'); });
    if (btn) btn.classList.add('act');
    document.querySelectorAll('#podcast-list .pccard').forEach(function (c) {
      c.style.display = (cat === 'all' || c.dataset.cat === cat) ? 'flex' : 'none';
    });
  }

  function updateAudioProgress() {
    var audio = getAudioAPI();
    if (!audio || !hasAudioSource) return;

    var current = typeof audio.getCurrentTime === 'function' ? Math.floor(audio.getCurrentTime()) : plCur;
    var duration = typeof audio.getDuration === 'function' ? Math.floor(audio.getDuration()) : getCurrentPodcastDuration();
    if (!duration) {
      duration = getCurrentPodcastDuration();
    }

    plCur = current;
    var pct = duration ? Math.min(100, current / duration * 100) : 0;
    var prog = document.getElementById('pl-prog');
    var cur = document.getElementById('pl-cur');
    if (prog) prog.style.width = pct + '%';
    if (cur) cur.textContent = fmtTime(current);
  }

  function onAudioEnded() {
    isPlaying = false;
    hasAudioSource = false;
    var playButton = document.getElementById('pl-playbtn');
    if (playButton) playButton.textContent = '▶';
    clearInterval(plTimer);
  }

  function resetPlayingState() {
    isPlaying = false;
    var playButton = document.getElementById('pl-playbtn');
    if (playButton) playButton.textContent = '▶';
    clearInterval(plTimer);
  }

  function pauseAudioIfNeeded() {
    var audio = getAudioAPI();
    if (audio && hasAudioSource && typeof audio.pause === 'function') {
      audio.pause();
    }
  }

  function onAudioError() {
    resetPlayingState();
    hasAudioSource = false;
    showToast('音频加载失败，请稍后重试');
  }

  function bindAudioEvents() {
    var audio = getAudioAPI();
    if (!audio || audioEventsBound) return;

    if (typeof audio.onTimeUpdate === 'function') audio.onTimeUpdate(updateAudioProgress);
    if (typeof audio.onEnded === 'function') audio.onEnded(onAudioEnded);
    if (typeof audio.onError === 'function') audio.onError(onAudioError);
    audioEventsBound = true;
  }

  function openPlayer(idx) {
    var d = podcastData[idx];
    var audio;
    if (!d) return;
    pauseAudioIfNeeded();
    curPodcast = idx;
    plCur = 0;
    resetPlayingState();
    hasAudioSource = false;
    bindAudioEvents();
    var colors = Array.isArray(d.colors) ? d.colors : [];
    document.getElementById('pl-icon').textContent = d.icon;
    document.getElementById('pl-icon').style.background = 'linear-gradient(' + sanitizeColor(colors[0], '#5A3E1B') + ',' + sanitizeColor(colors[1], '#8B6914') + ')';
    document.getElementById('pl-title').textContent = d.title;
    document.getElementById('pl-author').textContent = d.author;
    document.getElementById('pl-dur').textContent = fmtTime(d.dur);
    document.getElementById('pl-cur').textContent = '00:00';
    document.getElementById('pl-prog').style.width = '0%';
    document.getElementById('pl-playbtn').textContent = '▶';
    audio = getAudioAPI();
    if (audio && d.audioUrl) {
      hasAudioSource = audio.setSource(d.audioUrl);
      if (hasAudioSource && typeof audio.setPlaybackRate === 'function') {
        audio.setPlaybackRate(plSpeed);
      }
      if (!hasAudioSource) {
        onAudioError();
      }
    }
    document.getElementById('podcast-player').classList.add('act');
    startPlayProgress();
  }

  function closePlayer() {
    pauseAudioIfNeeded();
    document.getElementById('podcast-player').classList.remove('act');
    resetPlayingState();
  }

  function handlePlayRejected() {
    pauseAudioIfNeeded();
    resetPlayingState();
    showToast('音频加载失败，请稍后重试');
  }

  function togglePlay() {
    var audio = getAudioAPI();
    var playResult;
    isPlaying = !isPlaying;
    document.getElementById('pl-playbtn').textContent = isPlaying ? '⏸️' : '▶';

    if (hasAudioSource && audio) {
      if (isPlaying) {
        playResult = audio.play();
        if (playResult === false) {
          handlePlayRejected();
          return;
        }
        if (playResult && typeof playResult.then === 'function') {
          playResult.then(function (value) {
            if (value === false) {
              handlePlayRejected();
            }
          }, handlePlayRejected);
        }
      } else {
        audio.pause();
      }
      return;
    }

    if (isPlaying) startPlayProgress();
    else clearInterval(plTimer);
  }

  function startPlayProgress() {
    clearInterval(plTimer);
    if (!isPlaying) return;
    plTimer = setInterval(function () {
      plCur += 1;
      var d = podcastData[curPodcast];
      if (!d) return;
      var pct = Math.min(100, plCur / d.dur * 100);
      document.getElementById('pl-prog').style.width = pct + '%';
      document.getElementById('pl-cur').textContent = fmtTime(plCur);
      if (plCur >= d.dur) {
        isPlaying = false;
        document.getElementById('pl-playbtn').textContent = '▶';
        clearInterval(plTimer);
      }
    }, 1000 / plSpeed);
  }

  function seekPodcast(e) {
    var bar = document.getElementById('pl-bar'), r = bar.getBoundingClientRect();
    var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    plCur = Math.floor(pct * podcastData[curPodcast].dur);
    if (hasAudioSource && window.audioAPI) {
      window.audioAPI.seek(plCur);
    }
    document.getElementById('pl-prog').style.width = (pct * 100) + '%';
    document.getElementById('pl-cur').textContent = fmtTime(plCur);
  }

  function toggleSpeed() {
    var index = SPEEDS.indexOf(plSpeed);
    var audio = getAudioAPI();
    plSpeed = SPEEDS[(index + 1) % SPEEDS.length];
    var speedButton = document.getElementById('pl-speed');
    if (speedButton) {
      speedButton.textContent = plSpeed.toFixed(plSpeed % 1 === 0 ? 1 : 2).replace(/0$/, '') + 'x';
    }
    if (audio && hasAudioSource && typeof audio.setPlaybackRate === 'function') {
      audio.setPlaybackRate(plSpeed);
    }
    if (isPlaying && !hasAudioSource) {
      startPlayProgress();
    }
    return plSpeed;
  }

  function setTimer(n) {
    clearTimeout(timerID);
    if (n > 0) {
      timerID = setTimeout(function () { closePlayer(); showToast('定时关闭已触发'); }, n * 60000);
      showToast('将在' + n + '分钟后关闭播放');
    } else {
      showToast('已取消定时关闭');
    }
    document.getElementById('pl-timer').style.display = 'none';
  }

  function showTimer() { document.getElementById('pl-timer').style.display = 'block'; }

  function prevPodcast() { openPlayer(Math.max(0, curPodcast - 1)); }

  function nextPodcast() { openPlayer(Math.min(podcastData.length - 1, curPodcast + 1)); }

  bindAudioEvents();

  window.podcastAPI = {
    setPodcasts: setPodcasts,
    fmtTime: fmtTime,
    renderPodcastList: renderPodcastList,
    filterPodcast: filterPodcast,
    openPlayer: openPlayer,
    closePlayer: closePlayer,
    togglePlay: togglePlay,
    startPlayProgress: startPlayProgress,
    seekPodcast: seekPodcast,
    toggleSpeed: toggleSpeed,
    setTimer: setTimer,
    showTimer: showTimer,
    prevPodcast: prevPodcast,
    nextPodcast: nextPodcast
  };
})();
