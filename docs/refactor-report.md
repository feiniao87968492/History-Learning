# 第二阶段重构报告

## 一、重构目标

将单文件 HTML 原型拆分为 HTML、CSS、JavaScript 和 JSON 数据文件，同时保持页面视觉和交互基本不变。

## 二、已完成事项

- [x] CSS 已拆分为 `src/css/base.css`、`src/css/components.css`、`src/css/pages.css`
- [x] JavaScript 已拆分为：
  - `src/js/storage.js` — 本地存储封装
  - `src/js/navigation.js` — 登录、页面切换、Toast
  - `src/js/favorites.js` — 收藏管理
  - `src/js/noun.js` — 名词解释
  - `src/js/timeline.js` — 时间轴
  - `src/js/podcast.js` — AI 播客播放器
  - `src/js/ai-assistant.js` — AI 助手问答与拖拽
  - `src/js/app.js` — 应用入口与模块编排
- [x] JSON 数据已抽离：
  - `src/data/nouns.json`
  - `src/data/timeline.json`
  - `src/data/podcasts.json`
  - `src/data/books.json`
  - `src/data/memes.json`
- [x] README 已更新
- [x] 本地静态服务器运行正常
- [x] Git 提交已完成（分阶段提交，共 6 次提交）

## 三、文件变更说明

### 新增文件

- `src/css/base.css`、`src/css/components.css`、`src/css/pages.css`
- `src/js/storage.js`、`src/js/navigation.js`、`src/js/favorites.js`
- `src/js/noun.js`、`src/js/timeline.js`
- `src/js/podcast.js`、`src/js/ai-assistant.js`
- `src/js/app.js`
- `src/data/nouns.json`、`src/data/timeline.json`、`src/data/podcasts.json`
- `src/data/books.json`、`src/data/memes.json`
- `docs/refactor-report.md`

### 修改文件

- `index.html` — 删除内联 `<style>` 和已迁移的内联 `<script>`，改为外链引用

## 四、兼容性说明

- **HTML 内联 onclick**：保留，已迁移函数的全局暴露通过 `src/js/app.js` 实现
- **LocalStorage key**：旧的 `checkins` key 和思维导图笔记 key 保持不变
- **JSON fallback**：`app.js` 的 `loadJSON()` 函数在加载失败时返回 `fallback`，不会导致整页崩溃
- **CSS 重复**：已合并一处明显的榜单/收藏夹重复样式块
- **DOM 标识**：保留现有页面 `id`、主要 `class`、内联事件结构

### 仍保留在内联脚本中的内容

以下内容因耦合度高、与 HTML 结构紧密关联，暂时保留在 `index.html` 内联脚本中：
- 页面切换辅助函数 (`swTab`, `swSubTab`)
- 梗图轮播数据与逻辑
- 热点筛选
- 影视书目与榜单
- 收藏夹面板
- 反馈弹窗
- 人物关系网数据与渲染
- 思维导图与笔记
- 朝代特征详情
- 讨论区
- 打卡签到

这些内容保持原型功能完全可用，可在后续阶段继续迁移。

## 五、未处理事项

- 后端接口
- 微信登录真实接入
- AI API 真实接入
- CMS 内容管理后台
- 微信小程序版本
- PWA
- 真实音频资源
- Vite 或其它构建工具

## 六、Git 提交历史

```text
4cf86d5 refactor: remove duplicated AI FAB drag and finalize interaction cleanup
cea4a2b refactor: split prototype media and ai assistant modules
99d9e59 refactor: split prototype timeline logic into module
687e6e5 refactor: extract noun and favorites modules
130c2ad refactor: extract base navigation and storage modules
34f6c1f refactor: split prototype styles into css modules
3c60fd3 chore: initialize repository and backup static prototype
```

## 七、测试结果

- 启动命令：`python -m http.server 8000`
- 访问地址：`http://localhost:8000`
- 已验证：登录、导航、名词解释、名词搜索、名词详情、名词收藏、时间轴、朝代切换、缩放、人物专题、AI 播客播放器、收藏夹、我的页面签到、AI 助手问答
- 静态验证：HTML 无 `<style>` 残留，脚本引用顺序正确，JSON 加载路径正确
- 控制台：无阻断性报错（基于静态语法检查）
