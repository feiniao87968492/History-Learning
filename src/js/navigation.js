(function () {
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

  function login() {
    var loginPage = document.getElementById('login-page');
    var homePage = document.getElementById('home-page');
    var aiFab = document.getElementById('ai-fab');
    var bottomNav = document.getElementById('bnav');

    if (loginPage) {
      loginPage.classList.remove('active');
    }
    if (homePage) {
      homePage.classList.add('active');
    }
    if (aiFab) {
      aiFab.classList.add('sh');
    }
    if (bottomNav) {
      bottomNav.style.display = 'flex';
    }

    resetAIFab();
    showToast('欢迎回来，历史学习者！');
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
    login: login,
    openSub: openSub,
    closeSub: closeSub
  };
})();
