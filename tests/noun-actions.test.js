import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountNounDOM() {
  mountDOM(`
    <input id="noun-search-input" />
    <div class="nc" id="noun-grid"></div>
    <div id="noun-detail" class="nd">
      <h2 id="nd-title"></h2>
      <div id="nd-meta"></div>
      <p id="nd-text"></p>
      <div class="mp"></div>
      <div id="nd-related"></div>
    </div>
    <div id="toast"></div>
  `);
}

const NOUNS = {
  '郡县制': {
    text: '秦统一后在全国推行郡县制，地方长官由中央任免，行政权力不再世袭。',
    related: ['分封制', '商鞅变法'],
    dynasty: '秦朝',
    category: '制度',
    map: '秦统一后的郡县分布示意',
    year: '前221年'
  },
  '科举制': {
    text: '科举制是隋唐以后通过考试选拔官员的制度。',
    related: ['三省六部制', '军机处'],
    dynasty: '隋唐',
    category: '制度',
    map: '唐代贡举入京路线示意',
    year: '605年'
  }
};

function createStorageMock(initial) {
  var store = initial || {};

  return {
    getStoredJSON: vi.fn(function (key, fallbackValue) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallbackValue;
    }),
    setStoredJSON: vi.fn(function (key, value) {
      store[key] = value;
      return true;
    }),
    getStore: function () {
      return store;
    }
  };
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  mountNounDOM();
  window.navigationAPI = { showToast: vi.fn() };
  window.storageAPI = createStorageMock();
  window.htmlUtils = {
    escapeHtml(value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };
});

describe('noun favorite actions', () => {
  test('togNounFav stores a favorite noun and updates the clicked button', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    var button = document.querySelector('#noun-grid .nfav');
    window.nounAPI.togNounFav(button, '郡县制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_favorites', ['郡县制']);
    expect(button.classList.contains('faved')).toBe(true);
    expect(button.textContent).toBe('★');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('已收藏「郡县制」');
  });

  test('togNounFav removes an existing favorite noun', async () => {
    window.storageAPI = createStorageMock({ xds_favorites: ['郡县制'] });
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    var button = document.querySelector('#noun-grid .nfav');
    window.nounAPI.togNounFav(button, '郡县制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_favorites', []);
    expect(button.classList.contains('faved')).toBe(false);
    expect(button.textContent).toBe('☆');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('已取消收藏「郡县制」');
  });

  test('renderNounCards restores favorite star state from storage', async () => {
    window.storageAPI = createStorageMock({ xds_favorites: ['科举制'] });
    await import('../src/js/noun.js');

    window.nounAPI.setNounData(NOUNS);

    var buttons = document.querySelectorAll('#noun-grid .nfav');
    expect(buttons[0].textContent).toBe('☆');
    expect(buttons[0].classList.contains('faved')).toBe(false);
    expect(buttons[1].textContent).toBe('★');
    expect(buttons[1].classList.contains('faved')).toBe(true);
  });
});

describe('noun learned actions', () => {
  test('openNounDet renders a mark learned button for unlearned nouns', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    window.nounAPI.openNounDet('郡县制');

    var button = document.getElementById('nd-learned-btn');
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('标记已学');
    expect(button.classList.contains('learned')).toBe(false);
  });

  test('markNounLearned stores learned record with timestamp and updates detail button', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));

    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);
    window.nounAPI.openNounDet('郡县制');

    window.nounAPI.markNounLearned('郡县制');

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_learned', {
      '郡县制': {
        name: '郡县制',
        learnedAt: '2026-06-11T12:00:00.000Z'
      }
    });
    expect(document.getElementById('nd-learned-btn').textContent).toBe('已学');
    expect(document.getElementById('nd-learned-btn').classList.contains('learned')).toBe(true);
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('已标记「郡县制」为已学');

    vi.useRealTimers();
  });

  test('openNounDet restores learned button state from storage', async () => {
    window.storageAPI = createStorageMock({
      xds_learned: {
        '科举制': {
          name: '科举制',
          learnedAt: '2026-06-11T12:00:00.000Z'
        }
      }
    });
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    window.nounAPI.openNounDet('科举制');

    var button = document.getElementById('nd-learned-btn');
    expect(button.textContent).toBe('已学');
    expect(button.classList.contains('learned')).toBe(true);
  });

  test('noun action APIs do not throw when storageAPI is unavailable', async () => {
    delete window.storageAPI;
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    expect(function () {
      window.nounAPI.toggleNounFavorite('郡县制');
      window.nounAPI.markNounLearned('郡县制');
      window.nounAPI.renderNounCards();
      window.nounAPI.openNounDet('郡县制');
    }).not.toThrow();

    expect(window.nounAPI.getFavoriteNouns()).toEqual([]);
    expect(window.nounAPI.getLearnedNouns()).toEqual({});
  });
});
