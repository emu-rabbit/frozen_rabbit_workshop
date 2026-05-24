# UI/UX 與視覺規範

## 概述
本技能確保 Workshop 的前端介面在清單效率、視覺品質、暗黑模式與 RWD 上保持穩定。

## 觸發條件
- 建立或修改 Vue component。
- 調整 CSS、Tailwind class、佈局、色彩、互動流程或 responsive behavior。
- 修改備料台、待辦清單、推薦筆記、搜尋、設定、FAQ 或 modals。

## 核心規則

### Workshop 介面原則
- **資訊密度優先**：Workshop 是工作台，不是展示頁。大量素材、價格、職業與數量資訊要易掃描。
- **主線流程短**：選清單、分配來源、生成待辦這條路徑不可被裝飾或過度說明阻擋。
- **互動狀態清楚**：分配數量、未分配警告、價格錯誤、重試、HQ/NQ 切換與收藏狀態都要一眼可辨。
- **文字不溢出**：中英日長字串、物品名與按鈕文案都要在手機與桌面檢查。

### 前端架構
- 元件應保持小型、可重用，避免單檔持續膨脹。
- UI 呈現與資料邏輯應分離；跨頁狀態優先放在 composable 或 service。
- 定時器、事件監聽、AbortController 或訂閱要有清理機制。
- 不要為單次畫面修補新增難以維護的全域 CSS。

### 視覺與暗黑模式
- 優先使用專案既有 `soft-green`、slate、amber、indigo 等語彙。
- 避免單一色系過度支配整頁；警告、採集、製作、市場等語意色應清楚分層。
- 若可直接用 Tailwind `dark:` class，優先放在 template。
- 在 Vue SFC `<style scoped>` 中，若要寫全域暗黑 selector，請包住完整 selector，例如 `:global(html.dark .filter-input)`。
- 不要寫 `:global(.dark) .foo` 或 `:global(html.dark) .foo` 這類可能編譯成根節點樣式污染的 selector。
- 修正 scoped CSS 或暗黑模式後，應用 `npm run build` 檢查編譯結果，必要時用瀏覽器 computed style 驗證。

## 驗證清單
- 桌面寬度下主要清單不應跳動、擠壓或文字重疊。
- 手機寬度下按鈕、輸入框與 sticky footer 不應遮住核心內容。
- 明亮與暗黑模式都要檢查背景、文字、邊框、hover/focus 與 disabled 狀態。
- locale 切換後，長英文與日文不應破壞布局。
