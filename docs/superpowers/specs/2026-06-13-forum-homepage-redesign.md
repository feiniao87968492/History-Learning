# 论坛首页重构 — 设计文档

日期：2026-06-13
状态：已确认

## 概述

将讨论区升级为社区首页和主要功能。热点文章、人物专题、影视书目内容全部并入帖子区，按主类型+标签分类。AI 播客、错题本、题目功能完全移除。登录页移除，直接进入首页。名词解释和时间轴收入新建工具页。

## 页面结构

| 页面 | 来源 | 说明 |
|------|------|------|
| **社区首页** | 原 `home-page` 改造 | 帖子流 + 类型/标签筛选，打开即见 |
| **工具页** | 新建 `tools-page` | 收纳名词解释 + 时间轴 |
| **我的** | 原 `profile-page` 精简 | 收藏、打卡、设置 |

### 底部导航

```
[首页]  [工具]  [我的]
forum   tools   profile
```

## 模块变更

### 扩展
- `discuss.js` → 重命名为 `forum.js`，扩展为论坛核心模块，增加文章/人物/书影/资源四种帖子类型 + 标签系统，对外暴露 `window.forumAPI`

### 保留搬入工具页
- `noun.js`、`timeline.js`

### 保留不动
- `app.js`（精简初始化）、`navigation.js`（适配新页面）、`checkin.js`、`favorites.js`、`ai-assistant.js`、全部 adapter（`storage.js`、`data-loader.js`、`external-link.js`、`navigation.js`）

### 移除
- 模块：`podcast.js`、`quiz.js`、`review.js`、`learning-stats.js`、`film.js`、`people.js`
- Adapter：`audio.js`
- 数据文件：`podcasts.json`、`questions.json`、`films.json`、`people.json`、`rankings.json`、`books.json`、`hot-articles.json`、`memes.json`（如未在论坛使用）

### 新建
- `tools.js`：工具页模块，包装名词解释和时间轴入口
- `forum.js`：论坛核心模块（由 `discuss.js` 重命名扩展而来）

## 帖子数据模型

```json
{
  "id": "p_001",
  "type": "discussion",
  "title": "为什么唐朝能成为当时世界最强盛的帝国？",
  "content": "<p>唐朝在太宗、玄宗时期...</p>",
  "author": {
    "id": "u_system",
    "name": "学史小助手",
    "avatar": null
  },
  "tags": ["唐", "政治", "军事"],
  "metadata": {
    "externalUrl": null,
    "personId": null,
    "mediaType": null
  },
  "stats": { "views": 128, "likes": 24, "comments": 7, "favorites": 3 },
  "createdAt": "2026-06-12T08:00:00Z",
  "updatedAt": "2026-06-12T08:00:00Z"
}
```

## 五种主类型

| 类型 | 标识 | 说明 | 卡片特征 |
|------|------|------|----------|
| **讨论** | `discussion` | 用户发帖、问答、观点交流 | 标题+正文+评论计数 |
| **文章** | `article` | 科普文章、史料解读（原热点文章） | 标题+摘要+封面图+外链 |
| **人物** | `person` | 历史人物卡片（原人物专题） | 姓名+朝代+身份+简介 |
| **书影** | `media` | 书籍/影视/纪录片推荐（原影视书目） | 标题+类型标签+评分+简介 |
| **资源** | `resource` | 学习工具、资料分享 | 标题+链接+简介 |

## 标签体系

### 朝代标签
先秦 / 秦 / 汉 / 三国 / 晋 / 南北朝 / 隋 / 唐 / 宋 / 元 / 明 / 清 / 近代 / 跨朝代

### 主题标签
政治 / 军事 / 经济 / 文化 / 科技 / 地理 / 社会 / 制度

每帖可挂多个标签（朝代 + 主题混用），最多 5 个。首页按标签筛选。

## 种子数据迁移

| 来源 | 现有量 | 转为种子帖 | 转换规则 |
|------|--------|-----------|----------|
| 讨论区 | 3 帖 | 保留 3 帖 | 类型标 `discussion` |
| 热点文章 | 10 篇 | 选 8 篇 | 类型标 `article`，正文存摘要+外链 |
| 人物数据 | 32 人 | 选 8 人 | 类型标 `person`，一帖一人 |
| 影视书目 | 45 条 | 选 10 条 | 类型标 `media`，一帖一条 |

种子帖总计约 29 条，覆盖五种类型和主要朝代。

## 数据流

### 初始化流程
```
页面加载
  → app.js 初始化
    → 加载 discussions.json（种子数据）
    → forumAPI.init() 合并 LocalStorage 中的本地帖子
    → 渲染帖子流到首页
    → 加载工具页、个人页（延迟/按需）
```

### 帖子流渲染
```
forumAPI.getPosts(filter)
  → 返回帖子数组（seed + local，按时间倒序）
  → 逐帖渲染卡片：
      type=discussion → 讨论卡片
      type=article    → 文章卡片
      type=person     → 人物卡片
      type=media      → 书影卡片
      type=resource   → 资源卡片
  → 插入 #forum-list 容器
  → 绑定评论/收藏/点赞事件
```

### 筛选流程
```
用户点击类型Tab（讨论/文章/人物/书影/资源/全部）
  → forumAPI.filterByType(type)
  → 可选叠加标签筛选（朝代/主题）
  → 重新渲染帖子流
```

### 发帖流程
```
用户点击发帖FAB
  → 打开发帖面板
  → 选择类型 + 填写标题/正文 + 添加标签
  → 验证必填字段
  → forumAPI.createPost(postData)
    → 生成 id + 时间戳
    → unshift 到帖子列表
    → 持久化到 LocalStorage
    → 重新渲染首页
```

### 评论流程（保持现有）
```
点击帖子卡片 → 展开评论区
  → 加载该帖评论列表
  → 可添加评论 → 计数+1 → 持久化 → 刷新评论列表
```

## 安全与校验

### 输入安全
- 所有标题/正文/评论输入经过 `htmlUtils.escapeHtml()` 再做 `innerHTML`
- JSON 种子数据内容渲染前统一转义
- `metadata.externalUrl` 打开前校验协议（仅允许 `http:` / `https:`），通过 `externalLinkAPI` 统一出口

### 发帖/评论校验

| 字段 | 规则 |
|------|------|
| 标题 | 必填，1-80 字 |
| 正文 | 必填，1-5000 字 |
| 类型 | 必选一种（默认「讨论」） |
| 标签 | 至少选 1 个，最多选 5 个 |
| 评论 | 必填，1-1000 字 |

### 错误处理
- `discussions.json` 加载失败 → 显示空状态「内容加载失败，请刷新页面」+ 重试按钮
- LocalStorage 异常 → 降级为仅种子数据，toast 提示
- 无帖子 →「还没有帖子，来发第一条吧」+ 发帖引导按钮
- 筛选无结果 →「该分类下暂无内容」

## 命名兼容

重构后 `forum.js` 对外暴露 `window.forumAPI`，旧 `window.discussAPI` 保留兼容别名（标记 `@deprecated`）。

## 测试计划

### 移除（功能下线）
`podcast.test.js`、`quiz.test.js`、`wrong-question.test.js`、`review.test.js`、`learning-stats.test.js`、`film.test.js`、`people.test.js`、`hot-articles.test.js`

### 保留并更新
- `discuss.test.js` → `forum.test.js`：覆盖五种类型、标签筛选、发帖/评论校验、空状态
- `app-static-data.test.js`：更新为论坛种子数据校验
- `adapter-wiring.test.js`：移除 audio adapter 引用
- `validate-data.test.js`：校验新的帖子结构
- `favorites.test.js`：收藏扩展到所有帖子类型
- `checkin.test.js`、`navigation.test.js`：适配新页面结构

### 新增
- `forum-post-types.test.js`：每种类型的卡片渲染、metadata 正确性
- `forum-tags.test.js`：标签添加/筛选/去重/限制
- `forum-xss.test.js`：输入转义、URL 协议校验
- `tools-page.test.js`：工具页渲染、入口可用性

### 目标
全部测试通过 `npx vitest run --environment jsdom` 一条命令通过。
