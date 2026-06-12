# Static Content Split and Resources Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端中仍残留在 `index.html` 与内联脚本中的静态展示内容逐步迁移到 `src/data/`，并把正式媒体资源统一整理到 `resources/` 目录下，同时尽量不破坏现有页面与交互。

**Architecture:** 保留 `index.html` 作为页面壳层，继续使用 `src/js/app.js` 作为入口调度器，并复用现有模块如 `noun.js`、`timeline.js`、`podcast.js`、`film.js`、`checkin.js`。本次按“先抽数据、再改静态列表、最后整理资源目录与路径”的顺序增量推进，让 JSON 承担内容、让 `resources/` 承担真实文件资源、让 JS 负责加载和渲染。

**Tech Stack:** HTML、CSS、原生 JavaScript、JSON、Vitest、jsdom、PowerShell、Git

---

## File Structure Map

### Existing files to modify

- Modify: `index.html`
  - 逐步移除首页热点、科学备考卡片、讨论区帖子、反馈类型、梗图弹窗、人物关系网等静态内容与内联数据
  - 保留页面骨架、关键容器和必要的内联事件入口
- Modify: `src/js/app.js`
  - 统一加载新增 JSON
  - 接管首页、人物页、讨论区、思维导图、反馈类型等渲染初始化
  - 暴露仍被 HTML 直接调用的全局函数
- Modify: `src/js/ai-assistant.js`
  - 如需读取新的快捷问题配置，补充初始化逻辑；若不需要则保持不动
- Modify: `src/js/checkin.js`
  - 不改业务逻辑，只在测试或初始化顺序要求下做最小兼容调整
- Modify: `src/js/film.js`
  - 如资源路径字段新增后需要显示封面图或兜底字段，做最小兼容扩展
- Modify: `src/js/navigation.js`
  - 如页面切换逻辑需接管 `swTab`、`swSubTab` 等函数，可在此扩展或保留在 `app.js`
- Modify: `README.md`
  - 增补 `resources/` 目录用途说明与静态内容组织说明
- Modify: `.gitignore`
  - 忽略 `.DS_Store`、`Thumbs.db` 等垃圾文件

### Existing files to inspect and preserve compatibility with

- Inspect: `src/data/nouns.json`
- Inspect: `src/data/timeline.json`
- Inspect: `src/data/podcasts.json`
- Inspect: `src/data/films.json`
- Inspect: `src/data/rankings.json`
- Inspect: `tests/navigation.test.js`
- Inspect: `tests/checkin.test.js`
- Inspect: `tests/film.test.js`
- Inspect: `tests/helpers/dom-test-utils.js`

### New files to create

- Create: `src/data/memes.json`
  - 首页梗图轮播与弹窗详情数据
- Create: `src/data/hot-articles.json`
  - 首页热点文章与卡片数据
- Create: `src/data/people.json`
  - 人物中心数据、关系网数据、资料卡数据
- Create: `src/data/discussions.json`
  - 讨论区默认帖子与评论数据
- Create: `src/data/science-tools.json`
  - 科学备考卡片数据
- Create: `src/data/mindmaps.json`
  - 思维导图 tab 与节点结构数据
- Create: `src/data/profile-menu.json`
  - “我的”页面菜单项配置
- Create: `src/data/feedback-types.json`
  - 反馈弹窗标签配置
- Create: `tests/app-static-data.test.js`
  - 覆盖 app 初始化时加载静态内容数据并渲染首页、反馈区、讨论区等的测试
- Create: `tests/resources-structure.test.js`
  - 覆盖资源目录存在性、垃圾文件隔离与关键数据路径约束的测试
- Create: `resources/images/.gitkeep`
- Create: `resources/images/memes/.gitkeep`
- Create: `resources/images/nouns/.gitkeep`
- Create: `resources/images/people/.gitkeep`
- Create: `resources/images/timeline/.gitkeep`
- Create: `resources/images/common/.gitkeep`
- Create: `resources/audio/.gitkeep`
- Create: `resources/audio/podcasts/.gitkeep`
- Create: `resources/icons/.gitkeep`
- Create: `resources/raw/.gitkeep`
- Create: `resources/raw/imported/.gitkeep`
- Create: `docs/resources-inventory.md`
  - 记录当前已迁移资源、待清理资源与资源路径规范

### Files likely to move or delete

- Move: `resources/名词解释/**` 中当前作为原始导入素材的文件到 `resources/raw/imported/` 下的规范子目录
- Delete: `resources/**/.DS_Store`
- Delete: `resources/**/__MACOSX/**`
- Delete: `resources/**/Thumbs.db`

---

### Task 1: 建立静态内容与资源整理的测试护栏

**Files:**
- Create: `tests/app-static-data.test.js`
- Create: `tests/resources-structure.test.js`
- Inspect: `tests/helpers/dom-test-utils.js`
- Inspect: `package.json`

- [ ] **Step 1: 写首页与反馈类型渲染的失败测试**

Write `tests/app-static-data.test.js`:

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const MEMES = [
  {
    id: 'meme-qinshihuang',
    emoji: '🏺',
    title: '秦始皇陵兵马俑',
    origin: '兵马俑考古发现与秦陵修建背景。',
    tag: '#考古发现 #秦朝 #世界遗产'
  },
  {
    id: 'meme-tang-poetry',
    emoji: '📜',
    title: '唐朝公务员写诗内卷',
    origin: '唐代科举与诗赋文化影响。',
    tag: '#科举 #唐朝 #文化史'
  }
];

const FEEDBACK_TYPES = ['功能异常', '内容错误', '功能建议', '其他'];

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  mountDOM(`
    <div id="meme-scroll"></div>
    <div id="meme-dots"></div>
    <div id="meme-overlay"></div>
    <span id="meme-emoji"></span>
    <h3 id="meme-title"></h3>
    <p id="meme-origin"></p>
    <p id="meme-tag"></p>
    <div class="fty" id="feedback-type-list"></div>
    <div id="toast"></div>
  `);

  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: 'complete'
  });

  window.navigationAPI = {
    showToast: vi.fn(),
    resetAIFab: vi.fn(),
    login: vi.fn(),
    openSub: vi.fn(),
    closeSub: vi.fn()
  };
  window.storageAPI = {
    getStoredJSON: vi.fn(),
    setStoredJSON: vi.fn(),
    getStoredString: vi.fn(),
    setStoredString: vi.fn()
  };
  window.nounAPI = { setNounData: vi.fn() };
  window.timelineAPI = {
    setDynasties: vi.fn(),
    setTimelineEvents: vi.fn(),
    renderTimeline: vi.fn(),
    renderEventList: vi.fn()
  };
  window.podcastAPI = { setPodcasts: vi.fn() };
  window.filmAPI = {
    setFilms: vi.fn(),
    setRankings: vi.fn(),
    initializeFilmModule: vi.fn(),
    filterFilms: vi.fn(),
    switchRankingTab: vi.fn(),
    openWatchlist: vi.fn(),
    closeWatchlist: vi.fn(),
    switchWatchlistTab: vi.fn(),
    toggleWatchlistItem: vi.fn(),
    moveWatchlistItem: vi.fn()
  };
  window.checkinAPI = { updateCheckinStats: vi.fn() };
  window.aiAssistantAPI = {
    togAI: vi.fn(),
    aiAsk: vi.fn(),
    aiSend: vi.fn()
  };
});

describe('app static content data wiring', () => {
  test('loads meme and feedback datasets and renders them into the shell containers', async () => {
    global.fetch = vi.fn(async (path) => {
      if (path.endsWith('nouns.json')) return { ok: true, json: async () => ({}) };
      if (path.endsWith('timeline.json')) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
      if (path.endsWith('podcasts.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('films.json')) return { ok: true, json: async () => [] };
      if (path.endsWith('rankings.json')) return { ok: true, json: async () => ({ book: [], film: [], doc: [] }) };
      if (path.endsWith('memes.json')) return { ok: true, json: async () => MEMES };
      if (path.endsWith('feedback-types.json')) return { ok: true, json: async () => FEEDBACK_TYPES };
      return { ok: true, json: async () => [] };
    });

    await import('../src/js/app.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelectorAll('#meme-scroll .meme-card')).toHaveLength(2);
    expect(document.getElementById('feedback-type-list').textContent).toContain('功能异常');
    expect(document.getElementById('feedback-type-list').textContent).toContain('其他');
  });
});
```

- [ ] **Step 2: 写资源目录结构的失败测试**

Write `tests/resources-structure.test.js`:

```js
import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

describe('resources structure', () => {
  test('keeps the normalized resources directory skeleton', () => {
    expect(exists('resources/images')).toBe(true);
    expect(exists('resources/images/memes')).toBe(true);
    expect(exists('resources/images/nouns')).toBe(true);
    expect(exists('resources/images/people')).toBe(true);
    expect(exists('resources/images/timeline')).toBe(true);
    expect(exists('resources/images/common')).toBe(true);
    expect(exists('resources/audio/podcasts')).toBe(true);
    expect(exists('resources/icons')).toBe(true);
    expect(exists('resources/raw/imported')).toBe(true);
  });

  test('does not keep macOS metadata files in normalized runtime directories', () => {
    expect(exists('resources/images/.DS_Store')).toBe(false);
    expect(exists('resources/images/__MACOSX')).toBe(false);
  });
});
```

- [ ] **Step 3: 运行新增测试，确认当前失败**

Run:

```powershell
npm test -- --run tests/app-static-data.test.js tests/resources-structure.test.js
```

Expected:
- `tests/app-static-data.test.js` FAIL，因为 `app.js` 还未加载并渲染新增静态内容数据
- `tests/resources-structure.test.js` FAIL，因为 `resources/` 目录骨架和清理尚未完成

- [ ] **Step 4: 提交测试护栏**

Run:

```powershell
git add tests/app-static-data.test.js tests/resources-structure.test.js
git commit -m "test: add guards for static data and resources layout"
```

Expected: 提交成功。

---

### Task 2: 抽离第一批纯数据对象并接入 `app.js`

**Files:**
- Create: `src/data/memes.json`
- Create: `src/data/people.json`
- Create: `src/data/discussions.json`
- Create: `src/data/science-tools.json`
- Create: `src/data/feedback-types.json`
- Modify: `src/js/app.js`
- Modify: `index.html:203-210`
- Modify: `index.html:308-333`
- Modify: `index.html:410-466`
- Modify: `index.html:515-523`
- Modify: `index.html:609-676`
- Test: `tests/app-static-data.test.js`

- [ ] **Step 1: 创建梗图数据文件**

Write `src/data/memes.json`:

```json
[
  {
    "id": "meme-qinshihuang",
    "emoji": "🏺",
    "title": "秦始皇陵兵马俑",
    "origin": "1974年陕西农民打井时意外挖出陶俑碎片，经考古发掘后发现规模宏大的兵马俑坑。秦始皇13岁即位就开始修建陵墓，历时39年，役使70余万人。每个兵马俑面容不同，千人千面，被誉为\"世界第八大奇迹\"。",
    "tag": "#考古发现 #秦朝 #世界遗产",
    "caption": "秦始皇：朕的江山，你们随便挖",
    "background": "linear-gradient(135deg,#C0392B,#E74C3C)"
  },
  {
    "id": "meme-tang-poetry",
    "emoji": "📜",
    "title": "唐朝公务员写诗内卷",
    "origin": "唐朝科举常设\"进士科\"，考试内容包含诗赋。诗写得好不仅能中举，还能直接当官。李白靠诗名被唐玄宗召见，王维靠诗画赢得太平公主推荐。为了科举和仕途，整个唐朝文人圈陷入写诗\"内卷\"。",
    "tag": "#科举 #唐朝 #文化史",
    "caption": "唐朝公务员：上班如上坟，还要写诗",
    "background": "linear-gradient(135deg,#8E44AD,#9B59B6)"
  },
  {
    "id": "meme-zhuyuanzhang",
    "emoji": "⚔️",
    "title": "朱元璋反贪大案",
    "origin": "明太祖朱元璋出身贫农，对贪官深恶痛绝。他规定贪污60两银子以上即处死，甚至发明\"剥皮楦草\"酷刑。洪武年间大案频发：空印案、郭桓案、胡惟庸案，诛杀官吏数以万计。",
    "tag": "#明朝 #反腐 #制度史",
    "caption": "朱元璋：我杀贪官的速度比贪官贪钱的速度还快",
    "background": "linear-gradient(135deg,#2C3E50,#34495E)"
  },
  {
    "id": "meme-song-economy",
    "emoji": "🏯",
    "title": "宋朝的经济奇迹",
    "origin": "北宋时期GDP占全球60%以上，远超同时期欧洲各国总和。开封城人口超百万，是世界上最大的城市。但宋军\"重文轻武\"，虽有百万禁军，却连年败于辽、西夏、金，最终亡于蒙古。",
    "tag": "#宋朝 #经济史 #反思",
    "caption": "宋朝GDP占世界60%：我有钱，但我怂",
    "background": "linear-gradient(135deg,#D35400,#E67E22)"
  },
  {
    "id": "meme-kangqian",
    "emoji": "🐉",
    "title": "康乾盛世的代价",
    "origin": "康熙、雍正、乾隆三代虽号称盛世，但闭关锁国政策使中国错失工业革命。乾隆拒绝英国马戛尔尼使团的通商请求，埋下近代屈辱的伏笔。与此同时，贪污盛行，和珅一人贪银折合今人民币超千亿。",
    "tag": "#清朝 #反思 #转折",
    "caption": "康乾盛世：表面万岁，底下全是窟窿",
    "background": "linear-gradient(135deg,#27AE60,#2ECC71)"
  }
]
```

- [ ] **Step 2: 创建人物、讨论区、科学备考与反馈类型数据文件**

Write `src/data/people.json`:

```json
{
  "defaultCenter": "武则天",
  "defaultGroup": "career",
  "centers": {
    "武则天": {
      "name": "武则天",
      "nick": "武曌、则天皇后",
      "career": [
        { "name": "狄仁杰", "role": "宰相", "deeds": ["断案如神", "劝立李显为太子"] },
        { "name": "上官婉儿", "role": "女官", "deeds": ["起草诏令", "称量天下"] },
        { "name": "来俊臣", "role": "酷吏", "deeds": ["编《罗织经》", "制造冤狱"] },
        { "name": "姚崇", "role": "宰相", "deeds": ["开元名相", "灭蝗灾"] },
        { "name": "宋璟", "role": "宰相", "deeds": ["刚正不阿", "与姚崇并称"] },
        { "name": "张易之", "role": "男宠", "deeds": ["干预朝政", "被张柬之诛杀"] }
      ],
      "family": [
        { "name": "李治", "role": "丈夫（唐高宗）", "deeds": ["在位34年", "废王立武"] },
        { "name": "李显", "role": "第三子（唐中宗）", "deeds": ["两度登基", "被韦后毒杀"] },
        { "name": "李旦", "role": "第四子（唐睿宗）", "deeds": ["禅位给李隆基", "政事堂改革"] },
        { "name": "太平公主", "role": "女儿", "deeds": ["权倾朝野", "被李隆基赐死"] },
        { "name": "武三思", "role": "侄子", "deeds": ["权倾一时", "与韦后勾结"] },
        { "name": "武承嗣", "role": "侄子", "deeds": ["请立武氏七庙", "未能成为太子"] }
      ],
      "yearTable": ["637年 生于利州", "655年 被立为皇后", "690年 废唐建周，称帝", "697年 酷吏政治结束", "705年 神龙革命，退位"],
      "evaluation": "中国历史上唯一正统女皇帝。统治期间打击关陇集团，推广科举，重用寒门人才；但晚年宠信男宠、重用酷吏，政治严酷。总体而言，其统治为开元盛世奠定了坚实基础。"
    },
    "秦始皇": {
      "name": "秦始皇",
      "nick": "嬴政、始皇帝",
      "career": [
        { "name": "李斯", "role": "丞相", "deeds": ["统一文字", "制定秦律"] },
        { "name": "王翦", "role": "大将", "deeds": ["灭楚之战", "战功赫赫"] },
        { "name": "蒙恬", "role": "大将", "deeds": ["北击匈奴", "修长城"] },
        { "name": "赵高", "role": "宦官", "deeds": ["沙丘之变", "指鹿为马"] }
      ],
      "family": [
        { "name": "秦庄襄王", "role": "父亲", "deeds": ["在位仅3年", "重用吕不韦"] },
        { "name": "吕不韦", "role": "仲父", "deeds": ["辅政大臣", "《吕氏春秋》"] },
        { "name": "扶苏", "role": "长子", "deeds": ["被矫诏赐死", "素有贤名"] },
        { "name": "胡亥", "role": "第十八子（秦二世）", "deeds": ["沙丘之变继位", "被赵高逼死"] }
      ],
      "yearTable": ["前259年 嬴政生于赵国邯郸", "前247年 13岁即位秦王", "前238年 平定嫪毐之乱，罢黜吕不韦", "前221年 灭齐，统一六国", "前210年 沙丘病逝，赵高篡改遗诏"],
      "evaluation": "中国历史上第一个大一统王朝的创立者。废分封、行郡县、书同文、车同轨，其制度创新影响中国两千年。但严刑峻法、焚书坑儒、徭役繁重，导致民怨沸腾，秦朝二世而亡。"
    }
  }
}
```

Write `src/data/discussions.json`:

```json
[
  {
    "id": "post-keju-neijuan",
    "category": "view",
    "author": "长安一片月",
    "avatar": "🧑",
    "time": "5小时前",
    "title": "科举制和高考，跨越千年的「内卷」",
    "body": "从隋唐到明清，科举从\"取士\"变成\"困士\"。八股文把思维框死。回头看看今天的高考，感觉历史的车轮又在重复转动。",
    "likes": "986",
    "comments": "392",
    "favorite": "收藏",
    "commentsList": [
      { "author": "历史小白", "avatar": "🧒", "body": "真的，我看到八股文就想到现在的高考作文..." },
      { "author": "教书匠", "avatar": "🧓", "body": "科举是阶层跃升，高考也是，本质没变。" }
    ],
    "moreCommentsLabel": "展开全部 390 条评论"
  },
  {
    "id": "post-zhangjuzheng",
    "category": "view",
    "author": "史海拾贝",
    "avatar": "👩",
    "time": "2小时前",
    "title": "如果张居正多活十年，明朝会怎样？",
    "body": "一条鞭法改革初见成效，国库充盈，边防稳固。但张居正一死，万历立刻翻脸，所有改革付诸东流。",
    "likes": "534",
    "comments": "189",
    "favorite": "收藏",
    "commentsList": []
  },
  {
    "id": "post-wangmang",
    "category": "cold",
    "author": "故纸堆里的人",
    "avatar": "🧔",
    "time": "8小时前",
    "title": "历史课本里被一笔带过的\"小事\"",
    "body": "王莽改制在课本上就几行字，但细看他的改革措施——盐铁、土地国有、计划经济，简直是穿越者...",
    "likes": "103",
    "comments": "28",
    "favorite": "收藏",
    "commentsList": []
  }
]
```

Write `src/data/science-tools.json`:

```json
[
  { "id": "fill-blank", "icon": "✏️", "title": "挖空练习", "description": "历年真题挖空训练", "action": "toast", "message": "挖空练习功能开发中" },
  { "id": "note-upload", "icon": "📤", "title": "笔记上传", "description": "上传分享学习笔记", "action": "toast", "message": "笔记上传功能开发中" },
  { "id": "battle", "icon": "⚔️", "title": "联机PK", "description": "和全国考生实时对战", "action": "toast", "message": "联机PK功能开发中" },
  { "id": "review-zone", "icon": "📚", "title": "复习专区", "description": "高频考点专项突破", "action": "toast", "message": "复习专区加载中" },
  { "id": "mindmap", "icon": "🧠", "title": "思维导图", "description": "知识导图·笔记标注", "action": "openSub", "target": "mindmap-page" }
]
```

Write `src/data/feedback-types.json`:

```json
[
  "功能异常",
  "内容错误",
  "功能建议",
  "其他"
]
```

- [ ] **Step 3: 在 `app.js` 中加入第一批数据加载与渲染函数**

In `src/js/app.js`, add the following functions inside the IIFE before `initializeApp()`:

```js
  var memeData = [];
  var peopleData = { defaultCenter: '武则天', defaultGroup: 'career', centers: {} };
  var discussionData = [];
  var scienceTools = [];
  var feedbackTypes = [];
  var curCenter = '武则天';
  var curGroup = 'career';
  var postTags = [];

  function escapeHTML(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderMemes() {
    var scroll = document.getElementById('meme-scroll');
    var dots = document.getElementById('meme-dots');
    if (!scroll || !dots || !memeData.length) return;

    scroll.innerHTML = memeData.map(function (item, index) {
      return '<div class="meme-card" onclick="openMeme(' + index + ')" style="background:' + item.background + '">' +
        '<span style="font-size:64px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">' + item.emoji + '</span>' +
        '<div class="meme-cap">' + escapeHTML(item.caption) + '</div>' +
      '</div>';
    }).join('');

    dots.innerHTML = memeData.map(function (_, index) {
      return '<span class="meme-dot' + (index === 0 ? ' act' : '') + '"></span>';
    }).join('');
  }

  function openMeme(idx) {
    var item = memeData[idx];
    if (!item) return;
    document.getElementById('meme-emoji').textContent = item.emoji;
    document.getElementById('meme-title').textContent = item.title;
    document.getElementById('meme-origin').textContent = item.origin;
    document.getElementById('meme-tag').textContent = item.tag;
    document.getElementById('meme-overlay').classList.add('act');
  }

  function closeMeme(e) {
    if (e.target === document.getElementById('meme-overlay')) {
      document.getElementById('meme-overlay').classList.remove('act');
    }
  }

  function renderScienceTools() {
    var grid = document.querySelector('#science-page .sg');
    if (!grid || !scienceTools.length) return;

    grid.innerHTML = scienceTools.map(function (item) {
      var action = item.action === 'openSub'
        ? 'openSub(\'' + item.target + '\')'
        : 'showToast(\'' + item.message + '\')';
      return '<button class="scard" onclick="' + action + '">' +
        '<span class="ic">' + item.icon + '</span>' +
        '<h4>' + escapeHTML(item.title) + '</h4>' +
        '<p>' + escapeHTML(item.description) + '</p>' +
      '</button>';
    }).join('');
  }

  function renderFeedbackTypes() {
    var list = document.querySelector('#feedback-overlay .fty') || document.getElementById('feedback-type-list');
    if (!list || !feedbackTypes.length) return;

    list.innerHTML = feedbackTypes.map(function (label, index) {
      return '<button class="ft' + (index === 0 ? ' act' : '') + '" onclick="selFT(this)">' + escapeHTML(label) + '</button>';
    }).join('');
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
    document.querySelectorAll('.fty .ft').forEach(function (item) { item.classList.remove('act'); });
    btn.classList.add('act');
  }

  function subFB() {
    var text = document.getElementById('feedback-text').value.trim();
    if (!text) {
      window.showToast('请输入反馈内容');
      return;
    }
    document.getElementById('feedback-overlay').classList.remove('act');
    document.getElementById('feedback-text').value = '';
    window.showToast('反馈已提交，感谢你的建议！');
  }
```

Then extend `initializeData()` with:

```js
    memeData = await loadJSON('./src/data/memes.json', []);
    peopleData = await loadJSON('./src/data/people.json', { defaultCenter: '武则天', defaultGroup: 'career', centers: {} });
    discussionData = await loadJSON('./src/data/discussions.json', []);
    scienceTools = await loadJSON('./src/data/science-tools.json', []);
    feedbackTypes = await loadJSON('./src/data/feedback-types.json', []);

    renderMemes();
    renderScienceTools();
    renderFeedbackTypes();
```

And extend `exposeGlobals()` with:

```js
      window.openMeme = openMeme;
      window.closeMeme = closeMeme;
      window.openFB = openFB;
      window.closeFB = closeFB;
      window.selFT = selFT;
      window.subFB = subFB;
```

- [ ] **Step 4: 删除 `index.html` 中已迁移的第一批硬编码列表与数据源**

Make these exact edits in `index.html`:

1. Replace the science tools static buttons at `index.html:205-211` with only the container shell:

```html
<div class="sg"></div>
```

2. Replace the feedback type buttons at `index.html:518-523` with:

```html
<div class="fty"></div>
```

3. Delete the `memeData` array and the old `openMeme`, `closeMeme`, `openFB`, `closeFB`, `selFT`, `subFB` function definitions from the inline script block.

Keep the overlay shells in HTML; only remove the duplicated data and logic.

- [ ] **Step 5: 运行测试并修正 app 初始化接线**

Run:

```powershell
npm test -- --run tests/app-static-data.test.js tests/navigation.test.js tests/checkin.test.js tests/film.test.js
```

Expected:
- `tests/app-static-data.test.js` PASS
- 现有 `navigation`、`checkin`、`film` 测试继续 PASS
- 如果 `app.js` 暴露顺序导致失败，先修顺序再重跑，直到全部通过

- [ ] **Step 6: 提交第一批静态数据拆分**

Run:

```powershell
git add src/data/memes.json src/data/people.json src/data/discussions.json src/data/science-tools.json src/data/feedback-types.json src/js/app.js index.html
git commit -m "refactor: extract first batch of static content data"
```

Expected: 提交成功。

---

### Task 3: 抽离首页热点、人物页、讨论区和个人页静态列表

**Files:**
- Create: `src/data/hot-articles.json`
- Create: `src/data/profile-menu.json`
- Modify: `src/js/app.js`
- Modify: `index.html:54-111`
- Modify: `index.html:264-289`
- Modify: `index.html:412-487`
- Test: `tests/app-static-data.test.js`

- [ ] **Step 1: 创建热点文章与个人页菜单数据文件**

Write `src/data/hot-articles.json`:

```json
[
  {
    "id": "hot-zhenguan",
    "kind": "headline",
    "dynasty": "qinhan",
    "icon": "📜",
    "background": "#C9A96E",
    "tag": "热门",
    "tagClass": "hot",
    "label": "贞观之治",
    "title": "唐太宗李世民在位期间的清明政治局面，以\"贞观\"为年号（627-649年）。轻徭薄赋、休养生息、虚心纳谏，奠定了\"大唐盛世\"的根基。",
    "meta": ["📖 2.3k 阅读", "❤️ 892 收藏", "💬 视频解读", "🗺️ 思维导图"],
    "url": "https://mp.weixin.qq.com"
  },
  {
    "id": "hot-keju",
    "kind": "headline",
    "dynasty": "suitang",
    "icon": "🏜️",
    "background": "#E8D5B0",
    "tag": "制度",
    "tagClass": "sys",
    "label": "科举制",
    "title": "隋朝创立的分科考试选拔官员的制度，打破门阀垄断，使寒门子弟得以入仕，影响了中国社会结构近1300年。",
    "meta": ["📖 1.6k 阅读", "❤️ 467 收藏", "💬 视频解读", "🗺️ 思维导图"],
    "url": "https://mp.weixin.qq.com"
  },
  {
    "id": "hot-qinshihuang",
    "kind": "headline",
    "dynasty": "qinhan",
    "icon": "⚔️",
    "background": "#EDE8E0",
    "tag": "热门",
    "tagClass": "hot",
    "label": "秦始皇",
    "title": "秦始皇统一六国，废分封行郡县，书同文车同轨，开创中国大一统格局，影响延续至今。",
    "meta": ["📖 3.1k 阅读", "❤️ 1.2k 收藏", "💬 视频解读"],
    "url": "https://mp.weixin.qq.com"
  },
  {
    "id": "hot-song-economy",
    "kind": "item",
    "dynasty": "song",
    "icon": "🏯",
    "background": "#D4C0A0",
    "title": "宋朝：被误解的\"弱宋\"实为经济革命",
    "meta": "💰 经济史 · 10分钟阅读",
    "cta": "🔗 阅读原文",
    "url": "https://mp.weixin.qq.com"
  },
  {
    "id": "hot-wanli",
    "kind": "item",
    "dynasty": "mingqing",
    "icon": "📘",
    "background": "#C0A890",
    "title": "万历十五年：大风起于青萍之末",
    "meta": "📚 历史书评 · 12分钟阅读",
    "cta": "🔗 阅读原文",
    "url": "https://mp.weixin.qq.com"
  },
  {
    "id": "hot-grand-canal",
    "kind": "item",
    "dynasty": "modern",
    "icon": "🌊",
    "background": "#B0C4DE",
    "title": "大运河：一部流动的政治经济学",
    "meta": "🚢 经济史 · 15分钟阅读",
    "cta": "🔗 阅读原文",
    "url": "https://mp.weixin.qq.com"
  },
  {
    "id": "hot-opium-war",
    "kind": "item",
    "dynasty": "modern",
    "icon": "🔥",
    "background": "#F5F0E8",
    "title": "鸦片战争：天朝上国的幻梦破碎时",
    "meta": "💣 近代史 · 8分钟阅读",
    "cta": "🔗 阅读原文",
    "url": "https://mp.weixin.qq.com"
  }
]
```

Write `src/data/profile-menu.json`:

```json
{
  "study": [
    { "id": "study-record", "icon": "📊", "label": "学习记录", "action": "toast", "message": "学习记录开发中" },
    { "id": "favorites", "icon": "📌", "label": "收藏/错题本", "action": "toast", "message": "收藏/错题本开发中" },
    { "id": "points", "icon": "🎁", "label": "积分兑换", "action": "toast", "message": "积分兑换开发中" }
  ],
  "settings": [
    { "id": "feedback", "icon": "💬", "label": "问题反馈", "action": "openFB" },
    { "id": "settings", "icon": "⚙️", "label": "设置与账号", "action": "toast", "message": "设置页面开发中" }
  ]
}
```

- [ ] **Step 2: 在 `app.js` 中增加热点、讨论区与个人页渲染逻辑**

Add to `src/js/app.js`:

```js
  var hotArticles = [];
  var profileMenu = { study: [], settings: [] };

  function renderHotArticles() {
    var container = document.getElementById('hot-articles');
    if (!container || !hotArticles.length) return;

    container.innerHTML = hotArticles.map(function (item) {
      if (item.kind === 'headline') {
        return '<div class="hl" onclick="window.open(\'' + item.url + '\',\'_blank\')" data-dynasty="' + item.dynasty + '">' +
          '<div class="hl-img" style="background:' + (item.background || '#EDE8E0') + ';">' + item.icon + '</div>' +
          '<div class="inf">' +
            '<div style="margin-bottom:6px"><span class="tg ' + item.tagClass + '">' + escapeHTML(item.tag) + '</span><span style="font-size:12px;color:#8A8279">' + escapeHTML(item.label) + '</span></div>' +
            '<h3>' + escapeHTML(item.title) + '</h3>' +
            '<div class="ad">' + item.meta.map(function (meta) { return '<span>' + escapeHTML(meta) + '</span>'; }).join('') + '</div>' +
          '</div>' +
        '</div>';
      }

      return '<div class="hi" onclick="window.open(\'' + item.url + '\',\'_blank\')" data-dynasty="' + item.dynasty + '">' +
        '<div class="hi-img" style="background:' + item.background + ';">' + item.icon + '</div>' +
        '<div class="tx">' +
          '<h4>' + escapeHTML(item.title) + '</h4>' +
          '<div class="meta">' + escapeHTML(item.meta) + '</div>' +
          '<div class="lk">' + escapeHTML(item.cta) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderDiscussions() {
    var page = document.querySelector('#discuss-page .dp');
    if (!page || !discussionData.length) return;

    var intro = '<div style="display:flex;gap:16px;padding:0 16px 12px;font-size:12px;color:#8A8279"><span>🔥 1.2k 讨论</span><span>⭐ 486 收藏</span></div>';
    var tabs = '<div class="htabs" style="padding:0 16px 12px;display:flex;gap:8px;overflow-x:auto">' +
      '<button class="htab act" onclick="filterDiscuss(\'all\',this)">全部</button>' +
      '<button class="htab" onclick="filterDiscuss(\'view\',this)">史观</button>' +
      '<button class="htab" onclick="filterDiscuss(\'cold\',this)">冷知识</button>' +
      '<button class="htab" onclick="filterDiscuss(\'help\',this)">求助</button>' +
      '<button class="htab" onclick="filterDiscuss(\'resource\',this)">资源</button>' +
    '</div>';

    var cards = discussionData.map(function (item) {
      var comments = item.commentsList && item.commentsList.length
        ? '<div class="cmt-list" style="display:none;padding:8px 0 0;border-top:1px solid #EDE8E0;margin-top:8px">' +
            item.commentsList.map(function (comment) {
              return '<div class="cmt-item" style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">' +
                '<div style="width:24px;height:24px;background:#EDE8E0;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center">' + escapeHTML(comment.avatar) + '</div>' +
                '<div style="flex:1"><div style="font-size:11px;font-weight:600;color:#2C1810">' + escapeHTML(comment.author) + '</div><div style="font-size:11px;color:#2C1810;line-height:1.5">' + escapeHTML(comment.body) + '</div></div>' +
              '</div>';
            }).join('') +
            '<div style="font-size:10px;color:#C9A96E;cursor:pointer;padding:4px 0" onclick="showToast(\'展开更多评论\')">' + escapeHTML(item.moreCommentsLabel || '展开更多评论') + '</div>' +
          '</div>'
        : '';

      return '<div class="pcard" data-discuss-cat="' + item.category + '">' +
        '<div class="pa"><div class="pav">' + escapeHTML(item.avatar) + '</div><div><div class="nm">' + escapeHTML(item.author) + '</div><div class="ti">' + escapeHTML(item.time) + '</div></div></div>' +
        '<div class="pc"><h4>' + escapeHTML(item.title) + '</h4><p>' + escapeHTML(item.body) + '</p></div>' +
        '<div class="pact"><span>❤️ ' + escapeHTML(item.likes) + '</span><span onclick="toggleComments(this)">💬 ' + escapeHTML(item.comments) + '</span><span>⭐ ' + escapeHTML(item.favorite) + '</span></div>' +
        comments +
      '</div>';
    }).join('');

    page.innerHTML = intro + tabs + cards;
  }

  function renderProfileMenu() {
    var groups = document.querySelectorAll('#profile-page .mg');
    if (groups.length < 2) return;

    function buildButton(item) {
      var action = item.action === 'openFB'
        ? 'openFB()'
        : 'showToast(\'' + item.message + '\')';
      return '<button class="mi" onclick="' + action + '"><span class="ic">' + item.icon + '</span>' + escapeHTML(item.label) + '<span class="ar">›</span></button>';
    }

    groups[0].innerHTML = profileMenu.study.map(buildButton).join('');
    groups[1].innerHTML = profileMenu.settings.map(buildButton).join('');
  }
```

Extend `initializeData()` with:

```js
    hotArticles = await loadJSON('./src/data/hot-articles.json', []);
    profileMenu = await loadJSON('./src/data/profile-menu.json', { study: [], settings: [] });

    renderHotArticles();
    renderDiscussions();
    renderProfileMenu();
```

- [ ] **Step 3: 用容器替换 `index.html` 中的大块静态列表**

Make these exact replacements in `index.html`:

1. Replace the current hot article cards inside `#hot-articles` with an empty shell:

```html
<div class="ha" id="hot-articles"></div>
```

2. Keep the people detail card shell, but remove static assumption text in the people page body except the search box, current person line, group tabs, and SVG container.

3. Replace the discuss page content region under `#discuss-page .dp` with:

```html
<div class="dp"></div>
```

4. Keep the two `.mg` containers in profile page, but remove the hardcoded buttons so that they remain empty containers:

```html
<div class="mg"></div>
<div class="mg"></div>
```

- [ ] **Step 4: 运行测试与手工冒烟**

Run:

```powershell
npm test -- --run tests/app-static-data.test.js tests/navigation.test.js tests/checkin.test.js tests/film.test.js
```

Then run:

```powershell
npm test
```

Expected:
- 全部测试 PASS
- 如果某个页面容器丢失导致测试失败，补回壳层节点后重跑

Manual smoke targets after test pass:
- 首页热点列表仍显示
- 讨论区仍显示帖子
- “我的”页面仍显示两组菜单按钮
- 反馈弹窗标签仍可切换

- [ ] **Step 5: 提交第二批静态列表拆分**

Run:

```powershell
git add src/data/hot-articles.json src/data/profile-menu.json src/js/app.js index.html
git commit -m "refactor: move static homepage and profile lists to data files"
```

Expected: 提交成功。

---

### Task 4: 完成人物关系页与思维导图的数据接管

**Files:**
- Create: `src/data/mindmaps.json`
- Modify: `src/js/app.js`
- Modify: `index.html:223-246`
- Modify: `index.html:669-779`
- Test: `tests/app-static-data.test.js`

- [ ] **Step 1: 创建思维导图数据文件**

Write `src/data/mindmaps.json`:

```json
{
  "tabs": [
    { "id": "china", "label": "中国通史" },
    { "id": "world", "label": "世界国别史" },
    { "id": "custom", "label": "＋ 新建导图" }
  ],
  "maps": {
    "china": {
      "root": "中国通史",
      "nodes": ["先秦", "秦汉", "魏晋南北朝", "隋唐", "宋元", "明清", "近代", "现代"]
    },
    "world": {
      "root": "世界史",
      "nodes": ["古希腊罗马", "中世纪欧洲", "文艺复兴", "工业革命", "世界大战", "冷战至今"]
    }
  }
}
```

- [ ] **Step 2: 在 `app.js` 中迁移人物页、思维导图、特征弹窗和讨论区交互函数**

Move the following functions from the inline script block into `src/js/app.js`, keeping behavior equivalent and using the new `peopleData` store:

```js
  function renderRel() {
    var svg = document.getElementById('relation-svg');
    var centers = peopleData.centers || {};
    var data = centers[curCenter];
    if (!svg || !data) return;
    var list = curGroup === 'career' ? data.career : data.family;
    while (svg.children.length > 2) svg.removeChild(svg.lastChild);
    var cx = 175, cy = 200, r = 140, l = list.length;
    list.forEach(function (person, index) {
      var angle = (2 * Math.PI * index / l) - Math.PI / 2;
      var px = cx + r * Math.cos(angle);
      var py = cy + r * Math.sin(angle);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', px);
      line.setAttribute('y2', py);
      line.setAttribute('stroke', '#D4C9B8');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('opacity', '0.6');
      svg.appendChild(line);
      var roleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      roleText.setAttribute('x', (cx + px) / 2);
      roleText.setAttribute('y', (cy + py) / 2 - 6);
      roleText.setAttribute('text-anchor', 'middle');
      roleText.setAttribute('font-size', '8');
      roleText.setAttribute('fill', '#8A8279');
      roleText.textContent = person.role;
      svg.appendChild(roleText);
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', px);
      circle.setAttribute('cy', py);
      circle.setAttribute('r', '9');
      circle.setAttribute('fill', '#7EBDA6');
      circle.setAttribute('stroke', '#6DAB95');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('cursor', 'pointer');
      circle.onclick = function () {
        if (centers[person.name]) {
          curCenter = person.name;
          renderRel();
          window.showToast('已切换到：' + person.name);
        } else {
          openPeoDet(curCenter, person);
        }
      };
      svg.appendChild(circle);
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', px);
      text.setAttribute('y', py - 12);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', '#2C1810');
      text.textContent = person.name;
      svg.appendChild(text);
    });
    document.getElementById('center-name').textContent = curCenter;
    document.getElementById('cur-peo-name').textContent = curCenter;
  }

  function openCenterDet() {
    var center = (peopleData.centers || {})[curCenter];
    if (!center) return;
    openPeoDet(curCenter, {
      name: center.name,
      role: '核心人物',
      nick: center.nick || '',
      deeds: (center.yearTable || []).slice(0, 3)
    });
  }

  function closePeoDet() {
    document.getElementById('people-detail-card').classList.remove('act');
  }

  function swPeoGroup(btn, group) {
    document.querySelectorAll('#people-page .dtab').forEach(function (item) { item.classList.remove('act'); });
    btn.classList.add('act');
    curGroup = group;
    renderRel();
  }

  function searchPeople() {
    var value = document.getElementById('people-search-input').value.trim();
    if ((peopleData.centers || {})[value]) {
      curCenter = value;
      renderRel();
      window.showToast('已切换到：' + value);
    } else if (value) {
      window.showToast('暂未收录，试试：武则天、秦始皇');
    }
  }

  function swMind(btn, tab) {
    document.querySelectorAll('.mtab').forEach(function (item) { item.classList.remove('act'); });
    btn.classList.add('act');
    document.getElementById('mm-china').style.display = tab === 'china' ? 'block' : 'none';
    document.getElementById('mm-world').style.display = tab === 'world' ? 'block' : 'none';
    document.getElementById('mm-custom').style.display = tab === 'custom' ? 'flex' : 'none';
  }

  function openNode(name) {
    document.getElementById('node-note-title').textContent = '📝 ' + name + ' · 节点笔记';
    document.getElementById('node-note-input').value = localStorage.getItem('note_' + name) || '';
    document.getElementById('node-note-input').dataset.node = name;
    document.getElementById('node-note-panel').style.display = 'flex';
  }

  function saveNode() {
    var input = document.getElementById('node-note-input');
    var name = input.dataset.node;
    localStorage.setItem('note_' + name, input.value);
    document.getElementById('node-note-panel').style.display = 'none';
    window.showToast('「' + name + '」的笔记已保存！');
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
```

Also extend `initializeData()` with:

```js
    curCenter = peopleData.defaultCenter || '武则天';
    curGroup = peopleData.defaultGroup || 'career';
    renderRel();
```

And extend `exposeGlobals()` with:

```js
      window.renderRel = renderRel;
      window.openCenterDet = openCenterDet;
      window.openPeoDet = openPeoDet;
      window.closePeoDet = closePeoDet;
      window.swPeoGroup = swPeoGroup;
      window.searchPeople = searchPeople;
      window.swMind = swMind;
      window.openNode = openNode;
      window.saveNode = saveNode;
      window.closeNodeNote = closeNodeNote;
      window.openFeatDet = openFeatDet;
      window.closeFeatDet = closeFeatDet;
```

- [ ] **Step 3: 删除对应的内联函数，并保留壳层 HTML**

In `index.html`, delete from the inline script block:
- `peoData` object
- `renderRel`
- `openCenterDet`
- `openPeoDet`
- `closePeoDet`
- `swPeoGroup`
- `searchPeople`
- `swMind`
- `openNode`
- `saveNode`
- `closeNodeNote`
- `openFeatDet`
- `closeFeatDet`

Do not delete:
- `#relation-svg`
- `#people-detail-card`
- `#node-note-panel`
- `#feat-detail-overlay`

- [ ] **Step 4: 运行测试并补一个人物页冒烟断言**

Append to `tests/app-static-data.test.js`:

```js
test('loads people dataset and keeps relation page globals available', async () => {
  global.fetch = vi.fn(async (path) => {
    if (path.endsWith('nouns.json')) return { ok: true, json: async () => ({}) };
    if (path.endsWith('timeline.json')) return { ok: true, json: async () => ({ dynasties: [], events: [] }) };
    if (path.endsWith('podcasts.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('films.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('rankings.json')) return { ok: true, json: async () => ({ book: [], film: [], doc: [] }) };
    if (path.endsWith('memes.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('feedback-types.json')) return { ok: true, json: async () => [] };
    if (path.endsWith('people.json')) {
      return {
        ok: true,
        json: async () => ({
          defaultCenter: '武则天',
          defaultGroup: 'career',
          centers: {
            '武则天': {
              name: '武则天',
              nick: '武曌、则天皇后',
              career: [{ name: '狄仁杰', role: '宰相', deeds: ['断案如神'] }],
              family: [],
              yearTable: ['690年 称帝'],
              evaluation: '为开元盛世奠基。'
            }
          }
        })
      };
    }
    return { ok: true, json: async () => [] };
  });

  mountDOM(`
    <div id="meme-scroll"></div>
    <div id="meme-dots"></div>
    <div id="feedback-type-list"></div>
    <svg id="relation-svg"><circle id="center-circle"></circle><text id="center-name"></text></svg>
    <span id="cur-peo-name"></span>
    <div id="people-detail-card"></div>
    <ul id="pd-deeds"></ul>
    <ul id="pd-year-table"></ul>
    <div id="pd-info"></div>
    <div id="pd-eval"><p id="pd-eval-text"></p></div>
    <div id="toast"></div>
  `);

  await import('../src/js/app.js');
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(window.renderRel).toBeTypeOf('function');
  expect(document.getElementById('center-name').textContent).toContain('武则天');
});
```

Run:

```powershell
npm test -- --run tests/app-static-data.test.js tests/navigation.test.js tests/checkin.test.js tests/film.test.js
```

Expected: 全部 PASS。

- [ ] **Step 5: 提交人物与思维导图静态数据接管**

Run:

```powershell
git add src/data/mindmaps.json src/js/app.js index.html tests/app-static-data.test.js
git commit -m "refactor: move people and mindmap static data into app layer"
```

Expected: 提交成功。

---

### Task 5: 清理剩余页面壳层脚本并完成底部页面切换接管

**Files:**
- Modify: `src/js/app.js`
- Modify: `src/js/navigation.js`
- Modify: `index.html:583-815`
- Test: `tests/navigation.test.js`

- [ ] **Step 1: 为页面切换补测试**

Append to `tests/navigation.test.js`:

```js
test('swTab switches active page and nav state while keeping login hidden rules', async () => {
  document.body.innerHTML = `
    <div id="login-page" class="page active"></div>
    <div id="home-page" class="page"></div>
    <div id="discuss-page" class="page"></div>
    <div id="profile-page" class="page"></div>
    <div id="bnav" style="display:none"></div>
    <div id="ai-fab"></div>
    <div id="toast"></div>
    <button class="ni act" id="nav-home"></button>
    <button class="ni" id="nav-discuss"></button>
    <button class="ni" id="nav-profile"></button>
    <div id="node-note-panel" style="display:flex"></div>
    <div id="people-detail-card" class="act"></div>
    <div id="noun-detail" class="act"></div>
  `;

  await import('../src/js/navigation.js');
  window.navigationAPI.swTab(document.getElementById('nav-discuss'), 'discuss-page');

  expect(document.getElementById('discuss-page').classList.contains('active')).toBe(true);
  expect(document.getElementById('nav-discuss').classList.contains('act')).toBe(true);
  expect(document.getElementById('bnav').style.display).toBe('flex');
  expect(document.getElementById('node-note-panel').style.display).toBe('none');
  expect(document.getElementById('people-detail-card').classList.contains('act')).toBe(false);
  expect(document.getElementById('noun-detail').classList.contains('act')).toBe(false);
});
```

- [ ] **Step 2: 在 `navigation.js` 中接管 `swTab` 与 `swSubTab`**

Add to `src/js/navigation.js` before `window.navigationAPI = { ... }`:

```js
  function swTab(btn, pid) {
    document.querySelectorAll('.sub').forEach(function (panel) { panel.classList.remove('act'); });
    document.querySelectorAll('.nd').forEach(function (panel) { panel.classList.remove('act'); });

    var notePanel = document.getElementById('node-note-panel');
    if (notePanel) notePanel.style.display = 'none';

    var peopleCard = document.getElementById('people-detail-card');
    if (peopleCard) peopleCard.classList.remove('act');

    var nounDetail = document.getElementById('noun-detail');
    if (nounDetail) nounDetail.classList.remove('act');

    document.querySelectorAll('.page').forEach(function (page) { page.classList.remove('active'); });
    document.querySelectorAll('.ni').forEach(function (nav) { nav.classList.remove('act'); });

    var page = document.getElementById(pid);
    if (page) page.classList.add('active');
    if (btn) btn.classList.add('act');

    var aiFab = document.getElementById('ai-fab');
    var bottomNav = document.getElementById('bnav');
    if (pid === 'login-page') {
      if (aiFab) aiFab.classList.remove('sh');
      if (bottomNav) bottomNav.style.display = 'none';
    } else {
      if (aiFab) aiFab.classList.add('sh');
      if (bottomNav) bottomNav.style.display = 'flex';
    }

    resetAIFab();
  }

  function swSubTab(btn, pageId) {
    document.querySelectorAll('.sub').forEach(function (panel) { panel.classList.remove('act'); });
    var page = document.getElementById(pageId);
    if (page) page.classList.add('act');
  }
```

Then export them:

```js
    swTab: swTab,
    swSubTab: swSubTab
```

- [ ] **Step 3: 在 `app.js` 中兼容暴露，并清空剩余内联脚本**

Extend `exposeGlobals()` in `src/js/app.js` with:

```js
      window.swTab = window.navigationAPI.swTab;
      window.swSubTab = window.navigationAPI.swSubTab;
```

Then replace the entire remaining inline `<script>` block in `index.html` with nothing so that the bottom of body ends with only the external scripts:

```html
<script src="./src/js/storage.js"></script>
<script src="./src/js/navigation.js"></script>
<script src="./src/js/favorites.js"></script>
<script src="./src/js/noun.js"></script>
<script src="./src/js/timeline.js"></script>
<script src="./src/js/podcast.js"></script>
<script src="./src/js/ai-assistant.js"></script>
<script src="./src/js/checkin.js"></script>
<script src="./src/js/film.js"></script>
<script src="./src/js/app.js"></script>
```

- [ ] **Step 4: 运行完整测试并检查 HTML 已无内联主脚本**

Run:

```powershell
npm test
```

Then run:

```powershell
git grep -n "<script>" -- index.html
```

Expected:
- `npm test` 全部 PASS
- `git grep` 对 `index.html` 不再返回页面底部主内联脚本块

- [ ] **Step 5: 提交壳层脚本清理**

Run:

```powershell
git add src/js/navigation.js src/js/app.js index.html tests/navigation.test.js
git commit -m "refactor: remove remaining inline shell script"
```

Expected: 提交成功。

---

### Task 6: 建立 `resources/` 正式目录骨架并清理垃圾文件

**Files:**
- Create: `resources/images/.gitkeep`
- Create: `resources/images/memes/.gitkeep`
- Create: `resources/images/nouns/.gitkeep`
- Create: `resources/images/people/.gitkeep`
- Create: `resources/images/timeline/.gitkeep`
- Create: `resources/images/common/.gitkeep`
- Create: `resources/audio/.gitkeep`
- Create: `resources/audio/podcasts/.gitkeep`
- Create: `resources/icons/.gitkeep`
- Create: `resources/raw/.gitkeep`
- Create: `resources/raw/imported/.gitkeep`
- Modify: `.gitignore`
- Modify: `docs/resources-inventory.md`
- Test: `tests/resources-structure.test.js`

- [ ] **Step 1: 建立规范化资源目录骨架**

Run:

```powershell
New-Item -ItemType Directory -Force "resources/images","resources/images/memes","resources/images/nouns","resources/images/people","resources/images/timeline","resources/images/common","resources/audio","resources/audio/podcasts","resources/icons","resources/raw","resources/raw/imported" | Out-Null
```

Expected: 目录全部创建完成，无报错。

- [ ] **Step 2: 创建 `.gitkeep` 与资源清单文档**

Create placeholder files:

```powershell
'' | Set-Content -Encoding utf8 "resources/images/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/images/memes/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/images/nouns/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/images/people/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/images/timeline/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/images/common/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/audio/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/audio/podcasts/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/icons/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/raw/.gitkeep"
'' | Set-Content -Encoding utf8 "resources/raw/imported/.gitkeep"
```

Write `docs/resources-inventory.md`:

```markdown
# Resources Inventory

## Runtime directories

- `resources/images/memes/`
- `resources/images/nouns/`
- `resources/images/people/`
- `resources/images/timeline/`
- `resources/images/common/`
- `resources/audio/podcasts/`
- `resources/icons/`

## Raw intake directory

- `resources/raw/imported/`

## Migration notes

- 现有 `resources/名词解释/` 下的导入图片先迁入 `resources/raw/imported/名词解释/`
- `__MACOSX/`、`.DS_Store`、`Thumbs.db` 不进入正式运行目录
- 正式页面引用路径后续统一使用 `resources/images/...` 或 `resources/audio/...`
```

- [ ] **Step 3: 更新 `.gitignore` 并清理垃圾文件**

Append to `.gitignore` if missing:

```gitignore
.DS_Store
Thumbs.db
__MACOSX/
```

Then clean known garbage files:

```powershell
Get-ChildItem -Path "resources" -Recurse -Force -Filter ".DS_Store" | Remove-Item -Force -Confirm:$false
Get-ChildItem -Path "resources" -Recurse -Force -Filter "Thumbs.db" | Remove-Item -Force -Confirm:$false
Get-ChildItem -Path "resources" -Recurse -Force -Directory | Where-Object { $_.Name -eq "__MACOSX" } | Remove-Item -Recurse -Force -Confirm:$false
```

Expected: 垃圾文件和 `__MACOSX` 目录被移除。

- [ ] **Step 4: 运行资源结构测试**

Run:

```powershell
npm test -- --run tests/resources-structure.test.js
```

Expected: PASS。

- [ ] **Step 5: 提交资源目录骨架与清理**

Run:

```powershell
git add .gitignore resources docs/resources-inventory.md tests/resources-structure.test.js
git commit -m "chore: normalize resources directory structure"
```

Expected: 提交成功。

---

### Task 7: 迁移现有导入资源并补充路径字段的兼容约定

**Files:**
- Modify: `docs/resources-inventory.md`
- Modify: `src/data/memes.json`
- Modify: `src/data/people.json`
- Modify: `src/data/films.json`
- Modify: `src/data/podcasts.json`
- Move: `resources/名词解释/**`
- Test: `tests/resources-structure.test.js`

- [ ] **Step 1: 把现有导入素材迁入 `resources/raw/imported/`**

Run after inspecting the current subtree:

```powershell
Get-ChildItem "resources"
Move-Item "resources/名词解释" "resources/raw/imported/名词解释"
```

Expected: 原导入素材从 `resources/名词解释` 迁移到 `resources/raw/imported/名词解释`。

- [ ] **Step 2: 为数据文件补充可选资源路径字段**

Update representative entries with nullable path fields.

In `src/data/memes.json`, add fields like:

```json
"image": "resources/images/memes/qinshihuang.jpg"
```

In `src/data/people.json`, for each center add optional fields like:

```json
"avatar": "resources/images/people/wuzetian.jpg"
```

In `src/data/films.json`, add optional cover fields like:

```json
"coverImage": "resources/images/common/film-last-emperor.jpg"
```

In `src/data/podcasts.json`, add optional fields like:

```json
"coverImage": "resources/images/common/podcast-zhenguan.jpg",
"audioUrl": "resources/audio/podcasts/zhenguan.mp3"
```

Do not update rendering to depend on these files yet; keep them optional metadata only.

- [ ] **Step 3: 更新资源清单文档，记录正式引用与原始导入分层**

Append to `docs/resources-inventory.md`:

```markdown
## Optional metadata paths added to JSON

- `src/data/memes.json` may define `image`
- `src/data/people.json` may define `avatar`
- `src/data/films.json` may define `coverImage`
- `src/data/podcasts.json` may define `coverImage` and `audioUrl`

## Rule

这些字段仅表示正式资源目标路径。若文件尚未准备完成，渲染层必须允许字段存在但资源未真正接入。
```

- [ ] **Step 4: 运行完整测试与 Git 状态检查**

Run:

```powershell
npm test
```

Then run:

```powershell
git status
```

Expected:
- 所有测试 PASS
- `git status` 仅显示本任务预期的资源迁移与数据字段修改

- [ ] **Step 5: 提交资源迁移与路径约定**

Run:

```powershell
git add resources/raw/imported src/data/memes.json src/data/people.json src/data/films.json src/data/podcasts.json docs/resources-inventory.md
git commit -m "chore: migrate imported assets and record resource path conventions"
```

Expected: 提交成功。

---

### Task 8: 更新文档并完成最终验收

**Files:**
- Modify: `README.md`
- Modify: `docs/refactor-report.md`
- Inspect: `docs/superpowers/specs/2026-06-09-static-content-resources-design.md`

- [ ] **Step 1: 更新 README 的静态内容与资源说明**

Append to `README.md` after the current structure section:

```markdown
## 静态内容组织

项目当前把静态内容分为两层：

- `src/data/`：结构化内容数据（JSON）
- `resources/`：图片、图标、音频与原始素材

页面运行时优先通过 `fetch` 读取 `src/data/`，并在渲染阶段按需引用 `resources/` 中的正式资源路径。
```

- [ ] **Step 2: 更新重构报告，记录本轮静态内容与资源整理结果**

Append to `docs/refactor-report.md`:

```markdown
## 第三阶段：静态内容拆分与 resources 统一管理

### 已完成

- 首页梗图、热点、讨论区、反馈类型等静态内容已迁入 `src/data/`
- 人物关系网与思维导图核心数据已从内联脚本迁出
- `index.html` 已移除剩余大块内联主脚本
- `resources/` 已建立正式目录骨架
- 原始导入素材已迁入 `resources/raw/imported/`
- 垃圾文件与 `__MACOSX` 残留已清理

### 兼容策略

- 保留页面骨架与关键容器
- 保留必要的内联事件入口名
- 资源路径字段先作为可选元数据接入，不强制一次性替换所有 UI 表现
```

- [ ] **Step 3: 做最终测试与结构检查**

Run:

```powershell
npm test
```

Then run:

```powershell
git grep -n "<script>" -- index.html
Get-ChildItem "resources" -Recurse
```

Expected:
- `npm test` 全部 PASS
- `index.html` 不再包含主业务内联脚本
- `resources/` 显示规范化目录骨架和已迁移文件

- [ ] **Step 4: 提交文档与最终整理**

Run:

```powershell
git add README.md docs/refactor-report.md
git commit -m "docs: document static content and resources organization"
```

Expected: 提交成功。

---

## Self-Review Checklist

### Spec coverage

This plan covers:
- `src/data/` 继续承载结构化内容数据
- `resources/` 作为统一正式资源目录
- 先抽离纯数据对象，再改大块静态列表，再整理资源目录与路径
- 兼容保留 `index.html` 壳层与现有交互入口
- 清理 `__MACOSX`、`.DS_Store`、`Thumbs.db`
- 对新增 JSON 和资源目录提供测试护栏
- 更新 README 与重构报告

### Placeholder scan

The plan avoids:
- TBD / TODO 占位
- “自行实现”式描述
- “参考前文”式省略
- 未给出命令或代码内容的实现步骤

### Type consistency

The plan uses consistent names across tasks:
- `memeData`
- `peopleData`
- `discussionData`
- `scienceTools`
- `feedbackTypes`
- `hotArticles`
- `profileMenu`
- `renderMemes()`
- `renderScienceTools()`
- `renderFeedbackTypes()`
- `renderHotArticles()`
- `renderDiscussions()`
- `renderProfileMenu()`
- `renderRel()`
- `swTab()` / `swSubTab()`

No later task renames these interfaces.
