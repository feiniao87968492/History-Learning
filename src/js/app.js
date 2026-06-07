(function () {
  function exposeGlobals() {
    if (window.storageAPI) {
      window.getStoredJSON = window.storageAPI.getStoredJSON;
      window.setStoredJSON = window.storageAPI.setStoredJSON;
      window.getStoredString = window.storageAPI.getStoredString;
      window.setStoredString = window.storageAPI.setStoredString;
    }

    if (window.navigationAPI) {
      window.resetAIFab = window.navigationAPI.resetAIFab;
      window.showToast = window.navigationAPI.showToast;
      window.login = window.navigationAPI.login;
      window.openSub = window.navigationAPI.openSub;
      window.closeSub = window.navigationAPI.closeSub;
    }

    if (window.nounAPI) {
      window.openNounDet = window.nounAPI.openNounDet;
      window.closeNounDet = window.nounAPI.closeNounDet;
      window.togNounFav = window.nounAPI.togNounFav;
      window.shareNoun = window.nounAPI.shareNoun;
      window.searchNouns = window.nounAPI.searchNouns;
    }

    if (window.favoritesAPI) {
      window.renderFavorites = window.favoritesAPI.renderFavorites;
    }

    if (window.timelineAPI) {
      window.selDyn = window.timelineAPI.selDyn;
      window.prevDyn = window.timelineAPI.prevDyn;
      window.nextDyn = window.timelineAPI.nextDyn;
      window.showTimelineDetail = window.timelineAPI.showTimelineDetail;
      window.showTimelineConn = window.timelineAPI.showTimelineConn;
      window.renderTimeline = window.timelineAPI.renderTimeline;
      window.renderEventList = window.timelineAPI.renderEventList;
      window.zoomTL = window.timelineAPI.zoomTL;
    }
  }

  async function loadJSON(path, fallback) {
    try {
      var response = await fetch(path);
      if (!response.ok) {
        throw new Error('Failed to load data: ' + path);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return fallback;
    }
  }

  async function initializeData() {
    var nouns = await loadJSON('./src/data/nouns.json', {});
    if (window.nounAPI) window.nounAPI.setNounData(nouns);

    var timeline = await loadJSON('./src/data/timeline.json', { dynasties: [], events: [] });
    if (window.timelineAPI) {
      window.timelineAPI.setDynasties(timeline.dynasties);
      window.timelineAPI.setTimelineEvents(timeline.events);
      try { window.timelineAPI.renderTimeline(); } catch (e) { console.error('renderTimeline err:', e); }
      try { window.timelineAPI.renderEventList(); } catch (e) { console.error('renderEventList err:', e); }
    }
  }

  function registerGlobalErrorToast() {
    window.onerror = function (msg) {
      var message = 'JS错误:' + String(msg).slice(0, 40);

      if (window.navigationAPI && window.navigationAPI.showToast) {
        window.navigationAPI.showToast(message);
      } else {
        var toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = message;
          toast.classList.add('sh');
          setTimeout(function () {
            toast.classList.remove('sh');
          }, 4000);
        }
      }

      return false;
    };
  }

  function initializeApp() {
    registerGlobalErrorToast();
    exposeGlobals();
    initializeData().catch(function (err) {
      console.error('Data initialization failed:', err);
    });
  }

  initializeApp();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  }
})();
