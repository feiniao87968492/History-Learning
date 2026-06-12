# 名词收藏与标记已学设计

## 1. 背景

Phase 2 Task 2.1 已将名词解释页改为从 `src/data/nouns.json` 渲染卡片与详情。当前 `src/js/noun.js` 中的收藏按钮只在当前 DOM 上切换星标，不会持久化；详情页也没有“标记已学”动作。

Phase 2 Task 2.2 需要补齐名词学习闭环的第一段：用户可以收藏名词、取消收藏、在详情页标记已学，并在刷新或重新渲染后恢复状态。

## 2. 目标

本任务实现以下能力：

1. 名词卡片收藏按钮可切换收藏状态。
2. 收藏状态通过 `window.storageAPI` 持久化到 `xds_favorites`。
3. 重新渲染名词卡片时恢复已收藏星标状态。
4. 名词详情页提供“标记已学”按钮。
5. 标记已学后通过 `window.storageAPI` 持久化到 `xds_learned`，记录学习时间。
6. 再次打开已学名词详情时，按钮显示为已学状态。
7. 缺少 `storageAPI` 时功能安全降级：不抛错，读取为空状态，写入返回失败并通过 toast/状态保持当前交互可用。

## 3. 非目标

本任务不实现以下内容：

- 不新增复习专区。
- 不新增学习统计模块。
- 不接入题库、错题或打卡事件。
- 不把名词收藏显示到独立收藏页。
- 不批量扩充名词数据。
- 不改动技术栈，不引入框架、构建工具或 TypeScript。

## 4. 存储设计

### 4.1 收藏存储

使用 LocalStorage key：`xds_favorites`。

通过 adapter 访问：

```js
window.storageAPI.getStoredJSON('xds_favorites', [])
window.storageAPI.setStoredJSON('xds_favorites', list)
```

数据结构为名词名称数组：

```json
["郡县制", "科举制"]
```

选择数组是因为本任务只需要判断名词是否被收藏与切换状态，不需要收藏时间、类型或排序信息。后续若要统一收藏中心，可在单独任务中迁移为对象列表。

### 4.2 已学存储

使用 LocalStorage key：`xds_learned`。

通过 adapter 访问：

```js
window.storageAPI.getStoredJSON('xds_learned', {})
window.storageAPI.setStoredJSON('xds_learned', learnedMap)
```

数据结构为名词名称到记录的映射：

```json
{
  "郡县制": {
    "name": "郡县制",
    "learnedAt": "2026-06-11T12:00:00.000Z"
  }
}
```

使用对象映射是为了快速判断某个名词是否已学，并为后续复习区按时间排序保留 `learnedAt`。

## 5. 模块设计

继续在 `src/js/noun.js` 内实现，不新增模块。

新增内部常量：

```js
var FAV_KEY = 'xds_favorites';
var LEARNED_KEY = 'xds_learned';
```

新增内部读写函数：

- `readFavorites()`：从 `storageAPI` 读取收藏数组，缺失或异常时返回 `[]`。
- `writeFavorites(list)`：写入收藏数组，缺失 adapter 时返回 `false`。
- `readLearned()`：从 `storageAPI` 读取已学映射，缺失或异常时返回 `{}`。
- `writeLearned(map)`：写入已学映射，缺失 adapter 时返回 `false`。
- `isNounFavorite(name)`：判断名词是否收藏。
- `isNounLearned(name)`：判断名词是否已学。

新增或调整对外 API：

```js
window.nounAPI = {
  ...existing,
  getFavoriteNouns: getFavoriteNouns,
  toggleNounFavorite: toggleNounFavorite,
  getLearnedNouns: getLearnedNouns,
  markNounLearned: markNounLearned,
  isNounFavorite: isNounFavorite,
  isNounLearned: isNounLearned
};
```

保留现有内联 HTML 调用的 `togNounFav(btn, name)`，但将其改为调用新的 `toggleNounFavorite(name)`，然后刷新按钮状态。

## 6. UI 行为

### 6.1 收藏按钮

`renderNounCards()` 渲染每张 `.ncard` 时根据 `isNounFavorite(name)` 设置按钮状态：

- 未收藏：按钮文本 `☆`，无 `faved` class。
- 已收藏：按钮文本 `★`，有 `faved` class。

点击收藏按钮时：

1. 阻止卡片点击冒泡。
2. 切换该名词在 `xds_favorites` 中的存在状态。
3. 更新当前按钮文本和 class。
4. 显示 toast：
   - 收藏成功：`已收藏「名词」`
   - 取消收藏：`已取消收藏「名词」`

### 6.2 标记已学按钮

详情页打开时，`openNounDet(name)` 在 `#nd-meta` 附近渲染一个学习动作按钮。为避免改动 `index.html` 结构，本任务可在 `noun.js` 中动态创建或复用 `#nd-actions` 容器。

按钮状态：

- 未学：`标记已学`
- 已学：`已学`

点击“标记已学”时：

1. 写入 `xds_learned[name] = { name, learnedAt }`。
2. `learnedAt` 使用 `new Date().toISOString()`。
3. 更新按钮为已学状态。
4. 显示 toast：`已标记「名词」为已学`

若已学，再次点击不重复写入新的时间，保持幂等。

## 7. 错误处理与降级

- `storageAPI` 缺失时：读取返回空状态，写入返回 `false`，不抛异常。
- `storageAPI` 返回非数组收藏数据时：按空数组处理。
- `storageAPI` 返回非对象已学数据时：按空对象处理。
- `navigationAPI.showToast` 缺失时：静默跳过 toast，不影响状态函数执行。

## 8. 测试设计

新增 `tests/noun-actions.test.js`。

测试覆盖：

1. 点击收藏按钮写入 `xds_favorites`。
2. 再次点击同一名词取消收藏。
3. `renderNounCards()` 根据已有 `xds_favorites` 恢复星标。
4. 打开详情页后显示“标记已学”按钮。
5. 点击标记已学写入 `xds_learned`，记录 `name` 和 `learnedAt`。
6. 已学名词再次打开详情时显示“已学”。
7. `storageAPI` 缺失时，收藏与已学 API 不抛错。

继续运行既有测试：

```powershell
npx vitest run tests/noun.test.js tests/noun-actions.test.js --environment jsdom
```

必要时运行全量：

```powershell
npx vitest run --environment jsdom
```

## 9. 验收标准

Task 2.2 完成时应满足：

1. 名词收藏可持久化到 `xds_favorites`。
2. 名词已学可持久化到 `xds_learned`。
3. 刷新/重新渲染后 UI 能恢复收藏与已学状态。
4. 所有存储访问都经过 `storageAPI`。
5. 新增测试与既有名词测试通过。
6. `CHANGELOG.md` 记录本任务实现与验证结果。
