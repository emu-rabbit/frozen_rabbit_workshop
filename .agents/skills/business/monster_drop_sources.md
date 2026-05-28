# 怪物掉落資料來源與實作規範

## 概述

本文件記錄 Workshop 若要判斷材料是否可透過狩獵怪物取得時，應使用的 Teamcraft 資料來源、資料格式、已驗證範例與實作注意事項。

此功能應被視為「材料來源補充資訊」，用來協助玩家判斷是否能自行狩獵取得素材；不要把它描述成最佳路線、保證掉落或完整掉率模型。

## 觸發條件

- 新增或修改怪物掉落來源查詢。
- 在備料台、待辦清單、離線匯出或來源分配 UI 顯示怪物名稱、狩獵地圖、座標或等級。
- 新增 Teamcraft `drop-sources.json`、`monsters.json`、`mobs.json`、`tw-mobs.json` 或 `zh-mobs.json` loader。
- 討論某個材料是否能透過打怪取得，或要把「其他來源」拆出「狩獵」類別。

## Teamcraft 資料檔

目前 Workshop 已經會載入 `maps.json`、`places.json`、`tw/tw-places.json` 等地名資料，因此怪物掉落功能主要需要新增下列檔案：

| 檔案 | 用途 | 2026-05-28 staging 大小 |
| --- | --- | ---: |
| `drop-sources.json` | `itemId -> monsterId[]`，判斷物品是否有已知怪物掉落來源 | 12,523 B |
| `monsters.json` | `monsterId -> { baseid, positions[] }`，取得等級、地圖、座標與 FATE 標記 | 9,511,421 B |
| `mobs.json` | 怪物名稱，含 `en`、`ja`、`de`、`fr` | 2,131,100 B |
| `tw/tw-mobs.json` | 繁中怪物名稱 | 614,227 B |
| `zh/zh-mobs.json` | 簡中怪物名稱 | 649,315 B |

若完整支援 `tw`、`cn`、`en`、`ja` 怪物名稱，新增原始下載量約 `12,918,586 B`，約 `12.92 MB`。其中 `monsters.json` 是主要成本。

如果只先支援繁中並以 `mobs.json` 作為英文 / 日文 fallback，可先拉 `drop-sources.json`、`monsters.json`、`mobs.json`、`tw/tw-mobs.json`，約 `12,269,271 B`。

## 資料格式

### `drop-sources.json`

格式是物品 ID 到怪物 ID 陣列：

```json
{
  "36257": [10471]
}
```

查詢時以 canonical item ID 為 key。不要用 `item-search.index` 裡可能出現的非 canonical `id` 當應用層物品 ID；若 search index entry 有 `data.itemId`，應以 `data.itemId` 為準。

### `mobs.json` / locale mobs

`mobs.json` 是怪物名稱表：

```json
{
  "10471": {
    "en": "mousse",
    "ja": "ムース",
    "de": "Mousse",
    "fr": "mousse"
  }
}
```

`tw/tw-mobs.json` 與 `zh/zh-mobs.json` 是同 key 的語系補充：

```json
{
  "10471": {
    "tw": "慕斯怪"
  }
}
```

```json
{
  "10471": {
    "zh": "慕斯怪"
  }
}
```

建議名稱 fallback 順序：

- `tw`: `tw-mobs[id].tw -> mobs[id].en -> Monster #id`
- `cn`: `zh-mobs[id].zh -> mobs[id].en -> Monster #id`
- `en`: `mobs[id].en -> Monster #id`
- `ja`: `mobs[id].ja -> mobs[id].en -> Monster #id`

### `monsters.json`

`monsters.json` 是怪物出沒資料。key 與 `drop-sources.json` 回傳的 monster ID 對應：

```json
{
  "10471": {
    "baseid": 13376,
    "positions": [
      {
        "map": 698,
        "zoneid": 3711,
        "level": 84,
        "hp": 61040,
        "fate": 0,
        "x": 16.2,
        "y": 25.9,
        "z": 0.8
      }
    ]
  }
}
```

欄位重點：

- `map`: Teamcraft `maps.json` 的 map ID，可用來找 `placename_id`、`region_id`、地圖圖資與區域層級。
- `zoneid`: 通常可直接用 `places.json` / `tw-places.json` 取地名；實作時也應支援透過 `maps.json[map].placename_id` fallback。
- `level`: 怪物等級。
- `x` / `y` / `z`: 座標。
- `fate`: `0` 表示非 FATE；若非 0，UI 應避免把它當普通野外怪直接呈現。

## 已驗證範例：慕斯怪的肉

以「慕斯怪的肉」為例，Teamcraft staging 上查到：

1. `zh/zh-items.json["36257"].zh = "慕斯怪的肉"`。
2. `items.json["36257"].en = "Mousse Flesh"`。
3. `tw/tw-items.json["36257"]` 在本次查驗中沒有繁中值；若使用者輸入繁中名稱，不能只查 `tw-items.json`。
4. `drop-sources.json["36257"] = [10471]`。
5. `tw/tw-mobs.json["10471"].tw = "慕斯怪"`。
6. `mobs.json["10471"].en = "mousse"`。
7. `monsters.json["10471"].positions` 有 15 筆，皆為 `map=698`、`zoneid=3711`、`level=84`。
8. `maps.json["698"].placename_id = 3711`，`region_id = 3704`。
9. `tw/tw-places.json["3711"].tw = "嘆息海"`。
10. `tw/tw-places.json["3704"].tw = "星外天域"`。

座標範圍約為：

```txt
怪物：慕斯怪 / mousse
材料：慕斯怪的肉 / Mousse Flesh
地區：星外天域
地圖：嘆息海
等級：Lv.84
座標：約 X 13.3-18.4, Y 22.7-26.8
```

## 建議實作路徑

建議新增 `src/services/monsterDrops.ts`，不要把怪物掉落邏輯混入 `gathering.ts`。原因是採集節點與怪物掉落的資料模型不同，且怪物資料量較大，應獨立 cache 與延遲載入。

建議 API：

```ts
export interface MonsterDropInfo {
  monsterId: number;
  monsterName: string;
  level: number;
  regionName?: string;
  zoneName?: string;
  parentZoneName?: string;
  mapId?: number;
  zoneId?: number;
  positions: Array<{
    x: number;
    y: number;
    z?: number;
    fate?: number;
  }>;
}

export async function ensureMonsterDropDataLoaded(): Promise<void>;
export function getMonsterDropInfo(itemId: number): MonsterDropInfo[] | null;
```

建議流程：

1. 以 canonical `itemId` 查 `dropSources[itemId]`。
2. 若沒有 monster IDs，回傳 `null`，代表 Teamcraft 沒有已知怪物掉落來源。
3. 對每個 `monsterId` 查 `mobs` / locale mobs 取得名稱。
4. 查 `monsters[monsterId].positions`。
5. 依 `map` / `zoneid` 透過現有 `ensureMapsLoaded()`、`ensurePlacesLoaded()`、`getMapData()`、`getPlaceName()` 解析地名。
6. 對同一地圖與等級的多筆座標做 grouping，UI 可顯示代表座標或座標範圍；詳細列表可放在展開內容。

## 與現有 Workbench 的整合

目前 `useWorkbench.ts` 已在 `refreshItemsData()` 中查：

- `getGatheringInfo(id)`：採集來源。
- `getBestVendor(id)`：NPC 購買來源。
- recipe cache：製作來源。
- Universalis：市場價格。

怪物掉落可沿用同樣模式，在 `WorkbenchItem` 增加例如：

```ts
monsterDrops: MonsterDropInfo[] | null;
canHunt: boolean;
```

UI 層應先把它視為來源提示，而不是立即改變既有四欄分配。若要新增「狩獵」分配欄，需同步調整：

- `ItemDecision`
- `TodoItem`
- `generateTodoSections`
- `WorkbenchView.vue`
- `TodoListView.vue`
- `exportHtml.ts`
- 四語系 locale
- e2e mock 與相關 unit test

若只想先顯示資訊卡，可先在展開明細裡顯示「可由怪物掉落：怪物名稱 / 地圖 / 座標」，不改分配模型。

## 實作注意事項

- `drop-sources.json` 只代表 Teamcraft 有已知掉落來源，不提供掉率。UI 文案應使用「可由怪物掉落」或「已知掉落來源」，不要寫「保證掉落」。
- `monsters.json` 體積大，應延遲載入；不要在初始字典載入時一併 preload。
- 若只需要判斷是否可打怪取得，可先載入 `drop-sources.json`；只有使用者展開來源細節時再載入 `monsters.json` 與 mob 名稱表。
- 若同一物品有多個 monster ID，應全部保留，不要只取第一個。UI 可排序為非 FATE 優先、座標完整優先、地圖名稱優先。
- 若 `positions` 空或只有 FATE / instance 資訊，應明確呈現「Teamcraft 有掉落來源，但缺少野外座標」。
- 若新增 loader URL，必須同步更新 Playwright mock。搜尋測試時用：`rg "teamcraft|drop-sources|monsters|mobs|places|maps" tests src`。
- 使用者輸入物品名稱時，應注意 `tw/tw-items.json` 可能缺少部分繁中名稱。若要支援直接輸入「慕斯怪的肉」，需要查 `zh/zh-items.json` 或英文 fallback；但 Workbench 從 recipe ingredient 展開時通常已經有 canonical item ID，不需要靠名稱反查。

## 驗證建議

新增 monster drop service 後，至少加 unit test 覆蓋：

- item `36257` 可映射到 monster `10471`。
- `10471` 名稱在 `tw` / `cn` / `en` / `ja` fallback 正確。
- `map=698` / `zoneid=3711` 解析為 `嘆息海`。
- 多筆 positions 可以 group 成單一地圖來源並保留座標範圍。
- 缺資料時回傳 `null` 或空陣列，不讓 UI crash。

若接上 Workbench UI，至少跑 `npm run build`，並依影響範圍補 e2e mock。
