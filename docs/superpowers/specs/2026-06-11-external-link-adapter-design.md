# Task 1.4 External Link Adapter Design

## Context

Phase 1 is building platform adapters before existing business modules are rewired. Task 1.4 creates the Web external-link boundary only. Existing direct `window.open(...)` calls remain unchanged in this task; later integration work will replace them with `window.externalLinkAPI.open(...)`.

## Goal

Create a small ES5/IIFE adapter at `src/js/adapters/external-link.js` that wraps Web external navigation behind a stable `window.externalLinkAPI.open(url)` interface, with unit tests in `tests/adapters/external-link.test.js`.

## Scope

In scope:

- Expose `window.externalLinkAPI.open(url)`.
- Open valid URLs in a new browser tab through `window.open(url, '_blank', 'noopener,noreferrer')`.
- Return `true` when the adapter successfully delegates to `window.open`.
- Return `false` for invalid URL inputs without calling `window.open`.
- Catch synchronous `window.open` failures, log an adapter-prefixed error, and return `false`.
- Test the adapter with a mocked `window.open`.

Out of scope:

- No changes to `index.html` direct `window.open(...)` calls.
- No changes to `src/js/app.js`, `src/js/film.js`, or other business modules.
- No WeChat Mini Program implementation.
- No URL allowlist, URL normalization, or rich metadata object API.

## Interface Behavior

`open(url)` accepts a non-empty string URL. When valid, it calls:

```js
window.open(url, '_blank', 'noopener,noreferrer');
```

The method returns `true` after the call. It does not expose Web-specific `target` or `features` parameters to business modules, because the adapter should hide platform details before the future Mini Program migration.

Invalid inputs return `false` and do not call `window.open`. Invalid inputs include empty strings, whitespace-only strings, `null`, `undefined`, and non-string values.

## Error Handling

If `window.open` throws synchronously, the adapter logs:

```js
console.error('externalLinkAdapter.open failed:', url, error);
```

and returns `false`. This mirrors the defensive style of the existing storage and audio adapters: platform errors are contained at the adapter boundary and business modules can branch on a boolean result.

## Testing

`tests/adapters/external-link.test.js` will:

- Mock `window.open` before importing the adapter.
- Verify `window.externalLinkAPI.open` exists.
- Verify valid URLs call `window.open(url, '_blank', 'noopener,noreferrer')` and return `true`.
- Verify empty, whitespace-only, missing, and non-string inputs return `false` and do not call `window.open`.
- Verify synchronous `window.open` failures return `false` and log `externalLinkAdapter.open failed:`.

## Acceptance

- `npx vitest run tests/adapters/external-link.test.js --environment jsdom` passes.
- Existing adapter tests continue to pass.
- The new adapter follows project style: IIFE, `var`, ordinary functions, and `window.externalLinkAPI` exposure.
- Business modules are intentionally unchanged in this task.
