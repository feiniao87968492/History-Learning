import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetGlobals } from '../helpers/dom-test-utils.js';

function installFetchMock(implementation) {
  var fetchMock = vi.fn(implementation || function () {
    return Promise.resolve({
      ok: true,
      json: function () {
        return Promise.resolve({});
      }
    });
  });

  Object.defineProperty(window, 'fetch', {
    value: fetchMock,
    configurable: true
  });

  return fetchMock;
}

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  installFetchMock();
});

describe('data loader adapter', () => {
  test('exposes the expected data loader API method', async () => {
    await import('../../src/js/adapters/data-loader.js');

    expect(window.dataLoaderAPI).toEqual({
      loadJSON: expect.any(Function)
    });
  });

  test('loads and returns parsed JSON data', async () => {
    var data = { title: '学的是史', count: 2 };
    var fetchMock = installFetchMock(function () {
      return Promise.resolve({
        ok: true,
        json: function () {
          return Promise.resolve(data);
        }
      });
    });

    await import('../../src/js/adapters/data-loader.js');

    var result = await window.dataLoaderAPI.loadJSON('./src/data/test.json', { fallback: true });

    expect(result).toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith('./src/data/test.json');
  });

  test('returns fallback and logs when response is not ok', async () => {
    var fallback = { safe: true };
    installFetchMock(function () {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: function () {
          return Promise.resolve({ shouldNotUse: true });
        }
      });
    });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/data-loader.js');

    var result = await window.dataLoaderAPI.loadJSON('./src/data/missing.json', fallback);

    expect(result).toBe(fallback);
    expect(errorSpy).toHaveBeenCalledWith(
      'dataLoaderAdapter.loadJSON failed:',
      './src/data/missing.json',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });

  test('returns fallback and logs when fetch rejects', async () => {
    var fallback = [];
    var networkError = new Error('network down');
    installFetchMock(function () {
      return Promise.reject(networkError);
    });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/data-loader.js');

    var result = await window.dataLoaderAPI.loadJSON('./src/data/nouns.json', fallback);

    expect(result).toBe(fallback);
    expect(errorSpy).toHaveBeenCalledWith(
      'dataLoaderAdapter.loadJSON failed:',
      './src/data/nouns.json',
      networkError
    );

    errorSpy.mockRestore();
  });

  test('returns fallback and logs when JSON parsing rejects', async () => {
    var fallback = { dynasties: [], events: [] };
    var parseError = new Error('invalid json');
    installFetchMock(function () {
      return Promise.resolve({
        ok: true,
        json: function () {
          return Promise.reject(parseError);
        }
      });
    });
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../src/js/adapters/data-loader.js');

    var result = await window.dataLoaderAPI.loadJSON('./src/data/timeline.json', fallback);

    expect(result).toBe(fallback);
    expect(errorSpy).toHaveBeenCalledWith(
      'dataLoaderAdapter.loadJSON failed:',
      './src/data/timeline.json',
      parseError
    );

    errorSpy.mockRestore();
  });
});