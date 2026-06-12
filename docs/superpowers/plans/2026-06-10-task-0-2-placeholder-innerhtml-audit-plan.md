# Task 0.2 Placeholder And innerHTML Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit placeholder `showToast` copy and all `innerHTML` usage in the current runtime code, then append the results to `docs/current-state.md` as fact-only audit sections.

**Architecture:** The implementation stays documentation-first and search-driven. It does not modify product behavior. Work proceeds by scanning runtime files, classifying each matching call site using the spec rules, then appending three new sections to `docs/current-state.md`: placeholder audit, `innerHTML` audit, and a short summary.

**Tech Stack:** Markdown, HTML, ES5 JavaScript, ripgrep, Git

---

## File Map

- Modify: `docs/current-state.md`
- Read: `index.html`
- Read: `src/js/app.js`
- Read: `src/js/storage.js`
- Read: `src/js/navigation.js`
- Read: `src/js/noun.js`
- Read: `src/js/timeline.js`
- Read: `src/js/podcast.js`
- Read: `src/js/ai-assistant.js`
- Read: `src/js/favorites.js`
- Read: `src/js/checkin.js`
- Read: `src/js/film.js`
- Read: `TASKS/2026-06-10-history-learning-phase1-plan-v2.md`
- Read: `docs/superpowers/specs/2026-06-10-task-0-2-placeholder-innerhtml-audit-design.md`

---

### Task 1: Collect Placeholder `showToast` Audit Entries

**Files:**
- Modify: `docs/current-state.md`
- Read: `index.html`
- Read: `src/js/**/*.js`

- [ ] **Step 1: Verify the Task 0.2 requirements before editing the document**

Run:

```bash
rg -n "Task 0.2|showToast|innerHTML" TASKS/2026-06-10-history-learning-phase1-plan-v2.md
```

Expected:

```text
Matches for Task 0.2 requirements in the Phase 1 plan.
```

- [ ] **Step 2: Search runtime files for placeholder `showToast` call sites**

Run:

```bash
rg -n "showToast\\([^\\n]*(开发中|加载中|即将上线|功能)" index.html src/js
```

Expected:

```text
Matches for placeholder-style toast calls in runtime files only.
```

- [ ] **Step 3: Group the matches and classify each call site**

Use this classification table while reviewing each match:

```md
- `占位入口`：点击入口后只弹出“开发中 / 加载中 / 即将上线”等提示。
- `状态提示`：处于真实功能流程中，但仍使用临时占位式提示。
- `说明性提示`：具备占位语义，但不是主入口点击提示。
```

Review each match and record only runtime entries that genuinely have placeholder semantics. Do not include:

```md
- 测试用例中的 mock 文案
- 计划文档中的示例文字
- 正常的成功/失败提示
- 非 `showToast` 路径上的普通文本
```

- [ ] **Step 4: Append the placeholder audit section to `docs/current-state.md`**

Add this section after the existing `## 8. 当前状态备注` section, replacing the sample entries with the real matches found:

```md
## 9. 占位文案审计结果

- `index.html`：`showToast('手机号登录功能开发中')`，用于登录页手机号登录按钮，分类为“占位入口”。
- `index.html`：`showToast('搜索功能开发中')`，用于首页搜索入口，分类为“占位入口”。
- `index.html`：`showToast('挖空练习功能开发中')`，用于科学备考页挖空练习入口，分类为“占位入口”。
- `index.html`：`showToast('笔记上传功能开发中')`，用于科学备考页笔记上传入口，分类为“占位入口”。
- `index.html`：`showToast('联机PK功能开发中')`，用于科学备考页联机 PK 入口，分类为“占位入口”。
- `index.html`：`showToast('复习专区加载中')`，用于科学备考页复习专区入口，分类为“占位入口”。
- `index.html`：`showToast('自定义导图编辑器开发中')`，用于思维导图页新建空白导图按钮，分类为“占位入口”。
- `index.html`：`showToast('搜索功能开发中')`，用于讨论区搜索入口，分类为“占位入口”。
- `index.html`：`showToast('学习记录开发中')`，用于个人页学习记录入口，分类为“占位入口”。
- `index.html`：`showToast('收藏/错题本开发中')`，用于个人页收藏/错题本入口，分类为“占位入口”。
- `index.html`：`showToast('积分兑换开发中')`，用于个人页积分兑换入口，分类为“占位入口”。
- `index.html`：`showToast('设置页面开发中')`，用于个人页设置与账号入口，分类为“占位入口”。
```

- [ ] **Step 5: Verify the placeholder section now exists and is runtime-only**

Run:

```bash
rg -n "## 9\\. 占位文案审计结果|占位入口|状态提示|说明性提示" docs/current-state.md
```

Expected:

```text
Matches for the new placeholder audit section and its classified entries.
```

- [ ] **Step 6: Commit the placeholder audit section**

Run:

```bash
git add docs/current-state.md
git commit -m "docs: record placeholder toast audit"
```

Expected:

```text
[main ...] docs: record placeholder toast audit
```

---

### Task 2: Collect And Classify All `innerHTML` Usage

**Files:**
- Modify: `docs/current-state.md`
- Read: `index.html`
- Read: `src/js/**/*.js`

- [ ] **Step 1: Search runtime files for every `innerHTML` usage**

Run:

```bash
rg -n "innerHTML" index.html src/js
```

Expected:

```text
Matches for all runtime `innerHTML` writes in index.html and src/js.
```

- [ ] **Step 2: Classify each `innerHTML` usage using the fixed source rules**

Use these source categories exactly as written:

```md
- `用户输入`
- `外部 JSON / 外部数据`
- `存储数据`
- `内部常量 / 模板`
```

Use this priority if a call site mixes sources:

```md
1. `用户输入`
2. `外部 JSON / 外部数据`
3. `存储数据`
4. `内部常量 / 模板`
```

Apply the category by reading the real code around each match. For example:

```md
- `src/js/noun.js` 中拼接相关名词按钮，若来源是 `nounData`，归为 `外部 JSON / 外部数据`
- `src/js/favorites.js` 中渲染收藏列表，若来源是 `storageAPI` 读取结果，归为 `存储数据`
- `index.html` 中固定空状态模板，若完全由常量字符串组成，归为 `内部常量 / 模板`
```

- [ ] **Step 3: Append the `innerHTML` audit section to `docs/current-state.md`**

Add a section in this shape, replacing the sample descriptions with the real usages found:

```md
## 10. innerHTML 审计结果

- `src/js/noun.js`：用于渲染相关名词按钮，来源分类为“外部 JSON / 外部数据”。
- `src/js/favorites.js`：用于渲染收藏列表和空状态，来源分类为“存储数据”。
- `src/js/film.js`：用于渲染影视卡片、榜单和待看栏，来源分类为“外部 JSON / 外部数据”。
- `src/js/checkin.js`：用于渲染打卡日历，来源分类为“内部常量 / 模板”。
- `index.html`：用于渲染影视榜单，来源分类为“内部常量 / 模板”。
- `index.html`：用于渲染待看栏空状态，来源分类为“内部常量 / 模板”。
- `index.html`：用于渲染人物详情信息块，来源分类为“内部常量 / 模板”。
```

If a call site writes multiple times in the same function but the source classification is identical, keep one entry per write site, not one entry per function name.

- [ ] **Step 4: Add the short audit summary section**

Append a section in this shape, replacing the counts with the real totals after classification:

```md
## 11. 审计摘要

- 占位文案 `showToast` 调用点：12 处。
- `innerHTML` 使用点：7 处。
- `innerHTML` 来源分类统计：`用户输入` 0 处，`外部 JSON / 外部数据` 2 处，`存储数据` 1 处，`内部常量 / 模板` 4 处。
```

- [ ] **Step 5: Verify the `innerHTML` audit and summary sections exist**

Run:

```bash
rg -n "## 10\\. innerHTML 审计结果|## 11\\. 审计摘要|外部 JSON / 外部数据|存储数据|内部常量 / 模板" docs/current-state.md
```

Expected:

```text
Matches for the new `innerHTML` audit section, summary section, and the fixed category names.
```

- [ ] **Step 6: Commit the `innerHTML` audit and summary**

Run:

```bash
git add docs/current-state.md
git commit -m "docs: record innerhtml audit summary"
```

Expected:

```text
[main ...] docs: record innerhtml audit summary
```

---

### Task 3: Final Audit Validation And Task 0.2 Completion

**Files:**
- Modify: `docs/current-state.md`
- Read: `docs/current-state.md`

- [ ] **Step 1: Run a final requirements check against Task 0.2 acceptance**

Run:

```bash
rg -n "## 9\\. 占位文案审计结果|## 10\\. innerHTML 审计结果|## 11\\. 审计摘要" docs/current-state.md
```

Expected:

```text
All three Task 0.2 audit sections are present.
```

- [ ] **Step 2: Run a wording check to ensure the document still stops at audit**

Run:

```bash
rg -n "建议|应该|后续将|整改方案|替换为 textContent|隐藏入口|置灰" docs/current-state.md
```

Expected:

```text
No matches in the newly added Task 0.2 audit sections.
```

- [ ] **Step 3: Read the completed audit additions end-to-end**

Run:

```bash
type docs\current-state.md
```

Expected:

```text
The audit sections read as a searchable checklist, not as a repair plan.
```

- [ ] **Step 4: Create the final Task 0.2 commit**

Run:

```bash
git add docs/current-state.md
git commit -m "docs: record audit of placeholders and innerHTML usage"
```

Expected:

```text
[main ...] docs: record audit of placeholders and innerHTML usage
```

---

## Self-Review

- **Spec coverage:** The plan covers both required audit tracks from the spec: placeholder `showToast` calls and all `innerHTML` usages, plus the required summary and append-only update to `docs/current-state.md`.
- **Placeholder scan:** No `TODO`, `TBD`, or deferred instructions remain in the steps.
- **Type consistency:** Category names are fixed and consistent: `占位入口 / 状态提示 / 说明性提示` for placeholder calls, and `用户输入 / 外部 JSON / 外部数据 / 存储数据 / 内部常量 / 模板` for `innerHTML` sources.
