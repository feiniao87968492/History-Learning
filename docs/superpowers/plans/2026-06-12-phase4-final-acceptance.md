# Phase 4 Final Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 4 final acceptance by verifying and hardening the timeline, people relationship graph, and mindmap modules, then record the final evidence.

**Architecture:** Keep the existing ES5 IIFE modules as the feature boundaries: `timelineAPI`, `peopleAPI`, and `mindmapAPI`. Data continues to flow from `src/data/*.json` through `dataLoaderAPI` and `app.js` into module setters; platform features remain behind adapters. The work removes remaining migrated inline implementation, adds regression tests around the Phase 4 acceptance gaps, and records evidence in a report.

**Tech Stack:** Native HTML/CSS/JavaScript ES5, JSON static data, LocalStorage through `storageAPI`, `dataLoaderAPI`, Vitest + jsdom, Node data validation script.

---

## File map

### Create

- `docs/superpowers/reports/2026-06-12-phase4-final-acceptance-report.md` — final acceptance matrix and verification evidence.

### Modify

- `index.html` — remove the legacy inline people graph implementation and hardcoded mindmap preset nodes; keep containers and existing global-compatible button calls.
- `src/js/timeline.js` — remove generated inline event handlers, add delegated click handlers, harden detail/connection guards, keep zoom/drag state contracts.
- `src/data/timeline.json` — add explicit `id` and `dynasty` fields and add the minimum seed events needed for 3 events per listed dynasty.
- `tests/timeline.test.js` — add acceptance coverage for details, causal lines, dynasty filtering, XSS, event delegation, and prev/next reset behavior.
- `src/js/people.js` — align duplicate relation detection with undirected graph semantics.
- `scripts/validate-data.js` — strengthen graph data validation for Phase 4 acceptance.
- `tests/people.test.js` — add acceptance coverage for legacy inline removal, all relation filters, XSS, and undirected duplicate detection.
- `src/js/mindmap.js` — harden numeric rendering and empty/custom/global compatibility behavior while preserving `storageAPI` persistence.
- `tests/mindmap.test.js` — add acceptance coverage for global compatibility, close behavior, render-all, empty/custom states, JSON-only preset rendering, and XSS.
- `tests/app-static-data.test.js` — add data-loader wiring coverage for `people.json` and `mindmaps.json` when their modules are present.
- `CHANGELOG.md` — add a short Phase 4 final acceptance summary after verification passes.

### Inspect only

- `src/js/app.js` — verify existing data loading and global exposure remain sufficient; edit only when a test proves a missing wiring path.
- `package.json` — use existing scripts only; do not add dependencies.

### Out of scope files

Do not stage the pre-existing untracked files reported by `git status` unless the user explicitly expands scope:

- `docs/学的是史.docx`
- `docs/（temp）review for phase1's plan.md`
- `resources/名词解释/`

---

## Task 1: Baseline verification and branch hygiene

**Files:**
- Inspect: `git status`
- Test: `tests/timeline.test.js`
- Test: `tests/people.test.js`
- Test: `tests/mindmap.test.js`
- Test: `scripts/validate-data.js`

- [ ] **Step 1: Confirm current branch and unstaged files**

Run:

```bash
git status --short --branch
```

Expected:

```text
## phase4-final-acceptance
?? docs/学的是史.docx
?? docs/（temp）review for phase1's plan.md
?? resources/名词解释/
```

The three untracked user files remain out of scope and unstaged.

- [ ] **Step 2: Run focused Phase 4 tests before edits**

Run:

```bash
npx vitest run tests/timeline.test.js tests/people.test.js tests/mindmap.test.js --environment jsdom
```

Expected current baseline:

```text
Test Files  3 passed
Tests       17 passed
```

When the exact count differs because new tests have already been added, require all listed files to pass before continuing.

- [ ] **Step 3: Run current data validation before edits**

Run:

```bash
node scripts/validate-data.js
```

Expected current baseline:

```text
Summary: 15 OK, 0 WARN, 0 ERROR
```

When `ERROR` is nonzero, stop before code changes and record the failing file/message in the final acceptance report.

---

## Task 2: Remove legacy inline people implementation

**Files:**
- Modify: `index.html:664-742`
- Test: `tests/people.test.js`

- [ ] **Step 1: Add a regression test proving legacy people inline code is absent**

Modify the import block at the top of `tests/people.test.js` to include Node file reading helpers:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
```

Append this test inside `describe('people relationship graph', () => { ... })`:

```js
  test('index.html no longer contains the legacy inline people graph implementation', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

    expect(html).not.toContain('var peoData=');
    expect(html).not.toContain('function renderRel()');
    expect(html).not.toContain('function swPeoGroup(btn, group)');
    expect(html).not.toContain("document.getElementById('center-name')");
    expect(html).toContain('人物关系网 已迁移到 src/js/people.js');
  });
```

- [ ] **Step 2: Run the new test and verify it fails before the HTML cleanup**

Run:

```bash
npx vitest run tests/people.test.js --environment jsdom
```

Expected failure before cleanup:

```text
expected '<!DOCTYPE html>...' not to contain 'var peoData='
```

- [ ] **Step 3: Replace the legacy inline people block in `index.html`**

Delete the block beginning with:

```js
// ===== 人物关系网 =====
var peoData={
```

and ending with:

```js
function searchPeople() {
  var v=document.getElementById('people-search-input').value.trim();
  if(peoData[v]){curCenter=v;renderRel();showToast('已切换到：'+v)}
  else if(v){showToast('暂未收录，试试：武则天、秦始皇、汉武帝、唐太宗、朱元璋、康熙')}
}
```

Replace the whole block with this exact comment:

```js
// ===== 人物关系网 已迁移到 src/js/people.js，并通过 app.js 暴露为兼容全局函数 =====
```

Also replace the initialization comment near the end of the script:

```js
// ===== 初始化：renderTimeline / renderEventList / renderRel / updateCheckinStats 已由 app.js 统一调度 =====
```

with:

```js
// ===== 初始化：Phase 4 模块与打卡统计已由 app.js 统一调度 =====
```

- [ ] **Step 4: Run people tests and verify the cleanup passes**

Run:

```bash
npx vitest run tests/people.test.js --environment jsdom
```

Expected:

```text
Test Files  1 passed
```

---

## Task 3: Strengthen people graph validation and acceptance tests

**Files:**
- Modify: `tests/people.test.js`
- Modify: `src/js/people.js`
- Modify: `scripts/validate-data.js`
- Inspect: `src/data/people.json`

- [ ] **Step 1: Add all-filter acceptance coverage**

Append this test inside `describe('people relationship graph', () => { ... })` in `tests/people.test.js`:

```js
  test('supports all required relation filters', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData(PEOPLE_DATA);

    const cases = [
      { type: 'all', expectedLines: 4, visible: ['狄仁杰', '李治', '上官婉儿', '李隆基'] },
      { type: 'career', expectedLines: 1, visible: ['狄仁杰'] },
      { type: 'family', expectedLines: 1, visible: ['李治'] },
      { type: 'teacher', expectedLines: 1, visible: ['上官婉儿'] },
      { type: 'political', expectedLines: 1, visible: ['李隆基'] }
    ];

    cases.forEach((item) => {
      window.peopleAPI.filterPeopleRelations(item.type, document.querySelector('[data-relation-filter="' + item.type + '"]'));
      expect(document.querySelectorAll('#relation-svg .relation-line')).toHaveLength(item.expectedLines);
      item.visible.forEach((name) => {
        expect(document.getElementById('relation-svg').textContent).toContain(name);
      });
    });
  });
```

- [ ] **Step 2: Add XSS acceptance coverage for person and relation details**

Append this test in the same describe block:

```js
  test('escapes graph data in person and relation detail rendering', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData({
      defaultCenter: 'evil-center',
      people: [
        {
          id: 'evil-center',
          name: '<img src=x onerror="window.__peopleNameXss=true">',
          dynasty: '<script>window.__peopleDynastyXss=true</script>',
          summary: '<img src=x onerror="window.__peopleSummaryXss=true">',
          yearTable: ['<script>window.__peopleYearXss=true</script>'],
          evaluation: '<img src=x onerror="window.__peopleEvalXss=true">'
        },
        {
          id: 'safe-target',
          name: '安全人物',
          dynasty: '测试',
          summary: '安全说明'
        }
      ],
      relations: [
        {
          source: 'evil-center',
          target: 'safe-target',
          type: 'career',
          label: '<img src=x onerror="window.__peopleLabelXss=true">',
          description: '<img src=x onerror="window.__peopleRelationXss=true">'
        }
      ]
    });

    window.peopleAPI.renderPeopleGraph();
    window.peopleAPI.openPeoDet('evil-center');

    expect(document.getElementById('pd-name').textContent).toContain('<img src=x');
    expect(document.getElementById('pd-info').innerHTML).toContain('&lt;img src=x');
    expect(document.getElementById('pd-info').querySelector('img')).toBeNull();
    expect(document.getElementById('pd-year-table').querySelector('script')).toBeNull();
    expect(document.getElementById('pd-eval').querySelector('img')).toBeNull();

    document.querySelector('#relation-svg .relation-line').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.getElementById('pd-name').textContent).toContain('<img src=x');
    expect(document.getElementById('pd-info').innerHTML).toContain('&lt;img src=x');
    expect(document.getElementById('pd-info').querySelector('img')).toBeNull();
    expect(window.__peopleNameXss).toBeUndefined();
    expect(window.__peopleDynastyXss).toBeUndefined();
    expect(window.__peopleSummaryXss).toBeUndefined();
    expect(window.__peopleYearXss).toBeUndefined();
    expect(window.__peopleEvalXss).toBeUndefined();
    expect(window.__peopleLabelXss).toBeUndefined();
    expect(window.__peopleRelationXss).toBeUndefined();
  });
```

- [ ] **Step 3: Add undirected duplicate relation coverage**

Replace the duplicate portion of the existing duplicate/invalid test with this assertion:

```js
    window.peopleAPI.setPeopleData({
      people: PEOPLE_DATA.people,
      relations: PEOPLE_DATA.relations.concat([
        { source: 'di-renjie', target: 'wu-zetian', type: 'career', label: '反向重复', description: '反向重复关系' },
        { source: 'wu-zetian', target: 'missing-person', type: 'career', label: '缺失', description: '无效关系' }
      ])
    });

    expect(window.peopleAPI.detectDuplicateRelations()).toContain('di-renjie__wu-zetian__career');
    expect(window.peopleAPI.detectInvalidRelations()).toContain('wu-zetian->missing-person');
```

- [ ] **Step 4: Run people tests and verify the duplicate test fails before implementation**

Run:

```bash
npx vitest run tests/people.test.js --environment jsdom
```

Expected failure before implementation:

```text
expected [] to contain 'di-renjie__wu-zetian__career'
```

- [ ] **Step 5: Update duplicate detection in `src/js/people.js`**

Insert this helper above `detectDuplicateRelations()`:

```js
  function getRelationKey(relation) {
    var source = relation && relation.source ? String(relation.source) : '';
    var target = relation && relation.target ? String(relation.target) : '';
    var first = source < target ? source : target;
    var second = source < target ? target : source;
    return first + '__' + second + '__' + (relation && relation.type ? relation.type : '');
  }
```

Replace `detectDuplicateRelations()` with:

```js
  function detectDuplicateRelations() {
    var seen = {};
    var duplicates = [];
    peopleData.relations.forEach(function (relation) {
      var key = getRelationKey(relation);
      var originalKey = relation.source + '__' + relation.target + '__' + relation.type;
      if (seen[key]) duplicates.push(originalKey);
      seen[key] = true;
    });
    return duplicates;
  }
```

- [ ] **Step 6: Strengthen `validatePeople()` in `scripts/validate-data.js`**

Add these helpers above `validatePeople(data, fileName)`:

```js
var PEOPLE_RELATION_TYPES = {
  career: true,
  family: true,
  teacher: true,
  friend: true,
  political: true
};

function getUndirectedRelationKey(relation) {
  var source = relation && relation.source ? String(relation.source) : '';
  var target = relation && relation.target ? String(relation.target) : '';
  var first = source < target ? source : target;
  var second = source < target ? target : source;
  return first + '__' + second + '__' + (relation && relation.type ? relation.type : '');
}
```

Inside `validatePeople(data, fileName)`, in the branch that handles `data.people`, add this after `data.people.forEach(validatePerson);`:

```js
    if (fileName === 'people.json' && (data.people.length < 10 || data.people.length > 15)) {
      addResult('ERROR', fileName, 'people seed count must be between 10 and 15 for Phase 4');
    }

    if (data.defaultCenter && !ids[data.defaultCenter]) {
      addResult('ERROR', fileName, 'defaultCenter not found: ' + data.defaultCenter);
    }
```

Inside the relation loop, after required field checks and before endpoint checks, add:

```js
      if (!isBlank(relation.type) && !PEOPLE_RELATION_TYPES[relation.type]) {
        addResult('ERROR', fileName, 'relations[' + index + '] unsupported type: ' + relation.type);
      }

      if (!isBlank(relation.source) && relation.source === relation.target) {
        addResult('ERROR', fileName, 'relations[' + index + '] source and target must differ: ' + relation.source);
      }
```

Replace the old duplicate key block:

```js
      key = relation.source + '__' + relation.target + '__' + relation.type;
```

with:

```js
      key = getUndirectedRelationKey(relation);
```

- [ ] **Step 7: Run people tests and data validation**

Run:

```bash
npx vitest run tests/people.test.js --environment jsdom
node scripts/validate-data.js
```

Expected:

```text
Test Files  1 passed
Summary: 15 OK, 0 WARN, 0 ERROR
```

- [ ] **Step 8: Commit the people acceptance slice**

Run:

```bash
git add index.html src/js/people.js scripts/validate-data.js tests/people.test.js
git commit -m "fix: finalize people graph acceptance"
```

Expected:

```text
[phase4-final-acceptance <hash>] fix: finalize people graph acceptance
```

---

## Task 4: Add timeline seed metadata and acceptance tests

**Files:**
- Modify: `src/data/timeline.json`
- Modify: `tests/timeline.test.js`
- Later modify: `src/js/timeline.js`

- [ ] **Step 1: Add explicit `id` and `dynasty` fields to timeline seed data**

Edit each existing event in `src/data/timeline.json` so it has an `id` and `dynasty`. Use these mappings:

```json
[
  { "id": "shangyang-reform", "dynasty": "qin", "name": "商鞅变法" },
  { "id": "qin-unification", "dynasty": "qin", "name": "秦统一" },
  { "id": "tui-en-ling", "dynasty": "han", "name": "推恩令" },
  { "id": "zhang-qian-west", "dynasty": "han", "name": "张骞西域" },
  { "id": "keju-created", "dynasty": "suitang", "name": "科举创立" },
  { "id": "zhenguan-rule", "dynasty": "suitang", "name": "贞观之治" },
  { "id": "an-shi-rebellion", "dynasty": "suitang", "name": "安史之乱" },
  { "id": "jiaozi-money", "dynasty": "song", "name": "交子出现" },
  { "id": "wang-anshi-reform", "dynasty": "song", "name": "王安石变法" },
  { "id": "zhu-yuanzhang-abolish-chancellor", "dynasty": "ming", "name": "朱元璋废相" },
  { "id": "zheng-he-voyages", "dynasty": "ming", "name": "郑和下西洋" },
  { "id": "grand-council", "dynasty": "qing", "name": "军机处设立" },
  { "id": "opium-war", "dynasty": "qing", "name": "鸦片战争" }
]
```

- [ ] **Step 2: Add five minimal seed events so every dynasty has at least three events**

Insert these event objects into the correct chronological positions in `src/data/timeline.json`:

```json
{
  "id": "junxian-system",
  "dynasty": "qin",
  "name": "郡县制推行",
  "year": "前221年后",
  "x": 112,
  "pol": 348,
  "eco": 338,
  "cul": 296,
  "description": "秦统一后在全国推行郡县制，地方长官由中央任免，削弱世袭贵族对地方的控制。",
  "conn": { "next": "推恩令", "pol": "郡县制成为后世中央集权的制度参照", "eco": "统一行政促进赋税与徭役征发", "cul": "制度统一推动大一统观念形成" }
},
{
  "id": "confucian-state-ideology",
  "dynasty": "han",
  "name": "独尊儒术",
  "year": "前134年",
  "x": 150,
  "pol": 328,
  "eco": 318,
  "cul": 268,
  "description": "汉武帝采纳董仲舒建议，提升儒学为国家意识形态，强化皇权与士人政治秩序。",
  "conn": { "next": "科举创立", "pol": "儒家官僚政治为选官制度提供价值基础", "eco": "稳定秩序有利于国家财政组织", "cul": "经学教育成为士人入仕核心路径" }
},
{
  "id": "neo-confucianism-rise",
  "dynasty": "song",
  "name": "理学兴起",
  "year": "11世纪",
  "x": 278,
  "pol": 188,
  "eco": 178,
  "cul": 160,
  "description": "北宋以来理学逐渐形成，士大夫以义理重构儒学，影响后世教育、科举与社会伦理。",
  "conn": { "next": "朱元璋废相", "pol": "理学伦理强化君臣纲常", "eco": "宗族与乡约秩序参与基层治理", "cul": "儒学解释体系更加严密" }
},
{
  "id": "ming-cabinet-forms",
  "dynasty": "ming",
  "name": "内阁形成",
  "year": "15世纪初",
  "x": 330,
  "pol": 142,
  "eco": 146,
  "cul": 132,
  "description": "明代废相后以内阁协助皇帝处理政务，内阁票拟逐渐成为中央决策的重要环节。",
  "conn": { "next": "军机处设立", "pol": "皇权直控政务的趋势继续加强", "eco": "行政集中影响财政调度", "cul": "文官集团围绕奏章制度运转" }
},
{
  "id": "gaitu-guiliu",
  "dynasty": "qing",
  "name": "改土归流",
  "year": "1726年前后",
  "x": 350,
  "pol": 112,
  "eco": 116,
  "cul": 106,
  "description": "清代在西南等地推进改土归流，以流官替代世袭土司，加强中央对边疆地区的直接治理。",
  "conn": { "next": "鸦片战争", "pol": "边疆治理纳入中央行政体系", "eco": "区域开发与税收管理加强", "cul": "国家制度深入多民族地区" }
}
```

- [ ] **Step 3: Add timeline detail and connection tests**

Append these tests inside `describe('timeline module drag and zoom bounds', () => { ... })` in `tests/timeline.test.js`:

```js
  test('node and causal detail APIs open safe detail content', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);

    window.timelineAPI.showTimelineDetail(0);
    expect(window.openFeatDet).toHaveBeenCalledWith('📅 秦统一（前221年）', '秦灭六国。');

    window.timelineAPI.showTimelineConn(0, 'pol');
    expect(window.openFeatDet).toHaveBeenLastCalledWith(
      '🔗 秦统一 → 文景之治',
      expect.stringContaining('🏛️ 政治影响')
    );
  });

  test('detail APIs safely no-op for invalid indexes or missing modal API', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);

    expect(() => window.timelineAPI.showTimelineDetail(99)).not.toThrow();
    expect(() => window.timelineAPI.showTimelineConn(99, 'pol')).not.toThrow();

    delete window.openFeatDet;
    expect(() => window.timelineAPI.showTimelineDetail(0)).not.toThrow();
    expect(() => window.timelineAPI.showTimelineConn(0, 'pol')).not.toThrow();
  });
```

- [ ] **Step 4: Add timeline dynasty filtering and prev/next reset tests**

Append these tests in the same describe block:

```js
  test('filters rendered events by the selected dynasty', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setDynasties(['qin', 'han', 'suitang']);
    window.timelineAPI.setTimelineEvents(EVENTS);

    window.timelineAPI.selDyn('han', document.querySelectorAll('#dynasty-tabs .dtab')[1]);

    expect(window.timelineAPI.getTimelineState().eventCount).toBe(1);
    expect(document.getElementById('event-list').textContent).toContain('文景之治');
    expect(document.getElementById('event-list').textContent).not.toContain('秦统一');
  });

  test('prevDyn and nextDyn wrap through dynasties and reset the view', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setDynasties(['qin', 'han', 'suitang']);
    window.timelineAPI.setTimelineEvents(EVENTS);

    window.timelineAPI.zoomTL(1);
    window.timelineAPI.pointerDown({ clientX: 0, clientY: 0, preventDefault: vi.fn() });
    window.timelineAPI.pointerMove({ clientX: 80, clientY: 60, preventDefault: vi.fn() });
    window.timelineAPI.pointerUp();

    window.timelineAPI.prevDyn();
    expect(window.timelineAPI.getTimelineState()).toMatchObject({ currentDynasty: 'suitang', zoom: 0, offsetX: 0, offsetY: 0 });

    window.timelineAPI.nextDyn();
    expect(window.timelineAPI.getTimelineState()).toMatchObject({ currentDynasty: 'qin', zoom: 0, offsetX: 0, offsetY: 0 });
  });
```

- [ ] **Step 5: Add timeline event delegation and XSS tests**

Append these tests in the same describe block:

```js
  test('rendered nodes and causal lines use data attributes and delegated clicks', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents(EVENTS);
    window.timelineAPI.renderTimeline();
    window.timelineAPI.renderEventList();

    document.querySelector('#coord-chart .tlevt').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(window.openFeatDet).toHaveBeenCalledWith('📅 秦统一（前221年）', '秦灭六国。');

    document.querySelector('#coord-chart .tldash[data-dim="pol"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(window.openFeatDet).toHaveBeenLastCalledWith('🔗 秦统一 → 文景之治', expect.stringContaining('中央制度延续'));

    document.querySelector('#event-list .evitem').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(window.openFeatDet).toHaveBeenLastCalledWith('📅 秦统一（前221年）', '秦灭六国。');
  });

  test('escapes timeline JSON fields before rendering list and chart HTML', async () => {
    await import('../src/js/timeline.js');
    window.timelineAPI.setTimelineEvents([
      {
        dynasty: 'qin',
        name: '<img src=x onerror="window.__timelineNameXss=true">',
        year: '<script>window.__timelineYearXss=true</script>',
        x: 100,
        pol: 350,
        eco: 340,
        cul: 310,
        description: '<img src=x onerror="window.__timelineDescXss=true">',
        conn: { next: '<img src=x onerror="window.__timelineConnXss=true">', pol: '<b>政治</b>', eco: '<b>经济</b>', cul: '<b>文化</b>' }
      }
    ]);

    window.timelineAPI.renderTimeline();
    window.timelineAPI.renderEventList();

    expect(document.querySelector('#coord-chart img')).toBeNull();
    expect(document.querySelector('#coord-chart script')).toBeNull();
    expect(document.querySelector('#event-list img')).toBeNull();
    expect(document.getElementById('coord-chart').innerHTML).toContain('&lt;img src=x');
    expect(document.getElementById('event-list').innerHTML).toContain('&lt;img src=x');
    expect(window.__timelineNameXss).toBeUndefined();
    expect(window.__timelineYearXss).toBeUndefined();
    expect(window.__timelineDescXss).toBeUndefined();
    expect(window.__timelineConnXss).toBeUndefined();
  });
```

- [ ] **Step 6: Run timeline tests and verify delegation test fails before implementation**

Run:

```bash
npx vitest run tests/timeline.test.js --environment jsdom
```

Expected pre-implementation failure:

```text
expected "spy" to be called with arguments: [ '📅 秦统一（前221年）', '秦灭六国。' ]
```

The failure appears because jsdom dispatching a click does not execute inline `onclick` strings inserted by `innerHTML`.

---

## Task 5: Harden timeline implementation

**Files:**
- Modify: `src/js/timeline.js`
- Test: `tests/timeline.test.js`

- [ ] **Step 1: Add delegated timeline click binding helpers**

Insert these helpers above `bindTimelineDrag()` in `src/js/timeline.js`:

```js
  function findClosestWithClass(node, className) {
    while (node && node !== document) {
      if (node.classList && node.classList.contains(className)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  function bindTimelineClicks() {
    var chart = document.getElementById('coord-chart');
    var eventList = document.getElementById('event-list');

    if (chart && chart.getAttribute('data-click-bound') !== 'true') {
      chart.setAttribute('data-click-bound', 'true');
      chart.addEventListener('click', function (event) {
        var dash = findClosestWithClass(event.target, 'tldash');
        var node = findClosestWithClass(event.target, 'tlevt');
        if (dash) {
          showTimelineConn(Number(dash.getAttribute('data-i')), dash.getAttribute('data-dim'));
          return;
        }
        if (node) {
          showTimelineDetail(Number(node.getAttribute('data-i')));
        }
      });
    }

    if (eventList && eventList.getAttribute('data-click-bound') !== 'true') {
      eventList.setAttribute('data-click-bound', 'true');
      eventList.addEventListener('click', function (event) {
        var item = findClosestWithClass(event.target, 'evitem');
        if (item) {
          showTimelineDetail(Number(item.getAttribute('data-i')));
        }
      });
    }
  }
```

- [ ] **Step 2: Harden detail and connection APIs**

Replace `showTimelineDetail(idx)` with:

```js
  function showTimelineDetail(idx) {
    var e = getVisibleEvents()[idx] || timelineEvents[idx];
    if (!e || typeof window.openFeatDet !== 'function') return false;
    window.openFeatDet('📅 ' + (e.name || '') + '（' + (e.year || '') + '）', e.description || '');
    return true;
  }
```

Replace `showTimelineConn(idx, dim)` with:

```js
  function showTimelineConn(idx, dim) {
    var e = getVisibleEvents()[idx] || timelineEvents[idx];
    var dimMap = { pol: '🏛️ 政治影响', eco: '💰 经济影响', cul: '📚 文化影响' };
    var label = dimMap[dim] || '影响';
    var text;

    if (!e || !e.conn || typeof window.openFeatDet !== 'function') return false;
    text = '从【' + (e.name || '') + '】到【' + (e.conn.next || '') + '】\n\n' + label + '：\n' + (e.conn[dim] || '暂无说明');
    window.openFeatDet('🔗 ' + (e.name || '') + ' → ' + (e.conn.next || ''), text);
    return true;
  }
```

- [ ] **Step 3: Remove generated inline `onclick` from timeline SVG and list HTML**

In `renderTimeline()`, call `bindTimelineClicks()` immediately after `bindTimelineDrag();`:

```js
    bindTimelineDrag();
    bindTimelineClicks();
```

Replace the three `.tldash` string appends with versions that do not include `onclick`:

```js
      s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.pol, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.pol, 0) + '" stroke="#C0392B" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="pol" style="cursor:pointer"/>';
      s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.eco, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.eco, 0) + '" stroke="#27AE60" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="eco" style="cursor:pointer"/>';
      s += '<line x1="' + safeNumber(a.x, 0) + '" y1="' + safeNumber(a.cul, 0) + '" x2="' + safeNumber(b.x, 0) + '" y2="' + safeNumber(b.cul, 0) + '" stroke="#8B6914" stroke-width="1" stroke-dasharray="5,3" opacity="0.4" class="tldash" data-i="' + i + '" data-dim="cul" style="cursor:pointer"/>';
```

Replace the event circle string with:

```js
      s += '<circle cx="' + safeNumber(d.x, 0) + '" cy="' + safeNumber(d.pol, 0) + '" r="6" fill="#C0392B" opacity="0.85" stroke="#fff" stroke-width="1" class="tlevt" data-i="' + index + '" style="cursor:pointer"/>';
```

In `renderEventList()`, call `bindTimelineClicks()` before `events.forEach(...)`:

```js
    bindTimelineClicks();
```

Replace the list item string with:

```js
      h += '<div class="evitem" data-i="' + i + '"><div class="evdot pol"></div><div class="evtxt"><h5>' + escapeHtml(d.name) + ' <span class="evyr">' + escapeHtml(d.year) + '</span></h5><div class="evdesc">' + escapeHtml(d.description) + '</div></div></div>';
```

- [ ] **Step 4: Run timeline tests**

Run:

```bash
npx vitest run tests/timeline.test.js --environment jsdom
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 5: Run timeline data validation**

Run:

```bash
node scripts/validate-data.js
```

Expected:

```text
Summary: 15 OK, 0 WARN, 0 ERROR
```

- [ ] **Step 6: Commit the timeline acceptance slice**

Run:

```bash
git add src/js/timeline.js src/data/timeline.json tests/timeline.test.js
git commit -m "fix: finalize timeline interaction acceptance"
```

Expected:

```text
[phase4-final-acceptance <hash>] fix: finalize timeline interaction acceptance
```

---

## Task 6: Remove hardcoded mindmap preset nodes and add acceptance tests

**Files:**
- Modify: `index.html:156-190`
- Modify: `tests/mindmap.test.js`
- Modify: `src/js/mindmap.js`

- [ ] **Step 1: Add static HTML regression coverage for JSON-only mindmap presets**

Add Node file reading helpers to the top of `tests/mindmap.test.js`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
```

Append this test inside `describe('mindmap module', () => { ... })`:

```js
  test('index.html keeps mindmap preset containers empty for JSON-driven rendering', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

    expect(html).toContain('<div id="mm-china" class="mc" style="position:relative;height:450px"></div>');
    expect(html).toContain('<div id="mm-world" class="mc" style="display:none;position:relative;height:450px"></div>');
    expect(html).not.toContain('onclick="openNode(\'中国通史\')"');
    expect(html).not.toContain('onclick="openNode(\'世界史\')"');
  });
```

- [ ] **Step 2: Replace hardcoded mindmap preset content in `index.html`**

Replace the current `#mm-china` block with:

```html
<div id="mm-china" class="mc" style="position:relative;height:450px"></div>
```

Replace the current `#mm-world` block with:

```html
<div id="mm-world" class="mc" style="display:none;position:relative;height:450px"></div>
```

Leave this custom container unchanged unless its formatting is touched by the edit:

```html
<div id="mm-custom" class="mc" style="display:none;height:450px"></div>
```

- [ ] **Step 3: Add global compatibility, close, render-all, empty, and custom tests**

Append these tests inside `describe('mindmap module', () => { ... })`:

```js
  test('exposes global compatibility functions for existing inline event calls', async () => {
    await import('../src/js/mindmap.js');

    expect(window.swMind).toBe(window.mindmapAPI.swMind);
    expect(window.openNode).toBe(window.mindmapAPI.openNode);
    expect(window.saveNode).toBe(window.mindmapAPI.saveNode);
    expect(window.closeNodeNote).toBe(window.mindmapAPI.closeNodeNote);
  });

  test('closeNodeNote hides the note panel', async () => {
    await import('../src/js/mindmap.js');
    document.getElementById('node-note-panel').style.display = 'flex';

    window.mindmapAPI.closeNodeNote();

    expect(document.getElementById('node-note-panel').style.display).toBe('none');
  });

  test('renderAllMindmaps renders every configured preset map', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData(MINDMAPS);

    window.mindmapAPI.renderAllMindmaps();

    expect(document.querySelectorAll('#mm-china .mn')).toHaveLength(3);
    expect(document.querySelectorAll('#mm-world .mn')).toHaveLength(2);
  });

  test('renders empty state for missing map data', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData({ maps: { china: { id: 'china', nodes: [] } } });

    window.mindmapAPI.renderMindmap('china');

    expect(document.getElementById('mm-china').textContent).toContain('暂无导图数据');
  });

  test('custom tab shows a disabled preview instead of a development toast', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData(MINDMAPS);

    window.mindmapAPI.swMind(document.querySelectorAll('#mindmap-tabs .mtab')[2], 'custom');

    expect(document.querySelectorAll('#mindmap-tabs .mtab')[2].classList.contains('act')).toBe(true);
    expect(document.getElementById('mm-custom').style.display).toBe('flex');
    expect(document.getElementById('mm-custom').textContent).toContain('自定义导图编辑器将在后续版本开放');
    expect(window.navigationAPI.showToast).not.toHaveBeenCalledWith(expect.stringContaining('开发中'));
  });
```

- [ ] **Step 4: Add expanded XSS coverage for mindmap attributes**

Append this test in the same describe block:

```js
  test('escapes node ids and coordinates before writing HTML attributes', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData({ maps: { china: { id: 'china', nodes: [
      { id: 'evil" onclick="window.__mindIdXss=true', label: '安全标签', root: true, x: '10" onmouseover="window.__mindXXss=true', y: '20" onmouseover="window.__mindYXss=true' }
    ] } } });

    window.mindmapAPI.renderMindmap('china');

    expect(document.getElementById('mm-china').querySelector('[onclick]')).toBeNull();
    expect(document.getElementById('mm-china').innerHTML).not.toContain('window.__mindIdXss=true');
    expect(document.getElementById('mm-china').innerHTML).not.toContain('window.__mindXXss=true');
    expect(document.getElementById('mm-china').innerHTML).not.toContain('window.__mindYXss=true');
    expect(window.__mindIdXss).toBeUndefined();
    expect(window.__mindXXss).toBeUndefined();
    expect(window.__mindYXss).toBeUndefined();
  });
```

- [ ] **Step 5: Harden mindmap numeric rendering in `src/js/mindmap.js`**

Insert this helper below `escapeHtml(value)`:

```js
  function safeNumber(value, fallbackValue) {
    var num = Number(value);
    return isFinite(num) ? num : fallbackValue;
  }
```

Replace `renderLinks(nodes)` with:

```js
  function renderLinks(nodes) {
    var byId = {};
    var links = '';

    nodes.forEach(function (node) {
      byId[node.id] = node;
    });

    nodes.forEach(function (node) {
      var parent = node.parent ? byId[node.parent] : null;
      if (!parent) return;
      links += '<line x1="' + (safeNumber(parent.x, 0) + 35) + '" y1="' + (safeNumber(parent.y, 0) + 35) + '" x2="' + (safeNumber(node.x, 0) + 35) + '" y2="' + (safeNumber(node.y, 0) + 35) + '" stroke="#D4A843" stroke-width="2"/>';
    });

    return '<svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none">' + links + '</svg>';
  }
```

In `renderMindmap(mapId)`, replace the node HTML line with:

```js
      return '<div class="' + cls + '" data-mindmap-node="' + escapeHtml(node.id || '') + '" style="left:' + safeNumber(node.x, 0) + 'px;top:' + safeNumber(node.y, 0) + 'px">' + escapeHtml(node.label || '') + '</div>';
```

- [ ] **Step 6: Run mindmap tests**

Run:

```bash
npx vitest run tests/mindmap.test.js --environment jsdom
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 7: Commit the mindmap acceptance slice**

Run:

```bash
git add index.html src/js/mindmap.js tests/mindmap.test.js
git commit -m "fix: finalize mindmap json acceptance"
```

Expected:

```text
[phase4-final-acceptance <hash>] fix: finalize mindmap json acceptance
```

---

## Task 7: Add app data wiring acceptance coverage

**Files:**
- Modify: `tests/app-static-data.test.js`
- Inspect: `src/js/app.js`

- [ ] **Step 1: Add module mocks for people and mindmap APIs in the test setup**

In `tests/app-static-data.test.js`, add these mocks inside `beforeEach`, after the existing `window.timelineAPI` assignment:

```js
  window.peopleAPI = {
    setPeopleData: vi.fn(),
    renderPeopleGraph: vi.fn()
  };
  window.mindmapAPI = {
    setMindmapData: vi.fn(),
    renderAllMindmaps: vi.fn(),
    swMind: vi.fn(),
    openNode: vi.fn(),
    saveNode: vi.fn(),
    closeNodeNote: vi.fn()
  };
```

- [ ] **Step 2: Add a data-loader wiring test for Phase 4 modules**

Append this test inside `describe('app static content data wiring', () => { ... })`:

```js
  test('loads people and mindmap datasets into Phase 4 modules', async () => {
    const people = { people: [{ id: 'wu-zetian', name: '武则天' }], relations: [] };
    const mindmaps = { maps: { china: { id: 'china', nodes: [] } } };

    global.fetch = vi.fn(async (path) => {
      if (path.endsWith('nouns.json')) return { ok: true, json: async () => ({}) };
      if (path.endsWith('timeline.json')) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
      if (path.endsWith('people.json')) return { ok: true, json: async () => people };
      if (path.endsWith('mindmaps.json')) return { ok: true, json: async () => mindmaps };
      if (path.endsWith('podcasts.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('films.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('rankings.json')) return { ok: true, json: async () => ({ book: [], film: [], doc: [] }) };
      return { ok: true, json: async () => [] };
    });

    await import('../src/js/app.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.peopleAPI.setPeopleData).toHaveBeenCalledWith(people);
    expect(window.peopleAPI.renderPeopleGraph).toHaveBeenCalled();
    expect(window.mindmapAPI.setMindmapData).toHaveBeenCalledWith(mindmaps);
    expect(window.mindmapAPI.renderAllMindmaps).toHaveBeenCalled();
  });
```

- [ ] **Step 3: Run app static data tests**

Run:

```bash
npx vitest run tests/app-static-data.test.js --environment jsdom
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 4: Commit the app wiring coverage slice**

Run:

```bash
git add tests/app-static-data.test.js
git commit -m "test: cover phase4 app data wiring"
```

Expected:

```text
[phase4-final-acceptance <hash>] test: cover phase4 app data wiring
```

---

## Task 8: Run cross-module automated verification

**Files:**
- Test: `tests/timeline.test.js`
- Test: `tests/people.test.js`
- Test: `tests/mindmap.test.js`
- Test: `tests/app-static-data.test.js`
- Test: `tests/adapter-wiring.test.js`
- Test: `scripts/validate-data.js`

- [ ] **Step 1: Run the Phase 4 acceptance bundle**

Run:

```bash
npx vitest run tests/timeline.test.js tests/people.test.js tests/mindmap.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom
```

Expected:

```text
Test Files  5 passed
```

- [ ] **Step 2: Run data validation**

Run:

```bash
node scripts/validate-data.js
```

Expected:

```text
Summary: 15 OK, 0 WARN, 0 ERROR
```

- [ ] **Step 3: Run full regression tests**

Run:

```bash
npx vitest run --environment jsdom
```

Expected:

```text
Test Files  all passed
Tests       all passed
```

- [ ] **Step 4: Check whitespace and conflict markers**

Run:

```bash
git diff --check
```

Expected: no output.

---

## Task 9: Browser smoke verification

**Files:**
- Inspect through browser: `index.html`
- Inspect through browser: `src/js/timeline.js`
- Inspect through browser: `src/js/people.js`
- Inspect through browser: `src/js/mindmap.js`

- [ ] **Step 1: Start local static server**

Run:

```bash
python -m http.server 8000
```

Expected:

```text
Serving HTTP on :: port 8000
```

Keep the server running for the next steps.

- [ ] **Step 2: Verify timeline interactions in browser**

Open `http://localhost:8000`, navigate to the timeline page, and verify:

```text
1. 连续点击放大 20 次，视图停留在最大缩放状态，页面不报错。
2. 连续点击缩小 20 次，视图停留在最小缩放状态，页面不报错。
3. 鼠标拖拽时间轴，节点不会全部离开可视区域。
4. 切换朝代后，缩放和拖拽偏移恢复默认状态。
5. 点击红色事件节点，详情浮层展示事件名称、年份和描述。
6. 点击虚线连接，详情浮层展示政治、经济或文化影响说明。
```

- [ ] **Step 3: Verify people graph interactions in browser**

Navigate to the people page and verify:

```text
1. 默认中心人物展示，周围人物与关系线正常渲染。
2. 点击周围人物后，该人物成为中心并展示详情。
3. 点击关系线后，详情卡展示关系说明。
4. 依次切换 全部 / 事业 / 亲属 / 师友 / 政治，关系线和人物列表随筛选变化。
5. 搜索已收录人物名称，中心人物切换并显示 toast。
6. 浏览器控制台没有 center-name、renderRel 或 peoData 相关错误。
```

- [ ] **Step 4: Verify mindmap interactions in browser**

Navigate to the mindmap page and verify:

```text
1. 中国通史和世界国别史导图由 JSON 渲染出节点和连线。
2. 点击节点打开笔记面板。
3. 输入笔记并保存后关闭面板。
4. 再次点击同一节点，笔记内容被读回。
5. 切换到“＋ 新建导图”，按钮置灰式展示预告内容，没有“点击后弹开发中”的伪入口 toast。
6. 浏览器控制台没有 openNode、saveNode、closeNodeNote 相关错误。
```

- [ ] **Step 5: Stop local server**

Stop the server with `Ctrl+C` in the terminal that is running it.

---

## Task 10: Write final acceptance report and changelog summary

**Files:**
- Create: `docs/superpowers/reports/2026-06-12-phase4-final-acceptance-report.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Create final acceptance report**

Create `docs/superpowers/reports/2026-06-12-phase4-final-acceptance-report.md` with this structure and fill every command result from the actual run:

```markdown
# Phase 4 最终验收报告

## 1. 验收范围

- Task 4.1：时间轴 Demo。
- Task 4.2：人物关系图 Demo。
- Task 4.3：思维导图 Demo。

## 2. 自动测试结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `npx vitest run tests/timeline.test.js tests/people.test.js tests/mindmap.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom` | PASS | Phase 4 模块、app 数据接线与 adapter 接线通过。 |
| `node scripts/validate-data.js` | PASS | 数据校验为 0 ERROR、0 WARN。 |
| `npx vitest run --environment jsdom` | PASS | 全量 jsdom 回归测试通过。 |
| `git diff --check` | PASS | 无空白错误或冲突标记。 |

## 3. Task 4.1 时间轴验收

| 验收项 | 结论 | 证据 |
|--------|------|------|
| 连续放大/缩小被限制在 -3 到 3 | PASS | `tests/timeline.test.js` zoom clamp 用例。 |
| 鼠标拖拽边界 | PASS | `tests/timeline.test.js` pointer drag clamp 用例。 |
| 触摸拖拽边界 | PASS | `tests/timeline.test.js` touch drag clamp 用例。 |
| 切换朝代重置缩放与偏移 | PASS | `selDyn`、`prevDyn`、`nextDyn` 测试。 |
| 点击节点展示详情 | PASS | 事件委托点击测试与浏览器 smoke。 |
| 点击虚线展示因果关系 | PASS | causal line 点击测试与浏览器 smoke。 |
| 空数据安全降级 | PASS | 空事件列表测试。 |
| JSON 字段转义 | PASS | timeline XSS 回归测试。 |

## 4. Task 4.2 人物关系图验收

| 验收项 | 结论 | 证据 |
|--------|------|------|
| 图结构数据 | PASS | `people.json` 与 `validate-data.js`。 |
| 10-15 人种子数据 | PASS | `people.json` 当前 12 人。 |
| 点击人物居中并展示详情 | PASS | `tests/people.test.js` 点击人物用例与浏览器 smoke。 |
| 点击关系线展示说明 | PASS | `tests/people.test.js` relation line 用例与浏览器 smoke。 |
| 关系筛选 | PASS | all/career/family/teacher/political 筛选测试。 |
| 空数据与孤立人物 | PASS | `tests/people.test.js` 边界用例。 |
| 重复和无效关系校验 | PASS | `peopleAPI` 与 `validate-data.js`。 |
| 旧内联实现移除 | PASS | 静态 HTML 回归测试。 |
| JSON 字段转义 | PASS | people XSS 回归测试。 |

## 5. Task 4.3 思维导图验收

| 验收项 | 结论 | 证据 |
|--------|------|------|
| 内联函数迁移到模块 | PASS | `mindmapAPI` 全局兼容函数测试。 |
| 预置导图 JSON 驱动 | PASS | 静态 HTML 回归测试与 renderAllMindmaps 测试。 |
| 节点笔记打开/关闭 | PASS | openNode 与 closeNodeNote 测试。 |
| 笔记通过 storageAPI 持久化 | PASS | saveNode adapter 调用测试与浏览器 smoke。 |
| 重新打开节点读回笔记 | PASS | storage restore 测试与浏览器 smoke。 |
| 空导图安全降级 | PASS | empty map 测试。 |
| JSON 字段转义 | PASS | mindmap XSS 回归测试。 |

## 6. 浏览器 smoke 结果

- 时间轴：PASS。
- 人物关系图：PASS。
- 思维导图：PASS。
- 控制台阻断错误：未发现。

## 7. 剩余风险

- 移动端真机触摸手感仍建议在后续发布前用真实设备复核。
- Phase 5 内容扩充前应继续保持种子数据规模，不在本任务中扩充到规划容量。
```

When a browser item cannot be executed in the current environment, write `NOT RUN` for that row and add the exact reason in section 7. Do not mark `NOT RUN` items as accepted.

- [ ] **Step 2: Add CHANGELOG summary**

At the top of the `## 2026-06-12` section in `CHANGELOG.md`, add:

```markdown
### Phase 4 最终验收补齐

- 移除人物关系图残留内联实现，避免覆盖 `peopleAPI` 模块函数。
- 时间轴事件补齐 `id` / `dynasty` 字段与每个重点朝代最少 3 条 Demo 种子事件，并改为通过事件委托处理节点与因果线点击。
- 思维导图预置节点改为完全由 `mindmaps.json` 渲染，`index.html` 仅保留容器。
- 补充 Phase 4 最终验收报告：`docs/superpowers/reports/2026-06-12-phase4-final-acceptance-report.md`。
- 新增/扩展回归测试覆盖旧内联实现移除、关系筛选、XSS、JSON 数据接线、导图持久化与时间轴交互边界。

#### 验证

- `npx vitest run tests/timeline.test.js tests/people.test.js tests/mindmap.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom`：通过。
- `node scripts/validate-data.js`：通过，`0 WARN`、`0 ERROR`。
- `npx vitest run --environment jsdom`：通过。
- `git diff --check`：通过。
```

- [ ] **Step 3: Commit report and changelog**

Run:

```bash
git add docs/superpowers/reports/2026-06-12-phase4-final-acceptance-report.md CHANGELOG.md
git commit -m "docs: record phase4 final acceptance"
```

Expected:

```text
[phase4-final-acceptance <hash>] docs: record phase4 final acceptance
```

---

## Task 11: Final verification and handoff

**Files:**
- Inspect: `git status`
- Inspect: `git log --oneline -5`

- [ ] **Step 1: Run final verification commands once more**

Run:

```bash
npx vitest run tests/timeline.test.js tests/people.test.js tests/mindmap.test.js tests/app-static-data.test.js tests/adapter-wiring.test.js --environment jsdom
node scripts/validate-data.js
npx vitest run --environment jsdom
git diff --check
```

Expected:

```text
Phase 4 focused tests pass
Data validation reports 0 WARN and 0 ERROR
Full Vitest suite passes
git diff --check has no output
```

- [ ] **Step 2: Confirm working tree only has pre-existing out-of-scope untracked files**

Run:

```bash
git status --short
```

Expected:

```text
?? docs/学的是史.docx
?? docs/（temp）review for phase1's plan.md
?? resources/名词解释/
```

No tracked file should remain modified after the final commit.

- [ ] **Step 3: Capture final commits for user report**

Run:

```bash
git log --oneline -5
```

Expected: output includes these commit messages:

```text
docs: record phase4 final acceptance
fix: finalize mindmap json acceptance
test: cover phase4 app data wiring
fix: finalize timeline interaction acceptance
fix: finalize people graph acceptance
```

- [ ] **Step 4: Final response content**

Report these items to the user:

```text
1. Phase 4 final acceptance is complete.
2. Files changed: index.html, timeline module/data/tests, people module/validator/tests, mindmap module/tests, app data wiring test, acceptance report, CHANGELOG.
3. Verification commands and pass/fail results.
4. Commit hashes and messages.
5. Remaining risk: mobile true-device touch feel should be rechecked before public release when available.
```
