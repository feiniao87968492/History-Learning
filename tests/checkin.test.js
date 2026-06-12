import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

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

function mountCheckinDOM() {
  mountDOM(`
    <div id="checkin-panel"></div>
    <div id="checkin-calendar"></div>
    <button id="checkin-btn">📅 今日打卡</button>
    <div id="ck-total">0</div>
    <div id="ck-streak">0</div>
    <div id="ck-month">0</div>
    <div id="stat-days">0</div>
    <div id="stat-streak">0</div>
  `);
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
  mountCheckinDOM();
  window.storageAPI = createStorageMock();
  window.navigationAPI = {
    showToast: vi.fn()
  };
  window.learningStatsAPI = {
    recordLearningEvent: vi.fn(),
    updateProfileStats: vi.fn()
  };
});

describe('checkin module', () => {
  test('opens panel and renders current month calendar from xds_checkins', async () => {
    window.storageAPI = createStorageMock({
      xds_checkins: {
        '2026-06-10': true
      }
    });
    await import('../src/js/checkin.js');

    window.checkinAPI.openCheckin();

    expect(document.getElementById('checkin-panel').classList.contains('act')).toBe(true);
    expect(window.storageAPI.getStoredJSON).toHaveBeenCalledWith('xds_checkins', {});
    expect(document.getElementById('checkin-calendar').textContent).toContain('日');
    expect(document.querySelector('.ckcell.today')).not.toBeNull();
    expect(document.querySelectorAll('.ckcell.done')).toHaveLength(1);
  });

  test('writes today checkin to xds_checkins and syncs stats and learning event', async () => {
    await import('../src/js/checkin.js');

    window.checkinAPI.doCheckin();

    expect(window.storageAPI.setStoredJSON).toHaveBeenCalledWith('xds_checkins', {
      '2026-06-11': true
    });
    expect(window.learningStatsAPI.recordLearningEvent).toHaveBeenCalledWith('checkin', '2026-06-11');
    expect(window.learningStatsAPI.updateProfileStats).toHaveBeenCalled();
    expect(document.getElementById('checkin-btn').textContent).toBe('✅ 已打卡');
    expect(document.getElementById('checkin-btn').disabled).toBe(true);
    expect(document.getElementById('checkin-btn').classList.contains('done')).toBe(true);
    expect(document.getElementById('ck-total').textContent).toBe('1');
    expect(document.getElementById('ck-streak').textContent).toBe('1');
    expect(window.storageAPI.getStore().xds_checkins['2026-06-11']).toBe(true);
  });

  test('does not write duplicate checkin for the same day', async () => {
    window.storageAPI = createStorageMock({
      xds_checkins: {
        '2026-06-11': true
      }
    });
    await import('../src/js/checkin.js');

    window.checkinAPI.doCheckin();

    expect(window.storageAPI.setStoredJSON).not.toHaveBeenCalled();
    expect(window.learningStatsAPI.recordLearningEvent).not.toHaveBeenCalled();
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('今日已打卡，明天继续加油！');
  });

  test('calculates consecutive streak from today backwards', async () => {
    await import('../src/js/checkin.js');

    expect(window.checkinAPI.calcStreak({
      '2026-06-08': true,
      '2026-06-09': true,
      '2026-06-10': true,
      '2026-06-11': true,
      '2026-06-01': true
    })).toBe(4);
    expect(window.checkinAPI.calcStreak({
      '2026-06-09': true,
      '2026-06-11': true
    })).toBe(1);
  });

  test('shows a 3-day streak toast after the third consecutive checkin', async () => {
    window.storageAPI = createStorageMock({
      xds_checkins: {
        '2026-06-09': true,
        '2026-06-10': true
      }
    });
    await import('../src/js/checkin.js');

    window.checkinAPI.doCheckin();

    expect(document.getElementById('ck-streak').textContent).toBe('3');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('打卡成功！连续 3 天学习，保持节奏！');
  });

  test('shows a 7-day streak toast after the seventh consecutive checkin', async () => {
    window.storageAPI = createStorageMock({
      xds_checkins: {
        '2026-06-05': true,
        '2026-06-06': true,
        '2026-06-07': true,
        '2026-06-08': true,
        '2026-06-09': true,
        '2026-06-10': true
      }
    });
    await import('../src/js/checkin.js');

    window.checkinAPI.doCheckin();

    expect(document.getElementById('ck-streak').textContent).toBe('7');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('打卡成功！连续 7 天学习，已经形成习惯啦！');
  });

  test('falls back to checkin stats when learningStatsAPI is unavailable', async () => {
    delete window.learningStatsAPI;
    await import('../src/js/checkin.js');

    window.checkinAPI.doCheckin();

    expect(document.getElementById('stat-days').textContent).toBe('1');
    expect(document.getElementById('stat-streak').textContent).toBe('1');
  });
});
