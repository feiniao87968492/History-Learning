(function () {
  function getStoredJSON(key, fallbackValue) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
      console.error('getStoredJSON failed:', key, error);
      return fallbackValue;
    }
  }

  function setStoredJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('setStoredJSON failed:', key, error);
      return false;
    }
  }

  function getStoredString(key, fallbackValue) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallbackValue : value;
    } catch (error) {
      console.error('getStoredString failed:', key, error);
      return fallbackValue;
    }
  }

  function setStoredString(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('setStoredString failed:', key, error);
      return false;
    }
  }

  window.storageAPI = {
    getStoredJSON: getStoredJSON,
    setStoredJSON: setStoredJSON,
    getStoredString: getStoredString,
    setStoredString: setStoredString
  };
})();
