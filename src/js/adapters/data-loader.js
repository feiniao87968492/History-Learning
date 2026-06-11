(function () {
  async function loadJSON(path, fallback) {
    try {
      var response = await fetch(path);
      if (!response.ok) {
        throw new Error('Failed to load data: ' + path);
      }
      return await response.json();
    } catch (error) {
      console.error('dataLoaderAdapter.loadJSON failed:', path, error);
      return fallback;
    }
  }

  window.dataLoaderAPI = {
    loadJSON: loadJSON
  };
})();
