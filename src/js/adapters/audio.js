(function () {
  var audio = new window.Audio();

  function setSource(src) {
    try {
      audio.src = src || '';
      if (typeof audio.load === 'function') {
        audio.load();
      }
      return true;
    } catch (error) {
      console.error('audioAdapter.setSource failed:', error);
      return false;
    }
  }

  function play() {
    try {
      var playResult = audio.play();
      if (playResult && typeof playResult.then === 'function') {
        return playResult.then(function () {
          return true;
        }, function (error) {
          console.error('audioAdapter.play failed:', error);
          return false;
        });
      }
      return playResult;
    } catch (error) {
      console.error('audioAdapter.play failed:', error);
      return false;
    }
  }

  function pause() {
    try {
      audio.pause();
      return true;
    } catch (error) {
      console.error('audioAdapter.pause failed:', error);
      return false;
    }
  }

  function seek(seconds) {
    try {
      var nextTime = Number(seconds);
      if (!isFinite(nextTime) || nextTime < 0) {
        nextTime = 0;
      }
      audio.currentTime = nextTime;
      return true;
    } catch (error) {
      console.error('audioAdapter.seek failed:', error);
      return false;
    }
  }

  function setPlaybackRate(rate) {
    try {
      var nextRate = Number(rate);
      if (!isFinite(nextRate) || nextRate <= 0) {
        nextRate = 1;
      }
      audio.playbackRate = nextRate;
      return true;
    } catch (error) {
      console.error('audioAdapter.setPlaybackRate failed:', error);
      return false;
    }
  }

  function addAudioListener(eventName, handler) {
    if (typeof handler !== 'function') {
      return false;
    }

    try {
      audio.addEventListener(eventName, handler);
      return true;
    } catch (error) {
      console.error('audioAdapter.addEventListener failed:', eventName, error);
      return false;
    }
  }

  function onTimeUpdate(handler) {
    return addAudioListener('timeupdate', handler);
  }

  function onEnded(handler) {
    return addAudioListener('ended', handler);
  }

  function onError(handler) {
    return addAudioListener('error', handler);
  }

  function getCurrentTime() {
    return audio.currentTime || 0;
  }

  function getDuration() {
    return audio.duration || 0;
  }

  function getPlaybackRate() {
    return audio.playbackRate || 1;
  }

  function isPaused() {
    return audio.paused;
  }

  window.audioAPI = {
    setSource: setSource,
    play: play,
    pause: pause,
    seek: seek,
    setPlaybackRate: setPlaybackRate,
    onTimeUpdate: onTimeUpdate,
    onEnded: onEnded,
    onError: onError,
    getCurrentTime: getCurrentTime,
    getDuration: getDuration,
    getPlaybackRate: getPlaybackRate,
    isPaused: isPaused
  };
})();
