# Task 1.3 Audio Adapter Design

## Context

Phase 1 is building platform adapters before business modules are rewired. Task 1.3 creates the Web audio boundary only. Existing podcast playback remains unchanged in this task; later integration work will replace direct audio usage with `window.audioAPI`.

## Goal

Create a small ES5/IIFE adapter at `src/js/adapters/audio.js` that wraps HTML5 `Audio` behind a stable `window.audioAPI` interface, with unit tests in `tests/adapters/audio.test.js`.

## Scope

In scope:

- Instantiate and own one HTML5 `Audio` object inside the adapter.
- Expose `window.audioAPI` with these methods:
  - `setSource(src)`
  - `play()`
  - `pause()`
  - `seek(seconds)`
  - `onTimeUpdate(handler)`
  - `onEnded(handler)`
  - `onError(handler)`
  - Optional read helpers if needed for tests and later modules: `getCurrentTime()`, `getDuration()`, `isPaused()`.
- Catch unsafe operations where practical and log adapter-prefixed errors instead of throwing from adapter calls.
- Test the adapter with a mocked `Audio` constructor.

Out of scope:

- No changes to `src/js/podcast.js`.
- No real podcast audio files or `podcasts.json` changes.
- No WeChat Mini Program implementation.

## Interface Behavior

`setSource(src)` sets the underlying audio source to the provided string and calls `load()` when available. It returns `true` on success and `false` if setting the source fails.

`play()` calls the underlying audio `play()` method and returns its result. If `play()` throws synchronously, the adapter logs `audioAdapter.play failed:` and returns `false`. Promise rejections from browser autoplay policy are left to the caller of the returned promise in later integration work.

`pause()` calls the underlying audio `pause()` method and returns `true` on success or `false` on synchronous failure.

`seek(seconds)` clamps invalid values to `0`, assigns `audio.currentTime`, and returns `true` or `false` on failure.

`onTimeUpdate(handler)`, `onEnded(handler)`, and `onError(handler)` register event listeners on the underlying audio object. Non-function handlers are ignored and return `false`; valid handlers return `true`.

## Error Handling

The adapter should not surface raw platform exceptions to business modules for common operations. Failures are logged with clear prefixes:

- `audioAdapter.setSource failed:`
- `audioAdapter.play failed:`
- `audioAdapter.pause failed:`
- `audioAdapter.seek failed:`
- `audioAdapter.addEventListener failed:`

This matches the existing storage adapter style while keeping behavior predictable for future podcast integration.

## Testing

`tests/adapters/audio.test.js` will:

- Install a mock `window.Audio` constructor before importing the adapter.
- Verify `window.audioAPI` exposes the expected functions.
- Verify `setSource()` updates `src` and calls `load()`.
- Verify `play()` and `pause()` call the mocked audio methods.
- Verify `seek()` sets `currentTime` and handles invalid values.
- Verify `onTimeUpdate`, `onEnded`, and `onError` register callbacks and that mocked events trigger them.
- Verify synchronous failures return `false` and log errors.

## Acceptance

- `npx vitest run tests/adapters/audio.test.js --environment jsdom` passes.
- Existing adapter tests continue to pass.
- The new adapter follows project style: IIFE, `var`, ordinary functions, and `window.audioAPI` exposure.
