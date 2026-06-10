import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

beforeEach(() => {
  vi.resetModules();
  vi.useRealTimers();
  resetGlobals();
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

describe('ai assistant hardening', () => {
  test('escapes user input before appending chat bubble HTML', async () => {
    mountDOM(`
      <div id="ai-panel"></div>
      <div id="ai-body"></div>
      <input id="ai-input" />
      <button id="ai-fab"></button>
    `);
    vi.useFakeTimers();
    await import('../src/js/ai-assistant.js');

    document.getElementById('ai-input').value = '<img src=x onerror=alert(1)>';
    window.aiAssistantAPI.aiSend();
    vi.runAllTimers();

    expect(document.getElementById('ai-body').querySelector('img')).toBeNull();
    expect(document.getElementById('ai-body').textContent).toContain('<img src=x onerror=alert(1)>');
  });
});

describe('noun related item hardening', () => {
  test('renders related nouns without injecting raw HTML into buttons', async () => {
    mountDOM(`
      <div id="nd-title"></div>
      <div id="nd-text"></div>
      <div id="nd-related"></div>
      <div id="noun-detail"></div>
    `);
    await import('../src/js/noun.js');

    window.nounAPI.setNounData({
      test: {
        text: '说明',
        related: ['<b>危险词</b>', '秦始皇']
      }
    });

    window.nounAPI.openNounDet('test');

    expect(document.getElementById('nd-related').innerHTML).toContain('&lt;b&gt;危险词&lt;/b&gt;');
    expect(document.getElementById('nd-related').innerHTML).not.toContain('<b>危险词</b>');
  });
});

describe('favorites and film rendering hardening', () => {
  test('escapes stored favorite fields and film JSON fields before innerHTML rendering', async () => {
    mountDOM(`
      <div id="fav-list"></div>
      <div id="film-page">
        <div class="fg2">
          <button class="dtab act" id="filter-all">全部</button>
        </div>
        <div id="film-grid"></div>
        <div id="film-rank">
          <button class="rnkt act" id="rank-film">影视榜</button>
          <div id="rnk-list"></div>
        </div>
        <div id="watchlist-panel">
          <button class="wltab act" id="wl-want">待看</button>
          <div id="wl-list"></div>
        </div>
      </div>
    `);

    window.storageAPI = {
      getStoredJSON(key, fallbackValue) {
        if (key === 'xds_favorites') {
          return [{
            id: 'fav-1\');alert(1);//',
            title: '<img src=x onerror=alert(1)>',
            subtitle: '<b>副标题</b>',
            icon: '<svg>'
          }];
        }
        if (key === 'xds_watchlist') {
          return { want: [{ id: 'film-1' }], watching: [], watched: [] };
        }
        return fallbackValue;
      },
      setStoredJSON() {
        return true;
      }
    };
    window.navigationAPI = { showToast: vi.fn() };

    await import('../src/js/favorites.js');
    await import('../src/js/film.js');

    window.favoritesAPI.renderFavorites();

    expect(document.getElementById('fav-list').querySelector('img')).toBeNull();
    expect(document.getElementById('fav-list').textContent).toContain('<img src=x onerror=alert(1)>');

    window.filmAPI.setFilms([{
      id: 'film-1',
      type: 'film',
      title: '<img src=x onerror=1>',
      creator: '<b>导演</b>',
      year: '2024',
      rating: '9.0',
      ratingCount: '<i>1人评</i>',
      description: '<script>bad()</script>',
      tags: ['<b>tag</b>'],
      coverStyle: 'linear-gradient(135deg,#1A1A2E,#16213E)',
      badge: '<b>影视</b>',
      icon: '<svg>'
    }]);
    window.filmAPI.setRankings({
      book: [{ id: 'film-1', title: '<b>榜单片名</b>', subtitle: '<i>副标题</i>', score: '9.3', rank: 1, icon: '<svg>' }],
      film: [],
      doc: []
    });
    window.filmAPI.initializeFilmModule();

    expect(document.getElementById('film-grid').querySelector('img')).toBeNull();
    expect(document.getElementById('film-grid').textContent).toContain('<img src=x onerror=1>');
    expect(document.getElementById('rnk-list').textContent).toContain('<b>榜单片名</b>');
    expect(document.getElementById('film-grid').querySelector('script')).toBeNull();
  });
});

describe('timeline rendering hardening', () => {
  test('escapes timeline event fields before injecting SVG and list HTML', async () => {
    mountDOM(`
      <div id="coord-chart"></div>
      <div id="event-list"></div>
    `);
    window.openFeatDet = vi.fn();
    window.showToast = vi.fn();
    await import('../src/js/timeline.js');

    window.timelineAPI.setTimelineEvents([
      {
        name: '<script>alert(1)</script>',
        year: '<b>前221</b>',
        description: '<img src=x onerror=1>',
        x: 100,
        pol: 100,
        eco: 160,
        cul: 220,
        conn: { next: '<i>汉</i>', pol: '影响', eco: '影响', cul: '影响' }
      }
    ]);

    window.timelineAPI.renderTimeline();
    window.timelineAPI.renderEventList();

    expect(document.getElementById('coord-chart').querySelector('script')).toBeNull();
    expect(document.getElementById('coord-chart').textContent).toContain('<script>alert(1)</script>');
    expect(document.getElementById('event-list').querySelector('img')).toBeNull();
    expect(document.getElementById('event-list').textContent).toContain('<img src=x onerror=1>');
  });
});
