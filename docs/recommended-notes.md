# 可直接備料的推薦筆記

推薦筆記提供職業含武器／工具套裝，同時保留原有共用裝備與單獨工具筆記。玩家可直接收藏或開啟備料台，不需要複製 JSON 才能補齊武器。

套裝名稱只列等級、品級、職業與件數，不加「含武器／主副手」括號註記。無論是否輸入搜尋條件，皆以職業套裝及包含工具的全職業套裝優先，原有共用裝備筆記排在後面；各組內保留原品級順序。優先順序與完整列表在建立索引時準備好，不逐次搜尋排序或讀取物品清單。

## 資料維護與來源

- `src/data/recommended/*.json`：原有人工整理筆記，保留 ID、物品與日期。依使用者要求統一名稱格式：中文件數用國字，等級／品級用 `Lv.100 iLv690`，英文與日文件數沿用阿拉伯數字；舊收藏的獨立副本不受影響。
- `scripts/generate-recommended.mjs`：從本站已簽入的 catalog 核對可製作物品、裝備等級、品級、職業與主副手部位；不下載另一版遊戲資料。武器缺漏的職業／品級不產生筆記；同一部位有多個候選則停止，需明確選定。
- `src/data/recommended/generated/compositions.json`：可重現的組合定義，記錄 Teamcraft SHA、官方職業名稱、共用筆記 ID、各職業額外物品 ID 與混裝品級；不可手動維護展開後的數百份筆記。
- `src/data/recommended/compose.ts`：組合為既有 `Note` 介面。ID 使用共用筆記 ID＋職業代碼，跨重新產生保持穩定。收藏／匯出序列化後是完整獨立筆記，不依賴組合定義，也不修改備份格式。
- `src/utils/noteSearch.ts`：四語名稱及職業縮寫的搜尋索引，只建立一次，支援空白分詞與全形輸入。

更新遊戲資料或共用筆記後執行 `npm run notes:generate`，檢視差異，再執行 `npm run test:unit`、`npm run build` 及相關 E2E。正式 build 會先做離線 `notes:verify`，防止資料改了卻忘記重新產生。

## 組合規則

- 戰鬥：共用防具五件、飾品五件（戒指數量二）＋一把武器；騎士另加盾牌，為十二件，其餘十一件。
- 巧匠：各職業主副手＋共用十件，為十二件；八職共用一份裝備＋十六件主副手，為二十六件。
- 大地：採掘師／園藝師各兩件工具，漁師一根釣竿；個別十二／十一件，全職共用十件＋五件可製作工具，為十五件。漁師任務副道具不在同級可製作工具範圍。
- i720 本身只有五件防具，純 i720 職業套裝為七件（漁師六件）；既有 i720＋i690 合裝另保留 i690 飾品，延伸為十二／十一件及巧匠二十六／大地十五件。
- 舊版 i190 防具搭配 i195 工具；i340 防具搭配 i345 主手／i325 副手。名稱明列實際品級，漁師不列未使用的副手品級。
- i110 武器有同品級發光蠻神武器等其他候選；生成器使用明確核對的原製作武器名單，不以 ID 大小隨機挑選。

檢查既有筆記時發現兩個錯置：i255 詠咒上衣 `19613` 是製作職裝備，對應上衣應為 `18086`；i770 強襲耳飾 `46068` 是 i740，對應 i770 耳飾為 `49307`。生成器只在新組合內替換；依本次保留要求與既有人工筆記保護規範，原始 JSON 與舊收藏維持原樣。

## 職業名稱

生成器沿用 `src/i18n/locales/{tw,cn,en,ja}.ts` 的 `newNote.filter.jobs`，不自行翻譯職業。2026-09-09 已比對下列官方資料：

- 繁中：[戰鬥職業指南](https://www.ffxiv.com.tw/web/intro/guide/battle/)、[能工巧匠與大地使者指南](https://www.ffxiv.com.tw/web/intro/guide/crafting_gathering/)。例如木工師、鍛造師、甲冑師、金工師、皮革師、毒蛇劍士、繪靈法師。
- 簡中：[官方職業資料](https://ff.web.sdo.com/date/na/game/index.html)、[特職冒險錄](https://actff1.web.sdo.com/project/20190918adventure/index.html)、[7.0 新特職](https://actff1.web.sdo.com/project/20240927dawntrail/patch70/job.html)。例如刻木匠、锻铁匠、铸甲匠、雕金匠、制革匠、钐镰客、蝰蛇剑士。
- 英文：[Job Guide](https://na.finalfantasyxiv.com/jobguide/battle/)、[Crafting and Gathering Guide](https://na.finalfantasyxiv.com/crafting_gathering_guide/)。
- 日文：[ジョブガイド](https://jp.finalfantasyxiv.com/jobguide/battle/)、[クラフター・ギャザラーガイド](https://jp.finalfantasyxiv.com/crafting_gathering_guide/)。

## 效能與驗證

原有 113 筆，加上 341 筆職業／全職業組合，共 454 筆。新增資料只記錄差異，名稱依模板生成；搜尋和計數不展開物品。卡片第一次渲染、收藏或開啟時才產生該筆物品陣列，且各筆陣列彼此獨立。維持每頁二十筆，不一次渲染全部卡片。搜尋改字立即回第一頁，避免上一頁位置造成空白結果。

本次組合 JSON 為 36,843 bytes，gzip 6,547 bytes；341 筆完整展開 JSON 為 195,507 bytes，gzip 16,672 bytes。這是新增資料模型的比較，並非整站下載量。Windows Node.js 本機量測：454 筆名稱／索引建立約 1.7 ms，10,000 次搜尋的 p95 約 0.013 ms，搜尋觸發物品 getter 次數為零；不能視為所有裝置的速度保證。

此規模以小型隨程式發布的靜態組合索引即可，不新增逐筆網路下載、IndexedDB 或大量分包。遊戲物品名稱／配方沿用本站既有三包快取。未來需依量測調整，不能只以筆記筆數推斷應新增資料庫。

`tests/data/recommendedCompositions.test.ts` 逐套檢查實際 catalog 的職業、部位、件數、品級、獨立序列化與搜尋，並核對生成結果與大小；`tests/e2e/recommended.test.ts` 使用真實本站資料包驗證分頁搜尋、收藏重載、直接備料與四語／窄螢幕布局。
