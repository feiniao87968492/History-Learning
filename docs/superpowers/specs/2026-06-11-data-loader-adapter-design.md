# Task 1.5 Data Loader Adapter Design

## Context

Phase 1 is building platform adapters before existing business modules are rewired. Task 1.5 creates the JSON data loading boundary only. Existing `src/js/app.js` `loadJSON(path, fallback)` and direct `fetch` usage remain unchanged in this task; later Task 1.6 will wire app initialization to the adapter.

## Goal

Create a small ES5/IIFE adapter at `src/js/adapters/data-loader.js` that wraps JSON loading behind a stable `window.dataLoaderAPI.loadJSON(path, fallback)` interface, with unit tests in `tests/adapters/data-loader.test.js`.

## Scope

In scope:

- Expose `window.dataLoaderAPI.loadJSON(path, fallback)`.
- Use `fetch(path)` to load JSON data on Web.
- Return parsed JSON when the response is successful and JSON parsing succeeds.
- Return the provided `fallback` when fetch fails, the response is not OK, or JSON parsing fails.
- Log adapter-prefixed errors for failure paths.
- Test the adapter with mocked `fetch`.

Out of scope:

- No changes to `src/js/app.js`.
- No changes to business modules or data files.
- No WeChat Mini Program implementation.
- No caching, retries, request cancellation, URL normalization, or module-specific loaders.

## Interface Behavior

`loadJSON(path, fallback)` is asynchronous and returns a Promise.

Successful path:

1. Call `fetch(path)`.
2. If `response.ok` is truthy, call `response.json()`.
3. Resolve to the parsed JSON value.

Failure paths:

- If `fetch(path)` rejects, resolve to `fallback`.
- If `response.ok` is falsy, resolve to `fallback`.
- If `response.json()` rejects or throws, resolve to `fallback`.

The adapter does not throw these platform or parsing failures to business modules.

## Error Handling

For every failure path, log:

```js
console.error('dataLoaderAdapter.loadJSON failed:', path, error);
```

For non-OK HTTP responses, create an Error with a message that includes the path, for example:

```js
new Error('Failed to load data: ' + path);
```

This mirrors the current `app.js` behavior while making the platform boundary explicit.

## Testing

`tests/adapters/data-loader.test.js` will:

- Mock `window.fetch` before importing the adapter.
- Verify `window.dataLoaderAPI.loadJSON` exists.
- Verify successful fetch and JSON parsing returns parsed data.
- Verify a non-OK response returns fallback and logs an error.
- Verify a rejected fetch returns fallback and logs an error.
- Verify a rejected JSON parse returns fallback and logs an error.
- Verify the adapter calls `fetch` with the provided path.

## Acceptance

- `npx vitest run tests/adapters/data-loader.test.js --environment jsdom` passes.
- Existing adapter tests continue to pass.
- The new adapter follows project style: IIFE, `var`, ordinary functions, and `window.dataLoaderAPI` exposure.
- `src/js/app.js` and business modules are intentionally unchanged in this task.
