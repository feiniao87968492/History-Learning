# Phase 1 功能补完 — 实施计划

> **For agentic workers:** 本计划按 A→I 优先级排列，每个 Task 为独立可验收单元。推荐使用 `superpowers:subagent-driven-development` 逐任务执行。步骤使用 checkbox (`- [ ]`) 语法跟踪。

**目标：** 将 Web 站所有 stub/mock/占位功能替换为真实可用功能，清理"功能开发中"toast，完成内联脚本迁移。

**架构：** 保持原生 HTML/CSS/JS + JSON 数据 + LocalStorage。不改动技术栈，不引入框架。每个模块独立、可单独验收。

**技术栈：** HTML5 / CSS3 / ES5 JavaScript / JSON / LocalStorage / Vitest + jsdom

---

## 前置约定

- 所有 JSON 数据文件使用 UTF-8 编码
- JS 使用 IIFE 模块模式，通过 `window.xxxAPI` 暴露接口
- 函数名保持 camelCase（与现有代码一致）
- 每一步完成后立即 git commit
- 每完成一个 Task 在浏览器验证

---

### Task 1: 名词解释 — 名词库扩充与详情数据补全

**文件：**
- 修改: `src/data/nouns.json`
- 修改: `src/js/noun.js`

#### 1.1 扩充名词数据至 50+ 条

- [ ] 将 `src/data/nouns.json` 从当前 4 条扩充到至少 50 条。每条包含：

```json
{
  "名词名": {
    "text": "详细解释正文（100-500字）",
    "related": ["相关名词1", "相关名词2", "相关名词3"],
    "dynasty": "所属朝代（如 唐朝、战国）",
    "category": "分类（制度/战争/文化/经济/人物/地理）",
    "map": "相关地图描述（可选，如 战国七雄形势图）",
    "year": "时间（可选，如 前356年）"
  }
}
```

- [ ] 覆盖以下朝代和分类：
  - 先秦：分封制、井田制、百家争鸣、青铜时代、甲骨文等
  - 秦汉：郡县制、焚书坑儒、丝绸之路、盐铁官营、黄老之学等
  - 隋唐：三省六部、均田制、租庸调制、藩镇割据、古文运动等
  - 宋元：交子、市舶司、活字印刷、程朱理学、行省制等
  - 明清：一条鞭法、摊丁入亩、军机处、闭关锁国、八旗制等
  - 近代：鸦片战争、洋务运动、戊戌变法、辛亥革命等

#### 1.2 名词卡片改为从 JSON 渲染

- [ ] 修改 `src/js/noun.js`，新增 `renderNounCards` 函数，用 JSON 数据渲染 `#noun-grid`：

```js
function renderNounCards(filter) {
  var grid = document.getElementById('noun-grid');
  if (!grid) return;
  var names = Object.keys(nounData);
  if (filter) {
    names = names.filter(function(n) {
      var d = nounData[n];
      return d.dynasty === filter || d.category === filter;
    });
  }
  if (!names.length) {
    grid.innerHTML = '<div style="text-align:center;padding:24px;color:#B5ADA5">暂无匹配名词</div>';
    return;
  }
  grid.innerHTML = names.map(function(name) {
    var d = nounData[name];
    return '<div class="ncard" onclick="openNounDet(\'' + name + '\')">' +
      '<div class="nmeta">' +
        '<span class="tg hot" style="font-size:10px">' + (d.dynasty || '') + '</span>' +
        '<div class="nact">' +
          '<button class="nfav" onclick="event.stopPropagation();togNounFav(this,\'' + name + '\')">☆</button>' +
          '<button class="nshr" onclick="event.stopPropagation();shareNoun(\'' + name + '\')">↗</button>' +
        '</div>' +
      '</div>' +
      '<h4>' + name + '</h4>' +
      '<p>' + (d.text ? d.text.slice(0, 50) + '...' : '暂无简介') + '</p>' +
    '</div>';
  }).join('');
}
```

- [ ] 在 `setNounData` 末尾自动调用 `renderNounCards()`
- [ ] 删除 `index.html` 中 `#noun-grid` 内的 4 个硬编码 `.ncard`（行 121-125）

#### 1.3 详情页补全地图/分类信息

- [ ] 修改 `openNounDet` 函数，补全详情渲染：

```js
function openNounDet(name) {
  document.getElementById('nd-title').textContent = name;
  var d = getNoun(name);
  // 正文
  document.getElementById('nd-text').textContent = (d && d.text) || '暂无详细解释。';
  // 分类与朝代
  var metaHtml = '';
  if (d && d.dynasty) metaHtml += '<span class="tg hot" style="font-size:10px;margin-right:6px">' + d.dynasty + '</span>';
  if (d && d.category) metaHtml += '<span class="tg sys" style="font-size:10px">' + d.category + '</span>';
  var metaEl = document.getElementById('nd-meta');
  if (metaEl) metaEl.innerHTML = metaHtml;
  // 地图
  var mapEl = document.querySelector('#noun-detail .mp');
  if (mapEl) {
    mapEl.textContent = (d && d.map) ? '🗺️ ' + d.map : '🗺️ 暂无相关地图';
  }
  // 相关名词
  var rel = document.getElementById('nd-related');
  rel.innerHTML = '';
  if (d && Array.isArray(d.related) && d.related.length) {
    d.related.forEach(function(r) {
      rel.innerHTML += '<button class="nrtag" onclick="openNounDet(\'' + r + '\')">' + r + '</button>';
    });
  } else {
    rel.innerHTML = '<span style="font-size:12px;color:#B5ADA5">暂无相关名词</span>';
  }
  document.getElementById('noun-detail').classList.add('act');
}
```

- [ ] 在 `index.html` 的 `#noun-detail` 中，`.vp` 和 `.sec` 之间添加朝代/分类元信息容器：
```html
<div style="padding:0 16px 8px" id="nd-meta"></div>
```

#### 1.4 搜索增强

- [ ] 修改 `searchNouns` 使其支持按 dynasty/category 子串匹配：

```js
function searchNouns() {
  var q = document.getElementById('noun-search-input').value.trim().toLowerCase();
  var grid = document.getElementById('noun-grid');
  if (!grid) return;
  var cards = grid.querySelectorAll('.ncard');
  cards.forEach(function(c) {
    var nameEl = c.querySelector('h4');
    var descEl = c.querySelector('p');
    var name = nameEl ? nameEl.textContent.toLowerCase() : '';
    var desc = descEl ? descEl.textContent.toLowerCase() : '';
    var tgEl = c.querySelector('.tg');
    var tag = tgEl ? tgEl.textContent.toLowerCase() : '';
    var matched = !q || name.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || tag.indexOf(q) !== -1;
    c.style.display = matched ? 'block' : 'none';
  });
}
```

#### 1.5 验证

- [ ] 启动 `python -m http.server 8000`，访问 `http://localhost:8000`
- [ ] 名词页应显示 50+ 张卡片，而非原先 4 张
- [ ] 搜索"唐朝"应筛选出唐朝相关名词
- [ ] 点击名词卡片进入详情，显示正文、朝代、分类、相关名词
- [ ] 收藏/取消收藏按钮正常
- [ ] 提交: `git add src/data/nouns.json src/js/noun.js index.html && git commit -m "feat: expand noun library to 50+ entries with full detail data"`

---

### Task 2: 时间轴 — 数据补全与交互修复

**文件：**
- 修改: `src/data/timeline.json`
- 修改: `src/js/timeline.js`
- 修改: `src/js/app.js`

#### 2.1 补全各朝代事件数据

- [ ] 确保 `src/data/timeline.json` 每个朝代至少有 6 个事件，总数 ≥ 40：

当前已有事件：商鞅变法、秦统一、推恩令、张骞西域、科举创立、贞观之治、安史之乱等。补充缺失朝代和事件，格式参考现有条目：

```json
{
  "name": "事件名",
  "year": "年份（如 前221年 或 1069年）",
  "x": 数字坐标,
  "pol": 政治维度坐标,
  "eco": 经济维度坐标,
  "cul": 文化维度坐标,
  "description": "事件描述（50-200字）",
  "conn": {
    "next": "下一关联事件名",
    "pol": "政治影响描述",
    "eco": "经济影响描述",
    "cul": "文化影响描述"
  }
}
```

- [ ] 补充事件建议：
  - 秦：焚书坑儒、修筑长城、灵渠开凿、陈胜吴广起义
  - 汉：文景之治、罢黜百家、王莽改制、光武中兴
  - 隋唐：开皇之治、大运河、开元盛世、两税法
  - 宋：王安石变法、靖康之变、海上丝绸之路
  - 明：郑和下西洋、张居正改革、万历三大征
  - 清：康乾盛世、虎门销烟、洋务运动

#### 2.2 修复缩放边界 bug

- [ ] 修改 `src/js/timeline.js` 的 `zoomTL` 函数，添加缩放边界限制：

```js
function zoomTL(delta) {
  timelineZoom = Math.max(-3, Math.min(3, timelineZoom + delta));
  renderTimeline();
  renderEventList();
}
```

#### 2.3 朝代特征数据迁移到 JSON

- [ ] 创建 `src/data/dynasty-features.json`：

```json
{
  "qin": {
    "name": "秦朝",
    "features": [
      {
        "title": "🏛️ 政治",
        "summary": "中央集权·郡县制·皇帝制度",
        "detail": "秦始皇首创皇帝制度..."
      }
    ]
  }
}
```

- [ ] 将 `index.html` 中 `#feat-qin` 到 `#feat-qing` 的 6 个朝代的硬编码 HTML（行 156-197）替换为通过 JS 动态渲染

- [ ] 在 `src/js/timeline.js` 中添加 `renderDynastyFeatures(dynastyId)` 函数，从 JSON 读取特征数据并渲染到 `#dynasty-features`

- [ ] 修改 `selDyn` 函数，切换朝代时调用 `renderDynastyFeatures`

#### 2.4 验证

- [ ] 时间轴每个朝代切换显示≥6个事件节点
- [ ] 缩放按钮有边界限制（不会无限缩放）
- [ ] 朝代特征详情从 JSON 加载
- [ ] 提交: `git add src/data/timeline.json src/data/dynasty-features.json src/js/timeline.js && git commit -m "feat: complete timeline data, add drag bounds, migrate features to JSON"`

---

### Task 3: 人物专题 — 数据迁移与关系网完善

**文件：**
- 修改: `src/data/people.json`
- 新建: `src/js/people.js`
- 修改: `index.html`
- 修改: `src/js/app.js`

#### 3.1 扩充 people.json 至 30+ 人

- [ ] 将 `index.html` 中 `peoData` 对象（行 634-640，含武则天/秦始皇/汉武帝/唐太宗/朱元璋/康熙 6 人）迁移到 `src/data/people.json`

- [ ] 扩充至≥30 人，覆盖各朝代关键人物。数据结构：

```json
{
  "defaultCenter": "武则天",
  "defaultGroup": "career",
  "centers": {
    "武则天": {
      "name": "武则天",
      "nick": "武曌、则天皇后",
      "dynasty": "唐朝",
      "career": [
        {"name": "狄仁杰", "role": "宰相", "deeds": ["断案如神", "劝立李显为太子"]}
      ],
      "family": [
        {"name": "李治", "role": "丈夫（唐高宗）", "deeds": ["在位34年", "废王立武"]}
      ],
      "yearTable": ["637年 生于利州", "655年 被立为皇后", ...],
      "evaluation": "中国历史上唯一正统女皇帝..."
    }
  }
}
```

- [ ] 补充人物：李斯、刘邦、项羽、卫青、霍去病、诸葛亮、曹操、李白、杜甫、苏轼、岳飞、成吉思汗、郑和、王阳明、张居正、林则徐、曾国藩、李鸿章等

#### 3.2 创建 people.js 模块

- [ ] 新建 `src/js/people.js`，从 `index.html` 迁移所有人物关系网逻辑：

```js
(function () {
  var peoData = {};
  var curCenter = '武则天';
  var curGroup = 'career';

  function setPeopleData(data) {
    if (data && data.centers) {
      peoData = data.centers;
      curCenter = data.defaultCenter || '武则天';
      curGroup = data.defaultGroup || 'career';
    }
  }

  // renderRel, openCenterDet, openPeoDet, closePeoDet, swPeoGroup, searchPeople
  // ... 从 index.html 行 633-709 迁移

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

#### 3.3 清理 index.html 内联脚本

- [ ] 删除 `index.html` 中的 `peoData` 对象声明和人物关系网函数（行 633-709）
- [ ] 在 `index.html` 中添加 `<script src="./src/js/people.js"></script>`（在 app.js 之前）

#### 3.4 app.js 集成

- [ ] 在 `src/js/app.js` 的 `initializeData` 中加载 `people.json`：
```js
var peopleRaw = await loadJSON('./src/data/people.json', { defaultCenter: '武则天', defaultGroup: 'career', centers: {} });
if (window.peopleAPI) window.peopleAPI.setPeopleData(peopleRaw);
try { window.peopleAPI.renderRel(); } catch (e) { console.error('renderRel err:', e); }
```

- [ ] 在 `exposeGlobals` 中暴露人物相关函数

#### 3.5 验证

- [ ] 人物专题页显示≥30 个可搜索人物
- [ ] 关系网 SVG 正常渲染
- [ ] 点击关系节点可切换中心人物
- [ ] 点击中心圆可查看详情
- [ ] 事业/亲属分组切换正常
- [ ] 提交: `git add src/data/people.json src/js/people.js index.html src/js/app.js && git commit -m "feat: migrate people data to JSON, create people.js module, expand to 30+ figures"`

---

### Task 4: 影视书目 — 数据充实与榜单完善

**文件：**
- 修改: `src/data/films.json`
- 修改: `src/data/rankings.json`
- 修改: `src/js/film.js`

#### 4.1 充实影片/书目数据

- [ ] 确保 `src/data/films.json` 每类（book/film/doc）≥15 条：

```json
[
  {
    "id": "unique-id",
    "type": "book",
    "title": "万历十五年",
    "author": "黄仁宇",
    "cover": "📘",
    "description": "以1587年为切入点，展现明朝衰落的深层原因",
    "dynasty": "ming",
    "rating": 9.0,
    "link": "https://book.douban.com/subject/..."
  }
]
```

- [ ] 补充历史书籍、历史影视剧、纪录片各至少 15 部

#### 4.2 榜单逻辑修复

- [ ] 检查 `switchRankingTab` 切换时是否正确渲染对应类型的排行列表
- [ ] 确保排行榜按评分降序排列
- [ ] 确保 `filterFilms` 的"全部/书籍/影视/纪录片"筛选正常工作

#### 4.3 验证

- [ ] 影视书目页三种类型切换正常
- [ ] 榜单按评分排序
- [ ] 待看栏添加/移动/查看正常
- [ ] 提交: `git add src/data/films.json src/data/rankings.json src/js/film.js && git commit -m "feat: enrich film/book data to 15+ per category"`

---

### Task 5: AI 播客 — 接入真实音频

**文件：**
- 修改: `src/data/podcasts.json`
- 修改: `src/js/podcast.js`
- 新建（或确认存在）: `assets/audio/` 目录

#### 5.1 准备音频文件

- [ ] 在 `assets/audio/` 下放置播客音频文件（mp3 格式），通过相对路径在 `podcasts.json` 中引用。对于尚无录制音频的播客，先在 `audioUrl` 字段中使用占位 URL（如 `./assets/audio/coming-soon.mp3`），播放时若加载失败则显示 toast 提示

- [ ] `src/data/podcasts.json` 中每条播客添加 `audioUrl` 字段：

```json
{
  "id": 0,
  "title": "贞观之治：盛世背后的智慧",
  "category": "suitang",
  "icon": "🏛️",
  "duration": "28:00",
  "listeners": "2.3万",
  "author": "AI历史助手 制作",
  "audioUrl": "./assets/audio/zhenguan.mp3"
}
```

#### 5.2 播放器接入真实音频

- [ ] 修改 `src/js/podcast.js`，在 `openPlayer` 中使用 HTML5 Audio API：

```js
var audioEl = null;

function getAudioEl() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.addEventListener('timeupdate', updateProgress);
    audioEl.addEventListener('ended', onAudioEnded);
    audioEl.addEventListener('error', function() {
      window.navigationAPI.showToast('音频加载失败，请稍后重试');
    });
  }
  return audioEl;
}

function openPlayer(idx) {
  var item = podcasts[idx];
  if (!item) return;
  currentIdx = idx;
  // ... 更新 UI
  var audio = getAudioEl();
  audio.src = item.audioUrl || '';
  audio.load();
  document.getElementById('podcast-player').classList.add('act');
}
```

- [ ] `togglePlay` 改为实际调用 `audio.play()` / `audio.pause()`
- [ ] `updateProgress` 更新进度条位置和当前时间显示
- [ ] `seekPodcast` 改为实际设置 `audio.currentTime`
- [ ] `setTimer` 使用 `setTimeout` 在指定时间后暂停

#### 5.3 验证

- [ ] 点击播客卡片 → 播放器弹出 → 音频开始加载
- [ ] 播放/暂停按钮正常
- [ ] 进度条实时更新
- [ ] 拖动进度条可跳转
- [ ] 音频加载失败时显示 toast
- [ ] 提交: `git add src/data/podcasts.json src/js/podcast.js && git commit -m "feat: integrate real audio playback for podcasts"`

---

### Task 6: 讨论区 — 帖子发布与评论功能（LocalStorage）

**文件：**
- 新建: `src/js/discuss.js`
- 修改: `index.html`
- 修改: `src/js/app.js`
- 修改: `src/data/discussions.json`

#### 6.1 创建 discuss.js 模块

- [ ] 新建 `src/js/discuss.js`，负责讨论区全部逻辑：

```js
(function () {
  var DISCUSS_KEY = 'xds_discussions';
  var posts = [];
  var activeFilter = 'all';

  function loadDiscussions() {
    var stored = window.storageAPI ? window.storageAPI.getStoredJSON(DISCUSS_KEY, null) : null;
    return Array.isArray(stored) ? stored : [];
  }

  function saveDiscussions() {
    if (window.storageAPI) window.storageAPI.setStoredJSON(DISCUSS_KEY, posts);
  }

  function setInitialDiscussions(data) {
    var stored = loadDiscussions();
    posts = stored.length ? stored : (Array.isArray(data) ? data : []);
    renderDiscussions();
  }

  function renderDiscussions() {
    var container = document.querySelector('#discuss-page .dp');
    if (!container) return;
    var filtered = activeFilter === 'all'
      ? posts
      : posts.filter(function(p) { return p.category === activeFilter; });

    var intro = '<div style="display:flex;gap:16px;padding:0 16px 12px;font-size:12px;color:#8A8279"><span>🔥 ' + posts.length + ' 讨论</span><span>⭐ ' + posts.reduce(function(s,p){return s + (p.commentsList ? p.commentsList.length : 0)}, 0) + ' 评论</span></div>';

    var tabs = '<div class="htabs" style="padding:0 16px 12px;display:flex;gap:8px;overflow-x:auto">' +
      ['all','view','cold','help','resource'].map(function(cat) {
        var labels = {all:'全部',view:'史观',cold:'冷知识',help:'求助',resource:'资源'};
        return '<button class="htab' + (activeFilter === cat ? ' act' : '') + '" onclick="window.discussAPI.filterDiscuss(\'' + cat + '\')">' + labels[cat] + '</button>';
      }).join('') +
    '</div>';

    var cards = filtered.length
      ? filtered.map(function(item) {
          return '<div class="pcard" data-discuss-cat="' + item.category + '">' +
            '<div class="pa"><div class="pav">' + item.avatar + '</div><div><div class="nm">' + item.author + '</div><div class="ti">' + item.time + '</div></div></div>' +
            '<div class="pc"><h4>' + item.title + '</h4><p>' + item.body + '</p></div>' +
            '<div class="pact"><span>❤️ ' + item.likes + '</span><span onclick="window.discussAPI.toggleComments(\'' + item.id + '\')">💬 ' + item.comments + '</span><span>⭐ ' + item.favorite + '</span></div>' +
            (item.commentsList && item.commentsList.length
              ? '<div class="cmt-list" style="display:none;padding:8px 0 0;border-top:1px solid #EDE8E0;margin-top:8px">' +
                  item.commentsList.map(function(c) {
                    return '<div class="cmt-item" style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">' +
                      '<div style="width:24px;height:24px;background:#EDE8E0;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center">' + c.avatar + '</div>' +
                      '<div style="flex:1"><div style="font-size:11px;font-weight:600;color:#2C1810">' + c.author + '</div><div style="font-size:11px;color:#2C1810;line-height:1.5">' + c.body + '</div></div>' +
                    '</div>';
                  }).join('') +
                  '<div class="cmt-input" style="display:flex;gap:8px;margin-top:8px">' +
                    '<input type="text" id="cmt-input-' + item.id + '" placeholder="写评论..." style="flex:1;padding:6px 10px;border:1px solid #EDE8E0;border-radius:10px;font-size:12px;outline:none">' +
                    '<button onclick="window.discussAPI.addComment(\'' + item.id + '\',document.getElementById(\'cmt-input-' + item.id + '\').value)" style="padding:6px 12px;background:#C9A96E;color:#fff;border:none;border-radius:10px;font-size:12px;cursor:pointer">发送</button>' +
                  '</div>' +
                '</div>'
              : '') +
          '</div>';
        }).join('')
      : '<div style="text-align:center;padding:32px;color:#B5ADA5">暂无讨论，快来发布第一条吧！</div>';

    container.innerHTML = intro + tabs + cards;
  }

  function submitPost(title, body, category) {
    var post = {
      id: 'post_' + Date.now(),
      author: '历史学习者',
      avatar: '👤',
      time: '刚刚',
      title: title,
      body: body,
      category: category || 'view',
      likes: '0',
      comments: '0',
      favorite: '收藏',
      commentsList: []
    };
    posts.unshift(post);
    saveDiscussions();
    renderDiscussions();
    window.navigationAPI.showToast('帖子发布成功！');
  }

  function addComment(postId, body) {
    if (!body || !body.trim()) {
      window.navigationAPI.showToast('请输入评论内容');
      return;
    }
    var post = posts.find(function(p) { return p.id === postId; });
    if (!post) return;
    post.commentsList = post.commentsList || [];
    post.commentsList.push({
      avatar: '👤',
      author: '历史学习者',
      body: body.trim()
    });
    post.comments = String(post.commentsList.length);
    saveDiscussions();
    renderDiscussions();
  }

  function toggleComments(postId) {
    var card = document.querySelector('[data-discuss-cat] .cmt-list');
    // 在 renderDiscussions 渲染后，通过 data-discuss-cat 找到对应 .pcard
    var allCards = document.querySelectorAll('#discuss-page .pcard');
    allCards.forEach(function(card) {
      var list = card.querySelector('.cmt-list');
      if (list) list.style.display = 'none';
    });
    // 简单实现：重新渲染并展开目标帖子的评论
    var targetCard = document.querySelector('#discuss-page .pcard');
    // 由于重新渲染会重置状态，改用 data 属性追踪
    var list = document.querySelector('#discuss-page .cmt-list');
    if (list) list.style.display = list.style.display === 'none' ? 'block' : 'none';
  }

  function filterDiscuss(cat) {
    activeFilter = cat;
    renderDiscussions();
  }

  window.discussAPI = {
    setInitialDiscussions: setInitialDiscussions,
    submitPost: submitPost,
    addComment: addComment,
    toggleComments: toggleComments,
    filterDiscuss: filterDiscuss,
    renderDiscussions: renderDiscussions
  };
})();
```

#### 6.2 修改发帖表单

- [ ] 修改 `index.html` 中 `submitPost()` 函数（行 753-764），改为调用 `window.discussAPI.submitPost()`：

```js
function submitPost() {
  var t = document.getElementById('post-title').value.trim();
  var b = document.getElementById('post-body').value.trim();
  if (!t) { showToast('请输入帖子标题'); return; }
  if (!b) { showToast('请输入帖子内容'); return; }
  var cat = postTags.length ? postTags[0] : 'view';
  window.discussAPI.submitPost(t, b, cat);
  document.getElementById('post-overlay').classList.remove('act');
  document.getElementById('post-title').value = '';
  document.getElementById('post-body').value = '';
  document.querySelectorAll('#post-overlay .ft').forEach(function(ft) { ft.classList.remove('act'); });
  postTags = [];
}
```

#### 6.3 迁移讨论区内联逻辑

- [ ] 从 `index.html` 中删除 `openPost`/`closePost`/`togglePostTag`/`submitPost`/`toggleComments`/`filterDiscuss` 函数（行 746-773），迁移到 `discuss.js`
- [ ] 在 `index.html` 中保留桥接函数引用
- [ ] 添加 `<script src="./src/js/discuss.js"></script>` 引用

#### 6.4 app.js 集成

- [ ] 在 `initializeData` 中加载 discussions.json 作为初始数据
- [ ] 在 `exposeGlobals` 中暴露 discussAPI 函数

#### 6.5 验证

- [ ] 讨论区显示帖子列表
- [ ] 点击"+"发布新帖 → 列表即时出现新帖
- [ ] 切换筛选标签（史观/冷知识/求助/资源）
- [ ] 评论展开/收起
- [ ] 刷新页面后帖子仍在（LocalStorage 持久化）
- [ ] 提交: `git add src/js/discuss.js index.html src/js/app.js && git commit -m "feat: implement discussion board with LocalStorage persistence"`

---

### Task 7: 打卡签到 — 统计联动与连续性奖励

**文件：**
- 修改: `src/js/checkin.js`

#### 7.1 统计数据联动

- [ ] 修改 `src/js/checkin.js`，打卡后更新首页个人区域的统计数据：

```js
function updateCheckinStats() {
  var checkins = loadCheckins();
  var today = new Date();
  var streak = calcStreak(checkins, today);
  
  // 更新统计数字
  var daysEl = document.getElementById('stat-days');
  var streakEl = document.getElementById('stat-streak');
  if (daysEl) daysEl.textContent = checkins.length;
  if (streakEl) streakEl.textContent = streak;
  
  // 更新打卡按钮状态
  var todayStr = formatDate(today);
  var btn = document.getElementById('checkin-btn');
  if (btn) {
    if (checkins.indexOf(todayStr) !== -1) {
      btn.textContent = '✅ 今日已打卡';
      btn.disabled = true;
    } else {
      btn.textContent = '📅 今日打卡';
      btn.disabled = false;
    }
  }
}
```

#### 7.2 连续打卡奖励提示

- [ ] 在 `doCheckin` 中添加连续打卡提示：

```js
function doCheckin() {
  var today = formatDate(new Date());
  var checkins = loadCheckins();
  if (checkins.indexOf(today) !== -1) {
    window.navigationAPI.showToast('今日已打卡，明天再来吧！');
    return;
  }
  checkins.push(today);
  saveCheckins(checkins);
  var streak = calcStreak(checkins, new Date());
  var msg = '打卡成功！';
  if (streak >= 7) msg = '🔥 连续打卡 ' + streak + ' 天！太厉害了！';
  else if (streak >= 3) msg = '👍 连续打卡 ' + streak + ' 天，继续加油！';
  window.navigationAPI.showToast(msg);
  updateCheckinStats();
  renderCheckinCalendar();
}
```

#### 7.3 验证

- [ ] 打卡后统计数字更新
- [ ] 连续 3/7 天有不同的奖励提示
- [ ] 今日已打卡后按钮置灰
- [ ] 提交: `git add src/js/checkin.js && git commit -m "feat: enhance checkin with stats sync and streak rewards"`

---

### Task 8: 科学备考 — 基础测验功能 + 思维导图完善

**文件：**
- 新建: `src/data/questions.json`
- 新建: `src/js/quiz.js`
- 修改: `src/data/science-tools.json`
- 修改: `index.html`
- 修改: `src/js/app.js`

#### 8.1 创建历史选择题库

- [ ] 新建 `src/data/questions.json`，包含≥30 道选择题：

```json
[
  {
    "id": "q001",
    "topic": "秦朝政治",
    "dynasty": "qin",
    "question": "秦始皇统一六国后推行的地方行政制度是？",
    "options": [
      {"key": "A", "text": "分封制"},
      {"key": "B", "text": "郡县制"},
      {"key": "C", "text": "行省制"},
      {"key": "D", "text": "三省六部制"}
    ],
    "answer": "B",
    "explanation": "秦始皇废除分封制，全面推行郡县制，地方官吏由朝廷直接任命。"
  }
]
```

#### 8.2 创建 quiz.js 测验模块

- [ ] 新建 `src/js/quiz.js`，实现选择题答题功能：

```js
(function () {
  var questions = [];
  var currentIndex = 0;
  var score = 0;
  var userAnswers = [];
  var QUIZ_CONTAINER_ID = 'quiz-container';

  function setQuestions(data) {
    questions = Array.isArray(data) ? data : [];
  }

  function shuffleQuestions(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function startQuiz() {
    if (!questions.length) {
      window.navigationAPI.showToast('题库暂未加载，请刷新页面后重试');
      return;
    }
    currentIndex = 0;
    score = 0;
    userAnswers = [];
    questions = shuffleQuestions(questions);
    showQuizUI();
    renderQuestion();
  }

  function showQuizUI() {
    var sciencePage = document.getElementById('science-page');
    if (!sciencePage) return;
    // 在科学备考页中显示答题区
    var sg = sciencePage.querySelector('.sg');
    if (sg) sg.style.display = 'none';
    // 创建答题容器
    var existing = document.getElementById(QUIZ_CONTAINER_ID);
    if (existing) existing.remove();
    var container = document.createElement('div');
    container.id = QUIZ_CONTAINER_ID;
    container.style.cssText = 'padding:16px';
    container.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
        '<button class="bk" onclick="window.quizAPI.closeQuiz()">← 返回</button>' +
        '<span style="font-size:13px;color:#8A8279" id="quiz-progress"></span>' +
        '<span style="font-size:13px;color:#C9A96E;font-weight:600" id="quiz-score"></span>' +
      '</div>' +
      '<div id="quiz-question-area"></div>' +
      '<div id="quiz-result-area" style="display:none"></div>';
    sciencePage.appendChild(container);
  }

  function renderQuestion() {
    if (currentIndex >= questions.length) {
      finishQuiz();
      return;
    }
    var q = questions[currentIndex];
    document.getElementById('quiz-progress').textContent = (currentIndex + 1) + ' / ' + questions.length;
    document.getElementById('quiz-score').textContent = '得分: ' + score;
    document.getElementById('quiz-result-area').style.display = 'none';

    var area = document.getElementById('quiz-question-area');
    area.innerHTML =
      '<div style="background:#FFFBF0;border-radius:12px;padding:16px;margin-bottom:12px">' +
        '<div style="font-size:12px;color:#C9A96E;margin-bottom:8px">' + (q.topic || '') + ' · ' + (q.dynasty || '') + '</div>' +
        '<h4 style="font-size:16px;color:#2C1810;line-height:1.6;margin-bottom:16px">' + q.question + '</h4>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          q.options.map(function(opt) {
            return '<button class="quiz-opt" onclick="window.quizAPI.submitAnswer(\'' + opt.key + '\')" style="padding:12px 16px;border:1.5px solid #EDE8E0;border-radius:10px;background:#fff;text-align:left;font-size:14px;color:#2C1810;cursor:pointer">' +
              '<span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#EDE8E0;border-radius:50%;margin-right:10px;font-size:12px;font-weight:700">' + opt.key + '</span>' +
              opt.text +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  function submitAnswer(key) {
    var q = questions[currentIndex];
    var correct = q.answer === key;
    if (correct) score++;
    userAnswers.push({ questionId: q.id, userAnswer: key, correct: correct });

    // 显示结果
    var area = document.getElementById('quiz-question-area');
    var btns = area.querySelectorAll('.quiz-opt');
    btns.forEach(function(btn) {
      btn.disabled = true;
      btn.style.cursor = 'default';
      if (btn.textContent.indexOf(key) === 2) {
        btn.style.borderColor = correct ? '#27AE60' : '#E74C3C';
        btn.style.background = correct ? '#F0FFF0' : '#FFF0F0';
      }
    });

    document.getElementById('quiz-result-area').style.display = 'block';
    document.getElementById('quiz-result-area').innerHTML =
      '<div style="padding:12px;background:' + (correct ? '#F0FFF0' : '#FFF0F0') + ';border-radius:10px;margin-top:12px">' +
        '<div style="font-size:14px;font-weight:700;color:' + (correct ? '#27AE60' : '#E74C3C') + ';margin-bottom:6px">' +
          (correct ? '✅ 回答正确！' : '❌ 回答错误') +
        '</div>' +
        '<div style="font-size:13px;color:#2C1810;line-height:1.6">' + q.explanation + '</div>' +
        '<button onclick="window.quizAPI.nextQuestion()" style="margin-top:12px;padding:10px 24px;background:#C9A96E;color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">' +
          (currentIndex + 1 >= questions.length ? '查看成绩' : '下一题 →') +
        '</button>' +
      '</div>';
  }

  function nextQuestion() {
    currentIndex++;
    renderQuestion();
  }

  function finishQuiz() {
    var area = document.getElementById('quiz-question-area');
    var resultArea = document.getElementById('quiz-result-area');
    area.innerHTML = '';
    resultArea.style.display = 'block';
    var wrongCount = userAnswers.filter(function(a) { return !a.correct; }).length;
    resultArea.innerHTML =
      '<div style="text-align:center;padding:24px">' +
        '<div style="font-size:48px;margin-bottom:12px">' + (score === questions.length ? '🎉' : score >= questions.length / 2 ? '👍' : '📚') + '</div>' +
        '<h3 style="font-size:20px;color:#2C1810;margin-bottom:8px">测验完成！</h3>' +
        '<div style="font-size:32px;font-weight:700;color:#C9A96E;margin-bottom:8px">' + score + ' / ' + questions.length + '</div>' +
        '<div style="font-size:13px;color:#8A8279;margin-bottom:16px">正确率 ' + Math.round(score / questions.length * 100) + '%  |  错题 ' + wrongCount + ' 道</div>' +
        '<button onclick="window.quizAPI.startQuiz()" style="padding:10px 24px;background:#C9A96E;color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer">再来一轮</button>' +
        '<button onclick="window.quizAPI.closeQuiz()" style="margin-left:8px;padding:10px 24px;background:#EDE8E0;color:#2C1810;border:none;border-radius:10px;font-size:14px;cursor:pointer">返回备考</button>' +
      '</div>';
  }

  function closeQuiz() {
    var container = document.getElementById(QUIZ_CONTAINER_ID);
    if (container) container.remove();
    var sg = document.querySelector('#science-page .sg');
    if (sg) sg.style.display = '';
  }

  window.quizAPI = {
    setQuestions: setQuestions,
    startQuiz: startQuiz,
    submitAnswer: submitAnswer,
    nextQuestion: nextQuestion,
    closeQuiz: closeQuiz
  };
})();
```

#### 8.3 更新科学备考页面

- [ ] 修改 `src/data/science-tools.json`，将"挖空练习"从 toast 改为跳转到测验页面：

```json
{"id": "fill-blank", "icon": "✏️", "title": "真题演练", "description": "历年真题选择题训练", "action": "startQuiz"}
```

- [ ] 修改 `src/js/app.js` 的 `renderScienceTools`，支持 `startQuiz` action：

```js
var action;
if (item.action === 'openSub') {
  action = 'openSub(\'' + item.target + '\')';
} else if (item.action === 'startQuiz') {
  action = 'window.quizAPI.startQuiz()';
} else {
  action = 'showToast(\'' + item.message + '\')';
}
```

#### 8.4 思维导图节点笔记同步到 LocalStorage

- [ ] 确认 `openNode` 和 `saveNode` 函数（`index.html` 行 720-729）正常工作
- [ ] 将思维导图函数迁移到独立模块 `src/js/mindmap.js`

#### 8.5 验证

- [ ] 科学备考页点击"真题演练"进入答题界面
- [ ] 选题→提交→看解析→下一题 流程完整
- [ ] 完成后显示得分
- [ ] 思维导图笔记保存/读取正常
- [ ] 提交: `git add src/data/questions.json src/js/quiz.js src/data/science-tools.json src/js/app.js && git commit -m "feat: add history quiz with 30+ multiple-choice questions"`

---

### Task 9: 首页热点 — 数据驱动渲染

**文件：**
- 修改: `src/data/hot-articles.json`
- 修改: `src/js/app.js`
- 修改: `index.html`

#### 9.1 充实热点文章数据

- [ ] 确保 `src/data/hot-articles.json` 包含≥10 条真实可访问的文章链接
- [ ] 每条文章标记朝代、类型、真实 URL

#### 9.2 内联 HTML 清理

- [ ] 删除 `index.html` 中 `#hot-articles` 内的 6 个硬编码 `.hl` / `.hi` 元素（行 55-111）
- [ ] 确认 `app.js` 的 `renderHotArticles()` 已正确渲染（已有实现，第 116-141 行）

#### 9.3 验证

- [ ] 首页加载后热点文章从 JSON 渲染
- [ ] 朝代筛选（全部/秦汉/隋唐/宋元/明清/近代）正常工作
- [ ] 点击文章可跳转到外部链接
- [ ] 提交: `git add src/data/hot-articles.json index.html && git commit -m "feat: make hot articles fully data-driven"`

---

### Task 10: 收尾清理 — 内联脚本迁移与 Toast 清理

**文件：**
- 新建: `src/js/mindmap.js`
- 修改: `index.html`
- 修改: `src/js/app.js`

#### 10.1 迁移思维导图逻辑

- [ ] 新建 `src/js/mindmap.js`，从 `index.html` 迁移 `swMind`/`openNode`/`saveNode`/`closeNodeNote`（行 712-733）
- [ ] 在 `index.html` 添加引用，删除内联函数

#### 10.2 迁移朝代特征详情函数

- [ ] 将 `openFeatDet`/`closeFeatDet`（行 736-741）迁移到 `src/js/timeline.js` 或 `src/js/mindmap.js`

#### 10.3 Toast 文案清理

- [ ] 搜索全项目中的 `showToast` 调用，替换所有"开发中"/"加载中"等占位文案：

需要修改的文件和位置：
- `index.html:20` — `showToast('手机号登录功能开发中')` → 移除按钮或改为 `showToast('手机号登录即将上线')`
- `index.html:24` — `showToast('搜索功能开发中')` → 实现或改为跳转
- `index.html:240` — `showToast('自定义导图编辑器开发中')` → 保留但改文案为功能描述
- `index.html:344` — `showToast('倍速切换')` → 实现倍速切换
- `src/data/science-tools.json` — 多处 `message: "xxx开发中"` → 替换或删除
- `index.html:473-476` — `showToast('学习记录开发中')` 等 → 改为功能描述

#### 10.4 验证

- [ ] 全站无"开发中"/"加载中"等占位 toast
- [ ] 所有功能要么可用，要么有明确的功能说明（而非"开发中"）
- [ ] 无控制台报错
- [ ] 提交: `git add src/js/mindmap.js index.html src/js/app.js && git commit -m "chore: migrate remaining inline scripts, clean up stub toast messages"`

---

### Task 11: 测试补齐

**文件：**
- 新建: `tests/noun.test.js`
- 新建: `tests/quiz.test.js`
- 新建: `tests/discuss.test.js`
- 修改: 现有测试文件（如需要）

#### 11.1 名词搜索测试

- [ ] 新建 `tests/noun.test.js`：

```js
import { describe, it, expect, beforeEach } from 'vitest';

// 模拟 DOM
document.body.innerHTML = `
  <div id="noun-grid">
    <div class="ncard"><h4>商鞅变法</h4><p>战国时期...</p></div>
    <div class="ncard"><h4>科举制</h4><p>隋唐至清末...</p></div>
    <div class="ncard"><h4>军机处</h4><p>清朝雍正...</p></div>
  </div>
  <input id="noun-search-input" />
`;

describe('noun search', () => {
  it('should filter cards by search query', () => {
    document.getElementById('noun-search-input').value = '商鞅';
    // 模拟 searchNouns 调用
    // 验证只有匹配的卡片显示
  });

  it('should show all cards when query is empty', () => {
    // ...
  });
});
```

#### 11.2 测验逻辑测试

- [ ] 新建 `tests/quiz.test.js`，测试答题判定、得分计算、错题记录

#### 11.3 讨论区测试

- [ ] 新建 `tests/discuss.test.js`，测试发帖、评论、筛选、持久化

#### 11.4 运行全部测试

- [ ] 运行: `npx vitest run --environment jsdom`
- [ ] 确保全部通过
- [ ] 提交: `git add tests/ && git commit -m "test: add unit tests for noun, quiz, and discuss modules"`

---

## Phase 1 最终验收清单

全部 Task 完成后，执行以下端到端验证：

- [ ] `python -m http.server 8000` 正常启动
- [ ] 登录页 → 微信登录 → 首页
- [ ] 首页：梗图轮播、热点文章（数据驱动）、模块入口
- [ ] 名词解释：≥50 条可搜索名词，详情含正文+朝代+分类+相关词+地图
- [ ] 时间轴：≥40 个事件，朝代切换/缩放/拖拽正常
- [ ] 人物专题：≥30 人可搜索，关系网交互正常
- [ ] 影视书目：≥45 条推荐（书+影视+纪录片各≥15），榜单排序正常
- [ ] AI 播客：真实音频播放，进度条/倍速/定时正常
- [ ] 讨论区：发帖即时显示，评论可用，LocalStorage 持久化
- [ ] 打卡签到：统计联动，连续打卡提示
- [ ] 科学备考：≥30 道选择题可答题，思维导图笔记可用
- [ ] 全站无"开发中" toast
- [ ] 控制台无阻断性错误
- [ ] `npx vitest run --environment jsdom` 全部通过
