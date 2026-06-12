# 学的是史剩余内联脚本抽离与文档对齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为“学的是史”补上最小自动化测试基础，继续把 `index.html` 剩余业务内联脚本拆到 `src/js` / `src/data`，并让 README、重构报告与实际代码结构重新一致。

**Architecture:** 继续沿用当前原生静态站点架构：功能代码保持 IIFE + `window.*API` 模式，`src/js/app.js` 只负责编排、数据加载和全局兼容导出。新增最小测试底座使用 Vitest + jsdom，优先测试纯函数、数据注入与关键 DOM 交互，不引入构建工具。

**Tech Stack:** 原生 HTML、原生 JavaScript、JSON 静态数据、LocalStorage、Vitest、jsdom、Python 静态服务器、Git

---

## File Structure Map

### Existing files to modify

- Modify: `index.html`
  - 增加新模块 `<script>` 引用
  - 删除底部剩余业务内联脚本
  - 保留现有 DOM 结构、`id/class` 和内联 `onclick`
- Modify: `src/js/app.js`
  - 继续做编排层
  - 加载新增 JSON 数据
  - 暴露新增模块所需的全局函数
  - 调用新模块初始化入口
- Modify: `src/js/navigation.js`
  - 吸收 `swTab()` / `swSubTab()`
- Modify: `README.md`
  - 使目录结构、运行方式、模块现状与代码一致
- Modify: `docs/refactor-report.md`
  - 更新“仍保留在内联脚本中的内容”与测试结果

### New files to create

- Create: `package.json`
  - 最小测试脚本与 devDependencies
- Create: `tests/helpers/dom-test-utils.js`
  - 提供挂载 DOM、清理 DOM、小型 storage mock 辅助函数
- Create: `tests/navigation.test.js`
  - 覆盖页面切换与子页面切换
- Create: `tests/people.test.js`
  - 覆盖 people 数据注入、搜索、关系切换、详情渲染
- Create: `tests/study-tools.test.js`
  - 覆盖笔记保存/读取与签到统计
- Create: `tests/library.test.js`
  - 覆盖榜单渲染、反馈提交、待看栏空态
- Create: `src/js/memes.js`
  - 梗图详情弹层、轮播指示器、数据注入
- Create: `src/js/library.js`
  - 热点筛选、影视筛选、榜单、待看栏、反馈弹层
- Create: `src/js/people.js`
  - 人物关系网数据注入、SVG 渲染、详情卡、搜索、分组切换
- Create: `src/js/study-tools.js`
  - 思维导图笔记、特征详情弹层、讨论区、签到逻辑
- Create: `src/data/people.json`
  - 人物专题数据源
- Create: `docs/maintainability-review.md`
  - 当前可维护性审查结论与后续建议

### Files intentionally not changed in this round

- `docs/superpowers/specs/2026-06-07-history-learning-static-refactor-design.md`
  - 作为历史设计文档保留，不追写“当前状态”
- `src/js/noun.js`
- `src/js/timeline.js`
- `src/js/podcast.js`
- `src/js/ai-assistant.js`
- `src/js/favorites.js`
- `src/js/storage.js`
  - 除非实施中出现明确阻断，否则保持现状，只被新模块复用

---

## Task 1: 建立最小测试底座

**Files:**
- Create: `package.json`
- Create: `tests/helpers/dom-test-utils.js`

- [ ] **Step 1: 写出用于验证测试底座的失败测试**

Create `tests/navigation.test.js` with the first failing test:

```js
import { describe, expect, test, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = `
    <div id="login-page" class="page active"></div>
    <div id="home-page" class="page"></div>
    <div id="bnav" style="display:none"></div>
    <div id="ai-fab"></div>
    <div id="toast"></div>
  `;
});

describe('navigation baseline', () => {
  test('loads navigation module in test runtime', async () => {
    await import('../src/js/navigation.js');
    expect(window.navigationAPI).toBeDefined();
  });
});
```

- [ ] **Step 2: 运行测试并确认它因为缺少测试环境而失败**

Run:

```bash
npx vitest run tests/navigation.test.js
```

Expected: FAIL，错误类似 `Cannot find package 'vitest'` 或 `document is not defined`。

- [ ] **Step 3: 写入最小 `package.json`**

Write `package.json`:

```json
{
  "name": "history-learning",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run --environment jsdom",
    "test:watch": "vitest --environment jsdom"
  },
  "devDependencies": {
    "jsdom": "^26.1.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 4: 安装测试依赖**

Run:

```bash
npm install
```

Expected: 生成 `package-lock.json`，安装 `vitest` 与 `jsdom` 成功。

- [ ] **Step 5: 加入测试辅助工具**

Write `tests/helpers/dom-test-utils.js`:

```js
export function mountDOM(html) {
  document.body.innerHTML = html;
}

export function makeStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

export function resetGlobals() {
  document.body.innerHTML = '';
  delete window.navigationAPI;
  delete window.peopleAPI;
  delete window.studyToolsAPI;
  delete window.libraryAPI;
  delete window.memesAPI;
}
```

- [ ] **Step 6: 再次运行测试并确认转为通过**

Run:

```bash
npm test -- tests/navigation.test.js
```

Expected: PASS，`window.navigationAPI` 已定义。

- [ ] **Step 7: 提交测试底座**

Run:

```bash
git add package.json package-lock.json tests/helpers/dom-test-utils.js tests/navigation.test.js
git commit -m "test: add minimal vitest jsdom harness"
```

Expected: 成功提交测试底座。

---

## Task 2: 用 TDD 扩充导航模块并移出页面切换逻辑

**Files:**
- Modify: `src/js/navigation.js`
- Modify: `tests/navigation.test.js`

- [ ] **Step 1: 为 `swTab()` 写失败测试**

Append to `tests/navigation.test.js`:

```js
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';

beforeEach(() => {
  resetGlobals();
  mountDOM(`
    <div id="login-page" class="page active"></div>
    <div id="home-page" class="page"></div>
    <div id="node-note-panel" style="display:flex"></div>
    <div id="people-detail-card" class="act"></div>
    <div id="noun-detail" class="act"></div>
    <div id="bnav" style="display:none"></div>
    <div id="ai-fab" class="sh"></div>
    <button id="nav-btn" class="ni"></button>
  `);
  window.navigationAPI = undefined;
});

describe('swTab', () => {
  test('activates target page and resets overlays', async () => {
    await import('../src/js/navigation.js');
    window.navigationAPI.swTab(document.getElementById('nav-btn'), 'home-page');

    expect(document.getElementById('home-page').classList.contains('active')).toBe(true);
    expect(document.getElementById('node-note-panel').style.display).toBe('none');
    expect(document.getElementById('people-detail-card').classList.contains('act')).toBe(false);
    expect(document.getElementById('noun-detail').classList.contains('act')).toBe(false);
    expect(document.getElementById('bnav').style.display).toBe('flex');
    expect(document.getElementById('nav-btn').classList.contains('act')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run:

```bash
npm test -- tests/navigation.test.js
```

Expected: FAIL，错误类似 `window.navigationAPI.swTab is not a function`。

- [ ] **Step 3: 在导航模块中实现最小版本 `swTab()` 与 `swSubTab()`**

Update `src/js/navigation.js` by adding:

```js
function swTab(btn, pid) {
  document.querySelectorAll('.sub').forEach(function (panel) {
    panel.classList.remove('act');
  });
  document.querySelectorAll('.nd').forEach(function (panel) {
    panel.classList.remove('act');
  });
  var nodePanel = document.getElementById('node-note-panel');
  if (nodePanel) nodePanel.style.display = 'none';
  var peopleDetail = document.getElementById('people-detail-card');
  if (peopleDetail) peopleDetail.classList.remove('act');
  var nounDetail = document.getElementById('noun-detail');
  if (nounDetail) nounDetail.classList.remove('act');
  document.querySelectorAll('.page').forEach(function (page) {
    page.classList.remove('active');
  });
  document.querySelectorAll('.ni').forEach(function (nav) {
    nav.classList.remove('act');
  });
  var target = document.getElementById(pid);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('act');
  var af = document.getElementById('ai-fab');
  var bnav = document.getElementById('bnav');
  if (pid === 'login-page') {
    if (af) af.classList.remove('sh');
    if (bnav) bnav.style.display = 'none';
  } else {
    if (af) af.classList.add('sh');
    if (bnav) bnav.style.display = 'flex';
  }
  resetAIFab();
}

function swSubTab(btn, pageId) {
  document.querySelectorAll('.sub').forEach(function (panel) {
    panel.classList.remove('act');
  });
  var target = document.getElementById(pageId);
  if (target) target.classList.add('act');
  if (btn && !btn.classList.contains('act')) btn.classList.add('act');
}
```

And expose them:

```js
swTab: swTab,
swSubTab: swSubTab
```

- [ ] **Step 4: 运行测试并确认通过**

Run:

```bash
npm test -- tests/navigation.test.js
```

Expected: PASS。

- [ ] **Step 5: 提交导航抽离**

Run:

```bash
git add src/js/navigation.js tests/navigation.test.js
git commit -m "refactor: move page switching into navigation module"
```

Expected: 成功提交。

---

## Task 3: 抽离人物数据并实现 `people.js`

**Files:**
- Create: `src/data/people.json`
- Create: `src/js/people.js`
- Create: `tests/people.test.js`
- Modify: `src/js/app.js`

- [ ] **Step 1: 为人物模块写失败测试**

Write `tests/people.test.js`:

```js
import { beforeEach, describe, expect, test } from 'vitest';
import { makeStorageMock, mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

beforeEach(() => {
  resetGlobals();
  Object.defineProperty(window, 'localStorage', {
    value: makeStorageMock(),
    configurable: true
  });
  window.navigationAPI = { showToast() {} };
  mountDOM(`
    <input id="people-search-input" />
    <div id="center-name"></div>
    <svg id="relation-svg"><circle></circle><text></text></svg>
    <div id="people-detail-card"></div>
    <div id="pd-name"></div>
    <div id="pd-role"></div>
    <div id="pd-info"></div>
    <ul id="pd-deeds"></ul>
    <ul id="pd-year-table"></ul>
    <div id="pd-eval"><p></p></div>
  `);
});

describe('people module', () => {
  test('loads people data and renders center name', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData({
      '武则天': {
        name: '武则天',
        nick: '武曌',
        career: [{ name: '狄仁杰', role: '宰相', deeds: ['断案如神'] }],
        family: [],
        yearTable: ['690年 称帝'],
        evaluation: '唯一正统女皇帝'
      }
    });
    window.peopleAPI.renderRel();
    expect(document.getElementById('center-name').textContent).toBe('武则天');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/people.test.js
```

Expected: FAIL，错误类似 `Failed to resolve import '../src/js/people.js'`。

- [ ] **Step 3: 创建 `src/data/people.json`**

Create `src/data/people.json` by moving the current `peoData` object from `index.html` into JSON, preserving keys and fields:

```json
{
  "武则天": {
    "name": "武则天",
    "nick": "武曌、则天皇后",
    "career": [
      { "name": "狄仁杰", "role": "宰相", "deeds": ["断案如神", "劝立李显为太子"] }
    ],
    "family": [
      { "name": "李治", "role": "丈夫（唐高宗）", "deeds": ["在位34年", "废王立武"] }
    ],
    "yearTable": ["637年 生于利州", "690年 废唐建周，称帝"],
    "evaluation": "中国历史上唯一正统女皇帝。"
  }
}
```

Implementation note: 实施时应把现有 `index.html:698-705` 中所有人物完整迁入该文件，而不是只保留示例条目。

- [ ] **Step 4: 写最小 `src/js/people.js` 实现**

Write `src/js/people.js`:

```js
(function () {
  var peopleData = {};
  var curCenter = '武则天';
  var curGroup = 'career';

  function setPeopleData(data) {
    peopleData = data && typeof data === 'object' ? data : {};
    if (!peopleData[curCenter]) {
      var firstKey = Object.keys(peopleData)[0];
      if (firstKey) curCenter = firstKey;
    }
  }

  function renderRel() {
    var svg = document.getElementById('relation-svg');
    var data = peopleData[curCenter];
    if (!svg || !data) return;
    while (svg.children.length > 2) svg.removeChild(svg.lastChild);
    var list = curGroup === 'career' ? (data.career || []) : (data.family || []);
    var cx = 175, cy = 200, r = 140, l = list.length || 1;
    list.forEach(function (person, i) {
      var a = (2 * Math.PI * i / l) - Math.PI / 2;
      var px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', px);
      line.setAttribute('y2', py);
      svg.appendChild(line);
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', px);
      circle.setAttribute('cy', py);
      circle.setAttribute('r', '9');
      circle.onclick = function () {
        if (peopleData[person.name]) {
          curCenter = person.name;
          renderRel();
          if (window.navigationAPI) window.navigationAPI.showToast('已切换到：' + person.name);
        } else {
          openPeoDet(curCenter, person);
        }
      };
      svg.appendChild(circle);
    });
    document.getElementById('center-name').textContent = curCenter;
  }

  function openCenterDet() {
    var data = peopleData[curCenter];
    if (!data) return;
    openPeoDet(curCenter, {
      name: data.name,
      role: '核心人物',
      nick: data.nick || '',
      deeds: (data.yearTable || []).slice(0, 3)
    });
  }

  function openPeoDet(center, person) {
    var centerData = peopleData[center];
    var displayName = person.name + (person.nick ? '（' + person.nick + '）' : '');
    if (center === person.name && centerData && centerData.nick) {
      displayName = centerData.name + '（' + centerData.nick + '）';
    }
    document.getElementById('pd-name').textContent = displayName;
    document.getElementById('pd-role').textContent = person.role || '—';
    document.getElementById('pd-info').innerHTML = '<div class="ii"><div class="lbl">身份</div><div class="val">' + (person.role || '—') + '</div></div>';
    var deedList = document.getElementById('pd-deeds');
    deedList.innerHTML = '';
    (person.deeds || []).forEach(function (deed) {
      var li = document.createElement('li');
      li.textContent = deed;
      deedList.appendChild(li);
    });
    var yearTable = document.getElementById('pd-year-table');
    yearTable.innerHTML = '';
    (centerData && centerData.yearTable ? centerData.yearTable : []).forEach(function (row) {
      var li = document.createElement('li');
      li.textContent = row;
      yearTable.appendChild(li);
    });
    var evalBlock = document.getElementById('pd-eval');
    if (evalBlock && centerData && centerData.evaluation) {
      evalBlock.style.display = 'block';
      evalBlock.querySelector('p').textContent = centerData.evaluation;
    }
    document.getElementById('people-detail-card').classList.add('act');
  }

  function closePeoDet() {
    document.getElementById('people-detail-card').classList.remove('act');
  }

  function swPeoGroup(btn, group) {
    document.querySelectorAll('#people-page .dtab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    curGroup = group;
    renderRel();
  }

  function searchPeople() {
    var input = document.getElementById('people-search-input');
    var value = input ? input.value.trim() : '';
    if (peopleData[value]) {
      curCenter = value;
      renderRel();
      if (window.navigationAPI) window.navigationAPI.showToast('已切换到：' + value);
    } else if (value && window.navigationAPI) {
      window.navigationAPI.showToast('暂未收录，试试：' + Object.keys(peopleData).join('、'));
    }
  }

  window.peopleAPI = {
    setPeopleData: setPeopleData,
    renderRel: renderRel,
    openCenterDet: openCenterDet,
    openPeoDet: openPeoDet,
    closePeoDet: closePeoDet,
    swPeoGroup: swPeoGroup,
    searchPeople: searchPeople
  };
})();
```

- [ ] **Step 5: 在 `src/js/app.js` 加入 people 数据加载**

Insert in `initializeData()`:

```js
var people = await loadJSON('./src/data/people.json', {});
if (window.peopleAPI) {
  window.peopleAPI.setPeopleData(people);
  try { window.peopleAPI.renderRel(); } catch (e) { console.error('renderRel err:', e); }
}
```

And expose globals in `exposeGlobals()`:

```js
if (window.peopleAPI) {
  window.openCenterDet = window.peopleAPI.openCenterDet;
  window.openPeoDet = window.peopleAPI.openPeoDet;
  window.closePeoDet = window.peopleAPI.closePeoDet;
  window.swPeoGroup = window.peopleAPI.swPeoGroup;
  window.searchPeople = window.peopleAPI.searchPeople;
}
```

- [ ] **Step 6: 运行 people 测试并确认通过**

Run:

```bash
npm test -- tests/people.test.js
```

Expected: PASS。

- [ ] **Step 7: 提交人物模块与数据抽离**

Run:

```bash
git add src/data/people.json src/js/people.js src/js/app.js tests/people.test.js
git commit -m "refactor: extract people data and relationship module"
```

Expected: 成功提交。

---

## Task 4: 抽离学习工具模块并覆盖笔记/签到关键行为

**Files:**
- Create: `src/js/study-tools.js`
- Create: `tests/study-tools.test.js`
- Modify: `src/js/app.js`

- [ ] **Step 1: 为笔记保存写失败测试**

Write `tests/study-tools.test.js`:

```js
import { beforeEach, describe, expect, test } from 'vitest';
import { makeStorageMock, mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

beforeEach(() => {
  resetGlobals();
  Object.defineProperty(window, 'localStorage', {
    value: makeStorageMock(),
    configurable: true
  });
  window.storageAPI = {
    getStoredString(key, fallbackValue) {
      const value = window.localStorage.getItem(key);
      return value === null ? fallbackValue : value;
    },
    setStoredString(key, value) {
      window.localStorage.setItem(key, value);
      return true;
    },
    getStoredJSON(key, fallbackValue) {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallbackValue;
    },
    setStoredJSON(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
  };
  window.navigationAPI = { showToast() {} };
  mountDOM(`
    <div id="node-note-panel" style="display:none"></div>
    <div id="node-note-title"></div>
    <textarea id="node-note-input"></textarea>
    <div id="checkin-panel"></div>
    <div id="checkin-calendar"></div>
    <button id="checkin-btn"></button>
    <div id="ck-total"></div>
    <div id="stat-days"></div>
    <div id="stat-streak"></div>
    <div id="ck-streak"></div>
    <div id="ck-month"></div>
  `);
});

describe('study tools', () => {
  test('opens note panel with saved note content', async () => {
    window.localStorage.setItem('note_秦朝', '旧笔记');
    await import('../src/js/study-tools.js');
    window.studyToolsAPI.openNode('秦朝');
    expect(document.getElementById('node-note-input').value).toBe('旧笔记');
    expect(document.getElementById('node-note-panel').style.display).toBe('flex');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/study-tools.test.js
```

Expected: FAIL，错误类似 `Failed to resolve import '../src/js/study-tools.js'`。

- [ ] **Step 3: 创建学习工具模块的最小实现**

Write `src/js/study-tools.js`:

```js
(function () {
  var postTags = [];

  function swMind(btn, tab) {
    document.querySelectorAll('.mtab').forEach(function (item) {
      item.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    var china = document.getElementById('mm-china');
    var world = document.getElementById('mm-world');
    var custom = document.getElementById('mm-custom');
    if (china) china.style.display = tab === 'china' ? 'block' : 'none';
    if (world) world.style.display = tab === 'world' ? 'block' : 'none';
    if (custom) custom.style.display = tab === 'custom' ? 'flex' : 'none';
  }

  function openNode(name) {
    document.getElementById('node-note-title').textContent = '📝 ' + name + ' · 节点笔记';
    document.getElementById('node-note-input').value = window.storageAPI
      ? window.storageAPI.getStoredString('note_' + name, '')
      : '';
    document.getElementById('node-note-input').dataset.node = name;
    document.getElementById('node-note-panel').style.display = 'flex';
  }

  function saveNode() {
    var input = document.getElementById('node-note-input');
    var node = input.dataset.node;
    if (window.storageAPI) {
      window.storageAPI.setStoredString('note_' + node, input.value);
    }
    document.getElementById('node-note-panel').style.display = 'none';
    if (window.navigationAPI) window.navigationAPI.showToast('「' + node + '」的笔记已保存！');
  }

  function closeNodeNote() {
    document.getElementById('node-note-panel').style.display = 'none';
  }

  function openFeatDet(title, text) {
    document.getElementById('feat-det-title').textContent = title;
    document.getElementById('feat-det-text').textContent = text;
    document.getElementById('feat-detail-overlay').classList.add('act');
  }

  function closeFeatDet(e) {
    if (e.target === document.getElementById('feat-detail-overlay')) {
      document.getElementById('feat-detail-overlay').classList.remove('act');
    }
  }

  function openPost() {
    document.getElementById('post-overlay').classList.add('act');
  }

  function closePost(e) {
    if (e.target === document.getElementById('post-overlay')) {
      document.getElementById('post-overlay').classList.remove('act');
    }
  }

  function togglePostTag(btn, tag) {
    btn.classList.toggle('act');
    if (btn.classList.contains('act')) postTags.push(tag);
    else postTags = postTags.filter(function (item) { return item !== tag; });
  }

  function submitPost() {
    var title = document.getElementById('post-title').value.trim();
    var body = document.getElementById('post-body').value.trim();
    if (!title) {
      if (window.navigationAPI) window.navigationAPI.showToast('请输入帖子标题');
      return;
    }
    if (!body) {
      if (window.navigationAPI) window.navigationAPI.showToast('请输入帖子内容');
      return;
    }
    document.getElementById('post-overlay').classList.remove('act');
    document.getElementById('post-title').value = '';
    document.getElementById('post-body').value = '';
    document.querySelectorAll('#post-overlay .ft').forEach(function (item) {
      item.classList.remove('act');
    });
    postTags = [];
    if (window.navigationAPI) window.navigationAPI.showToast('帖子发布成功！');
  }

  function toggleComments(span) {
    var card = span.closest('.pcard');
    var list = card ? card.querySelector('.cmt-list') : null;
    if (list) list.style.display = list.style.display === 'none' ? 'block' : 'none';
  }

  function filterDiscuss(cat, btn) {
    document.querySelectorAll('#discuss-page .htabs .htab').forEach(function (item) {
      item.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
  }

  function openCheckin() {
    document.getElementById('checkin-panel').classList.add('act');
    renderCheckinCalendar();
  }

  function closeCheckin() {
    document.getElementById('checkin-panel').classList.remove('act');
  }

  function calcStreak(checkins) {
    var d = new Date();
    var streak = 0;
    while (true) {
      var ds = d.toISOString().slice(0, 10);
      if (checkins[ds]) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function updateCheckinStats() {
    var checkins = window.storageAPI ? window.storageAPI.getStoredJSON('checkins', {}) : {};
    var keys = Object.keys(checkins);
    var total = keys.length;
    var today = new Date().toISOString().slice(0, 10);
    var done = !!checkins[today];
    if (document.getElementById('ck-total')) document.getElementById('ck-total').textContent = total;
    if (document.getElementById('stat-days')) document.getElementById('stat-days').textContent = total;
    if (document.getElementById('stat-streak')) document.getElementById('stat-streak').textContent = calcStreak(checkins);
    if (document.getElementById('ck-streak')) document.getElementById('ck-streak').textContent = calcStreak(checkins);
    var monthCount = keys.filter(function (key) {
      return key.slice(0, 7) === today.slice(0, 7);
    }).length;
    if (document.getElementById('ck-month')) document.getElementById('ck-month').textContent = monthCount;
    if (done) {
      document.getElementById('checkin-btn').textContent = '✅ 已打卡';
      document.getElementById('checkin-btn').classList.add('done');
    }
  }

  function renderCheckinCalendar() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var checkins = window.storageAPI ? window.storageAPI.getStoredJSON('checkins', {}) : {};
    var html = '<div class="ckrow head"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div><div class="ckrow">';
    for (var i = 0; i < firstDay; i++) html += '<div></div>';
    for (var d = 1; d <= daysInMonth; d++) {
      var ds = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var cls = 'ckcell';
      if (checkins[ds]) cls += ' done';
      if (d === now.getDate()) cls += ' today';
      html += '<div class="' + cls + '">' + d + '</div>';
      if ((firstDay + d) % 7 === 0) html += '</div><div class="ckrow">';
    }
    html += '</div>';
    document.getElementById('checkin-calendar').innerHTML = html;
    updateCheckinStats();
  }

  function doCheckin() {
    var today = new Date().toISOString().slice(0, 10);
    var checkins = window.storageAPI ? window.storageAPI.getStoredJSON('checkins', {}) : {};
    if (checkins[today]) {
      if (window.navigationAPI) window.navigationAPI.showToast('今日已打卡，明天继续加油！');
      return;
    }
    checkins[today] = true;
    if (window.storageAPI) window.storageAPI.setStoredJSON('checkins', checkins);
    document.getElementById('checkin-btn').textContent = '✅ 已打卡';
    document.getElementById('checkin-btn').classList.add('done');
    updateCheckinStats();
    if (window.navigationAPI) window.navigationAPI.showToast('打卡成功！连续学习，历史达人就是你！');
  }

  window.studyToolsAPI = {
    swMind: swMind,
    openNode: openNode,
    saveNode: saveNode,
    closeNodeNote: closeNodeNote,
    openFeatDet: openFeatDet,
    closeFeatDet: closeFeatDet,
    openPost: openPost,
    closePost: closePost,
    togglePostTag: togglePostTag,
    submitPost: submitPost,
    toggleComments: toggleComments,
    filterDiscuss: filterDiscuss,
    openCheckin: openCheckin,
    closeCheckin: closeCheckin,
    doCheckin: doCheckin,
    renderCheckinCalendar: renderCheckinCalendar,
    updateCheckinStats: updateCheckinStats,
    calcStreak: calcStreak
  };
})();
```

- [ ] **Step 4: 在 `app.js` 暴露学习工具全局函数**

Add to `exposeGlobals()`:

```js
if (window.studyToolsAPI) {
  window.swMind = window.studyToolsAPI.swMind;
  window.openNode = window.studyToolsAPI.openNode;
  window.saveNode = window.studyToolsAPI.saveNode;
  window.closeNodeNote = window.studyToolsAPI.closeNodeNote;
  window.openFeatDet = window.studyToolsAPI.openFeatDet;
  window.closeFeatDet = window.studyToolsAPI.closeFeatDet;
  window.openPost = window.studyToolsAPI.openPost;
  window.closePost = window.studyToolsAPI.closePost;
  window.togglePostTag = window.studyToolsAPI.togglePostTag;
  window.submitPost = window.studyToolsAPI.submitPost;
  window.toggleComments = window.studyToolsAPI.toggleComments;
  window.filterDiscuss = window.studyToolsAPI.filterDiscuss;
  window.openCheckin = window.studyToolsAPI.openCheckin;
  window.closeCheckin = window.studyToolsAPI.closeCheckin;
  window.doCheckin = window.studyToolsAPI.doCheckin;
}
```

And add to `initializeApp()`:

```js
if (window.studyToolsAPI) {
  try { window.studyToolsAPI.updateCheckinStats(); } catch (e) { console.error('updateCheckinStats err:', e); }
}
```

- [ ] **Step 5: 运行测试并确认通过**

Run:

```bash
npm test -- tests/study-tools.test.js
```

Expected: PASS。

- [ ] **Step 6: 提交学习工具模块**

Run:

```bash
git add src/js/study-tools.js src/js/app.js tests/study-tools.test.js
git commit -m "refactor: extract study tools and checkin logic"
```

Expected: 成功提交。

---

## Task 5: 抽离 `library.js` 并用 `books.json` 驱动榜单

**Files:**
- Create: `src/js/library.js`
- Create: `tests/library.test.js`
- Modify: `src/js/app.js`

- [ ] **Step 1: 为榜单渲染写失败测试**

Write `tests/library.test.js`:

```js
import { beforeEach, describe, expect, test } from 'vitest';
import { makeStorageMock, mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

beforeEach(() => {
  resetGlobals();
  Object.defineProperty(window, 'localStorage', {
    value: makeStorageMock(),
    configurable: true
  });
  window.navigationAPI = { showToast() {} };
  window.storageAPI = {
    getStoredJSON(key, fallbackValue) {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallbackValue;
    },
    setStoredJSON(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
  };
  mountDOM(`
    <div id="rnk-list"></div>
    <div id="watchlist-panel"></div>
    <div id="wl-list"></div>
    <div id="feedback-overlay"></div>
    <textarea id="feedback-text"></textarea>
  `);
});

describe('library module', () => {
  test('renders book ranking list from injected data', async () => {
    await import('../src/js/library.js');
    window.libraryAPI.setRankingData({
      book: [{ title: '万历十五年', sub: '黄仁宇 著', score: '9.0', idx: 1 }]
    });
    window.libraryAPI.renderRnk('book');
    expect(document.getElementById('rnk-list').textContent).toContain('万历十五年');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/library.test.js
```

Expected: FAIL，错误类似 `Failed to resolve import '../src/js/library.js'`。

- [ ] **Step 3: 创建最小 `library.js` 实现**

Write `src/js/library.js`:

```js
(function () {
  var rankingData = { book: [], film: [], doc: [] };
  var watchlistData = { watching: [], watched: [], want: [] };

  function setRankingData(data) {
    rankingData = data && typeof data === 'object' ? data : rankingData;
  }

  function filterHot(dyn, btn) {
    document.querySelectorAll('#hot-tabs .htab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    document.querySelectorAll('#hot-articles .hl, #hot-articles .hi').forEach(function (card) {
      card.style.display = dyn === 'all' || card.dataset.dynasty === dyn ? 'block' : 'none';
    });
  }

  function filFilm(btn, type) {
    document.querySelectorAll('#film-page .dtab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    document.querySelectorAll('#film-grid .fcard').forEach(function (card) {
      card.style.display = type === 'all' || card.dataset.type === type ? 'block' : 'none';
    });
  }

  function togWL(btn) {
    if (btn.classList.contains('add')) {
      btn.classList.remove('add');
      btn.textContent = '＋ 待看';
      if (window.navigationAPI) window.navigationAPI.showToast('已移出待看栏');
    } else {
      btn.classList.add('add');
      btn.textContent = '✓ 已添加';
      if (window.navigationAPI) window.navigationAPI.showToast('已添加到待看栏！');
    }
  }

  function swRnkTab(btn, type) {
    document.querySelectorAll('#film-rank .rnkt').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    renderRnk(type);
  }

  function renderRnk(type) {
    var list = rankingData[type] || [];
    var html = '';
    list.forEach(function (item) {
      html += '<div class="rnkitem"><div class="rnkidx">' + (item.idx || '-') + '</div><div class="rnkimg" style="background:#EDE8E0;font-size:20px">' + (item.icon || '📖') + '</div><div class="rnkname"><h5>' + item.title + '</h5><p>' + item.sub + ' · ★ ' + item.score + '</p></div></div>';
    });
    document.getElementById('rnk-list').innerHTML = html;
  }

  function openWL() {
    document.getElementById('watchlist-panel').classList.add('act');
    renderWL('watching');
  }

  function closeWL() {
    document.getElementById('watchlist-panel').classList.remove('act');
  }

  function swWLTab(btn, type) {
    document.querySelectorAll('#watchlist-panel .wltab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
    renderWL(type);
  }

  function renderWL(type) {
    var list = watchlistData[type] || [];
    var html = '';
    if (!list.length) {
      html = '<div style="text-align:center;padding:24px;color:#B5ADA5;font-size:13px">暂无内容，去添加吧～</div>';
    }
    document.getElementById('wl-list').innerHTML = html;
  }

  function openFB() {
    document.getElementById('feedback-overlay').classList.add('act');
  }

  function closeFB(e) {
    if (e.target === document.getElementById('feedback-overlay')) {
      document.getElementById('feedback-overlay').classList.remove('act');
    }
  }

  function selFT(btn) {
    document.querySelectorAll('.fty .ft').forEach(function (item) {
      item.classList.remove('act');
    });
    if (btn) btn.classList.add('act');
  }

  function subFB() {
    var value = document.getElementById('feedback-text').value.trim();
    if (!value) {
      if (window.navigationAPI) window.navigationAPI.showToast('请输入反馈内容');
      return;
    }
    document.getElementById('feedback-overlay').classList.remove('act');
    document.getElementById('feedback-text').value = '';
    if (window.navigationAPI) window.navigationAPI.showToast('反馈已提交，感谢你的建议！');
  }

  window.libraryAPI = {
    setRankingData: setRankingData,
    filterHot: filterHot,
    filFilm: filFilm,
    togWL: togWL,
    swRnkTab: swRnkTab,
    renderRnk: renderRnk,
    openWL: openWL,
    closeWL: closeWL,
    swWLTab: swWLTab,
    renderWL: renderWL,
    openFB: openFB,
    closeFB: closeFB,
    selFT: selFT,
    subFB: subFB
  };
})();
```

- [ ] **Step 4: 在 `app.js` 中把 `books.json` 转换为榜单结构并注入**

Insert in `initializeData()`:

```js
var books = await loadJSON('./src/data/books.json', { books: [], films: [], docs: [] });
if (window.libraryAPI) {
  window.libraryAPI.setRankingData({
    book: (books.books || []).map(function (item, index) {
      return { title: item.title, sub: item.author + ' 著', score: item.rating, idx: index + 1, icon: item.icon || '📖' };
    }),
    film: (books.films || []).map(function (item, index) {
      return { title: item.title, sub: item.author, score: item.rating, idx: index + 1, icon: item.icon || '🎬' };
    }),
    doc: (books.docs || []).map(function (item, index) {
      return { title: item.title, sub: item.author, score: item.rating, idx: index + 1, icon: item.icon || '🎥' };
    })
  });
  try { window.libraryAPI.renderRnk('book'); } catch (e) { console.error('renderRnk err:', e); }
}
```

And expose globals in `exposeGlobals()`:

```js
if (window.libraryAPI) {
  window.filterHot = window.libraryAPI.filterHot;
  window.filFilm = window.libraryAPI.filFilm;
  window.togWL = window.libraryAPI.togWL;
  window.swRnkTab = window.libraryAPI.swRnkTab;
  window.renderRnk = window.libraryAPI.renderRnk;
  window.openWL = window.libraryAPI.openWL;
  window.closeWL = window.libraryAPI.closeWL;
  window.swWLTab = window.libraryAPI.swWLTab;
  window.renderWL = window.libraryAPI.renderWL;
  window.openFB = window.libraryAPI.openFB;
  window.closeFB = window.libraryAPI.closeFB;
  window.selFT = window.libraryAPI.selFT;
  window.subFB = window.libraryAPI.subFB;
}
```

- [ ] **Step 5: 运行测试并确认通过**

Run:

```bash
npm test -- tests/library.test.js
```

Expected: PASS。

- [ ] **Step 6: 提交内容交互模块**

Run:

```bash
git add src/js/library.js src/js/app.js tests/library.test.js
git commit -m "refactor: extract ranking and feedback interactions"
```

Expected: 成功提交。

---

## Task 6: 抽离 `memes.js` 并接入 `memes.json`

**Files:**
- Create: `src/js/memes.js`
- Modify: `src/js/app.js`

- [ ] **Step 1: 为梗图详情写失败测试**

Append to `tests/library.test.js` or create `tests/memes.test.js`:

```js
import { beforeEach, describe, expect, test } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

beforeEach(() => {
  resetGlobals();
  mountDOM(`
    <div id="meme-overlay"></div>
    <div id="meme-emoji"></div>
    <div id="meme-title"></div>
    <div id="meme-origin"></div>
    <div id="meme-tag"></div>
    <div id="meme-scroll"></div>
    <div id="meme-dots"><span class="meme-dot"></span></div>
  `);
});

describe('meme module', () => {
  test('opens meme overlay from injected data', async () => {
    await import('../src/js/memes.js');
    window.memesAPI.setMemes([{ icon: '🏺', caption: '测试标题', detail: '测试详情', tag: '#测试' }]);
    window.memesAPI.openMeme(0);
    expect(document.getElementById('meme-title').textContent).toBe('测试标题');
    expect(document.getElementById('meme-overlay').classList.contains('act')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/memes.test.js
```

Expected: FAIL，错误类似 `Failed to resolve import '../src/js/memes.js'`。

- [ ] **Step 3: 创建 `src/js/memes.js`**

Write `src/js/memes.js`:

```js
(function () {
  var memeData = [];

  function setMemes(list) {
    memeData = Array.isArray(list) ? list : [];
  }

  function openMeme(idx) {
    var data = memeData[idx];
    if (!data) return;
    document.getElementById('meme-emoji').textContent = data.icon || data.emoji || '📜';
    document.getElementById('meme-title').textContent = data.caption || data.title || '';
    document.getElementById('meme-origin').textContent = data.detail || data.origin || '';
    document.getElementById('meme-tag').textContent = data.tag || '';
    document.getElementById('meme-overlay').classList.add('act');
  }

  function closeMeme(e) {
    if (e.target === document.getElementById('meme-overlay')) {
      document.getElementById('meme-overlay').classList.remove('act');
    }
  }

  function initMemeDots() {
    var scroller = document.getElementById('meme-scroll');
    var dots = document.querySelectorAll('#meme-dots .meme-dot');
    if (!scroller || !dots.length) return;
    scroller.addEventListener('scroll', function () {
      var idx = Math.round(scroller.scrollLeft / (scroller.scrollWidth / dots.length || 1));
      dots.forEach(function (dot, i) {
        dot.classList.toggle('act', i === Math.min(idx, dots.length - 1));
      });
    });
  }

  window.memesAPI = {
    setMemes: setMemes,
    openMeme: openMeme,
    closeMeme: closeMeme,
    initMemeDots: initMemeDots
  };
})();
```

- [ ] **Step 4: 在 `app.js` 中接入 memes 数据并初始化滚动指示器**

Insert in `initializeData()`:

```js
var memes = await loadJSON('./src/data/memes.json', []);
if (window.memesAPI) {
  window.memesAPI.setMemes(memes);
  try { window.memesAPI.initMemeDots(); } catch (e) { console.error('initMemeDots err:', e); }
}
```

And expose globals:

```js
if (window.memesAPI) {
  window.openMeme = window.memesAPI.openMeme;
  window.closeMeme = window.memesAPI.closeMeme;
}
```

- [ ] **Step 5: 运行测试并确认通过**

Run:

```bash
npm test -- tests/memes.test.js
```

Expected: PASS。

- [ ] **Step 6: 提交梗图模块**

Run:

```bash
git add src/js/memes.js src/js/app.js tests/memes.test.js
git commit -m "refactor: extract meme overlay interactions"
```

Expected: 成功提交。

---

## Task 7: 清理 `index.html` 并接回所有新模块

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 写静态检查失败断言**

Create `tests/index-structure.test.js`:

```js
import { describe, expect, test } from 'vitest';
import fs from 'node:fs';

describe('index structure', () => {
  test('does not keep the legacy inline business script block', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    expect(html).not.toContain('var peoData=');
    expect(html).not.toContain('function openCheckin()');
    expect(html).toContain('./src/js/memes.js');
    expect(html).toContain('./src/js/library.js');
    expect(html).toContain('./src/js/people.js');
    expect(html).toContain('./src/js/study-tools.js');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/index-structure.test.js
```

Expected: FAIL，因为当前 `index.html` 仍保留旧内联脚本且缺少新模块引用。

- [ ] **Step 3: 修改脚本引用顺序**

Update the bottom of `index.html` to:

```html
<script src="./src/js/storage.js"></script>
<script src="./src/js/navigation.js"></script>
<script src="./src/js/favorites.js"></script>
<script src="./src/js/noun.js"></script>
<script src="./src/js/timeline.js"></script>
<script src="./src/js/podcast.js"></script>
<script src="./src/js/ai-assistant.js"></script>
<script src="./src/js/memes.js"></script>
<script src="./src/js/library.js"></script>
<script src="./src/js/people.js"></script>
<script src="./src/js/study-tools.js"></script>
<script src="./src/js/app.js"></script>
```

- [ ] **Step 4: 删除旧内联业务脚本**

Delete the entire inline `<script>` block currently spanning `index.html:571-902`, because its behavior is now owned by the external modules.

- [ ] **Step 5: 运行结构测试并确认通过**

Run:

```bash
npm test -- tests/index-structure.test.js
```

Expected: PASS。

- [ ] **Step 6: 提交 HTML 清理**

Run:

```bash
git add index.html tests/index-structure.test.js
git commit -m "refactor: remove remaining inline business scripts"
```

Expected: 成功提交。

---

## Task 8: 更新 README、重构报告和可维护性审查文档

**Files:**
- Modify: `README.md`
- Modify: `docs/refactor-report.md`
- Create: `docs/maintainability-review.md`

- [ ] **Step 1: 为 README 对齐写失败测试**

Create `tests/docs-alignment.test.js`:

```js
import { describe, expect, test } from 'vitest';
import fs from 'node:fs';

describe('documentation alignment', () => {
  test('README reflects current data files and module structure', () => {
    const readme = fs.readFileSync('README.md', 'utf8');
    expect(readme).toContain('people.json');
    expect(readme).toContain('memes.js');
    expect(readme).toContain('library.js');
    expect(readme).toContain('people.js');
    expect(readme).toContain('study-tools.js');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/docs-alignment.test.js
```

Expected: FAIL，因为 README 还没有这些新模块描述。

- [ ] **Step 3: 更新 `README.md`**

Adjust the project structure section so `src/js/` contains:

```text
app.js
storage.js
navigation.js
favorites.js
noun.js
timeline.js
podcast.js
ai-assistant.js
memes.js
library.js
people.js
study-tools.js
```

And keep `src/data/people.json` in the data tree.

Add a short note under the architecture/maintenance section:

```markdown
当前页面仍保留 HTML 内联 `onclick`，由 `src/js/app.js` 在运行时暴露兼容全局函数，避免在无构建工具前提下大规模改写 DOM 结构。
```

- [ ] **Step 4: 更新 `docs/refactor-report.md`**

Replace the “仍保留在内联脚本中的内容” section with:

```markdown
### 本轮继续拆分完成的内容

以下内容已从 `index.html` 内联脚本迁移为独立模块：
- 页面切换辅助函数 (`swTab`, `swSubTab`)
- 梗图详情与轮播指示器
- 热点筛选、影视筛选、榜单、待看栏、反馈弹层
- 人物关系网数据与渲染
- 思维导图与笔记
- 朝代特征详情
- 讨论区
- 打卡签到

当前 `index.html` 仅保留页面结构、样式引用、脚本引用与 HTML 内联事件声明。
```

Update the file list section to include:

```markdown
- `src/js/memes.js`
- `src/js/library.js`
- `src/js/people.js`
- `src/js/study-tools.js`
- `src/data/people.json`
```

- [ ] **Step 5: 新增 `docs/maintainability-review.md`**

Write `docs/maintainability-review.md`:

```markdown
# 可维护性审查：学的是史当前静态前端结构

## 1. 当前状态结论

项目已经从单文件原型演进为“静态页面壳层 + JS 功能模块 + JSON 数据文件”的结构，维护性明显提升，但仍处于“兼容原型期”的架构阶段。

## 2. 主要优点

- 业务逻辑已按功能拆到 `src/js/`
- 结构化数据已逐步拆到 `src/data/`
- `src/js/app.js` 保持编排层职责
- 无构建工具即可运行，迁移成本低

## 3. 当前主要维护成本

### 3.1 HTML 仍依赖内联 `onclick`

优点是迁移成本低，缺点是全局函数表面持续扩大，模块 API 必须长期兼容。

### 3.2 DOM 结构耦合仍然偏强

多个模块依赖硬编码的 `id/class`，重命名 DOM 标识时容易引发连锁回归。

### 3.3 LocalStorage key 仍然分散

虽然已经有 `storage.js`，但 key 约定尚未集中声明。

## 4. 本轮解决了什么

- 去除了 `index.html` 中大块业务内联脚本
- 补齐 `people.json` 真正数据源
- 让 README / 重构报告重新对齐代码
- 为核心模块补上最小自动化测试底座

## 5. 下一步最值得做的事

1. 用事件委托逐步替换内联 `onclick`
2. 把热点卡片和影视卡片也继续数据化
3. 收敛 LocalStorage key 常量定义
```

- [ ] **Step 6: 运行文档对齐测试并确认通过**

Run:

```bash
npm test -- tests/docs-alignment.test.js
```

Expected: PASS。

- [ ] **Step 7: 提交文档与审查结果**

Run:

```bash
git add README.md docs/refactor-report.md docs/maintainability-review.md tests/docs-alignment.test.js
git commit -m "docs: align structure docs with extracted modules"
```

Expected: 成功提交。

---

## Task 9: 做整体验证

**Files:**
- No new source files required

- [ ] **Step 1: 运行全部自动化测试**

Run:

```bash
npm test
```

Expected: 所有 `tests/*.test.js` 通过。

- [ ] **Step 2: 启动本地静态服务器**

Run:

```bash
python -m http.server 8000
```

Expected: 输出类似 `Serving HTTP on 0.0.0.0 port 8000`。

- [ ] **Step 3: 手工验证关键路径**

Open `http://localhost:8000` and verify:

```text
1. 登录后进入首页
2. 底部导航与子页面切换正常
3. 梗图点击与弹层正常
4. 名词解释搜索/详情正常
5. 时间轴切换、缩放、详情弹层正常
6. 人物关系网搜索、中心人物切换、详情卡正常
7. 思维导图节点笔记可保存并回显
8. 讨论区发帖弹层、标签切换、评论显隐正常
9. 打卡面板、连续签到、月度统计正常
10. 榜单切换、待看栏、反馈弹层正常
11. 浏览器控制台无新的阻断性错误
12. `people.json`、`memes.json`、`books.json` 请求无 404
```

- [ ] **Step 4: 查看工作区状态并准备合并**

Run:

```bash
git status --short
```

Expected: 工作区干净，或只剩人工确认后才需要继续处理的文件。

---

## Self-Review Checklist

- 规格覆盖：计划已覆盖测试底座、导航迁移、人物数据落地、学习工具抽离、library/memes 模块接入、HTML 清理、文档修正、可维护性审查、最终验证。
- 占位符扫描：本计划没有 `TODO` / `TBD` / “参考 Task N” 形式的空步骤；唯一的“示例 JSON”处已明确要求迁移完整数据。
- 命名一致性：新增模块统一命名为 `memes.js`、`library.js`、`people.js`、`study-tools.js`；对应 API 为 `window.memesAPI`、`window.libraryAPI`、`window.peopleAPI`、`window.studyToolsAPI`。
