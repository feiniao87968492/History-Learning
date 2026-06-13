(function () {
  if (window.navigationAPI) {
    return;
  }

  var toastTimer = null;

  function resetAIFab() {
    var fab = document.getElementById('ai-fab');
    if (fab) {
      fab.style.top = 'auto';
      fab.style.left = 'auto';
      fab.style.bottom = '';
      fab.style.right = '';
    }
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.add('sh');

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(function () {
      toast.classList.remove('sh');
    }, 2000);
  }

  function openSub(id) {
    var target = document.getElementById(id);
    if (target) {
      target.classList.add('act');
    }
  }

  function closeSub(id) {
    document.querySelectorAll('.sub').forEach(function (panel) {
      panel.classList.remove('act');
    });

    if (typeof id === 'string' && id) {
      var target = document.getElementById(id);
      if (target) {
        if (!target.classList.contains('sub')) {
          document.querySelectorAll('.page').forEach(function (page) {
            page.classList.remove('active');
          });
        }
        target.classList.add(target.classList.contains('sub') ? 'act' : 'active');
      }
    }
  }

  window.navigationAPI = {
    resetAIFab: resetAIFab,
    showToast: showToast,
    openSub: openSub,
    closeSub: closeSub
  };
})();
