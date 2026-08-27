# 怪物掉落資料來源與實作規範

## 路由與資料生命週期

涉及怪物、狩獵素材、位置或掉落資訊時閱讀本文件。資料包生命週期的唯一詳細規範是 `docs/game-data.md`。

原始來源由 generator 固定同一 Teamcraft commit 後下載：

- `drop-sources.json`：item ID → monster ID 陣列，沒有掉率。
- `monsters.json`：monster ID → baseid 與 positions；含 map、zoneid、level、x/y/z、fate。
- `mobs.json`、`tw/tw-mobs.json`、`zh/zh-mobs.json`：怪物四語名稱。
- 地名／地圖來源共用 sources 中的 maps、places。

generator 只保留 catalog 物品引用的掉落與相關怪物／地名／地圖，包進 sources。所有來源在首屏第二階段一起預熱，不等進入備料台或展開明細才下載；不再有獨立 monster loader／cache。

## 查詢與呈現

`src/services/monsterDrops.ts` 的 `getMonsterDropInfo(itemId)` 查詢共用 sourceData。`useWorkbench.ts` 將其接入 canHunt、備料分配與待辦；`WorkbenchView.vue`、`TodoListView.vue`、`exportHtml.ts` 負責顯示。

- 怪物不是採集節點，不混入 gathering service。
- 同物品的多個 monster ID 全保留；既有排序維持非 FATE／有座標等優先，不在產包時挑掉其他來源。
- 地點由 zoneid 或 map 的 placename_id、region_id 解析。名稱只用目前語言 → 英文；未知地名／怪物不偽造。
- positions 保留等級、地圖、座標及 FATE 標記；缺野外位置時呈現未知，不當作已知普通野外怪。
- 文案使用「已知掉落來源」，不宣稱掉率、保證掉落或最佳狩獵路線。
- 無人島屯貨倉庫素材屬其他，不因缺少採集資料就當作狩獵素材。

## 驗證

`tests/unit/monsterDrops.test.ts` 驗證名稱 fallback、位置／FATE 與排序；generator tests 驗證裁剪；Workbench 與 E2E 驗證備料到待辦。測試 fixtures 使用正式投影路徑，不 mock 已刪除的 raw loader API。
