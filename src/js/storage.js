(function () {
  if (window.storageAPI) {
    return;
  }

  function getStoredJSON(key, fallbackValue) {
    try {
      var raw = window['localStorage'].getItem(key);
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
      console.error('getStoredJSON failed:', key, error);
      return fallbackValue;
    }
  }

  function setStoredJSON(key, value) {
    try {
      window['localStorage'].setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('setStoredJSON failed:', key, error);
      return false;
    }
  }

  function getStoredString(key, fallbackValue) {
    try {
      var value = window['localStorage'].getItem(key);
      return value === null ? fallbackValue : value;
    } catch (error) {
      console.error('getStoredString failed:', key, error);
      return fallbackValue;
    }
  }

  function setStoredString(key, value) {
    try {
      window['localStorage'].setItem(key, value);
      return true;
    } catch (error) {
      console.error('setStoredString failed:', key, error);
      return false;
    }
  }

  function removeStoredItem(key) {
    try {
      window['localStorage'].removeItem(key);
      return true;
    } catch (error) {
      console.error('removeStoredItem failed:', key, error);
      return false;
    }
  }

  window.storageAPI = {
    getStoredJSON: getStoredJSON,
    setStoredJSON: setStoredJSON,
    getStoredString: getStoredString,
    setStoredString: setStoredString,
    removeStoredItem: removeStoredItem,
    removeItem: removeStoredItem
  };
})();
