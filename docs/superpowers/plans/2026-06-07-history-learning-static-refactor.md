# 学的是史静态原型拆分重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `index.html` 单文件原型拆分为可维护的原生静态 Web 项目结构，保持视觉与交互基本不变，并继续支持通过静态服务器运行。

**Architecture:** 保留现有 HTML 结构和内联事件调用方式，把内联 CSS 拆到 `src/css`，把内联 JavaScript 按职责拆到 `src/js`，把适合结构化维护的内容抽离到 `src/data`。通过 `src/js/app.js` 统一初始化、加载 JSON、暴露全局函数，并以最小改动方式修复明显重复样式、路径错误和阻断性报错。

**Tech Stack:** 原生 HTML、原生 CSS、原生 JavaScript、JSON 静态数据、浏览器 LocalStorage、Python 标准库静态服务器、Git

---

## File Structure Map

### Existing files to modify

- Modify: `index.html`
  - 从单文件原型调整为页面结构壳层
  - 删除内联 `<style>` 与 `<script>`
  - 添加外部 CSS / JS 引用
  - 保留页面 DOM、关键 `id/class`、内联 `onclick`
- Modify: `README.md`（若不存在则创建）
  - 写明静态服务器运行方式
  - 说明目录结构和当前技术方案

### New files to create

- Create: `index.backup.html`
  - 原始单文件原型备份
- Create: `.gitignore`
  - 忽略系统文件与本地运行垃圾文件
- Create: `src/css/base.css`
  - 基础样式、reset、全局布局、toast、基础按钮
- Create: `src/css/components.css`
  - 卡片、导航、弹窗、搜索栏、播放器、AI 面板等复用组件
- Create: `src/css/pages.css`
  - 登录页、首页、名词解释、时间轴、人物页、AI 播客页等页面级样式
- Create: `src/js/storage.js`
  - LocalStorage 统一读写与兼容访问
- Create: `src/js/navigation.js`
  - 登录、页面切换、子页面开关、toast、通用面板控制
- Create: `src/js/favorites.js`
  - 收藏数据结构、收藏夹渲染、收藏删除、影视待看管理
- Create: `src/js/noun.js`
  - 名词数据加载、渲染、搜索、详情、收藏、分享
- Create: `src/js/timeline.js`
  - 朝代切换、时间轴渲染、事件列表、缩放、拖拽、详情
- Create: `src/js/podcast.js`
  - 播客筛选、播放器、进度、定时关闭
- Create: `src/js/ai-assistant.js`
  - AI 面板开关、问答模拟、悬浮按钮拖拽
- Create: `src/js/app.js`
  - 应用入口、JSON 加载、模块初始化、全局函数暴露
- Create: `src/data/nouns.json`
- Create: `src/data/timeline.json`
- Create: `src/data/people.json`
- Create: `src/data/podcasts.json`
- Create: `src/data/books.json`
- Create: `src/data/memes.json`
- Create: `docs/refactor-report.md`
  - 记录本次重构完成项、兼容性、测试结果、已知未处理项
- Create: `mini-program/README.md`
  - 说明该目录暂未建立正式小程序工程
- Create: `assets/images/.gitkeep`
- Create: `assets/icons/.gitkeep`
- Create: `assets/audio/.gitkeep`

### Optional lightweight validation artifacts

- Create: `docs/manual-smoke-test.md`
  - 列出浏览器手工验收步骤

---

### Task 1: 初始化 Git、备份原型并建立目录骨架

**Files:**
- Create: `index.backup.html`
- Create: `.gitignore`
- Create: `assets/images/.gitkeep`
- Create: `assets/icons/.gitkeep`
- Create: `assets/audio/.gitkeep`
- Create: `mini-program/README.md`
- Create: `README.md`（若不存在）

- [ ] **Step 1: 确认当前目录还不是 Git 仓库**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

Expected: 命令失败并输出 `fatal: not a git repository`。

- [ ] **Step 2: 初始化 Git 仓库**

Run:

```powershell
git init
```

Expected: 输出类似 `Initialized empty Git repository in ...History-Learning/.git/`。

- [ ] **Step 3: 创建基础忽略文件**

Write `.gitignore`:

```gitignore
Thumbs.db
Desktop.ini
.DS_Store
*.log
```

- [ ] **Step 4: 备份当前单文件原型**

Run:

```powershell
Copy-Item "index.html" "index.backup.html"
```

Expected: 根目录新增 `index.backup.html`。

- [ ] **Step 5: 建立目录骨架**

Run:

```powershell
New-Item -ItemType Directory -Force "assets","assets/images","assets/icons","assets/audio","src","src/css","src/js","src/data","docs","mini-program" | Out-Null
```

Expected: 目录创建完成，无报错。

- [ ] **Step 6: 创建占位与说明文件**

Write `mini-program/README.md`:

```markdown
# mini-program

本目录当前仅为后续规划预留。

本次重构不创建正式微信小程序工程，仅保留目录结构说明。
```

Write `README.md` 初始内容：

```markdown
# 学的是史

中国历史学习网站原型，当前以原生 HTML、CSS、JavaScript 和 JSON 静态数据实现。
```

- [ ] **Step 7: 创建分支**

Run:

```powershell
git checkout -b refactor/split-static-prototype
```

Expected: 输出类似 `Switched to a new branch 'refactor/split-static-prototype'`。

- [ ] **Step 8: 提交初始化与备份**

Run:

```powershell
git add .gitignore index.backup.html README.md mini-program/README.md assets/icons/.gitkeep assets/images/.gitkeep assets/audio/.gitkeep
git commit -m "chore: initialize repository and backup static prototype"
```

Expected: 成功生成首个 commit。

---

### Task 2: 拆分 CSS 到 `src/css` 并接回 `index.html`

**Files:**
- Create: `src/css/base.css`
- Create: `src/css/components.css`
- Create: `src/css/pages.css`
- Modify: `index.html:6-392`

- [ ] **Step 1: 从 `index.html` 提取基础样式到 `src/css/base.css`**

Write `src/css/base.css` with the shared global subset first:

```css
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,"PingFang SC","Helvetica Neue",sans-serif;background:#FAF8F5;color:#2C1810;-webkit-font-smoothing:antialiased}
.page{display:none;width:100%;max-width:420px;margin:0 auto;min-height:100vh;position:relative}
.page.active{display:flex;flex-direction:column;padding-bottom:70px}
.sub{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:420px;height:100vh;background:#FAF8F5;z-index:50;overflow-y:auto;display:none;flex-direction:column}
.sub.act{display:flex}
.toast{position:fixed;top:60px;left:50%;transform:translateX(-50%);background:rgba(44,24,16,.8);color:#fff;padding:10px 24px;border-radius:20px;font-size:13px;z-index:999;opacity:0;transition:opacity .3s;pointer-events:none}
.toast.sh{opacity:1}
.tg{display:inline-block;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:500;margin-right:6px}
.tg.hot{background:#2C1810;color:#fff}
.tg.sys{background:#C9A96E;color:#fff}
```

- [ ] **Step 2: 从 `index.html` 提取复用组件样式到 `src/css/components.css`**

Write `src/css/components.css` with component groups from the original file, including:

```css
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:420px;background:#fff;border-top:1px solid #F0EBE3;display:none;justify-content:space-around;padding:8px 0 max(env(safe-area-inset-bottom,0),12px);z-index:100}
.ni{display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;color:#B5ADA5;font-size:10px;padding:4px 20px;transition:all .2s}
.ni.act{color:#2C1810;font-weight:600}
.ni span{font-size:22px}
.sh{background:#FAF8F5;padding:50px 16px 12px;display:flex;align-items:center;gap:12px;color:#2C1810;position:sticky;top:0;z-index:10;border-bottom:1px solid #EDE8E0}
.sh .bk{background:#EDE8E0;border:none;color:#2C1810;font-size:16px;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb{display:flex;gap:8px;padding:10px 16px}
.sb input{flex:1;padding:10px 14px;border:1.5px solid #EDE8E0;border-radius:14px;font-size:14px;background:#fff;outline:none;color:#2C1810}
.sb button{padding:10px 16px;background:#2C1810;color:#fff;border:none;border-radius:14px;font-size:14px;cursor:pointer}
```

Then continue adding the rest of the reusable component blocks from `index.html`, including cards, tabs, modal overlays, player UI, AI panel, person detail card, node note panel, and check-in panel.

- [ ] **Step 3: 把页面专属样式提取到 `src/css/pages.css`**

Write `src/css/pages.css` with page-specific groups from the original file, starting with:

```css
#login-page{background:#FAF8F5;justify-content:center;align-items:center;padding:40px 30px}
.lb{text-align:center;margin-bottom:40px}
.lb .lo{font-size:72px;margin-bottom:12px;display:block}
.lb h1{font-size:30px;color:#2C1810;font-weight:800;letter-spacing:2px}
.lb p{font-size:14px;color:#C9A96E;margin-top:8px;letter-spacing:3px;font-weight:500}
.lbtn{width:100%;max-width:260px;padding:14px;border:2px solid #E8E4DC;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px;transition:all .2s;background:#fff;color:#2C1810;display:block;text-align:center}
.lbtn.phone{background:#fff;color:#2C1810;border:2px solid #2C1810;font-weight:700}
.lbtn.wechat{background:#fff;color:#07C160;border:2px solid #07C160}
```

Then continue adding home-page, noun-page, timeline-page, science-page, people-page, podcast-page, film-page, discuss-page, and profile-page style groups.

- [ ] **Step 4: 删除 `index.html` 内联 `<style>` 并改成外链**

Replace the `<head>` stylesheet section with:

```html
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>学的是史</title>
<link rel="stylesheet" href="./src/css/base.css">
<link rel="stylesheet" href="./src/css/components.css">
<link rel="stylesheet" href="./src/css/pages.css">
</head>
```

- [ ] **Step 5: 合并一处已识别的重复样式块**

When copying CSS, keep only one copy of the duplicated film-rank/watchlist block currently repeated in `index.html:238-299`.

Keep the single canonical version:

```css
.rnk{padding:0 16px 16px}
.rnktab{display:flex;gap:8px;margin-bottom:12px}
.rnkt{padding:6px 14px;border-radius:14px;border:1.5px solid #EDE8E0;background:#fff;font-size:12px;cursor:pointer;color:#8A8279;transition:all .2s}
.rnkt.act{background:#2C1810;color:#fff;border-color:#2C1810}
.wlpanel{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:420px;height:100vh;background:#FAF8F5;z-index:70;display:none;flex-direction:column;overflow-y:auto}
.wlpanel.act{display:flex}
```

- [ ] **Step 6: 启动静态服务器检查样式未明显走样**

Run:

```powershell
python -m http.server 8000
```

Expected: 输出类似 `Serving HTTP on :: port 8000`。

Manual check:
- 打开 `http://localhost:8000`
- 登录页正常显示
- 首页卡片、底部导航、AI 按钮、toast 样式与原版基本一致

- [ ] **Step 7: 提交 CSS 拆分**

Run:

```powershell
git add index.html src/css/base.css src/css/components.css src/css/pages.css
git commit -m "refactor: split prototype styles into css modules"
```

Expected: CSS 拆分提交成功。

---

### Task 3: 创建 `storage.js` 与 `navigation.js` 并迁移基础交互

**Files:**
- Create: `src/js/storage.js`
- Create: `src/js/navigation.js`
- Create: `src/js/app.js`
- Modify: `index.html:946-1063`

- [ ] **Step 1: 建立存储工具模块**

Write `src/js/storage.js`:

```js
(function () {
  function getStoredJSON(key, fallbackValue) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
      console.error('getStoredJSON failed:', key, error);
      return fallbackValue;
    }
  }

  function setStoredJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('setStoredJSON failed:', key, error);
      return false;
    }
  }

  function getStoredString(key, fallbackValue) {
    var value = localStorage.getItem(key);
    return value === null ? fallbackValue : value;
  }

  function setStoredString(key, value) {
    localStorage.setItem(key, value);
    return true;
  }

  window.storageAPI = {
    getStoredJSON: getStoredJSON,
    setStoredJSON: setStoredJSON,
    getStoredString: getStoredString,
    setStoredString: setStoredString
  };
})();
```

- [ ] **Step 2: 建立基础导航模块**

Write `src/js/navigation.js`:

```js
(function () {
  var toastTimer = null;

  function resetAIFab() {
    var fab = document.getElementById('ai-fab');
    if (fab) {
      fab.style.top = 'auto';
      fab.style.left = 'auto';
      fab.style.bottom = '';
      fab.style.right = '';
    }
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('sh');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('sh');
    }, 2000);
  }

  function login() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('home-page').classList.add('active');
    document.getElementById('ai-fab').classList.add('sh');
    document.getElementById('bnav').style.display = 'flex';
    resetAIFab();
    showToast('欢迎回来，历史学习者！');
  }

  function openSub(id) {
    var target = document.getElementById(id);
    if (target) target.classList.add('act');
  }

  function closeSub(id) {
    document.querySelectorAll('.sub').forEach(function (panel) {
      panel.classList.remove('act');
    });
    if (typeof id === 'string' && id) {
      var target = document.getElementById(id);
      if (target) {
        if (!target.classList.contains('sub')) {
          document.querySelectorAll('.page').forEach(function (page) {
            page.classList.remove('active');
          });
        }
        target.classList.add(target.classList.contains('sub') ? 'act' : 'active');
      }
    }
  }

  window.navigationAPI = {
    resetAIFab: resetAIFab,
    showToast: showToast,
    login: login,
    openSub: openSub,
    closeSub: closeSub
  };
})();
```

- [ ] **Step 3: 建立入口模块并先挂接基础全局函数**

Write `src/js/app.js`:

```js
(function () {
  function exposeGlobals() {
    window.resetAIFab = window.navigationAPI.resetAIFab;
    window.showToast = window.navigationAPI.showToast;
    window.login = window.navigationAPI.login;
    window.openSub = window.navigationAPI.openSub;
    window.closeSub = window.navigationAPI.closeSub;
  }

  function registerGlobalErrorToast() {
    window.onerror = function (msg) {
      var toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'JS错误:' + String(msg).slice(0, 40);
        toast.classList.add('sh');
        setTimeout(function () {
          toast.classList.remove('sh');
        }, 4000);
      }
      return false;
    };
  }

  function initializeApp() {
    registerGlobalErrorToast();
    exposeGlobals();
  }

  document.addEventListener('DOMContentLoaded', initializeApp);
})();
```

- [ ] **Step 4: 把 `index.html` 的脚本引用先替换成基础 3 文件**

Before `</body>`, add:

```html
<script src="./src/js/storage.js"></script>
<script src="./src/js/navigation.js"></script>
<script src="./src/js/app.js"></script>
```

Temporarily keep the remaining inline script below them until later tasks finish迁移。

- [ ] **Step 5: 人工验证基础导航与 toast 仍可用**

Run:

```powershell
python -m http.server 8000
```

Manual check:
- 手机号按钮仍能弹出 toast
- 微信登录仍能从登录页进入首页
- 首页入口按钮仍能打开子页面

- [ ] **Step 6: 提交基础交互拆分**

Run:

```powershell
git add index.html src/js/storage.js src/js/navigation.js src/js/app.js
git commit -m "refactor: extract base navigation and storage modules"
```

Expected: 基础交互模块提交成功。

---

### Task 4: 拆分名词、收藏与影视榜单逻辑

**Files:**
- Create: `src/js/noun.js`
- Create: `src/js/favorites.js`
- Create: `src/data/nouns.json`
- Create: `src/data/books.json`
- Create: `src/data/memes.json`
- Modify: `index.html:1007-1253`
- Modify: `src/js/app.js`

- [ ] **Step 1: 先创建名词 JSON 数据文件**

Write `src/data/nouns.json`:

```json
[
  {
    "id": "shangyang-reform",
    "title": "商鞅变法",
    "period": "战国·秦",
    "category": "制度改革",
    "summary": "战国时期秦国通过变法实现富国强兵的改革运动",
    "detail": "商鞅变法是中国战国时期秦国的一次重要改革，由商鞅在秦孝公支持下推行。主要内容包括废井田、开阡陌、奖励军功、推行县制、统一度量衡。变法使秦国迅速富强，为秦统一六国奠定基础。",
    "related": ["秦始皇", "郡县制", "井田制"]
  },
  {
    "id": "grand-council",
    "title": "军机处",
    "period": "清朝",
    "category": "中枢机构",
    "summary": "清朝雍正设立的中枢决策机构，标志君主集权达到顶峰",
    "detail": "军机处是清朝雍正帝于 1729 年设立的中央决策机构，后逐渐演变为最高政务中枢。军机大臣直接听命于皇帝，军政机务集中处理。",
    "related": ["雍正", "内阁", "军机大臣"]
  },
  {
    "id": "imperial-examination",
    "title": "科举制",
    "period": "隋唐-清",
    "category": "选官制度",
    "summary": "隋唐至清末的选官制度，打破门阀对政治的垄断",
    "detail": "科举制始于隋，完善于唐宋，延续至清末。它通过考试选拔官吏，为社会各阶层提供了向上流动通道，是中国古代最重要的制度创新之一。",
    "related": ["隋炀帝", "九品中正制", "八股文"]
  },
  {
    "id": "jingnan-campaign",
    "title": "靖难之役",
    "period": "明朝",
    "category": "政治军事",
    "summary": "明成祖朱棣起兵夺取建文帝皇位的战争",
    "detail": "靖难之役是建文帝削藩引发的内战。燕王朱棣以清君侧为名起兵，历时四年攻入南京，最终夺位称帝，改元永乐。",
    "related": ["朱元璋", "建文帝", "永乐大帝"]
  }
]
```

- [ ] **Step 2: 创建影视书目与梗图 JSON 数据**

Write `src/data/books.json`:

```json
[
  {
    "id": "book-wanli-fifteen-years",
    "type": "book",
    "title": "万历十五年",
    "author": "黄仁宇",
    "rating": "9.0",
    "summary": "从万历十五年切入，观察明朝制度运行的问题。",
    "icon": "📘"
  },
  {
    "id": "film-last-emperor",
    "type": "film",
    "title": "末代皇帝",
    "author": "贝纳尔多·贝托鲁奇",
    "rating": "9.3",
    "summary": "清朝末代皇帝溥仪的一生。",
    "icon": "🎬"
  }
]
```

Write `src/data/memes.json`:

```json
[
  {
    "id": "meme-qinshihuang",
    "icon": "🏺",
    "caption": "秦始皇：朕的江山，你们随便挖",
    "background": "linear-gradient(135deg,#C0392B,#E74C3C)",
    "detail": "1974年陕西兵马俑考古发现背后的历史故事。",
    "tag": "#考古发现 #秦朝 #世界遗产"
  },
  {
    "id": "meme-tang-poetry",
    "icon": "📜",
    "caption": "唐朝公务员：上班如上坟，还要写诗",
    "background": "linear-gradient(135deg,#8E44AD,#9B59B6)",
    "detail": "唐代进士科与诗赋文化的社会影响。",
    "tag": "#科举 #唐朝 #文化史"
  }
]
```

- [ ] **Step 3: 创建 `src/js/noun.js`**

Write `src/js/noun.js`:

```js
(function () {
  var nounList = [];
  var nounMap = {};

  function setNouns(list) {
    nounList = Array.isArray(list) ? list : [];
    nounMap = {};
    nounList.forEach(function (item) {
      nounMap[item.title] = item;
    });
  }

  function openNounDet(name) {
    var noun = nounMap[name];
    document.getElementById('nd-title').textContent = name;
    document.getElementById('nd-text').textContent = noun ? noun.detail : '暂无详细解释。';
    var related = document.getElementById('nd-related');
    related.innerHTML = '';
    if (noun && Array.isArray(noun.related) && noun.related.length) {
      noun.related.forEach(function (item) {
        related.innerHTML += '<button class="nrtag" onclick="openNounDet(\'' + item + '\')">' + item + '</button>';
      });
    } else {
      related.innerHTML = '<span style="font-size:12px;color:#B5ADA5">暂无相关名词</span>';
    }
    document.getElementById('noun-detail').classList.add('act');
  }

  function closeNounDet() {
    document.getElementById('noun-detail').classList.remove('act');
  }

  function searchNouns() {
    var q = document.getElementById('noun-search-input').value.trim().toLowerCase();
    var grid = document.getElementById('noun-grid');
    if (!grid) return;
    grid.querySelectorAll('.ncard').forEach(function (card) {
      var name = card.querySelector('h4').textContent;
      var desc = card.querySelector('p').textContent;
      var matched = !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      card.style.display = matched ? 'block' : 'none';
    });
  }

  function shareNoun(name) {
    if (navigator.share) {
      navigator.share({
        title: '学的是史 - ' + name,
        text: '来「学的是史」查看「' + name + '」的详细解释！',
        url: location.href
      }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText('来「学的是史」查看「' + name + '」的详细解释！').then(function () {
        window.navigationAPI.showToast('链接已复制，快去分享给好友吧！');
      });
    }
  }

  window.nounAPI = {
    setNouns: setNouns,
    openNounDet: openNounDet,
    closeNounDet: closeNounDet,
    searchNouns: searchNouns,
    shareNoun: shareNoun
  };
})();
```

- [ ] **Step 4: 创建 `src/js/favorites.js`**

Write `src/js/favorites.js`:

```js
(function () {
  var FAVORITES_KEY = 'favorites';

  function getFavorites() {
    return window.storageAPI.getStoredJSON(FAVORITES_KEY, []);
  }

  function setFavorites(list) {
    window.storageAPI.setStoredJSON(FAVORITES_KEY, list);
  }

  function toggleNounFavorite(button, name) {
    var favorites = getFavorites();
    var exists = favorites.some(function (item) { return item.id === 'noun-' + name; });
    if (exists) {
      favorites = favorites.filter(function (item) { return item.id !== 'noun-' + name; });
      button.classList.remove('faved');
      button.textContent = '☆';
      window.navigationAPI.showToast('已取消收藏「' + name + '」');
    } else {
      favorites.push({
        id: 'noun-' + name,
        type: 'noun',
        title: name,
        icon: '📖',
        subtitle: '历史名词'
      });
      button.classList.add('faved');
      button.textContent = '★';
      window.navigationAPI.showToast('已收藏「' + name + '」');
    }
    setFavorites(favorites);
  }

  function renderFavorites() {
    var list = getFavorites();
    var container = document.getElementById('fav-list');
    if (!container) return;
    if (!list.length) {
      container.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5;font-size:13px">暂无收藏内容</div>';
      return;
    }
    container.innerHTML = list.map(function (item) {
      return '<div class="wlitem"><div class="wlthumb">' + item.icon + '</div><div class="wlinfo"><h5>' + item.title + '</h5><p>' + item.subtitle + '</p></div><button class="wldel" onclick="removeFavorite(\'' + item.id + '\')">×</button></div>';
    }).join('');
  }

  function removeFavorite(id) {
    var list = getFavorites().filter(function (item) { return item.id !== id; });
    setFavorites(list);
    renderFavorites();
    window.navigationAPI.showToast('已移除收藏项');
  }

  window.favoritesAPI = {
    getFavorites: getFavorites,
    setFavorites: setFavorites,
    toggleNounFavorite: toggleNounFavorite,
    renderFavorites: renderFavorites,
    removeFavorite: removeFavorite
  };
})();
```

- [ ] **Step 5: 在 `app.js` 中加入 JSON 加载与全局暴露**

Extend `src/js/app.js` with:

```js
async function loadJSON(path, fallback) {
  try {
    var response = await fetch(path);
    if (!response.ok) {
      throw new Error('Failed to load data: ' + path);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    if (window.navigationAPI && window.navigationAPI.showToast) {
      window.navigationAPI.showToast('部分数据加载失败，已使用兜底内容');
    }
    return fallback;
  }
}

async function initializeData() {
  var nouns = await loadJSON('./src/data/nouns.json', []);
  window.nounAPI.setNouns(nouns);
}

function exposeGlobals() {
  window.resetAIFab = window.navigationAPI.resetAIFab;
  window.showToast = window.navigationAPI.showToast;
  window.login = window.navigationAPI.login;
  window.openSub = window.navigationAPI.openSub;
  window.closeSub = window.navigationAPI.closeSub;
  window.openNounDet = window.nounAPI.openNounDet;
  window.closeNounDet = window.nounAPI.closeNounDet;
  window.searchNouns = window.nounAPI.searchNouns;
  window.shareNoun = window.nounAPI.shareNoun;
  window.togNounFav = window.favoritesAPI.toggleNounFavorite;
  window.removeFavorite = window.favoritesAPI.removeFavorite;
}
```

And update the DOMContentLoaded initializer to call `initializeData()` before first render.

- [ ] **Step 6: 更新 `index.html` 的脚本引用顺序**

Replace the bottom-of-body script block with:

```html
<script src="./src/js/storage.js"></script>
<script src="./src/js/navigation.js"></script>
<script src="./src/js/favorites.js"></script>
<script src="./src/js/noun.js"></script>
<script src="./src/js/app.js"></script>
```

Temporarily keep timeline / podcast / AI / people logic inline until the later tasks migrate them.

- [ ] **Step 7: 手工验收名词与收藏流程**

Manual check:
- 名词页能打开
- 搜索可过滤卡片
- 名词详情可开关
- 收藏图标可切换
- 收藏夹能显示已收藏项

- [ ] **Step 8: 提交名词与收藏拆分**

Run:

```powershell
git add index.html src/js/app.js src/js/noun.js src/js/favorites.js src/data/nouns.json src/data/books.json src/data/memes.json
git commit -m "refactor: extract noun and favorites modules"
```

Expected: 名词与收藏模块提交成功。

---

### Task 5: 拆分时间轴模块与历史数据

**Files:**
- Create: `src/js/timeline.js`
- Create: `src/data/timeline.json`
- Modify: `index.html:995-1211`
- Modify: `src/js/app.js`

- [ ] **Step 1: 创建时间轴 JSON 数据**

Write `src/data/timeline.json`:

```json
{
  "dynasties": ["qin", "han", "suitang", "song", "ming", "qing"],
  "events": [
    {
      "name": "商鞅变法",
      "year": "前356年",
      "x": 75,
      "pol": 385,
      "eco": 375,
      "cul": 330,
      "description": "秦国通过商鞅推行变法，废井田、开阡陌、奖励军功，使秦国由弱转强。",
      "conn": {
        "next": "秦统一",
        "pol": "变法为秦统一提供制度保障",
        "eco": "重农抑商促进国家积累",
        "cul": "法家思想成为主导"
      }
    },
    {
      "name": "秦统一",
      "year": "前221年",
      "x": 105,
      "pol": 355,
      "eco": 345,
      "cul": 300,
      "description": "秦王嬴政灭六国，建立中央集权国家。",
      "conn": {
        "next": "推恩令",
        "pol": "郡县制影响后世中央集权",
        "eco": "统一货币度量衡促进经济整合",
        "cul": "书同文车同轨统一文化基础"
      }
    }
  ]
}
```

Then continue adding the remaining original events from `index.html:1117-1130` without altering their wording beyond JSON escaping.

- [ ] **Step 2: 创建时间轴模块文件**

Write `src/js/timeline.js`:

```js
(function () {
  var dynasties = [];
  var timelineEvents = [];
  var currentDynastyIndex = 0;
  var timelineZoom = 0;

  function setTimelineData(data) {
    dynasties = data && Array.isArray(data.dynasties) ? data.dynasties : [];
    timelineEvents = data && Array.isArray(data.events) ? data.events : [];
  }

  function selDyn(id, button) {
    document.querySelectorAll('#dynasty-tabs .dtab').forEach(function (tab) {
      tab.classList.remove('act');
    });
    if (button) button.classList.add('act');
    document.querySelectorAll('#dynasty-features .df').forEach(function (section) {
      section.style.display = 'none';
    });
    var feature = document.getElementById('feat-' + id);
    if (feature) feature.style.display = 'block';
    var idx = dynasties.indexOf(id);
    if (idx >= 0) currentDynastyIndex = idx;
  }

  function prevDyn() {
    currentDynastyIndex = (currentDynastyIndex - 1 + dynasties.length) % dynasties.length;
    selDyn(dynasties[currentDynastyIndex], document.querySelectorAll('#dynasty-tabs .dtab')[currentDynastyIndex]);
  }

  function nextDyn() {
    currentDynastyIndex = (currentDynastyIndex + 1) % dynasties.length;
    selDyn(dynasties[currentDynastyIndex], document.querySelectorAll('#dynasty-tabs .dtab')[currentDynastyIndex]);
  }

  function showTimelineDetail(index) {
    var eventItem = timelineEvents[index];
    window.openFeatDet('📅 ' + eventItem.name + '（' + eventItem.year + '）', eventItem.description);
  }

  function showTimelineConn(index, dim) {
    var eventItem = timelineEvents[index];
    if (!eventItem || !eventItem.conn) return;
    var dimMap = { pol: '🏛️ 政治影响', eco: '💰 经济影响', cul: '📚 文化影响' };
    var text = '从【' + eventItem.name + '】到【' + eventItem.conn.next + '】\n\n' + dimMap[dim] + '：\n' + eventItem.conn[dim];
    window.openFeatDet('🔗 ' + eventItem.name + ' → ' + eventItem.conn.next, text);
  }

  window.timelineAPI = {
    setTimelineData: setTimelineData,
    selDyn: selDyn,
    prevDyn: prevDyn,
    nextDyn: nextDyn,
    showTimelineDetail: showTimelineDetail,
    showTimelineConn: showTimelineConn
  };
})();
```

Then move over `renderTimeline()`, `renderEventList()`, `zoomTL()`, and the original drag behavior from `index.html`, preserving selector names.

- [ ] **Step 3: 在 `app.js` 中接入时间轴数据与全局函数**

Add to `initializeData()`:

```js
var timeline = await loadJSON('./src/data/timeline.json', { dynasties: [], events: [] });
window.timelineAPI.setTimelineData(timeline);
```

Expose globals:

```js
window.selDyn = window.timelineAPI.selDyn;
window.prevDyn = window.timelineAPI.prevDyn;
window.nextDyn = window.timelineAPI.nextDyn;
window.zoomTL = window.timelineAPI.zoomTL;
window.showTimelineDetail = window.timelineAPI.showTimelineDetail;
window.showTimelineConn = window.timelineAPI.showTimelineConn;
```

And in the DOMContentLoaded success path:

```js
try { window.timelineAPI.renderTimeline(); } catch (error) { console.error('renderTimeline err:', error); }
try { window.timelineAPI.renderEventList(); } catch (error) { console.error('renderEventList err:', error); }
```

- [ ] **Step 4: 删除已迁移的时间轴内联脚本段**

Remove the corresponding functions and data from the old inline `<script>` after confirming the external module is loaded and working.

- [ ] **Step 5: 手工验收时间轴页面**

Manual check:
- 时间轴页能打开
- 朝代切换可用
- 上一朝代 / 下一朝代可用
- 缩放可用
- 事件详情和虚线关系弹窗可用
- 控制台无 `selDyn` / `renderTimeline` 未定义错误

- [ ] **Step 6: 提交时间轴拆分**

Run:

```powershell
git add index.html src/js/app.js src/js/timeline.js src/data/timeline.json
git commit -m "refactor: split prototype timeline logic into module"
```

Expected: 时间轴模块提交成功。

---

### Task 6: 拆分播客与 AI 助手模块

**Files:**
- Create: `src/js/podcast.js`
- Create: `src/js/ai-assistant.js`
- Create: `src/data/podcasts.json`
- Modify: `index.html:1267-1510`
- Modify: `src/js/app.js`

- [ ] **Step 1: 创建播客 JSON 数据**

Write `src/data/podcasts.json`:

```json
[
  {
    "id": "podcast-zhenguan",
    "title": "贞观之治：盛世背后的智慧",
    "category": "suitang",
    "duration": 1680,
    "icon": "🏛️",
    "colors": ["#5A3E1B", "#8B6914"],
    "author": "AI历史助手",
    "audioUrl": ""
  },
  {
    "id": "podcast-shangyang",
    "title": "商鞅变法：战国变局的破局者",
    "category": "qin",
    "duration": 1320,
    "icon": "⚔️",
    "colors": ["#C0392B", "#E74C3C"],
    "author": "AI历史助手",
    "audioUrl": ""
  }
]
```

Then continue adding the remaining original episodes from `index.html:1268-1274`.

- [ ] **Step 2: 创建播客模块**

Write `src/js/podcast.js` by moving and preserving the original functions and state names:

```js
(function () {
  var podcastData = [];
  var curPodcast = 0;
  var isPlaying = false;
  var plTimer = null;
  var plCur = 0;
  var plSpeed = 1.0;
  var timerID = null;

  function setPodcasts(list) {
    podcastData = Array.isArray(list) ? list : [];
  }

  function fmtTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  window.podcastAPI = {
    setPodcasts: setPodcasts,
    fmtTime: fmtTime
  };
})();
```

Then migrate `filterPodcast`, `openPlayer`, `closePlayer`, `togglePlay`, `startPlayProgress`, `seekPodcast`, `setTimer`, `showTimer`, `prevPodcast`, and `nextPodcast` from the original script.

- [ ] **Step 3: 创建 AI 助手模块**

Write `src/js/ai-assistant.js`:

```js
(function () {
  function togAI() {
    document.getElementById('ai-panel').classList.toggle('act');
  }

  function aiAsk(question) {
    document.getElementById('ai-input').value = question;
    aiSend();
  }

  function aiReply(question) {
    var replies = {
      '贞观之治是什么？': '贞观之治是唐太宗李世民在位期间出现的政治清明、社会安定的盛世局面。',
      '科举制的发展历程': '科举制始于隋，完善于唐宋，延续至清末，共存在约 1300 年。',
      '明朝灭亡的原因': '明朝灭亡受财政危机、农民起义、满洲崛起、政治腐败和气候因素共同影响。'
    };
    return replies[question] || '这是一个很好的历史问题！📜<br>关于「' + question.replace(/</g, '&lt;') + '」，建议结合史料和学术论文继续深入。';
  }

  function aiSend() {
    var input = document.getElementById('ai-input');
    var question = input.value.trim();
    if (!question) return;
    var body = document.getElementById('ai-body');
    body.innerHTML += '<div class="amsg usr"><div class="amb">' + question + '</div></div>';
    input.value = '';
    body.scrollTop = body.scrollHeight;
    setTimeout(function () {
      body.innerHTML += '<div class="amsg bot"><div class="amb">' + aiReply(question) + '</div></div>';
      body.scrollTop = body.scrollHeight;
    }, 800);
  }

  window.aiAssistantAPI = {
    togAI: togAI,
    aiAsk: aiAsk,
    aiSend: aiSend,
    aiReply: aiReply
  };
})();
```

Then move the AI FAB drag behavior from `index.html:1465-1509` into the same file unchanged except for wrapping.

- [ ] **Step 4: 在 `app.js` 中接入播客和 AI 模块**

Add to `initializeData()`:

```js
var podcasts = await loadJSON('./src/data/podcasts.json', []);
window.podcastAPI.setPodcasts(podcasts);
```

Expose globals:

```js
window.filterPodcast = window.podcastAPI.filterPodcast;
window.openPlayer = window.podcastAPI.openPlayer;
window.closePlayer = window.podcastAPI.closePlayer;
window.togglePlay = window.podcastAPI.togglePlay;
window.seekPodcast = window.podcastAPI.seekPodcast;
window.setTimer = window.podcastAPI.setTimer;
window.showTimer = window.podcastAPI.showTimer;
window.prevPodcast = window.podcastAPI.prevPodcast;
window.nextPodcast = window.podcastAPI.nextPodcast;
window.togAI = window.aiAssistantAPI.togAI;
window.aiAsk = window.aiAssistantAPI.aiAsk;
window.aiSend = window.aiAssistantAPI.aiSend;
```

- [ ] **Step 5: 手工验收播客与 AI 助手**

Manual check:
- AI 播客页能打开
- 分类筛选可用
- 播放器能打开/关闭
- 播放按钮和进度条可变化
- AI 助手浮动按钮可显示
- 面板能开关
- 快捷问题与输入提问都能生成模拟回复
- 拖动悬浮按钮不会导致点击失效

- [ ] **Step 6: 提交播客与 AI 模块拆分**

Run:

```powershell
git add index.html src/js/app.js src/js/podcast.js src/js/ai-assistant.js src/data/podcasts.json
git commit -m "refactor: split prototype media and ai assistant modules"
```

Expected: 播客与 AI 模块提交成功。

---

### Task 7: 拆分人物、签到、讨论区与剩余全局功能

**Files:**
- Modify: `src/js/navigation.js`
- Modify: `src/js/favorites.js`
- Modify: `src/js/app.js`
- Modify: `index.html:1213-1608`
- Create: `src/data/people.json`

- [ ] **Step 1: 创建人物 JSON 数据**

Write `src/data/people.json` with the current centers from `index.html:1354-1360`, preserving their core fields:

```json
[
  {
    "id": "wu-zetian",
    "name": "武则天",
    "period": "唐周",
    "identity": "中国历史上唯一正统女皇帝",
    "summary": "统治期间打击门阀、推广科举、重用寒门人才。",
    "nick": "武曌、则天皇后"
  },
  {
    "id": "qin-shihuang",
    "name": "秦始皇",
    "period": "秦朝",
    "identity": "中国第一个大一统王朝的创立者",
    "summary": "废分封、行郡县、书同文、车同轨，对后世影响极深。",
    "nick": "嬴政、始皇帝"
  }
]
```

Then continue adding the remaining center人物。

- [ ] **Step 2: 把签到逻辑从内联脚本迁移到 `navigation.js`**

Move these functions into `src/js/navigation.js`, preserving current behavior and localStorage key `checkins`:

```js
function openCheckin() {
  document.getElementById('checkin-panel').classList.add('act');
  renderCheckinCalendar();
}

function closeCheckin() {
  document.getElementById('checkin-panel').classList.remove('act');
}

function doCheckin() {
  var today = new Date().toISOString().slice(0, 10);
  var checkins = JSON.parse(localStorage.getItem('checkins') || '{}');
  if (checkins[today]) {
    showToast('今日已打卡，明天继续加油！');
    return;
  }
  checkins[today] = true;
  localStorage.setItem('checkins', JSON.stringify(checkins));
  document.getElementById('checkin-btn').textContent = '✅ 已打卡';
  document.getElementById('checkin-btn').classList.add('done');
  updateCheckinStats();
  showToast('打卡成功！连续学习，历史达人就是你！');
}
```

Then add `renderCheckinCalendar`, `updateCheckinStats`, and `calcStreak` from the original inline script.

- [ ] **Step 3: 把人物关系网与讨论区逻辑留在 `app.js` 或单独内联迁移块中**

Because the spec does not require dedicated `people.js` / `discuss.js`, move the remaining `renderRel`, `openPeoDet`, `swPeoGroup`, `searchPeople`, `openPost`, `submitPost`, and related helpers into `src/js/app.js` under clearly separated sections.

Start that section with:

```js
function registerPeopleAndCommunityGlobals() {
  window.renderRel = renderRel;
  window.openCenterDet = openCenterDet;
  window.openPeoDet = openPeoDet;
  window.closePeoDet = closePeoDet;
  window.swPeoGroup = swPeoGroup;
  window.searchPeople = searchPeople;
  window.openPost = openPost;
  window.closePost = closePost;
  window.togglePostTag = togglePostTag;
  window.submitPost = submitPost;
  window.toggleComments = toggleComments;
  window.filterDiscuss = filterDiscuss;
}
```

- [ ] **Step 4: 删除剩余内联 `<script>` 并改为完整外链顺序**

Final bottom-of-body script order:

```html
<script src="./src/js/storage.js"></script>
<script src="./src/js/navigation.js"></script>
<script src="./src/js/favorites.js"></script>
<script src="./src/js/noun.js"></script>
<script src="./src/js/timeline.js"></script>
<script src="./src/js/podcast.js"></script>
<script src="./src/js/ai-assistant.js"></script>
<script src="./src/js/app.js"></script>
```

At this point `index.html` should no longer contain the original large inline `<script>` block.

- [ ] **Step 5: 手工验收剩余页面功能**

Manual check:
- 人物专题页能打开，切换人物关系组正常
- 思维导图笔记可保存和关闭
- 讨论区发帖弹窗可开关
- 我的页面签到面板可开关并更新统计
- 所有 `onclick` 不再出现未定义函数错误

- [ ] **Step 6: 提交剩余逻辑拆分**

Run:

```powershell
git add index.html src/js/navigation.js src/js/favorites.js src/js/app.js src/data/people.json
git commit -m "refactor: split remaining prototype interactions into modules"
```

Expected: 主体脚本拆分提交成功。

---

### Task 8: 更新 README、补重构报告并完成最终验收

**Files:**
- Modify: `README.md`
- Create: `docs/refactor-report.md`
- Create: `docs/manual-smoke-test.md`

- [ ] **Step 1: 更新 README 运行说明与项目结构**

Replace `README.md` with:

```markdown
# 学的是史

中国历史学习网站原型，当前以原生 HTML、CSS、JavaScript 和 JSON 静态数据实现。

## 本地运行

由于页面需要通过 `fetch` 加载 JSON 数据，请使用静态服务器运行项目。

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 当前项目结构

```text
.
├── index.html
├── assets/
├── docs/
├── src/
│   ├── css/
│   ├── js/
│   └── data/
└── mini-program/
```

## 当前技术方案

项目当前使用：

- 原生 HTML
- 原生 CSS
- 原生 JavaScript
- JSON 静态数据
- 浏览器 LocalStorage

暂未引入构建工具和第三方框架。
```

- [ ] **Step 2: 创建手工验收清单文档**

Write `docs/manual-smoke-test.md`:

```markdown
# 手工验收清单

- 启动 `python -m http.server 8000`
- 打开 `http://localhost:8000`
- 检查登录页显示
- 检查微信登录进入首页
- 检查底部导航切换
- 检查名词搜索、详情、收藏
- 检查时间轴切换、缩放、详情
- 检查人物专题页面
- 检查 AI 播客播放器
- 检查收藏夹
- 检查签到面板
- 检查 AI 助手问答
- 检查 Console 无阻断性报错
```

- [ ] **Step 3: 创建重构报告**

Write `docs/refactor-report.md`:

```markdown
# 第二阶段重构报告

## 一、重构目标

将单文件 HTML 原型拆分为 HTML、CSS、JavaScript 和 JSON 数据文件，同时保持页面视觉和交互基本不变。

## 二、已完成事项

- [x] CSS 已拆分
- [x] JavaScript 已拆分
- [x] JSON 数据已抽离
- [x] README 已更新
- [x] 本地静态服务器运行正常
- [x] 浏览器控制台无阻断性错误
- [x] Git 提交已完成

## 三、文件变更说明

- 新增 `src/css/*`
- 新增 `src/js/*`
- 新增 `src/data/*`
- 更新 `index.html`
- 更新 `README.md`
- 新增 `docs/manual-smoke-test.md`

## 四、兼容性说明

- 保留 HTML 内联 `onclick`
- 保留旧版 `localStorage` key `checkins`
- JSON 加载失败时允许 fallback
- 修复了明显重复 CSS
- 保留现有页面 `id` 与主要 `class`

## 五、未处理事项

- 后端接口
- 微信登录真实接入
- AI API
- CMS 内容管理后台
- 微信小程序版本
- PWA
- 真实音频资源

## 六、测试结果

- 启动命令：`python -m http.server 8000`
- 访问地址：`http://localhost:8000`
- 已验证：登录、导航、名词、时间轴、人物、播客、收藏、签到、AI 助手
- 已知问题：如有非阻断性 UI 小差异，在此补充
```

- [ ] **Step 4: 运行最终 Git 状态和历史检查**

Run:

```powershell
git status
git log --oneline --decorate -10
```

Expected:
- `git status` 显示工作区干净或仅剩报告微调
- `git log` 能看到分步提交历史

- [ ] **Step 5: 进行最终浏览器验收**

Run:

```powershell
python -m http.server 8000
```

Manual check exact list:
- 登录页能显示
- 微信登录按钮能进入首页
- 首页底部导航可切换
- 首页梗图轮播能显示
- 名词解释页能打开
- 名词搜索能使用
- 名词详情能打开和关闭
- 名词收藏能使用
- 时间轴页能打开
- 朝代切换能使用
- 上一朝代和下一朝代能使用
- 时间轴缩放功能可用
- 时代特征详情能打开
- 科学备考页能打开
- 人物专题页能打开
- AI 播客页能打开
- 播客播放器能打开和关闭
- 影视书目页能打开
- 收藏夹能打开
- 我的页面能打开
- 签到面板能打开和关闭
- AI 助手按钮能显示
- AI 助手面板能打开和关闭
- AI 助手模拟问答能使用
- Toast 提示正常
- Console 中没有阻断性报错

- [ ] **Step 6: 提交文档与最终修复**

Run:

```powershell
git add README.md docs/refactor-report.md docs/manual-smoke-test.md
git commit -m "docs: add refactor report and update local development guide"
```

If you fixed any independent bug during final verification, add:

```powershell
git add .
git commit -m "fix: resolve prototype markup and interaction issues"
```

---

## Self-Review Checklist

### Spec coverage

This plan covers:
- Git initialization because the current folder is not yet a repository
- backup creation before edits
- CSS split into `base.css` / `components.css` / `pages.css`
- JavaScript split into the required modules
- JSON extraction for nouns, timeline, people, podcasts, books, memes
- compatibility via global `window.*` exports
- README update and refactor report creation
- manual acceptance using static server
- staged commits rather than one squashed change

### Placeholder scan

Intentional implementation follow-ups remain only where the work is purely transcriptional from `index.html` into external files:
- complete remaining CSS groups from the original source
- continue adding the remaining JSON entries already present in `index.html`
- move unchanged helper functions from the original inline script into the named module files

These are bounded by explicit source ranges and concrete target files, so they are implementation transcription tasks rather than open-ended TODOs.

### Type and interface consistency

Planned cross-file interfaces are:
- `window.storageAPI`
- `window.navigationAPI`
- `window.favoritesAPI`
- `window.nounAPI`
- `window.timelineAPI`
- `window.podcastAPI`
- `window.aiAssistantAPI`

`src/js/app.js` is the only file responsible for re-exporting those module functions to legacy global names used by HTML inline handlers.
