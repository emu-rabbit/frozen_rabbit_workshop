# FFXIV 資料來源與字典規範

## 概述
本技能定義 Workshop 如何使用 Teamcraft、Universalis、XIVAPI 與本地資料，避免物品 ID、語系、配方與採集資訊在不同功能中失準。

## 觸發條件
- 修改 `src/services/dictionary.ts`、`src/services/gathering.ts`、`src/services/vendor.ts`、`src/services/universalis.ts`。
- 修改 item search、filter dialog、recipe 展開、採集資訊、NPC 資訊或 icon 顯示。
- 更新 e2e mock、測試 fixture 或資料載入 URL。

## 資料來源
- **Teamcraft**：主要資料來源，包含 `item-search.index`、`items.json`、`recipes.json`、`gathering-items.json`、`nodes.json`、`maps.json`、`places.json`、`job-name.json` 等。若涉及怪物掉落，另讀 `.agents/skills/business/monster_drop_sources.md`。
- **Universalis**：市場看板資料來源，負責價格、listing、資料中心與世界資訊。
- **XIVAPI**：主要用於 icon URL 或 Teamcraft icon path 的 fallback。
- **本地 JSON**：`src/data/recommended/` 與 changelog 等站內內容。

## 核心規則
- **Canonical ID 優先**：Teamcraft `item-search.index` 是壓縮搜尋資料，不一定是 canonical ID 來源。若 entry 有 `data.itemId`，應以它作為 item ID。
- **語系 fallback 清楚**：物品名稱應依目前語系取值，並有 `en`、`tw`、`zh`、`ja` 或 `Item #id` fallback。
- **資料快取集中**：資料載入、cache、inflight promise 與 fallback 應集中在 service，不要在 component 私自 fetch 同一份資料。
- **語言切換要重建顯示資料**：切換 locale 後，字典、地名與顯示 metadata 需要重新整理或失效。
- **Mock parity**：新增或改動 loader URL 後，必須同步更新 Playwright / e2e mock，避免測試只在真網路下才會過。

## 採集資料規範
- `gathering-items.json` 不一定涵蓋所有 item -> node 映射；必要時應從 `nodes.json` 建立反向索引。
- 同一 item 可能有多個 node 或多種採集情境，應優先修正 schema / helper，不要只在 UI 遮掩。
- 採集地名應走 `places` / `maps` helper，以目前 locale 顯示。
- 釣魚資料若與採掘/園藝差異過大，不要假設可用同一路徑完整支援。

## 怪物掉落資料規範

- 怪物掉落來源不屬於採集節點，應獨立於 `gathering.ts` 建模。
- Teamcraft `drop-sources.json` 可用於 `itemId -> monsterId[]`，`monsters.json` 提供座標與等級，`mobs.json` / locale mobs 提供怪物名稱。
- `drop-sources.json` 不提供掉率；產品文案應使用「可由怪物掉落」或「已知掉落來源」，不要宣稱保證掉落。
- 詳細資料格式、檔案大小與已驗證範例見 `.agents/skills/business/monster_drop_sources.md`。

## 驗證方式
- 修改資料載入後，至少執行 `npm run build`。
- 若 e2e 涉及搜尋、備料台、推薦筆記或待辦清單，執行 `npm run test:e2e` 或相關 case。
- 若新增 Teamcraft URL，搜尋測試 mock 是否需要同步：`rg "teamcraft|item-search|recipes|nodes|gathering" tests src`。
