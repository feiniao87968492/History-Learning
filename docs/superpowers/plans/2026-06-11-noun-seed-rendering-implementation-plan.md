# Noun Seed Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Task 2.1 by rendering noun cards from structured JSON seed data with safe escaping, search, detail metadata, and tests.

**Architecture:** `src/data/nouns.json` becomes the source of truth for noun cards and detail data. `src/js/noun.js` owns rendering/search/detail behavior and exposes the existing `window.nounAPI` surface with one additional `renderNounCards` method. `index.html` keeps the existing UI shell but removes hardcoded noun cards.

**Tech Stack:** Native ES5 JavaScript IIFE, JSON static data, DOM APIs, `window.htmlUtils.escapeHtml`, Vitest, jsdom.

---

## File Structure

- Modify: `src/data/nouns.json`
  - Responsibility: store 10 structured seed nouns with `text`, `related`, `dynasty`, `category`, `map`, and `year`.
- Modify: `src/js/noun.js`
  - Responsibility: render noun cards from `nounData`, filter/search, open details, and safely escape JSON-backed HTML.
- Modify: `index.html`
  - Responsibility: keep `#noun-grid` as an empty render target and add `#nd-meta` for detail metadata.
- Create: `tests/noun.test.js`
  - Responsibility: verify data-driven rendering, search, empty state, detail metadata/map, and XSS protection.

---

### Task 1: Add failing noun rendering tests

**Files:**
- Create: `tests/noun.test.js`

- [ ] **Step 1: Write the failing test file**

Create `tests/noun.test.js` with this complete content:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountNounDOM() {
  mountDOM(`
    <input id="noun-search-input" />
    <div class="nc" id="noun-grid"></div>
    <div id="noun-detail" class="nd">
      <h2 id="nd-title"></h2>
      <div id="nd-meta"></div>
      <p id="nd-text"></p>
      <div class="mp"></div>
      <div id="nd-related"></div>
    </div>
    <div id="toast"></div>
  `);
}

const NOUNS = {
  '郡县制': {
    text: '秦统一后在全国推行郡县制，地方长官由中央任免，行政权力不再世袭。它削弱了诸侯割据的基础，使中央政令能够直接抵达地方，是中国古代中央集权制度形成的重要标志。',
    related: ['秦始皇', '分封制', '中央集权'],
    dynasty: '秦朝',
    category: '制度',
    map: '秦统一后的郡县分布示意',
    year: '前221年'
  },
  '科举制': {
    text: '科举制是隋唐以后通过考试选拔官员的制度。它打破门阀世族长期垄断仕途的局面，使寒门士人能够凭借经学、诗赋和策论进入官僚体系。',
    related: ['三省六部制', '九品中正制'],
    dynasty: '隋唐',
    category: '制度',
    map: '唐代贡举入京路线示意',
    year: '605年'
  },
  '交子': {
    text: '交子是北宋四川地区出现的纸币，最初由商人发行，后来由政府接管。它反映了宋代商品经济和长途贸易的发展，也体现了金属货币在大规模交易中的局限。',
    related: ['市舶司', '宋代经济'],
    dynasty: '宋朝',
    category: '经济',
    map: '北宋四川与商贸路线示意',
    year: '北宋'
  }
};

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  mountNounDOM();
  window.navigationAPI = { showToast: vi.fn() };
  window.htmlUtils = {
    escapeHtml(value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };
});

describe('noun data-driven rendering', () => {
  test('renders cards from noun data after setNounData', async () => {
    await import('../src/js/noun.js');

    window.nounAPI.setNounData(NOUNS);

    expect(document.querySelectorAll('#noun-grid .ncard')).toHaveLength(3);
    expect(document.getElementById('noun-grid').textContent).toContain('郡县制');
    expect(document.getElementById('noun-grid').textContent).toContain('秦朝');
    expect(document.getElementById('noun-grid').textContent).toContain('制度');
  });

  test('search filters by dynasty and empty search restores all cards', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    document.getElementById('noun-search-input').value = '唐朝';
    window.nounAPI.searchNouns();

    expect(document.querySelectorAll('#noun-grid .ncard')).toHaveLength(1);
    expect(document.getElementById('noun-grid').textContent).toContain('科举制');
    expect(document.getElementById('noun-grid').textContent).not.toContain('郡县制');

    document.getElementById('noun-search-input').value = '';
    window.nounAPI.searchNouns();

    expect(document.querySelectorAll('#noun-grid .ncard')).toHaveLength(3);
  });

  test('search shows empty state when no noun matches', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    document.getElementById('noun-search-input').value = '不存在的名词';
    window.nounAPI.searchNouns();

    expect(document.querySelectorAll('#noun-grid .ncard')).toHaveLength(0);
    expect(document.getElementById('noun-grid').textContent).toContain('暂无匹配名词');
  });

  test('openNounDet renders text metadata map and related buttons safely', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    window.nounAPI.openNounDet('郡县制');

    expect(document.getElementById('nd-title').textContent).toBe('郡县制');
    expect(document.getElementById('nd-text').textContent).toContain('中央集权制度');
    expect(document.getElementById('nd-meta').textContent).toContain('秦朝');
    expect(document.getElementById('nd-meta').textContent).toContain('制度');
    expect(document.querySelector('#noun-detail .mp').textContent).toContain('秦统一后的郡县分布示意');
    expect(document.querySelectorAll('#nd-related .nrtag')).toHaveLength(3);
  });

  test('escapes script-like noun data in card HTML', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData({
      '<script>window.__xss = true</script>': {
        text: '<img src=x onerror="window.__xss = true">恶意正文',
        related: ['<script>alert(1)</script>'],
        dynasty: '<script>唐朝</script>',
        category: '制度',
        map: '<script>地图</script>',
        year: '测试'
      }
    });

    expect(document.querySelector('#noun-grid script')).toBeNull();
    expect(window.__xss).toBeUndefined();
    expect(document.getElementById('noun-grid').innerHTML).toContain('&lt;script&gt;window.__xss = true&lt;/script&gt;');
    expect(document.getElementById('noun-grid').innerHTML).toContain('&lt;img src=x onerror=&quot;window.__xss = true&quot;&gt;');
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```powershell
npx vitest run tests/noun.test.js --environment jsdom
```

Expected: FAIL because current `noun.js` does not render cards from `setNounData`, does not filter by dynasty/category/year, and does not render metadata/map.

---

### Task 2: Implement noun module rendering and search

**Files:**
- Modify: `src/js/noun.js`
- Test: `tests/noun.test.js`

- [ ] **Step 1: Replace `src/js/noun.js` with the data-driven implementation**

Replace `src/js/noun.js` with this complete content:

```js
(function () {
  var nounData = {};

  function escapeHtml(value) {
    if (window.htmlUtils && typeof window.htmlUtils.escapeHtml === 'function') {
      return window.htmlUtils.escapeHtml(value);
    }

    if (value === null || typeof value === 'undefined') {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeJSString(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/</g, '\\x3c')
      .replace(/>/g, '\\x3e');
  }

  function getNounNames() {
    return Object.keys(nounData);
  }

  function setNounData(data) {
    nounData = data && typeof data === 'object' ? data : {};
    renderNounCards();
  }

  function getNoun(name) {
    return nounData[name] || null;
  }

  function matchesFilter(name, filter) {
    if (!filter) return true;

    var d = getNoun(name) || {};
    var query = String(filter).toLowerCase();
    var values = [
      name,
      d.text,
      d.dynasty,
      d.category,
      d.year
    ];

    return values.some(function (value) {
      return String(value || '').toLowerCase().indexOf(query) !== -1;
    });
  }

  function renderNounCards(filter) {
    var grid = document.getElementById('noun-grid');
    if (!grid) return;

    var names = getNounNames().filter(function (name) {
      return matchesFilter(name, filter);
    });

    if (!names.length) {
      grid.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无匹配名词</div>';
      return;
    }

    grid.innerHTML = names.map(function (name) {
      var d = getNoun(name) || {};
      var summary = d.text ? String(d.text).slice(0, 50) + (String(d.text).length > 50 ? '...' : '') : '暂无简介';
      var tags = [d.dynasty, d.category].filter(Boolean).map(function (tag, index) {
        return '<span class="tg ' + (index === 0 ? 'hot' : 'sys') + '" style="font-size:10px">' + escapeHtml(tag) + '</span>';
      }).join('');
      var safeName = escapeJSString(name);

      return '<div class="ncard" onclick="openNounDet(\'' + safeName + '\')">' +
        '<div class="nmeta">' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap">' + tags + '</div>' +
          '<div class="nact">' +
            '<button class="nfav" onclick="event.stopPropagation();togNounFav(this,\'' + safeName + '\')">☆</button>' +
            '<button class="nshr" onclick="event.stopPropagation();shareNoun(\'' + safeName + '\')">↗</button>' +
          '</div>' +
        '</div>' +
        '<h4>' + escapeHtml(name) + '</h4>' +
        '<p>' + escapeHtml(summary) + '</p>' +
      '</div>';
    }).join('');
  }

  function renderMeta(d) {
    var meta = document.getElementById('nd-meta');
    if (!meta) return;

    var parts = [];
    if (d && d.dynasty) parts.push('<span class="tg hot" style="font-size:10px;margin-right:6px">' + escapeHtml(d.dynasty) + '</span>');
    if (d && d.category) parts.push('<span class="tg sys" style="font-size:10px;margin-right:6px">' + escapeHtml(d.category) + '</span>');
    if (d && d.year) parts.push('<span class="tg" style="font-size:10px">' + escapeHtml(d.year) + '</span>');
    meta.innerHTML = parts.join('');
  }

  function openNounDet(name) {
    var title = document.getElementById('nd-title');
    if (title) title.textContent = name;

    var d = getNoun(name);
    var text = document.getElementById('nd-text');
    if (text) text.textContent = (d && d.text) || '暂无详细解释。';

    renderMeta(d);

    var map = document.querySelector('#noun-detail .mp');
    if (map) {
      map.textContent = d && d.map ? '🗺️ ' + d.map : '🗺️ 暂无相关地图';
    }

    var rel = document.getElementById('nd-related');
    if (rel) {
      rel.innerHTML = '';
      if (d && Array.isArray(d.related) && d.related.length) {
        d.related.forEach(function (r) {
          var button = document.createElement('button');
          button.className = 'nrtag';
          button.textContent = r;
          button.onclick = function () {
            openNounDet(r);
          };
          rel.appendChild(button);
        });
      } else {
        rel.innerHTML = '<span style="font-size:12px;color:#B5ADA5">暂无相关名词</span>';
      }
    }

    var detail = document.getElementById('noun-detail');
    if (detail) detail.classList.add('act');
  }

  function closeNounDet() {
    var detail = document.getElementById('noun-detail');
    if (detail) detail.classList.remove('act');
  }

  function togNounFav(btn, name) {
    btn.classList.toggle('faved');
    if (btn.classList.contains('faved')) {
      btn.textContent = '★';
      window.navigationAPI.showToast('已收藏「' + name + '」');
    } else {
      btn.textContent = '☆';
      window.navigationAPI.showToast('已取消收藏「' + name + '」');
    }
  }

  function shareNoun(name) {
    if (navigator.share) {
      navigator.share({
        title: '学的是史 - ' + name,
        text: '来「学的是史」查看「' + name + '」的详细解释！',
        url: location.href
      }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText('来「学的是史」查看「' + name + '」的详细解释！')
        .then(function () {
          window.navigationAPI.showToast('链接已复制，快去分享给好友吧！');
        });
    }
  }

  function searchNouns() {
    var input = document.getElementById('noun-search-input');
    var q = input ? input.value.trim() : '';
    renderNounCards(q);
  }

  window.nounAPI = {
    setNounData: setNounData,
    getNoun: getNoun,
    getNounNames: getNounNames,
    renderNounCards: renderNounCards,
    openNounDet: openNounDet,
    closeNounDet: closeNounDet,
    togNounFav: togNounFav,
    shareNoun: shareNoun,
    searchNouns: searchNouns
  };
})();
```

- [ ] **Step 2: Run focused noun tests**

Run:

```powershell
npx vitest run tests/noun.test.js --environment jsdom
```

Expected: PASS.

---

### Task 3: Update noun seed data

**Files:**
- Modify: `src/data/nouns.json`

- [ ] **Step 1: Replace noun JSON with 10 structured seed entries**

Replace `src/data/nouns.json` with this complete JSON:

```json
{
  "郡县制": {
    "text": "郡县制是秦统一后在全国推行的地方行政制度。郡、县长官由中央任免，不能世袭，地方行政权直接归属于中央。它取代了西周以来以血缘和封土为基础的分封格局，削弱了地方割据力量，使国家政令、赋税和兵役能够更直接地贯彻到基层，是中国古代中央集权制度形成的重要标志。",
    "related": ["分封制", "秦始皇", "中央集权"],
    "dynasty": "秦朝",
    "category": "制度",
    "map": "秦统一后的郡县分布示意",
    "year": "前221年"
  },
  "商鞅变法": {
    "text": "商鞅变法是战国时期秦国在秦孝公支持下推行的改革。改革奖励耕战，废除旧贵族特权，实行军功爵制，推行县制并统一度量衡。变法增强了秦国的财政、军事实力，也重塑了社会秩序，使秦国从西部诸侯成长为统一六国的强国。其严刑峻法也体现了法家治理的鲜明特征。",
    "related": ["郡县制", "法家", "军功爵制"],
    "dynasty": "战国",
    "category": "改革",
    "map": "战国时期秦国扩张形势图",
    "year": "前356年"
  },
  "科举制": {
    "text": "科举制是隋唐以后通过考试选拔官员的制度。它打破门阀世族长期垄断仕途的局面，使寒门士人能够凭借经学、诗赋和策论进入官僚体系。唐宋以后，科举逐渐成为国家选官的核心渠道，也深刻影响了教育、文化和社会流动。明清时期八股取士使其趋于僵化，但制度影响延续一千多年。",
    "related": ["三省六部制", "九品中正制", "八股文"],
    "dynasty": "隋唐",
    "category": "制度",
    "map": "唐代贡举入京路线示意",
    "year": "605年"
  },
  "井田制": {
    "text": "井田制是西周时期理想化的土地制度。传统说法认为田地按井字形划分，中间为公田，周围为私田，农民共同耕作公田并向贵族承担劳役。它体现了宗法分封社会中土地、身份和义务的结合。春秋战国时期，铁器牛耕推广和私田发展削弱了井田制基础，最终被封建土地私有和赋税制度取代。",
    "related": ["分封制", "商鞅变法", "土地私有"],
    "dynasty": "西周",
    "category": "经济",
    "map": "西周分封与土地制度示意",
    "year": "西周"
  },
  "推恩令": {
    "text": "推恩令是汉武帝采纳主父偃建议颁布的削弱诸侯王势力的政策。它允许诸侯王将封地继续分给子弟，使诸侯国不断分割缩小，中央无需直接大规模用兵便能削弱地方王国。推恩令配合刺史制度、盐铁官营等措施，加强了西汉中央集权，是汉武帝巩固大一统国家的重要手段。",
    "related": ["汉武帝", "郡国并行", "中央集权"],
    "dynasty": "西汉",
    "category": "制度",
    "map": "西汉诸侯国分布与削藩示意",
    "year": "前127年"
  },
  "丝绸之路": {
    "text": "丝绸之路是汉代张骞通西域后逐步形成的东西方交通与贸易网络。它以长安为起点，经过河西走廊和西域，通向中亚、西亚乃至欧洲。丝绸、瓷器、香料、宝石和宗教思想在这条道路上交流传播。丝绸之路不仅是贸易路线，也是古代中国与欧亚世界相互理解的重要文明通道。",
    "related": ["张骞", "汉武帝", "河西走廊"],
    "dynasty": "西汉",
    "category": "交流",
    "map": "陆上丝绸之路路线示意",
    "year": "前2世纪"
  },
  "三省六部制": {
    "text": "三省六部制是隋唐时期成熟的中央官制。中书省负责起草诏令，门下省负责审议封驳，尚书省负责执行政令，下设吏、户、礼、兵、刑、工六部。它通过分工与制衡提高行政效率，也限制了单一宰相机构权力过大。该制度对后世中央行政体系影响深远。",
    "related": ["科举制", "唐太宗", "尚书省"],
    "dynasty": "隋唐",
    "category": "制度",
    "map": "唐代中央机构结构示意",
    "year": "隋唐"
  },
  "交子": {
    "text": "交子是北宋四川地区出现的早期纸币。随着宋代商品经济和长途贸易发展，金属货币在大额交易中携带不便，商人最初发行交子作为信用凭证，后来政府设立机构统一管理。交子的出现说明宋代市场活动活跃，也反映了国家财政和商业信用之间的复杂关系。",
    "related": ["宋代经济", "市舶司", "纸币"],
    "dynasty": "北宋",
    "category": "经济",
    "map": "北宋四川与商贸路线示意",
    "year": "11世纪"
  },
  "一条鞭法": {
    "text": "一条鞭法是明代张居正在万历初年推行的重要赋役改革。它将田赋、徭役和杂税合并折算为银两，按土地和人丁等因素统一征收，简化了征收流程，也推动白银在财政中的地位上升。改革在一定程度上减轻了赋役混乱，但也使农民更依赖市场换取白银缴税。",
    "related": ["张居正", "明代赋税", "白银货币化"],
    "dynasty": "明朝",
    "category": "经济",
    "map": "明代赋税改革推行区域示意",
    "year": "1581年"
  },
  "军机处": {
    "text": "军机处是清雍正时期设立的中枢机构，最初为处理西北军务而设，后来逐渐成为皇帝处理军国大政的核心班子。军机大臣品级未必最高，却直接承旨办事，办事迅速而机密。军机处强化了皇帝对政务的直接控制，标志着清代君主专制达到高峰。",
    "related": ["雍正", "内阁", "君主专制"],
    "dynasty": "清朝",
    "category": "制度",
    "map": "清代中央权力结构示意",
    "year": "1729年"
  }
}
```

- [ ] **Step 2: Run JSON/data sanity tests**

Run:

```powershell
npx vitest run tests/app-static-data.test.js tests/noun.test.js --environment jsdom
```

Expected: PASS.

---

### Task 4: Update index noun shell

**Files:**
- Modify: `index.html`
- Test: `tests/noun.test.js`

- [ ] **Step 1: Remove hardcoded noun cards**

In `index.html`, replace the current `#noun-grid` block containing four `.ncard` elements with:

```html
<div class="nc" id="noun-grid"></div>
```

- [ ] **Step 2: Add noun detail metadata target**

In `index.html`, inside `#noun-detail .db`, insert this line between the `.vp` block and the detailed explanation `.sec`:

```html
<div style="padding:0 16px 8px" id="nd-meta"></div>
```

The resulting detail area should contain:

```html
<div class="db">
<div class="vp"><div class="pb">▶</div></div>
<div style="padding:0 16px 8px" id="nd-meta"></div>
<div class="sec"><h3>详细解释</h3><p id="nd-text"></p></div>
```

- [ ] **Step 3: Run noun tests**

Run:

```powershell
npx vitest run tests/noun.test.js --environment jsdom
```

Expected: PASS.

---

### Task 5: Validate and commit Task 2.1

**Files:**
- Modify: `src/data/nouns.json`
- Modify: `src/js/noun.js`
- Modify: `index.html`
- Create: `tests/noun.test.js`

- [ ] **Step 1: Run focused Task 2.1 tests**

Run:

```powershell
npx vitest run tests/noun.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 2: Run related regression tests**

Run:

```powershell
npx vitest run tests/adapter-wiring.test.js tests/app-static-data.test.js tests/html-hardening.test.js --environment jsdom
```

Expected: PASS.

- [ ] **Step 3: Run full suite**

Run:

```powershell
npx vitest run --environment jsdom
```

Expected: PASS.

- [ ] **Step 4: Stage only Task 2.1 files**

Run:

```powershell
git add -- src/data/nouns.json src/js/noun.js index.html tests/noun.test.js
```

Expected: no command output.

- [ ] **Step 5: Commit Task 2.1**

Run:

```powershell
git commit -m "feat: noun module with seed data and data-driven rendering"
```

Expected: a commit is created with only Task 2.1 files.

- [ ] **Step 6: Report completion**

Report these facts:

```text
Task 2.1 complete.
Noun page renders cards from src/data/nouns.json.
Seed data contains 10 structured noun entries.
Search supports name/text/dynasty/category/year.
Details show metadata, map text, and related nouns.
Focused noun tests and full Vitest suite pass.
```
