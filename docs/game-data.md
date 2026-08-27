# Workshop 遊戲資料

## 架構與資料範圍

Teamcraft 原始資料只由 `scripts/generate-game-data.mjs` 在維護者產包時下載。瀏覽器只讀本站 `game-data/`，不會回退到 Teamcraft staging。Universalis 市場行情及 XIVAPI 圖示仍為外部服務。

| 包 | 內容 | 載入時機 |
| --- | --- | --- |
| catalog | 可製作物品與所有配方材料的統一 ID、四語名稱、圖示、搜尋／裝備篩選欄位、職業／分類名稱及無人島分類 | 第一階段；完成即可搜尋與顯示筆記 |
| recipes | 保留原順序的配方 ID、結果、產量、職業、等級、星數、材料數量 | 首次可用畫面呈現後，與 sources 平行載入 |
| sources | 採集節點／時段、無人島採集座標、金幣商店／NPC、怪物掉落／座標／名稱，以及所引用地圖／四語地名 | 第二階段；包含怪物，不等進備料台才載入 |

`App.vue` 啟動兩階段載入；`services/gameData.ts` 唯一負責 manifest、下載、驗證、更新狀態；`gameDataCache.ts` 只負責 IndexedDB。`dictionary.ts`、`gathering.ts`、`vendor.ts`、`monsterDrops.ts` 從共用資料解讀顯示與來源，不各自下載原始檔。

資料格式為 `src/types/gameData.ts` 的 formatVersion 2。每個壓縮包為 `<name>.<sha256>.bin`，內文是 gzip；副檔名不用 `.gz`，避免靜態伺服器自動解壓後破壞位元組驗證。瀏覽器驗證 SHA-256、大小與格式後以 DecompressionStream 解壓。

### 投影規則

- 保留有效配方產物與材料的聯集，包含水晶；排除結果 ID 0 的配方／物品，略去數量 0 的材料。產量至少為 1。
- 搜尋索引 `data.itemId` 優先於 entry ID；維持原搜尋順序與配方選擇順序。素材不因收進 catalog 就自動變成可製作搜尋結果。
- 每個語言各自合併名稱：專用語系檔 → 全域物品檔 → 搜尋索引。顯示只回退目前語言 → 英文；都沒有則顯示本地化「未知的物品」。不跨用其他中文或日文譯名。
- 無人島負 ID 建築／地標可搜尋、加入筆記、拆材料、送入待辦。只算所選階段，不追溯前置建設或解鎖。
- 無人島物品不查市場、不分配購買、不使用 HQ，也不納入一般製作／採集時間及職業等級估算。一般物品原來源選擇方式不變。
- 建築材料有無人島採集座標者歸採集；屯貨倉庫素材 37578、37579、37580、37582、39894 歸其他，不杜撰配方或狩獵來源。
- 缺資料的舊筆記仍保留 ID 與數量，顯示未知物品；不刪使用者資料。

目前快照 `28cd7763e23781cd17650a7ae7a336688815360a`：catalog 14,153 筆，recipes 14,188 筆（含 25 個負 ID 產物），sources 648 個普通採集節點。三包合計約 0.96 MB 壓縮／10.61 MB JSON；精確位元組與其餘診斷以 manifest 為準。

## 本站名稱補丁

`data/game-data-patches/*.json` 是正式簽入的名稱補丁；`scripts/game-data/name-patches.mjs` 負責驗證、套用與離線核對。第一版 schemaVersion 1 只支援無人島建築／地標的繁中名稱，不修改配方、材料、來源或一般物品，也不把介面語言當作遊戲版本。

首批 `island-names-tw` 補齊 15 筆建築階段及 10 筆地標的繁中名稱。名稱依據為 `thewakingsands/ffxiv-datamining-tc` commit `e203c7e46dd80fd2a967e5741b30e3c9fad0c767`：由 `MJIBuilding.csv`／`MJILandmark.csv` 的 Name 欄位連到 `MJIText.csv`。JSON 保留原始 CSV 的 SHA-256、row、文字 ID、查證日期及 Teamcraft 基準 SHA；這是社群資料擷取來源，並非本次逐項遊戲內實測。`.cache/game-data/tc-name-audit` 只是查證暫存，產包與 CI 不依賴它或下載新的翻譯來源。

名稱補丁在 Teamcraft 投影、同語言名稱合併完成後、壓縮前套用，只修改指定語言。每筆核對 catalog 的負 ID、英文名稱及配方 ID／產物／開拓職業。`expected: null` 代表該語言確實缺漏；上游值等於 expected 才套用，等於 value 則列為 upstreamResolved，其他值或目標消失一律停止產包。重複補丁 ID 或同物品／語言的重複目標也會停止。原始快照及未指定語言維持不變。

補丁變更流程：

1. 依固定版本來源查證名稱，新增或修改 JSON 的 value、expected 與證據；不要自行把簡中轉繁中代替查證。
2. 使用現有 `--source-dir` 與 `--output` 命令預覽；檢查套用數量及 upstreamResolved 清單。上游已補齊的項目可刪除，整份無剩餘項目時刪除該補丁 JSON。衝突需重新查證，不能直接放寬 expected。
3. 重建正式產物，執行 data:verify、unit、build 與相關 E2E，連同 JSON 一起提交。Teamcraft 基準 SHA 是查證紀錄，不鎖死未來版本；每次上游更新仍以逐項前置條件核對。

manifest 的可選 `patches` 欄位記錄補丁集合 SHA-256 與 ID，參與資料版本雜湊；NOTICE 同時標示補丁來源。三包 formatVersion 仍為 2。新版程式可驗證未帶 patches 的舊 manifest／快取及上一版產物。更新前已開啟的舊版程式可能無法辨識新 manifest 的雜湊規則，需要重新整理頁面取得新版程式。

`data:verify` 除了檢查包完整性，也核對**目前產物**與工作區補丁集合及最終名稱；只改 JSON 而未產包會失敗。上一版只驗證自己的 manifest／檔案，不套用今天的補丁檢查。沒有補丁時，底層 generator 的投影內容與既有輸出一致。

## 裝置快取與更新

IndexedDB 預設啟用，不詢問占用空間；資料庫名含部署 BASE_URL，正式與 staging 分開。只存三包的壓縮 ArrayBuffer 與 manifest，不建逐物品資料庫索引。

- 第一次開啟下載 catalog，再平行下載 recipes／sources；只有三包都完整才寫入 active。
- 已有快取時先使用快取；每次開頁仍以 `cache: no-store` 查一次 manifest。版本相同不重抓資料包。
- 版本不同時背景下載並驗證完整三包，存 pending；正在使用的資料不切換。
- 完整更新下載後直接顯示共用確認 popup（與設定頁清除遊戲資料快取同款），標題為「檢測到新遊戲資料更新」，內容說明新資料已可使用並讓使用者選擇套用時間，提供「下次套用」與「現在套用並重新整理」。現在套用才 reload；延後、關閉、點遮罩或 Escape 均保留目前工作，本次開頁不再重複提醒，下一次開頁使用 pending。設定頁不另設更新提示按鈕，也不顯示更新橫幅。
- IndexedDB 保留 active 與最多一份 pending，壓縮內容目前約 1 MB，更新等待期間約 2 MB，另有 manifest／資料庫管理開銷。瀏覽器 HTTP cache 與解壓後記憶體另計。
- IndexedDB 被封鎖、額度不足或不可用時，仍能從本站載入資料；下次開啟可能重新下載。這是可被瀏覽器清除的快取，不是永久保存承諾。
- 快取可用但版本檢查失敗：繼續使用原資料並顯示重試；必要資料失敗：明確阻擋備料，不用空陣列或假資料假裝成功。
- 設定頁顯示版本與「清除遊戲資料快取並重新下載」，只清遊戲資料，不動筆記、收藏、設定。

執行環境需支援 Web Crypto、DecompressionStream、AbortSignal.timeout；IndexedDB 是可選的效能優化。這次不新增舊瀏覽器 polyfill 或離線網站 service worker。

## 手動更新與部署

使用 Node.js 24；產包不需要新增相依套件。

```powershell
# 固定本次 staging 的 SHA，再從同一 SHA 下載全部來源
npm run data:generate
# 或指定完整 SHA／分支／tag
npm run data:generate -- --ref staging
# 驗證已簽入產物；不下載上游
npm run data:verify
# 從本地完整快照重建
npm run data:generate -- --source-dir .cache/game-data/<commit>
# 獨立預覽，不替換本站產物
npm run data:generate -- --source-dir .cache/game-data/<commit> --output .cache/game-data/preview
npm run data:verify -- --output .cache/game-data/preview
```

來源固定 `ffxiv-teamcraft/ffxiv-teamcraft`。`--ref` 預設 staging；不再讀取 VITE_TEAMCRAFT_BRANCH。可用程序環境 GITHUB_TOKEN 提高 GitHub API 額度，只送 commit API，不寫入產物。所有來源與根目錄 LICENSE 皆固定同一 SHA；原始快照保存在被忽略的 `.cache/game-data/<commit>/`，`source.json` 記錄 checksum。快照異常會停止，不偷偷換來源。

產物 `public/game-data/` 全部納入 git，包含 manifest、三包、完整 Teamcraft MIT NOTICE，以及若有的上一版。產包不進 build；`npm run build` 的 prebuild 只做離線 data:verify。相同來源與生成器／壓縮器環境可重現相同版本；版本不含執行時間。NOTICE 同時標示投影修改與遊戲素材歸屬，並不宣稱取得遊戲素材所有權。

輸出以內容定址檔名寫入並驗證，最後更新 manifest。**保留目前與上一版**，再清除更早且符合生成命名的檔案；不會刪除任意檔案。這能照顧仍持有上一版 manifest 的開啟頁面，不承諾跨多次發布的極舊頁面仍能補抓；該情況需重新整理／修復快取。首次發布沒有上一版。不要同時對同個快照／輸出目錄執行多個產包程序。

發布順序：產包 → 檢查來源 SHA、診斷與大小變化 → unit/build/e2e → 提交同一份產物到 staging → 驗證 → merge main。CI 不重新抓上游，避免測試與發布版本不同。本次沒有自動通知、定時產包或自動發布新資料。

現有 Pages pipeline 仍將正式分支與 staging 各自 build 後組成一個 Pages artifact；推 staging 也會重新部署正式分支的內容，但不會因此把 staging 的資料包放進正式站。不要在此流程偷偷加入重新產包。

## 測試與驗收

```powershell
npm run test:unit
npm run build
npm run test:e2e -- --workers=2
# 可選：以真實來源快照檢查全部配方材料閉包、特殊資料與推薦筆記
$env:GAME_DATA_SOURCE_DIR = '.cache/game-data/<commit>'
npm run test:unit -- tests/unit/gameDataGeneration.test.ts
Remove-Item Env:GAME_DATA_SOURCE_DIR
```

Generator tests 覆蓋固定 SHA、來源／授權檢查、投影、checksum、重現性與保留上一版。Runtime tests 覆蓋兩階段、快取、失敗與完整更新。E2E 同時測試受控資料與真實簽入資料經靜態伺服器載入，涵蓋搜尋、無人島備料、待辦、更新接受／延後與無 IndexedDB 回退。

手動 staging 再查：Network 無 Teamcraft raw JSON 請求；冷啟動三包，暖啟動只查 manifest；更新提示前不混版；設定修復不影響收藏；繁中／簡中／英文／日文與手機／暗色布局。自動化瀏覽器不能代替真實裝置或正式部署驗證。
