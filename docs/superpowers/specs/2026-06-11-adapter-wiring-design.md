# Task 1.6 Adapter Wiring Design

## Context

Phase 1 has created the platform adapter modules for storage, navigation, audio, external links, and data loading. Task 1.6 wires existing Web modules to those adapters without changing user-facing behavior.

Exploration found that `index.html` currently loads legacy business modules but does not load `src/js/adapters/*.js`. It also still contains inline direct calls to `window.open(...)` and `localStorage`. Therefore Task 1.6 includes the necessary `index.html` script loading and inline platform-call replacement, not only the originally listed JS modules.

## Goal

Route existing platform capability usage through adapters while preserving current Web prototype behavior. The page should continue to work if loaded in the browser, existing tests should remain green, and future Mini Program migration should only need adapter replacement for these capabilities.

## Scope

In scope:

- Load adapter scripts in `index.html` before business modules.
- Prevent legacy `src/js/storage.js` and `src/js/navigation.js` from overwriting adapter-provided `window.storageAPI` and `window.navigationAPI`.
- Update `src/js/app.js` data loading to prefer `window.dataLoaderAPI.loadJSON(path, fallback)` while keeping the current fetch fallback for test/runtime safety.
- Update `src/js/podcast.js` to use `window.audioAPI` when available, while preserving the existing simulated progress behavior when no real audio source is present.
- Replace inline direct `window.open(...)` calls in `index.html` with `window.externalLinkAPI.open(...)` plus a safe fallback.
- Replace inline direct `localStorage` note/checkin calls in `index.html` with `window.storageAPI` calls plus a safe fallback where needed.
- Add or update tests for non-overwrite behavior, data loader usage, audio adapter usage, and static platform-call cleanup.

Out of scope:

- No WeChat Mini Program implementation.
- No UI redesign.
- No migration of unrelated inline business logic into new modules.
- No addition of real podcast audio files.
- No large content/data expansion.

## Script Loading Strategy

`index.html` should load adapters before business modules:

```html
<script src="./src/js/adapters/storage.js"></script>
<script src="./src/js/adapters/navigation.js"></script>
<script src="./src/js/adapters/audio.js"></script>
<script src="./src/js/adapters/external-link.js"></script>
<script src="./src/js/adapters/data-loader.js"></script>
<script src="./src/js/storage.js"></script>
<script src="./src/js/navigation.js"></script>
```

The legacy `storage.js` and `navigation.js` files stay referenced for compatibility during this phase, but they must not overwrite an adapter API that already exists.

## Module Changes

### `src/js/storage.js`

If `window.storageAPI` already exists, return immediately and leave the adapter intact. If it does not exist, create the same fallback API currently provided by the file. Add `removeStoredItem` and `removeItem` aliases in the fallback so the legacy API remains compatible with the adapter API.

### `src/js/navigation.js`

If `window.navigationAPI` already exists, return immediately and leave the adapter intact. If it does not exist, create the same fallback API currently provided by the file. Keep existing DOM behavior unchanged.

### `src/js/app.js`

Change the internal `loadJSON(path, fallback)` helper to:

1. Use `window.dataLoaderAPI.loadJSON(path, fallback)` when available.
2. Otherwise use the existing fetch implementation.

This preserves unit-test flexibility and prevents the app from crashing if `app.js` is imported without adapter setup.

### `src/js/podcast.js`

Keep the existing simulated-progress player as fallback behavior. Add adapter usage when `window.audioAPI` is available:

- `openPlayer(idx)` sets the player UI as it does today. If the podcast item has `audioUrl`, call `window.audioAPI.setSource(item.audioUrl)`.
- `togglePlay()` calls `window.audioAPI.play()` when switching to playing and `window.audioAPI.pause()` when switching to paused.
- `seekPodcast(event)` updates existing UI state and calls `window.audioAPI.seek(plCur)` when available.
- Register `onTimeUpdate`, `onEnded`, and `onError` once when the module initializes if `window.audioAPI` exists. These handlers update the same UI state where DOM nodes exist and fail safely when they do not.

If there is no `audioUrl`, keep current simulated progress behavior so the prototype does not regress before real podcast audio is introduced.

### `index.html` inline calls

Replace direct `window.open(...)` with a compatibility function that prefers `window.externalLinkAPI.open(url)` and falls back to `window.open(url, '_blank')` only when the adapter is unavailable.

Replace inline `localStorage` note/checkin reads and writes with `window.storageAPI` helpers. The fallback should only use direct localStorage if `window.storageAPI` is unavailable, preserving manual page behavior during partial script loading.

## Testing

Update or add tests to cover:

- `storage.js` does not overwrite an existing `window.storageAPI` adapter.
- `navigation.js` does not overwrite an existing `window.navigationAPI` adapter.
- `app.js` uses `window.dataLoaderAPI.loadJSON` when present and still falls back to fetch when absent.
- `podcast.js` calls `window.audioAPI.setSource`, `play`, `pause`, and `seek` when adapter and `audioUrl` are present.
- Static HTML/source scan confirms business-facing files no longer contain direct forbidden platform calls outside adapter files:
  - direct `window.open(` in `index.html`
  - direct `localStorage.` in `index.html`, `src/js/storage.js`, `src/js/checkin.js`, and other non-adapter modules where touched
  - direct `fetch(` in `src/js/app.js`
  - direct `new Audio` in business modules

Adapter implementations themselves are allowed to call platform APIs.

## Acceptance

- `npx vitest run --environment jsdom` passes.
- Browser script order loads adapters before business modules.
- Existing Web behavior is preserved for login, toast, data initialization, checkin, and podcast UI controls.
- Business modules prefer adapters and retain safe fallbacks where needed.
- No direct platform calls remain in Task 1.6 touched business/inline code except explicit fallback branches documented above.
