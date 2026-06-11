(function () {
  function isValidUrl(url) {
    return typeof url === 'string' && url.trim() !== '';
  }

  function open(url) {
    if (!isValidUrl(url)) {
      return false;
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    } catch (error) {
      console.error('externalLinkAdapter.open failed:', url, error);
      return false;
    }
  }

  window.externalLinkAPI = {
    open: open
  };
})();
