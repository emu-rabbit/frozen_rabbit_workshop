# 市場價格與成本估算規範

## 概述
本技能定義 Workshop 如何使用 Universalis listing 估算市場價格，並維持定價策略、HQ/NQ 切換、快取與錯誤狀態的一致性。

## 觸發條件
- 修改 `src/services/universalis.ts`、`src/utils/marketPricing.ts`、`src/composables/useWorkbench.ts` 或備料台價格 UI。
- 修改設定頁的市場資料中心、市場策略、HQ/NQ 相關文案。
- 回答 GA、FAQ、README 或 changelog 中關於價格策略與估算方式的問題。

## 核心概念
- Universalis listing 會隨時間、資料中心、世界、HQ/NQ 與上架數量變動。
- Workshop 的價格是估算，不是保證成交價。
- 目前策略可對應：
  - **激進**：偏向最低價。
  - **平衡**：偏向低價樣本的加權第 25 百分位。
  - **保守**：偏向低價樣本的加權中位數。
- HQ 價格應是每項素材明確切換，不要讓使用者誤以為全域都切成 HQ。

## 實作規則
- 價格 fetch 應沿用 service 內的 session cache、TTL、inflight request 與 AbortController 模式。
- API 404 或無 listing 代表可能不可市場購買，應回傳空價格而不是讓整個備料台崩潰。
- 網路失敗應顯示可理解的重試或錯誤狀態。
- `calculateMarketStats` 應維持 quantity-weighted percentile 的語意，不要改成只看 listing 筆數。
- 切換資料中心、市場策略或 HQ/NQ 後，需確認快取 key 與 UI 顯示同步更新。
- 成本加總遇到未知價格時，應清楚標示不能完整估算，而不是把未知項目當 0。

## 文案規範
- 使用「估算」、「基準」、「策略」、「目前資料」等詞。
- 避免「保證最低」、「最佳價格」、「一定最省」。
- FAQ 中解釋市場策略時，要對玩家說明它們是不同風險偏好的估算基準。

## 驗證方式
- 修改定價計算時，優先補或執行 unit test。
- 修改 UI 時，檢查備料台 summary、item row、價格 detail card、未知價格與錯誤狀態。
- 若改動 API query 或 cache key，檢查 HQ/NQ、資料中心切換與 abort retry 行為。
