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
