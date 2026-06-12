import { beforeEach, describe, expect, test } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = `
    <div id="login-page" class="page active"></div>
    <div id="home-page" class="page"></div>
    <div id="bnav" style="display:none"></div>
    <div id="ai-fab"></div>
    <div id="toast"></div>
  `;
});

describe('navigation baseline', () => {
  test('loads navigation module in test runtime', async () => {
    await import('../src/js/navigation.js');
    expect(window.navigationAPI).toBeDefined();
  });
});
