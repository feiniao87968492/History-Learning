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

  function getAudioAPI() {
    return window.audioAPI || null;
  }

  function getCurrentPodcastDuration() {
    var d = podcastData[curPodcast];
    return d && d.dur ? d.dur : 0;
  }

  function setPodcasts(list) {
    podcastData = Array.isArray(list) ? list : [];
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60), ss = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
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

  function onAudioError() {
    isPlaying = false;
    hasAudioSource = false;
    var playButton = document.getElementById('pl-playbtn');
    if (playButton) playButton.textContent = '▶';
    clearInterval(plTimer);
    if (window.navigationAPI && window.navigationAPI.showToast) {
      window.navigationAPI.showToast('音频加载失败，请稍后重试');
    }
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
    if (!d) return;
    curPodcast = idx;
    plCur = 0;
    isPlaying = false;
    hasAudioSource = false;
    bindAudioEvents();
    document.getElementById('pl-icon').textContent = d.icon;
    document.getElementById('pl-icon').style.background = 'linear-gradient(' + d.colors[0] + ',' + d.colors[1] + ')';
    document.getElementById('pl-title').textContent = d.title;
    document.getElementById('pl-author').textContent = d.author;
    document.getElementById('pl-dur').textContent = fmtTime(d.dur);
    document.getElementById('pl-cur').textContent = '00:00';
    document.getElementById('pl-prog').style.width = '0%';
    document.getElementById('pl-playbtn').textContent = '▶';
    if (window.audioAPI && d.audioUrl) {
      hasAudioSource = window.audioAPI.setSource(d.audioUrl);
    }
    document.getElementById('podcast-player').classList.add('act');
    startPlayProgress();
  }

  function closePlayer() {
    document.getElementById('podcast-player').classList.remove('act');
    isPlaying = false;
    clearInterval(plTimer);
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('pl-playbtn').textContent = isPlaying ? '⏸️' : '▶';

    if (hasAudioSource && window.audioAPI) {
      if (isPlaying) {
        window.audioAPI.play();
      } else {
        window.audioAPI.pause();
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

  function setTimer(n) {
    clearTimeout(timerID);
    if (n > 0) {
      timerID = setTimeout(function () { closePlayer(); window.showToast('定时关闭已触发'); }, n * 60000);
      window.showToast('将在' + n + '分钟后关闭播放');
    } else {
      window.showToast('已取消定时关闭');
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
    filterPodcast: filterPodcast,
    openPlayer: openPlayer,
    closePlayer: closePlayer,
    togglePlay: togglePlay,
    startPlayProgress: startPlayProgress,
    seekPodcast: seekPodcast,
    setTimer: setTimer,
    showTimer: showTimer,
    prevPodcast: prevPodcast,
    nextPodcast: nextPodcast
  };
})();
