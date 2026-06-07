# 本地 Agent Skill：拆分“学的是史”单文件原型并建立可维护结构

## 一、角色

你是我的本地开发 Agent。

当前仓库中已有一个可以直接运行的中国历史学习网站原型，项目名称为：

```text
学的是史
```

当前主要代码集中在根目录的：

```text
index.html
```

本次任务是进行第二阶段重构：将单文件 HTML 原型拆分为清晰、可维护、便于继续开发的项目结构。

本次重构必须保证：

1. 页面视觉效果基本不变。
2. 已有交互功能基本不变。
3. 不引入前端框架。
4. 不安装 npm 依赖。
5. 不直接迁移到微信小程序。
6. 不重写业务逻辑。
7. 每一步都可回退。
8. 重构完成后仍可通过静态服务器直接运行。

---

# 二、核心任务

将当前 `index.html` 拆分为：

```text
HTML + CSS + JavaScript + JSON 数据
```

目标结构：

```text
xuedeshi-history-learning/
├── index.html
├── README.md
├── .gitignore
├── docs/
│   ├── product-vision.md
│   ├── dev-notes.md
│   └── refactor-report.md
├── assets/
│   ├── images/
│   ├── icons/
│   └── audio/
├── src/
│   ├── css/
│   │   ├── base.css
│   │   ├── components.css
│   │   └── pages.css
│   ├── js/
│   │   ├── app.js
│   │   ├── storage.js
│   │   ├── navigation.js
│   │   ├── noun.js
│   │   ├── timeline.js
│   │   ├── podcast.js
│   │   ├── favorites.js
│   │   └── ai-assistant.js
│   └── data/
│       ├── nouns.json
│       ├── timeline.json
│       ├── people.json
│       ├── podcasts.json
│       ├── books.json
│       └── memes.json
└── mini-program/
    └── README.md
```

---

# 三、执行原则

## 1. 先备份，再修改

开始前创建备份：

```bash
cp index.html index.backup.html
```

然后创建独立 Git 分支：

```bash
git checkout -b refactor/split-static-prototype
```

如果该分支已存在，则切换到该分支：

```bash
git checkout refactor/split-static-prototype
```

## 2. 不改变现有视觉风格

当前项目整体使用：

* 米白色背景
* 深棕色文字
* 金色强调色
* 紫色 AI 助手按钮
* 移动端优先布局
* 最大宽度约 `420px`
* 卡片化 UI
* 页面模拟切换
* 多种弹窗和底部面板

拆分后需要保留这些设计特征。

## 3. 不做功能升级

本次只做代码结构优化，不主动增加：

* 后端接口
* 数据库
* 用户鉴权
* 微信登录真实接入
* AI API
* 第三方 UI 库
* 构建工具
* npm 依赖
* Vue、React、Svelte 等框架
* 微信小程序源码

## 4. 保留静态页面运行能力

拆分完成后，项目必须可以使用：

```bash
python -m http.server 8000
```

启动。

浏览器访问：

```text
http://localhost:8000
```

注意：由于需要加载 JSON 文件，不建议继续直接双击 `index.html` 运行。README 中需要明确说明使用静态服务器启动。

---

# 四、第一阶段：拆分 CSS

## 任务

将 `index.html` 中 `<style>` 标签里的 CSS 拆分到以下文件：

```text
src/css/base.css
src/css/components.css
src/css/pages.css
```

## 建议分类

### `src/css/base.css`

放置：

* CSS Reset
* `body`
* 通用字体
* 页面背景
* `.page`
* 通用按钮基础样式
* 通用颜色
* Toast
* 通用布局工具类

### `src/css/components.css`

放置可复用组件样式：

* 底部导航栏
* 标签
* 卡片
* 弹窗
* 面板
* 搜索框
* 按钮
* 收藏按钮
* 反馈弹窗
* AI 悬浮按钮
* AI 对话面板
* 播客播放器
* 人物资料卡
* 笔记面板

### `src/css/pages.css`

放置页面级样式：

* 登录页
* 首页
* 首页梗图轮播
* 首页热点文章
* 名词解释页
* 名词详情页
* 时间轴页
* 科学备考页
* 思维导图页
* 人物专题页
* AI 播客页
* 影视书目页
* 收藏夹页
* 讨论区
* 我的页面

## 修改 `index.html`

删除原来的内联 `<style>` 标签，并在 `<head>` 中引入：

```html
<link rel="stylesheet" href="./src/css/base.css">
<link rel="stylesheet" href="./src/css/components.css">
<link rel="stylesheet" href="./src/css/pages.css">
```

## 注意事项

* CSS 拆分后不要改变选择器名称。
* 不要为了“美化代码”大规模重命名 class。
* 如发现重复 CSS，可在保证效果完全一致的前提下进行合并。
* 合并重复样式时，在 `docs/refactor-report.md` 中说明。

完成 CSS 拆分后，先启动静态服务器进行人工检查，再提交一次：

```bash
git add .
git commit -m "refactor: split prototype styles into css modules"
```

---

# 五、第二阶段：拆分 JavaScript

## 任务

将 `index.html` 中原有 `<script>` 标签中的逻辑，按功能拆分到以下文件：

```text
src/js/storage.js
src/js/navigation.js
src/js/noun.js
src/js/timeline.js
src/js/podcast.js
src/js/favorites.js
src/js/ai-assistant.js
src/js/app.js
```

## 文件职责

### `src/js/storage.js`

统一处理浏览器本地存储。

建议提供通用方法：

```js
function getStoredJSON(key, fallbackValue) {}
function setStoredJSON(key, value) {}
function getStoredString(key, fallbackValue) {}
function setStoredString(key, value) {}
```

如原型中使用 `localStorage` 记录以下内容，可集中管理：

* 登录状态
* 签到状态
* 收藏
* 笔记
* 播客收藏
* 影视书目收藏
* 用户设置

不要改变原有 key，除非确有必要。

如调整 key，需要保留兼容迁移逻辑。

---

### `src/js/navigation.js`

负责：

* 登录后的页面显示
* 底部导航切换
* 子页面打开和关闭
* 面板打开和关闭
* Toast 提示
* 通用弹窗关闭逻辑

例如：

```js
function login() {}
function showPage(pageId) {}
function openSub(pageId) {}
function closeSub(pageId) {}
function showToast(message) {}
```

---

### `src/js/noun.js`

负责名词解释模块：

* 搜索名词
* 渲染名词卡片
* 打开名词详情
* 关闭名词详情
* 收藏名词
* 分享名词
* 相关名词跳转

建议：

```js
async function loadNouns() {}
function renderNouns(list) {}
function searchNouns() {}
function openNounDet(name) {}
function closeNounDet() {}
```

---

### `src/js/timeline.js`

负责时间轴模块：

* 朝代切换
* 历史事件渲染
* 图表生成
* 坐标点交互
* 上一朝代 / 下一朝代
* 缩放
* 拖拽
* 时代特征弹窗

建议保留现有逻辑，只做模块化拆分。

---

### `src/js/podcast.js`

负责：

* 播客列表
* 播客分类筛选
* 播放器打开与关闭
* 播放按钮状态
* 播放进度
* 播放速度
* 收藏播客

注意：如果当前只是交互模拟，不要擅自引入真实音频。

---

### `src/js/favorites.js`

负责：

* 名词收藏
* 影视书目收藏
* 播客收藏
* 收藏夹展示
* 收藏删除
* 收藏类型筛选

建议统一收藏数据结构，例如：

```js
{
  id: "noun-shangyang-reform",
  type: "noun",
  title: "商鞅变法",
  icon: "📖",
  subtitle: "战国时期秦国变法"
}
```

如果当前已有其他存储结构，优先兼容已有结构，不要直接破坏用户已有数据。

---

### `src/js/ai-assistant.js`

负责 AI 助手模拟交互：

* 打开面板
* 关闭面板
* 快捷问题
* 用户输入
* 模拟回复
* 聊天消息渲染
* AI 悬浮按钮拖拽

本阶段仍保持模拟回答，不接入真实 API。

---

### `src/js/app.js`

作为入口文件，负责：

* 初始化页面
* 加载 JSON 数据
* 绑定全局事件
* 恢复本地存储状态
* 兼容旧版 HTML 内联事件调用

建议：

```js
document.addEventListener("DOMContentLoaded", async () => {
  await initializeApp();
});
```

---

## 修改 `index.html`

删除原有内联 `<script>`，在 `</body>` 前按顺序引入：

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

## 关于全局函数

当前 HTML 中可能大量使用：

```html
onclick="openSub('noun-page')"
```

这类内联事件调用。

本次重构可以暂时保留。

因此拆分后的对应函数仍需要暴露在全局作用域中，确保按钮不会失效。

例如：

```js
window.openSub = openSub;
window.closeSub = closeSub;
window.showToast = showToast;
```

不要在本次重构中强行将全部内联事件改为 `addEventListener`。

完成 JavaScript 拆分和基本验证后提交：

```bash
git add .
git commit -m "refactor: split prototype logic into javascript modules"
```

---

# 六、第三阶段：抽离 JSON 数据

## 任务

将页面中适合数据化维护的内容抽离为 JSON 文件。

## 需要抽离的数据

### `src/data/nouns.json`

存放历史名词解释。

建议格式：

```json
[
  {
    "id": "shangyang-reform",
    "title": "商鞅变法",
    "period": "战国·秦",
    "category": "制度改革",
    "summary": "战国时期秦国通过变法实现富国强兵的改革运动",
    "detail": "商鞅变法是战国时期秦国的重要改革……",
    "related": ["秦孝公", "军功爵制", "郡县制"]
  }
]
```

至少抽离当前页面已有的名词：

* 商鞅变法
* 军机处
* 科举制
* 靖难之役

---

### `src/data/timeline.json`

存放朝代和事件。

建议格式：

```json
{
  "qin": {
    "name": "秦",
    "startYear": -221,
    "endYear": -207,
    "events": [
      {
        "year": -221,
        "title": "秦统一六国",
        "type": "politics",
        "description": "秦始皇完成统一，建立中国历史上第一个统一的中央集权国家。"
      }
    ]
  }
}
```

朝代至少包括：

* 秦
* 汉
* 隋唐
* 宋
* 明
* 清

保留现有历史事件和时代特征内容。

---

### `src/data/people.json`

存放人物专题数据。

建议格式：

```json
[
  {
    "id": "qin-shihuang",
    "name": "秦始皇",
    "period": "秦朝",
    "birth": "前259年",
    "death": "前210年",
    "identity": "秦朝开国皇帝",
    "summary": "完成统一六国，建立中央集权国家。",
    "relations": []
  }
]
```

---

### `src/data/podcasts.json`

存放播客列表。

建议格式：

```json
[
  {
    "id": "podcast-qin-unification",
    "title": "秦始皇：统一背后的代价",
    "category": "秦汉",
    "duration": "12:30",
    "icon": "🏺",
    "audioUrl": ""
  }
]
```

若当前没有真实音频文件，`audioUrl` 保持空字符串。

---

### `src/data/books.json`

存放影视和书目推荐。

建议格式：

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
  }
]
```

---

### `src/data/memes.json`

存放首页梗图轮播内容。

建议格式：

```json
[
  {
    "id": "meme-qinshihuang",
    "icon": "🏺",
    "caption": "秦始皇：朕的江山，你们随便挖",
    "background": "linear-gradient(135deg,#C0392B,#E74C3C)",
    "detail": "……"
  }
]
```

---

## 数据加载方式

使用原生 `fetch` 加载 JSON：

```js
async function loadJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load data: ${path}`);
  }

  return response.json();
}
```

加载失败时：

1. 不要导致整个页面崩溃。
2. 控制台输出清晰错误。
3. 显示适当 Toast。
4. 如有必要，为关键模块保留最小 fallback 数据。

示例：

```js
async function safeLoadJSON(path, fallback = []) {
  try {
    return await loadJSON(path);
  } catch (error) {
    console.error(error);
    return fallback;
  }
}
```

完成数据抽离后提交：

```bash
git add .
git commit -m "refactor: extract prototype content into json data files"
```

---

# 七、HTML 清理要求

完成拆分后，根目录 `index.html` 主要保留：

1. HTML 页面结构。
2. CSS 文件引用。
3. JavaScript 文件引用。
4. 必要的语义化标签。
5. 少量无法立即迁移的内联内容。

需要减少：

* 大段 `<style>`
* 大段 `<script>`
* 重复样式
* 明显重复代码
* 无用注释
* 重复 DOM 结构

但不要：

* 擅自删除看似未使用的功能
* 改变页面 ID
* 改变按钮行为
* 大量重命名 class
* 改写设计风格

---

# 八、检查并修复明显问题

在保持功能不变的前提下，检查以下问题。

## 1. 重复 CSS 定义

原型中可能存在重复定义，例如同一类组件样式重复出现。

处理原则：

* 确认内容完全重复时，可删除多余定义。
* 如不同定义存在覆盖关系，必须谨慎保留最终效果。
* 在重构报告中列出处理情况。

## 2. HTML 标签闭合问题

检查：

* `<div>` 是否正确闭合
* 按钮是否嵌套异常
* 页面容器是否错位
* 列表是否存在不完整标签
* 模板中是否存在被截断或复制残留的片段

## 3. JS 全局函数缺失

检查页面中的：

```html
onclick="..."
```

确保引用的所有函数都存在。

可以通过命令初步搜索：

```bash
grep -o 'onclick="[^"]*"' index.html
```

然后人工检查对应函数。

## 4. 控制台报错

使用浏览器开发者工具检查：

* 是否有 `ReferenceError`
* 是否有 JSON 加载错误
* 是否有路径错误
* 是否有事件绑定错误
* 是否有空元素调用错误

## 5. 静态资源路径

全部使用相对路径：

```text
./src/...
./assets/...
```

不要写死本地绝对路径。

---

# 九、验收清单

完成后必须逐项验证。

## 1. 启动服务

```bash
python -m http.server 8000
```

## 2. 页面访问

浏览器打开：

```text
http://localhost:8000
```

## 3. 基础功能

检查：

* 登录页能显示
* 微信登录按钮能进入首页
* 首页底部导航可切换
* 首页梗图轮播能显示
* 首页热点筛选能使用
* 名词解释页能打开
* 名词搜索能使用
* 名词详情能打开和关闭
* 名词收藏能使用
* 时间轴页能打开
* 朝代切换能使用
* 上一朝代和下一朝代能使用
* 时间轴缩放功能可用
* 时代特征详情能打开
* 科学备考页能打开
* 人物专题页能打开
* AI 播客页能打开
* 播客播放器能打开和关闭
* 影视书目页能打开
* 收藏夹能打开
* 我的页面能打开
* 签到面板能打开和关闭
* AI 助手按钮能显示
* AI 助手面板能打开和关闭
* AI 助手模拟问答能使用
* Toast 提示正常

## 4. 开发者工具检查

确认：

```text
Console 中没有阻断性报错
```

## 5. Git 状态

确认：

```bash
git status
git log --oneline --decorate -10
```

---

# 十、更新 README.md

在 `README.md` 中加入：

````markdown
## 本地运行

由于页面需要通过 `fetch` 加载 JSON 数据，请使用静态服务器运行项目。

```bash
python -m http.server 8000
````

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

* 原生 HTML
* 原生 CSS
* 原生 JavaScript
* JSON 静态数据
* 浏览器 LocalStorage

暂未引入构建工具和第三方框架。

````

---

# 十一、创建重构报告

创建：

```text
docs/refactor-report.md
````

内容至少包括：

```markdown
# 第二阶段重构报告

## 一、重构目标

将单文件 HTML 原型拆分为 HTML、CSS、JavaScript 和 JSON 数据文件，同时保持页面视觉和交互基本不变。

## 二、已完成事项

- [ ] CSS 已拆分
- [ ] JavaScript 已拆分
- [ ] JSON 数据已抽离
- [ ] README 已更新
- [ ] 本地静态服务器运行正常
- [ ] 浏览器控制台无阻断性错误
- [ ] Git 提交已完成

## 三、文件变更说明

列出新增和修改的文件。

## 四、兼容性说明

说明：

- 是否保留 HTML 内联 onclick
- 是否保留旧版 localStorage key
- 是否加入 fallback 数据
- 是否修复明显 HTML 闭合问题
- 是否合并重复 CSS

## 五、未处理事项

列出暂时没有处理的事项，例如：

- 后端接口
- 微信登录
- AI API
- CMS 内容管理后台
- 微信小程序版本
- PWA
- 真实音频资源

## 六、测试结果

记录：

- 启动命令
- 访问地址
- 已验证功能
- 已知问题
```

---

# 十二、Git 提交策略

本次不要把所有修改压缩成一次提交。

建议至少拆成以下提交：

```bash
git commit -m "refactor: split prototype styles into css modules"
git commit -m "refactor: split prototype logic into javascript modules"
git commit -m "refactor: extract prototype content into json data files"
git commit -m "docs: add refactor report and update local development guide"
```

如修复了独立 bug，可增加：

```bash
git commit -m "fix: resolve prototype markup and interaction issues"
```

---

# 十三、最终交付内容

完成后向我汇报：

1. 当前分支名称。
2. 仓库绝对路径。
3. 最新 commit hash。
4. Git 提交列表。
5. 新目录结构。
6. 如何启动项目。
7. 已完成的测试项。
8. 控制台是否存在报错。
9. 修复了哪些明显问题。
10. 哪些问题暂未处理。
11. 是否建议下一阶段引入 Vite。
12. 是否建议优先开发 Web 版本，还是优先考虑微信小程序跨端方案。

---

# 十四、严格限制

本次禁止：

* 删除 `index.backup.html`
* 擅自改版
* 改变产品名称
* 引入 Vue、React、Angular、Svelte
* 初始化 Vite
* 使用 TypeScript
* 安装 npm 包
* 接入后端
* 接入真实 AI API
* 接入真实微信登录
* 创建微信小程序正式工程
* 大量调整文案
* 大量修改历史内容
* 将所有功能推倒重写

本次只完成：

```text
单文件原型 → 可维护的原生 Web 项目
```
