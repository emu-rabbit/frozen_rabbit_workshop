# 姊妹專案參考規範

## 1. 專案血緣
本專案 **`frozen_rabbit_workshop` (能工巧匠管理工具)** 與同級目錄下的 **`frozen_rabbit_tome` (大地使者策略工具)** 為姊妹專案。

- 兩者功能獨立，但共享 Frozen Rabbit 品牌、語氣、四語系習慣與部分視覺語彙。
- Workshop 側重備料管理、成本估算與行動清單。
- Tome 側重採集策略推薦、模擬、分析與演算法驗證。

## 2. 何時參考 Tome
Agent 在以下任務中應主動檢視 `frozen_rabbit_tome` 的實作或 `.agents` 文件：

- 新增或整理 `.agents` 技能檔與工作流程。
- 調整品牌語氣、README、FAQ、changelog 或 public-facing 文件。
- 需要對齊 Frozen Rabbit 系列視覺語彙。
- 涉及採掘師、園藝師、採集職業名稱、GP、獲得力、鑑別力等跨專案術語。
- 設計新 UI 時需要參考姊妹站的元件層級、暗黑模式或 RWD 處理方式。

## 3. 不可盲目照搬
- Tome 的核心是 solver / simulator，Workshop 的核心是 workbench / todo list；不要把求解器心智模型搬進備料工具。
- Tome 的收藏品、WASM、policy tree、reward scoring 文件不適合作為 Workshop 的直接產品規格。
- 若一致性會傷害 Workshop 的清單效率、資訊密度或資料管理流程，應優先維持 Workshop 的工具便利性。

## 4. 實作準則
- 跨專案參考時，使用 `rg`、`rg --files` 與 `Get-Content -Encoding UTF8` 檢視真實檔案。
- 若只需要語氣或結構，請改寫成 Workshop 語境，不要保留 Tome 專屬名詞。
- 若要同步 locale 術語，先確認兩邊目前實際使用的 key 與可見文字。
