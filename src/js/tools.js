(function () {
  if (window.toolsAPI) {
    return;
  }

  function initToolsPage() {
    var toolsPage = document.getElementById('tools-page');
    if (!toolsPage) return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    initToolsPage();
  });

  window.toolsAPI = {
    initToolsPage: initToolsPage
  };
})();
