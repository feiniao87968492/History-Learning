import { beforeEach, describe, expect, test, vi } from 'vitest';
import { makeStorageMock, resetGlobals } from '../helpers/dom-test-utils.js';

function installStorageMock(storage) {
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true
  });
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  installStorageMock(makeStorageMock());
});

describe('storage adapter', () => {
  test('writes and reads JSON values', async () => {
    await import('../../src/js/adapters/storage.js');

    var saved = window.storageAPI.setStoredJSON('xds_test_json', { count: 2 });
    var value = window.storageAPI.getStoredJSON('xds_test_json', { count: 0 });

    expect(saved).toBe(true);
    expect(value).toEqual({ count: 2 });
  });

  test('returns fallback when JSON key is missing', async () => {
    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.getStoredJSON('missing_key', ['fallback'])).toEqual(['fallback']);
  });

  test('returns fallback when stored JSON is invalid', async () => {
    window.localStorage.setItem('broken_json', '{not valid json');
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.getStoredJSON('broken_json', { safe: true })).toEqual({ safe: true });
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('writes and reads string values', async () => {
    await import('../../src/js/adapters/storage.js');

    var saved = window.storageAPI.setStoredString('xds_test_string', '学的是史');
    var value = window.storageAPI.getStoredString('xds_test_string', 'fallback');

    expect(saved).toBe(true);
    expect(value).toBe('学的是史');
  });

  test('returns fallback when string key is missing', async () => {
    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.getStoredString('missing_string', 'fallback')).toBe('fallback');
  });

  test('returns false when JSON write throws', async () => {
    var failingStorage = makeStorageMock();
    failingStorage.setItem = function () {
      throw new Error('quota exceeded');
    };
    installStorageMock(failingStorage);
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.setStoredJSON('xds_fail', { ok: false })).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('returns false when string write throws', async () => {
    var failingStorage = makeStorageMock();
    failingStorage.setItem = function () {
      throw new Error('quota exceeded');
    };
    installStorageMock(failingStorage);
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.setStoredString('xds_fail', 'value')).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('returns fallback when localStorage read throws', async () => {
    var failingStorage = makeStorageMock();
    failingStorage.getItem = function () {
      throw new Error('read blocked');
    };
    installStorageMock(failingStorage);
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.getStoredJSON('xds_fail', { fallback: true })).toEqual({ fallback: true });
    expect(window.storageAPI.getStoredString('xds_fail', 'fallback')).toBe('fallback');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('removes a stored item through both remove method names', async () => {
    await import('../../src/js/adapters/storage.js');

    window.storageAPI.setStoredString('xds_remove_one', 'value');
    window.storageAPI.setStoredString('xds_remove_two', 'value');

    expect(window.storageAPI.removeStoredItem('xds_remove_one')).toBe(true);
    expect(window.storageAPI.removeItem('xds_remove_two')).toBe(true);
    expect(window.storageAPI.getStoredString('xds_remove_one', 'fallback')).toBe('fallback');
    expect(window.storageAPI.getStoredString('xds_remove_two', 'fallback')).toBe('fallback');
  });

  test('returns false when remove throws', async () => {
    var failingStorage = makeStorageMock();
    failingStorage.removeItem = function () {
      throw new Error('remove blocked');
    };
    installStorageMock(failingStorage);
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/storage.js');

    expect(window.storageAPI.removeStoredItem('xds_fail')).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
