# 開發實作規範

## 概述
本技能定義 Frozen Rabbit Workshop 的開發基準，涵蓋程式碼風格、資料處理、測試與維護方式。

## 觸發條件
- 撰寫、修改或重構任何程式碼時。
- 撰寫單元測試、e2e 測試或測試資料時。
- 分析現有架構或進行 code review 時。

## 核心規則

### 程式碼撰寫
- **遵循既有模式**：優先使用現有 composable、service、type 與 component 結構。
- **命名一致性**：變數與函式使用 `camelCase`，類別、介面與型別使用 `PascalCase`。
- **單一責任**：資料載入、狀態管理、UI 呈現與格式化邏輯應清楚分工。
- **防禦性處理**：網路、資料缺漏、API 404、價格不存在與語系 fallback 都必須有明確處理。
- **非同步安全**：避免 unhandled Promise；重複請求應優先沿用既有 cache / inflight request 模式。
- **資料乾淨**：儲存資料時優先存 ID 與結構化資料；顯示文字應在 render 時依 locale 推導。

### 測試品質
- 修改 shared utility、service、composable 或資料轉換時，優先補 unit test。
- 修改主要使用流程、備料台、待辦清單、搜尋、推薦筆記或暗黑模式時，評估是否需要 e2e。
- 測試應覆蓋成功、失敗與邊界情境，例如空清單、缺價格、不可製作、不可採集、HQ/NQ 切換與語言切換。
- 不要只測單一快樂路徑。

## 常用驗證
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`

若 npm 因 Windows sandbox、cache 或 Vite `node_modules/.vite-temp` 權限失敗，請參考專案外層 AGENTS 指令中的 npm / nvm-windows sandbox note，必要時用 `require_escalated` 重新執行同一命令。

## 注意事項
- 處理 legacy code 時，不要順手重構無關區塊；若發現值得整理的問題，先完成任務再回報。
- 修改資料來源或 schema 時，應同步檢查 e2e mock、fixture 與相關 fallback。
