import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const EVENTS = [
  { id: 'qin-unify', dynasty: 'qin', name: '秦统一', year: '前221年', x: 100, pol: 350, eco: 340, cul: 310, description: '秦灭六国。', conn: { next: '文景之治', pol: '中央制度延续', eco: '统一市场', cul: '书同文' } },
  { id: 'junxian', dynasty: 'qin', name: '郡县制推行', year: '前221年后', x: 120, pol: 340, eco: 330, cul: 300, description: '地方制度定型。' },
  { id: 'wenjing', dynasty: 'han', name: '文景之治', year: '前180年', x: 160, pol: 320, eco: 300, cul: 280, description: '休养生息。', conn: { next: '贞观之治', pol: '治国经验', eco: '轻徭薄赋', cul: '以民为本' } },
  { id: 'zhenguan', dynasty: 'suitang', name: '贞观之治', year: '627年', x: 220, pol: 250, eco: 240, cul: 210, description: '盛世治理。' }
];

function mountTimelineDOM() {
  mountDOM(`
    <div id="dynasty-tabs">
      <button class="dtab act">秦朝</button>
      <button class="dtab">汉朝</button>
      <button class="dtab">隋唐</button>
    </div>
    <div id="dynasty-features">
      <div class="df" id="feat-qin"></div>
      <div class="df" id="feat-han"></div>
      <div class="df" id="feat-suitang"></div>
    </div>
    <div id="coord-chart"></div>
    <div id="event-list"></div>
    <div id="feat-detail-overlay"><h3 id="feat-det-title"></h3><p id="feat-det-text"></p></div>
    <div id="toast"></div>
  `);
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetGlobals();
  mountTimelineDOM();
  window.showToast = vi.fn();
  window.openFeatDet = vi.fn(function (title, text) {
    document.getElementById('feat-det-title').textContent = title;
    document.getElementById('feat-det-text').textContent = text;
  });
});

describe('timeline module drag and zoom bounds', () => {
  test('zoomTL clamps zoom between -3 and 3', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);

    for (var i = 0; i < 20; i += 1) window.timelineAPI.zoomTL(1);
    expect(window.timelineAPI.getTimelineState().zoom).toBe(3);

    for (var j = 0; j < 20; j += 1) window.timelineAPI.zoomTL(-1);
    expect(window.timelineAPI.getTimelineState().zoom).toBe(-3);
  });

  test('drag handlers clamp offsets so the chart cannot disappear', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);
    window.timelineAPI.renderTimeline();

    window.timelineAPI.pointerDown({ clientX: 0, clientY: 0, preventDefault: vi.fn() });
    window.timelineAPI.pointerMove({ clientX: 9999, clientY: 9999, preventDefault: vi.fn() });
    window.timelineAPI.pointerUp();

    var state = window.timelineAPI.getTimelineState();
    expect(state.offsetX).toBeLessThanOrEqual(state.maxOffsetX);
    expect(state.offsetY).toBeLessThanOrEqual(state.maxOffsetY);

    window.timelineAPI.pointerDown({ clientX: 0, clientY: 0, preventDefault: vi.fn() });
    window.timelineAPI.pointerMove({ clientX: -9999, clientY: -9999, preventDefault: vi.fn() });
    window.timelineAPI.pointerUp();

    state = window.timelineAPI.getTimelineState();
    expect(state.offsetX).toBeGreaterThanOrEqual(state.minOffsetX);
    expect(state.offsetY).toBeGreaterThanOrEqual(state.minOffsetY);
  });

  test('touch handlers reuse bounded dragging behavior', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);
    window.timelineAPI.renderTimeline();

    window.timelineAPI.touchStart({ touches: [{ clientX: 0, clientY: 0 }] });
    window.timelineAPI.touchMove({ touches: [{ clientX: 9000, clientY: 9000 }], preventDefault: vi.fn() });
    window.timelineAPI.touchEnd();

    var state = window.timelineAPI.getTimelineState();
    expect(state.offsetX).toBeLessThanOrEqual(state.maxOffsetX);
    expect(state.offsetY).toBeLessThanOrEqual(state.maxOffsetY);
  });

  test('switching dynasty resets zoom and offsets', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setDynasties(['qin', 'han', 'suitang']);
    window.timelineAPI.setTimelineEvents(EVENTS);
    window.timelineAPI.zoomTL(1);
    window.timelineAPI.pointerDown({ clientX: 0, clientY: 0, preventDefault: vi.fn() });
    window.timelineAPI.pointerMove({ clientX: 80, clientY: 60, preventDefault: vi.fn() });
    window.timelineAPI.pointerUp();

    window.timelineAPI.selDyn('han', document.querySelectorAll('#dynasty-tabs .dtab')[1]);

    expect(window.timelineAPI.getTimelineState()).toMatchObject({ zoom: 0, offsetX: 0, offsetY: 0, currentDynasty: 'han' });
  });

  test('empty event list renders a safe empty state', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents([]);
    window.timelineAPI.renderTimeline();
    window.timelineAPI.renderEventList();

    expect(document.getElementById('coord-chart').textContent).toContain('暂无时间轴事件');
    expect(document.getElementById('event-list').textContent).toContain('暂无事件数据');
  });

  test('node and causal detail APIs open safe detail content', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);

    window.timelineAPI.showTimelineDetail(0);
    expect(window.openFeatDet).toHaveBeenCalledWith('📅 秦统一（前221年）', '秦灭六国。');

    window.timelineAPI.showTimelineConn(0, 'pol');
    expect(window.openFeatDet).toHaveBeenLastCalledWith(
      '🔗 秦统一 → 文景之治',
      expect.stringContaining('🏛️ 政治影响')
    );
  });

  test('detail APIs safely no-op for invalid indexes or missing modal API', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);

    expect(() => window.timelineAPI.showTimelineDetail(99)).not.toThrow();
    expect(() => window.timelineAPI.showTimelineConn(99, 'pol')).not.toThrow();

    delete window.openFeatDet;
    expect(() => window.timelineAPI.showTimelineDetail(0)).not.toThrow();
    expect(() => window.timelineAPI.showTimelineConn(0, 'pol')).not.toThrow();
  });

  test('filters rendered events by the selected dynasty', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setDynasties(['qin', 'han', 'suitang']);
    window.timelineAPI.setTimelineEvents(EVENTS);

    window.timelineAPI.selDyn('han', document.querySelectorAll('#dynasty-tabs .dtab')[1]);

    expect(window.timelineAPI.getTimelineState().eventCount).toBe(1);
    expect(document.getElementById('event-list').textContent).toContain('文景之治');
    expect(document.getElementById('event-list').textContent).not.toContain('秦统一');
  });

  test('prevDyn and nextDyn wrap through dynasties and reset the view', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setDynasties(['qin', 'han', 'suitang']);
    window.timelineAPI.setTimelineEvents(EVENTS);

    window.timelineAPI.zoomTL(1);
    window.timelineAPI.pointerDown({ clientX: 0, clientY: 0, preventDefault: vi.fn() });
    window.timelineAPI.pointerMove({ clientX: 80, clientY: 60, preventDefault: vi.fn() });
    window.timelineAPI.pointerUp();

    window.timelineAPI.prevDyn();
    expect(window.timelineAPI.getTimelineState()).toMatchObject({ currentDynasty: 'suitang', zoom: 0, offsetX: 0, offsetY: 0 });

    window.timelineAPI.nextDyn();
    expect(window.timelineAPI.getTimelineState()).toMatchObject({ currentDynasty: 'qin', zoom: 0, offsetX: 0, offsetY: 0 });
  });

  test('rendered nodes and causal lines use data attributes and delegated clicks', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);
    window.timelineAPI.renderTimeline();
    window.timelineAPI.renderEventList();

    document.querySelector('#coord-chart .tlevt').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(window.openFeatDet).toHaveBeenCalledWith('📅 秦统一（前221年）', '秦灭六国。');

    document.querySelector('#coord-chart .tldash[data-dim="pol"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(window.openFeatDet).toHaveBeenLastCalledWith('🔗 秦统一 → 文景之治', expect.stringContaining('中央制度延续'));

    document.querySelector('#event-list .evitem').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(window.openFeatDet).toHaveBeenLastCalledWith('📅 秦统一（前221年）', '秦灭六国。');
  });

  test('escapes timeline JSON fields before rendering list and chart HTML', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents([
      {
        dynasty: 'qin',
        name: '<img src=x onerror="window.__timelineNameXss=true">',
        year: '<script>window.__timelineYearXss=true</script>',
        x: 100,
        pol: 350,
        eco: 340,
        cul: 310,
        description: '<img src=x onerror="window.__timelineDescXss=true">',
        conn: { next: '<img src=x onerror="window.__timelineConnXss=true">', pol: '<b>政治</b>', eco: '<b>经济</b>', cul: '<b>文化</b>' }
      }
    ]);

    window.timelineAPI.renderTimeline();
    window.timelineAPI.renderEventList();

    expect(document.querySelector('#coord-chart img')).toBeNull();
    expect(document.querySelector('#coord-chart script')).toBeNull();
    expect(document.querySelector('#event-list img')).toBeNull();
    expect(document.getElementById('coord-chart').innerHTML).toContain('&lt;img src=x');
    expect(document.getElementById('event-list').innerHTML).toContain('&lt;img src=x');
    expect(window.__timelineNameXss).toBeUndefined();
    expect(window.__timelineYearXss).toBeUndefined();
    expect(window.__timelineDescXss).toBeUndefined();
    expect(window.__timelineConnXss).toBeUndefined();
  });
});
