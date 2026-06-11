# Task 2.1 Noun Seed Data and Rendering Design

## Context

Phase 1 adapter wiring is complete. Phase 2 starts the core learning loop. Task 2.1 focuses on the noun explanation page: replace hardcoded noun cards with JSON-driven rendering, expand the first seed dataset to a small verified set, and add tests for rendering, search, and escaping.

The current noun module already exposes `window.nounAPI`, supports details and related noun buttons, and loads `src/data/nouns.json` through `app.js`. The current page still contains four hardcoded `.ncard` entries in `index.html`.

## Goal

Create a safe, data-driven noun page with 8-12 seed nouns, rendered from `src/data/nouns.json`, while preserving the existing card/detail UI style.

## Scope

In scope:

- Expand `src/data/nouns.json` to 10 seed noun entries.
- Add structured fields to each noun: `text`, `related`, `dynasty`, `category`, `map`, and `year`.
- Add `renderNounCards(filter)` to `src/js/noun.js`.
- Call `renderNounCards()` from `setNounData(data)`.
- Update `searchNouns()` to filter by noun name, text, dynasty, category, and year.
- Update noun detail rendering to show dynasty/category/year metadata and map text.
- Remove hardcoded noun cards from `index.html` and keep `#noun-grid` as an empty render target.
- Add `#nd-meta` in the noun detail page.
- Add `tests/noun.test.js` for rendering, search, empty state, and XSS protection.

Out of scope:

- No favorite persistence or learned-state persistence. Those belong to Task 2.2.
- No bulk expansion to 50+ nouns.
- No new UI redesign beyond using the existing card/detail structure.
- No Mini Program implementation.

## Seed Data

Use 10 seed nouns that cover major periods and categories while supporting the Phase 2 end-to-end path:

1. 郡县制
2. 商鞅变法
3. 科举制
4. 井田制
5. 推恩令
6. 丝绸之路
7. 三省六部制
8. 交子
9. 一条鞭法
10. 军机处

Each entry should include concise but meaningful text between 100 and 500 Chinese characters. `related` should contain 2-3 related noun names. `dynasty`, `category`, `map`, and `year` should be present for all 10 entries, using an empty string only if there is no historically useful value.

## Rendering Design

`src/js/noun.js` will keep the IIFE and `window.nounAPI` pattern.

Add an `escapeHtml(value)` helper that delegates to `window.htmlUtils.escapeHtml` when available and otherwise performs local escaping. Use this before placing JSON data into `innerHTML`.

`renderNounCards(filter)` will:

- Read names from `nounData`.
- Apply a case-insensitive filter against name, `text`, `dynasty`, `category`, and `year`.
- Render cards into `#noun-grid`.
- Show a centered empty message when no nouns match.
- Preserve inline event compatibility by using `onclick="openNounDet('...')"`, `togNounFav`, and `shareNoun` with escaped JavaScript string values.

`setNounData(data)` will normalize invalid data to `{}` and call `renderNounCards()` so the page updates after `app.js` loads JSON.

## Detail Design

`openNounDet(name)` will continue to set `#nd-title` and `#nd-text` with `textContent`.

It will additionally:

- Populate `#nd-meta` with escaped tags for dynasty, category, and year.
- Populate `#noun-detail .mp` with `🗺️ ` plus the noun `map`, or `🗺️ 暂无相关地图` when no map exists.
- Render related noun buttons using `document.createElement` and `textContent`.

`index.html` will add:

```html
<div style="padding:0 16px 8px" id="nd-meta"></div>
```

between the video placeholder and the detailed explanation section.

## Search Design

`searchNouns()` will read `#noun-search-input`, trim and lowercase it, then call `renderNounCards(query)`. Empty query renders all nouns. A query with no match renders `暂无匹配名词`.

## Safety

- `textContent` is preferred for detail text and related buttons.
- Card HTML uses escaped values for every JSON-provided field.
- Test data will include script-like content to prove it is rendered as text and does not create executable script nodes.

## Testing

`tests/noun.test.js` will:

- Mount a minimal noun DOM.
- Import `src/js/noun.js`.
- Call `setNounData(mockData)` and assert card count/content.
- Search for `唐朝` and assert only matching dynasty cards are visible or rendered.
- Clear search and assert all cards return.
- Search for an unmatched term and assert `暂无匹配名词` appears.
- Use malicious mock values containing `<script>` and assert no script element is created and the raw script content is escaped in card HTML.

## Acceptance

- `npx vitest run tests/noun.test.js --environment jsdom` passes.
- Existing relevant suites continue to pass.
- Browser noun page shows 8-12 JSON-rendered cards instead of hardcoded cards.
- Searching `唐朝` filters to Tang-related nouns.
- Opening a noun detail shows text, dynasty/category/year, map text, and related noun buttons.
