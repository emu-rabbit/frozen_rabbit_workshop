# 推薦筆記資料規範

## 概述
本技能定義 `src/data/recommended/` 中站長推薦筆記的資料結構、語系、排序與維護方式。

## 觸發條件
- 新增、修改或修復 `src/data/recommended/*.json`。
- 修改 `src/data/recommended/index.ts`。
- 修改推薦筆記搜尋、收藏、匯入備料台或 FAQ 中的推薦筆記說明。
- 執行或更新 `.agents/workflows/process-recommended.md`。

## 資料結構
每筆推薦筆記應符合：

```json
{
  "id": "recommend_xxxxx",
  "name": {
    "tw": "繁體中文名稱",
    "cn": "简体中文名称",
    "en": "English name",
    "ja": "日本語名"
  },
  "items": [
    { "id": 12345, "quantity": 1 }
  ],
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

`name` 仍為字串時代表待處理；`name` 已是 `{ tw, cn, en, ja }` 時視為已完成。

## 核心規則
- **不得改寫已完成筆記**：若 `name` 已是四語物件，除非使用者明確指定，否則不可在處理 workflow 中改動任何語系欄位。
- **四語完整**：新筆記完成時必須包含 `tw`、`cn`、`en`、`ja`。
- **保留使用者指定順序**：使用者要求插入特定位置時，不可改成 append。
- **排序穩定**：`index.ts` 中的筆記彙整應維持既有 iLv / 等級邏輯，避免搜尋與顯示順序無理由跳動。
- **資料乾淨**：items 只存 item ID 與 quantity；物品名稱、icon、職業與價格由 service 於 render 時取得。

## 翻譯規範
- `tw` 使用繁體中文與台服/繁中慣用語。
- `cn` 使用簡體中文。
- `en` 使用自然英文，裝備分類可用 Fending、Maiming、Striking、Scouting、Aiming、Casting、Healing、Gathering、Crafting、Tools。
- `ja` 使用自然日文，必要時可用遊戲社群常見縮寫，但不要殘留中文。
- 英文數量詞需有空格，例如 `Fending 10-piece Set`。

## 維護流程
1. 新增筆記時，先以字串形式填入 `name`，並確認 item ID 與 quantity。
2. 執行 `.agents/workflows/process-recommended.md` 的規則展開多語系。
3. 若新增檔案或修正索引，更新 `src/data/recommended/index.ts`。
4. 執行相關測試或 build。

## 注意事項
- 推薦筆記是站長精選，不要在 UI 或 README 宣稱它是唯一正解或最佳配裝。
- 若 item ID 搜不到，先查 Teamcraft canonical ID 與字典載入，不要直接用顯示名稱硬塞。
