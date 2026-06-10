import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetGlobals } from '../helpers/dom-test-utils.js';

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  delete window.htmlUtils;
});

describe('htmlUtils.escapeHtml', () => {
  test('escapes script-like HTML', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('keeps plain Chinese text unchanged', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml('学的是史')).toBe('学的是史');
  });

  test('escapes double and single quotes', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml('"quoted" and \'single\'')).toBe('&quot;quoted&quot; and &#39;single&#39;');
  });

  test('returns empty string for null and undefined', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml(null)).toBe('');
    expect(window.htmlUtils.escapeHtml(undefined)).toBe('');
  });

  test('accepts empty string without throwing', async () => {
    await import('../../src/js/utils/html.js');
    expect(window.htmlUtils.escapeHtml('')).toBe('');
  });
});
