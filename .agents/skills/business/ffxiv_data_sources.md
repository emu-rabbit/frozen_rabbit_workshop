# FFXIV 資料來源與字典規範

## 適用範圍與唯一詳細文件

修改 Teamcraft 產包、搜尋、配方、來源、快取與載入失敗時，先讀 `docs/game-data.md`。該文件是三包 schema、兩階段載入、更新啟用、容量、上一版保留及手動發布流程的 canonical owner；不要在此複製另一份流程。

## 實作路由

- 產包：`scripts/generate-game-data.mjs`、`scripts/game-data/{source,project,package}.mjs`。全部來源固定同一 Teamcraft SHA。
- runtime：`src/services/gameData.ts` 唯一下載本站 catalog／recipes／sources；`gameDataCache.ts` 管理壓縮資料 IndexedDB。
- 查詢：`dictionary.ts` 統一名稱／搜尋，`gathering.ts`、`vendor.ts`、`monsterDrops.ts` 解讀共用 sources。元件不得另抓 Teamcraft raw JSON，也沒有上游 fallback。
- `App.vue` 第一階段 catalog，畫面可用後第二階段 recipes 與全部 sources 平行載入。備料台等待第二階段完整。
- Universalis 仍提供即時市場；XIVAPI 仍提供圖示。本站筆記與 changelog 不屬於遊戲資料快取。

## 不變條件

- canonical ID 優先 `data.itemId`；有效配方產物與材料均保留，水晶不裁掉，結果 ID 0 排除。
- 負 ID 的無人島建築／地標可備料，只算所選階段；無人島材料不走市場與 HQ。屯貨倉庫素材歸其他，不能杜撰可製作／可採集／可狩獵。
- 同語言合併專用語系 → 全域名稱 → 搜尋名稱；顯示 fallback 只有目前語言 → 英文 → 本地化未知物品。未知舊筆記 ID 與數量保留。
- 切語言重新推導顯示名稱，不下載另一套資料。配方與來源選擇順序不得在產包重構時順便更改。
- 普通採集以節點反向索引補足 gathering-items 缺口；怪物獨立模型，細節另讀 `monster_drop_sources.md`。
- 快取失敗可回到本站網路；資料失敗須顯示重試，不以 mock／空陣列假裝成功。僅完整三包可進 active／pending，不在使用中混版。

## 驗證

`npm run data:verify`、`npm run test:unit`、`npm run build`、相關 E2E。mock 透過正式 generator 投影 fixtures，並保留真實簽入包的靜態伺服器 E2E。改 schema 時同步 generator、types、runtime 驗證與測試。
