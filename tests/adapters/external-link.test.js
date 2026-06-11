import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetGlobals } from '../helpers/dom-test-utils.js';

function installWindowOpenMock(implementation) {
  var openMock = vi.fn(implementation || function () {});
  Object.defineProperty(window, 'open', {
    value: openMock,
    configurable: true
  });
  return openMock;
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  installWindowOpenMock();
});

describe('external link adapter', () => {
  test('exposes the expected external link API method', async () => {
    await import('../../src/js/adapters/external-link.js');

    expect(window.externalLinkAPI).toEqual({
      open: expect.any(Function)
    });
  });

  test('opens a valid URL in a new browser tab with safe features', async () => {
    var openMock = installWindowOpenMock();

    await import('../../src/js/adapters/external-link.js');

    expect(window.externalLinkAPI.open('https://example.com/history')).toBe(true);
    expect(openMock).toHaveBeenCalledWith('https://example.com/history', '_blank', 'noopener,noreferrer');
    expect(openMock).toHaveBeenCalledTimes(1);
  });

  test('returns false and does not open for invalid URL inputs', async () => {
    var openMock = installWindowOpenMock();

    await import('../../src/js/adapters/external-link.js');

    expect(window.externalLinkAPI.open()).toBe(false);
    expect(window.externalLinkAPI.open(null)).toBe(false);
    expect(window.externalLinkAPI.open(123)).toBe(false);
    expect(window.externalLinkAPI.open('')).toBe(false);
    expect(window.externalLinkAPI.open('   ')).toBe(false);
    expect(openMock).not.toHaveBeenCalled();
  });

  test('logs and returns false when window.open throws synchronously', async () => {
    installWindowOpenMock(function () {
      throw new Error('popup blocked');
    });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/external-link.js');

    expect(window.externalLinkAPI.open('https://example.com/fail')).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      'externalLinkAdapter.open failed:',
      'https://example.com/fail',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});
