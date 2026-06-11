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
      return audio.play();
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

  function isPaused() {
    return audio.paused;
  }

  window.audioAPI = {
    setSource: setSource,
    play: play,
    pause: pause,
    seek: seek,
    onTimeUpdate: onTimeUpdate,
    onEnded: onEnded,
    onError: onError,
    getCurrentTime: getCurrentTime,
    getDuration: getDuration,
    isPaused: isPaused
  };
})();
