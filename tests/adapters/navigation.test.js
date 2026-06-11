import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from '../helpers/dom-test-utils.js';

function mountNavigationDOM() {
  mountDOM(`
    <div id="login-page" class="page active"></div>
    <div id="home-page" class="page"></div>
    <div id="profile-page" class="page"></div>
    <div id="noun-page" class="sub"></div>
    <div id="timeline-page" class="sub act"></div>
    <div id="bnav" style="display:none"></div>
    <div id="ai-fab" style="top: 20px; left: 30px; bottom: 40px; right: 50px;"></div>
    <div id="toast"></div>
  `);
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  vi.useFakeTimers();
  mountNavigationDOM();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('navigation adapter', () => {
  test('shows toast text and hides it after the default duration', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.showToast('欢迎学习');

    expect(document.getElementById('toast').textContent).toBe('欢迎学习');
    expect(document.getElementById('toast').classList.contains('sh')).toBe(true);

    vi.advanceTimersByTime(1999);
    expect(document.getElementById('toast').classList.contains('sh')).toBe(true);

    vi.advanceTimersByTime(1);
    expect(document.getElementById('toast').classList.contains('sh')).toBe(false);
  });

  test('uses custom toast duration and resets previous timer', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.showToast('第一次', 1000);
    vi.advanceTimersByTime(500);
    window.navigationAPI.showToast('第二次', 1000);
    vi.advanceTimersByTime(600);

    expect(document.getElementById('toast').textContent).toBe('第二次');
    expect(document.getElementById('toast').classList.contains('sh')).toBe(true);

    vi.advanceTimersByTime(400);
    expect(document.getElementById('toast').classList.contains('sh')).toBe(false);
  });

  test('login switches from login page to home page and shows shell UI', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.login();

    expect(document.getElementById('login-page').classList.contains('active')).toBe(false);
    expect(document.getElementById('home-page').classList.contains('active')).toBe(true);
    expect(document.getElementById('ai-fab').classList.contains('sh')).toBe(true);
    expect(document.getElementById('bnav').style.display).toBe('flex');
    expect(document.getElementById('toast').textContent).toBe('欢迎回来，历史学习者！');
  });

  test('resetAIFab clears dragged inline positioning', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.resetAIFab();

    expect(document.getElementById('ai-fab').style.top).toBe('auto');
    expect(document.getElementById('ai-fab').style.left).toBe('auto');
    expect(document.getElementById('ai-fab').style.bottom).toBe('');
    expect(document.getElementById('ai-fab').style.right).toBe('');
  });

  test('openSub marks the requested sub panel active', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.openSub('noun-page');

    expect(document.getElementById('noun-page').classList.contains('act')).toBe(true);
  });

  test('closeSub closes all sub panels when no target is provided', async () => {
    await import('../../src/js/adapters/navigation.js');

    window.navigationAPI.closeSub();

    expect(document.getElementById('noun-page').classList.contains('act')).toBe(false);
    expect(document.getElementById('timeline-page').classList.contains('act')).toBe(false);
  });

  test('closeSub activates a target sub panel without changing active page', async () => {
    await import('../../src/js/adapters/navigation.js');
    document.getElementById('home-page').classList.add('active');

    window.navigationAPI.closeSub('noun-page');

    expect(document.getElementById('timeline-page').classList.contains('act')).toBe(false);
    expect(document.getElementById('noun-page').classList.contains('act')).toBe(true);
    expect(document.getElementById('home-page').classList.contains('active')).toBe(true);
  });

  test('closeSub activates a target page and deactivates other pages', async () => {
    await import('../../src/js/adapters/navigation.js');
    document.getElementById('home-page').classList.add('active');

    window.navigationAPI.closeSub('profile-page');

    expect(document.getElementById('timeline-page').classList.contains('act')).toBe(false);
    expect(document.getElementById('login-page').classList.contains('active')).toBe(false);
    expect(document.getElementById('home-page').classList.contains('active')).toBe(false);
    expect(document.getElementById('profile-page').classList.contains('active')).toBe(true);
  });

  test('missing DOM nodes do not throw', async () => {
    mountDOM('');

    await import('../../src/js/adapters/navigation.js');

    expect(function () {
      window.navigationAPI.showToast('no toast node');
      window.navigationAPI.login();
      window.navigationAPI.resetAIFab();
      window.navigationAPI.openSub('missing-page');
      window.navigationAPI.closeSub('missing-page');
    }).not.toThrow();
  });
});
