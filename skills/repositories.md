# 本地 Agent Skill：初始化“中国历史学习网站”Git 仓库

## 角色

你是我的本地开发 Agent。请在本地帮我创建并初始化一个 Git 仓库，用于开发一个中国历史学习网站。该项目后续可能会扩展为微信小程序，因此仓库结构需要从一开始保持清晰、可迁移、可继续迭代。

当前已有一个原型文件：`index.html`，这是项目的第一个静态页面原型，名称为“学的是史”。

## 项目目标

创建一个本地 Git 仓库，完成以下目标：

1. 初始化项目目录。
2. 将现有 `index.html` 放入项目中作为首个可运行原型。
3. 建立清晰的前端项目结构。
4. 添加基础项目说明文档。
5. 添加 `.gitignore`。
6. 完成第一次 Git 提交。
7. 保证项目可以在本地浏览器直接打开运行。
8. 为后续重构为模块化 Web 项目或迁移到微信小程序预留空间。

## 建议项目名称

仓库目录名建议使用：

```bash
xuedeshi-history-learning
```

中文项目名：

```text
学的是史
```

## 初始目录结构

请创建如下结构：

```text
xuedeshi-history-learning/
├── index.html
├── README.md
├── .gitignore
├── docs/
│   ├── product-vision.md
│   └── dev-notes.md
├── assets/
│   ├── images/
│   ├── icons/
│   └── audio/
├── src/
│   ├── css/
│   ├── js/
│   └── data/
└── mini-program/
    └── README.md
```

说明：

* `index.html`：当前已有的静态原型页面。
* `docs/`：存放产品规划、开发说明、需求文档。
* `assets/`：未来存放图片、图标、音频等静态资源。
* `src/css/`：未来拆分 CSS。
* `src/js/`：未来拆分 JS。
* `src/data/`：未来存放历史人物、朝代、名词解释、时间轴等结构化数据。
* `mini-program/`：为未来微信小程序版本预留目录。

## 操作步骤

### 1. 创建项目目录

```bash
mkdir xuedeshi-history-learning
cd xuedeshi-history-learning
```

### 2. 初始化 Git 仓库

```bash
git init
```

### 3. 放入当前原型文件

将用户提供的 `index.html` 放到项目根目录。

如果当前目录外已有该文件，请复制进来：

```bash
cp /path/to/index.html ./index.html
```

请根据本地实际路径调整 `/path/to/index.html`。

### 4. 创建目录结构

```bash
mkdir -p docs assets/images assets/icons assets/audio src/css src/js src/data mini-program
```

### 5. 创建 `.gitignore`

`.gitignore` 内容如下：

```gitignore
# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Dependencies
node_modules/

# Build outputs
dist/
build/
coverage/

# Environment
.env
.env.local

# Temporary files
*.tmp
*.swp
```

### 6. 创建 README.md

`README.md` 内容如下：

````markdown
# 学的是史

一个面向中国历史学习的互动型学习网站原型。

## 项目简介

“学的是史”是一个中国历史学习网站，当前阶段以移动端网页原型为主，后续可能扩展为微信小程序。

项目目标是用更轻量、更有趣、更结构化的方式帮助用户学习中国历史，包括：

- 名词解释
- 历史时间轴
- 科学备考
- AI 播客
- 人物专题
- 影视书目
- 历史热点内容
- 学习签到与收藏

## 当前状态

当前版本为单文件 HTML 原型，入口文件为：

```text
index.html
````

可直接用浏览器打开查看。

## 本地运行

直接打开：

```text
index.html
```

或者使用简单静态服务器运行：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 目录说明

```text
.
├── index.html          # 当前静态原型
├── docs/               # 产品与开发文档
├── assets/             # 图片、图标、音频等资源
├── src/                # 后续拆分 CSS、JS、数据文件
└── mini-program/       # 微信小程序预留目录
```

## 后续开发方向

1. 将 `index.html` 中的 CSS 拆分到 `src/css/`。
2. 将页面交互 JS 拆分到 `src/js/`。
3. 将历史数据抽离到 `src/data/`。
4. 增加真实内容数据源。
5. 增加移动端适配和 PWA 支持。
6. 评估是否迁移到 Vue / React / Taro / uni-app。
7. 为微信小程序版本建立独立实现方案。

````

### 7. 创建 docs/product-vision.md

内容如下：

```markdown
# 产品愿景：学的是史

## 一句话定位

一个面向学生和历史爱好者的中国历史轻学习平台。

## 核心用户

- 中学生
- 大学生
- 考研 / 考公 / 教资备考人群
- 中国历史兴趣用户
- 需要碎片化学习历史知识的用户

## 核心功能模块

### 1. 首页

展示历史热点、趣味内容、入口导航。

### 2. 名词解释

围绕考试和通识学习中的高频历史概念，提供简明解释、视频解读、地图关联和相关名词。

### 3. 时间轴

按照朝代展示重大历史事件，帮助用户建立时间顺序和因果关系。

### 4. 科学备考

面向考试场景，提供知识点整理、记忆方法、错题回顾、专题复习等功能。

### 5. AI 播客

将历史知识转化为音频讲解，适合通勤、睡前、碎片时间学习。

### 6. 人物专题

围绕重要历史人物，展示人物关系、关键事件、历史评价。

### 7. 影视书目

推荐与历史学习相关的书籍、影视作品，并提供学习化导读。

### 8. 我的

包含签到、收藏、笔记、学习记录、反馈等个人功能。

## 后续扩展方向

- 微信小程序
- PWA
- 内容管理后台
- AI 问答助手
- 历史地图交互
- 用户笔记系统
- 学习路径推荐
````

### 8. 创建 docs/dev-notes.md

内容如下：

````markdown
# 开发说明

## 当前技术状态

当前项目是一个单文件 HTML 原型，包含：

- HTML 结构
- CSS 样式
- JavaScript 交互
- 移动端页面布局
- 多页面模拟切换
- 弹窗、收藏、签到、时间轴等原型功能

## 初始开发原则

1. 先保留当前原型，不急于重构。
2. 第一次提交只做仓库初始化，不破坏现有页面。
3. 后续重构时再逐步拆分 CSS、JS、数据。
4. 每次重构都需要保证页面仍然可打开、可交互。
5. 后续若考虑微信小程序，应尽量把数据层和展示层分离。

## 推荐后续重构步骤

### 阶段一：静态资源整理

- 将内联 CSS 抽离到 `src/css/main.css`
- 将内联 JS 抽离到 `src/js/main.js`
- 将图片、图标、音频放入 `assets/`

### 阶段二：数据结构化

将以下内容抽离为 JSON：

- 朝代数据
- 历史事件
- 名词解释
- 人物资料
- 影视书目
- 播客列表
- 热点文章

建议放入：

```text
src/data/
````

### 阶段三：工程化

根据项目发展选择：

* 保持原生 HTML/CSS/JS
* 使用 Vite
* 使用 Vue
* 使用 React
* 使用 Taro / uni-app 以兼容微信小程序

### 阶段四：微信小程序版本

在 `mini-program/` 中单独建立小程序项目，或者使用跨端框架迁移。

````

### 9. 创建 mini-program/README.md

内容如下：

```markdown
# 微信小程序预留目录

该目录用于未来开发“学的是史”微信小程序版本。

当前阶段暂不实现小程序，只保留目录结构。

后续可选方案：

1. 原生微信小程序
2. uni-app
3. Taro
4. 先 Web，后小程序迁移

迁移时需要重点关注：

- 页面结构拆分
- 数据结构复用
- 用户登录体系
- 收藏与签到同步
- 音频播放能力
- 微信分享能力
````

### 10. 检查文件

执行：

```bash
ls -la
find . -maxdepth 3 -type f
```

确认至少包含：

```text
index.html
README.md
.gitignore
docs/product-vision.md
docs/dev-notes.md
mini-program/README.md
```

### 11. Git 首次提交

```bash
git add .
git commit -m "chore: initialize history learning website prototype"
```

### 12. 输出结果

完成后，请向我汇报：

1. 仓库路径。
2. Git 初始化是否成功。
3. 首次 commit hash。
4. 当前目录结构。
5. 如何在本地打开页面。
6. 是否发现 `index.html` 中有明显问题，但不要在第一次初始化中主动修改原型代码。

## 注意事项

* 不要删除或重写现有 `index.html`。
* 不要擅自引入框架。
* 不要自动安装 npm 包。
* 不要做大规模重构。
* 当前任务只做“项目建仓 + 文档初始化 + Git 首次提交”。
* 保证用户现有原型能够原样运行。
