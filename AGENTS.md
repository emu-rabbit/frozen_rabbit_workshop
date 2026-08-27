# Codex 專案指令

本專案使用 `.agents` 目錄保存給 Agent 的專案脈絡、技能規範與工作流程。開始任何分析、實作、設計、測試、提交或文件工作前，請先把本檔視為唯一初階入口，並依任務讀取下列資料。

除本 `AGENTS.md` 外，`.agents` 內的 Markdown 不會保證被 Codex 自動載入；後續 Agent 必須依本檔路由主動讀取需要的文件。

## 讀檔編碼規範

- 讀取本專案任何 `.agents`、skill、workflow 或 Markdown 脈絡檔案時，請務必明確使用 UTF-8 編碼。
- 在 Windows PowerShell 中請使用 `Get-Content -Encoding UTF8 <path>`；不要使用未指定編碼的 `Get-Content`、`type` 或其他可能套用系統預設編碼的讀檔方式。
- 本專案主要文件使用繁體中文撰寫；若讀取結果出現 `?`、亂碼或不可辨識字元，請立刻用 UTF-8 重新讀取，不要依亂碼內容推論。

## 必讀核心脈絡

每次開始工作時，請先閱讀：

1. `.agents/skills/core/language_policy.md`
2. `.agents/skills/core/global_standards.md`
3. `.agents/skills/mission/project_mission.md`
4. `.agents/skills/mission/product_architecture.md`
5. `.agents/skills/mission/brand_identity.md`
6. `.agents/skills/mission/reference_project.md`

## `.agents` 目錄地圖

- **`core/`**：全域核心規範，例如語言政策與基礎行為準則。
- **`mission/`**：專案使命、產品架構、品牌識別與姊妹專案參考。
- **`professional/`**：開發實作與 UI/UX 專業標準。
- **`business/`**：Workshop 專屬的 FFXIV 資料來源、推薦筆記與市場定價規範。
- **`workflows/`**：明確任務流程，例如推薦筆記處理與 git 提交流程。

## 技能索引

### Core

- `.agents/skills/core/language_policy.md`：規定 Agent 與使用者之間的回覆、進度與協作說明預設使用繁體中文；不管理產品對外 UI 文案。
- `.agents/skills/core/global_standards.md`：定義分析方式、回應風格、編碼與安全讀寫規範。

### Mission

- `.agents/skills/mission/project_mission.md`：專案定位、核心目標與不可過度承諾的邊界。
- `.agents/skills/mission/product_architecture.md`：備料台、待辦清單、推薦筆記、歷史、設定、產品對外 UI 文案與 locale 分工。
- `.agents/skills/mission/brand_identity.md`：Frozen Rabbit 品牌人格、語氣與視覺方向。
- `.agents/skills/mission/reference_project.md`：姊妹專案 `frozen_rabbit_tome` 的命名、資料與 i18n 參考。

### Professional

- `.agents/skills/professional/development_standards.md`：程式碼風格、重構、測試與維護要求。
- `.agents/skills/professional/ui_ux_standards.md`：前端元件、RWD、暗黑模式與一致設計系統要求。

### Business

- `.agents/skills/business/ffxiv_data_sources.md`：Teamcraft、Universalis、XIVAPI 與本地資料快取的維護規範。
- `.agents/skills/business/monster_drop_sources.md`：怪物掉落來源、Teamcraft drop/mob/monster 資料格式、檔案大小與實作路徑。
- `.agents/skills/business/recommended_notes.md`：推薦筆記 JSON、多語系名稱、排序與處理 workflow 規範。
- `.agents/skills/business/market_pricing.md`：市場價格策略、HQ/NQ 切換、快取與失敗處理規範。

## 任務型補充資料

若任務涉及程式碼撰寫、重構、測試、架構分析或 code review，另讀：

- `.agents/skills/professional/development_standards.md`

若任務涉及前端元件、UI、CSS、互動流程、RWD、視覺設計或可用性，另讀：

- `.agents/skills/professional/ui_ux_standards.md`

若任務涉及 Teamcraft 資料、物品搜尋、配方、採集資訊、地圖地名、職業名稱或資料載入失敗，另讀：

- `.agents/skills/business/ffxiv_data_sources.md`

若任務涉及怪物掉落、狩獵素材、怪物名稱、怪物所在地或 `drop-sources.json` / `monsters.json` / `mobs.json`，另讀：

- `.agents/skills/business/monster_drop_sources.md`

若任務涉及 `src/data/recommended/`、推薦筆記、站長精選清單、FAQ 中推薦筆記說明或多語系筆記名稱，另讀：

- `.agents/skills/business/recommended_notes.md`
- `.agents/workflows/process-recommended.md`

若任務涉及 Universalis、資料中心、市場價格、定價策略、HQ/NQ 價格、價格重試或成本估算，另讀：

- `.agents/skills/business/market_pricing.md`

若使用者要求提交 git 變更，另讀：

- `.agents/workflows/add-commit-all.md`

## 核心專案理解

- `frozen_rabbit_workshop` 是 Final Fantasy XIV 能工巧匠與採集素材的備料管理工具。
- 本專案協助玩家把大型製作目標拆成可行動的購買、製作、採集與既有庫存分配，並用市場資料估算成本與時間。
- 對外文案應避免宣稱全域「最佳」或「絕對最低成本」。市場價格會隨時間、伺服器、HQ/NQ 與樣本數變動；請使用「估算」、「建議」、「依目前資料」等保守語氣。
- 產品對外 UI 與 locale 規範由 `.agents/skills/mission/product_architecture.md` 管理。
- 品牌為 Frozen Rabbit，語氣應像友善且專業的朋友：親切、可靠、方便上手。
- UI 與視覺風格可參考姊妹專案 `frozen_rabbit_tome`，但 Workshop 的主線是快速備料與成本判斷，不能為一致性犧牲操作密度與清單效率。

## 固定行為規範

- 更新紀錄由使用者決定；未經使用者明確要求，Agent 嚴禁新增、修改或刪除更新紀錄（含 `src/data/changelog.ts`）。功能修改、版本發佈或 `commit` 要求均不構成授權；完整規範見 `.agents/skills/mission/product_architecture.md` 的「更新紀錄修改權限」。
- 回覆使用者、回報進度、撰寫任務說明時，預設使用繁體中文。
- 技術關鍵字、程式碼識別字、套件名稱與無通用譯名的專有名詞可保留英文。
- 修改程式碼時，遵循既有專案風格，保持變更聚焦，不主動重構無關 legacy code。
- 前端實作需重視元件小型化、關注點分離、暗黑模式、RWD 與一致的設計系統。
- 搜尋優先用 `rg`；讀取中文 Markdown 明確使用 UTF-8；手動編輯優先用 `apply_patch`。
- 若 `.agents` 內的舊文件提到 Antigravity 專用工具、舊式檔案讀寫工具或舊路徑，請理解其意圖並改用目前 Codex 可用的檔案讀取、`apply_patch` 與 shell 工具完成同等工作。
