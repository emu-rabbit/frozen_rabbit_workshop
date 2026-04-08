---
description: 翻譯 recommended.json 中的未翻譯欄位
---

# 執行步驟

1. 讀取專案底下的 `src/data/recommended.json` 檔案。
2. 尋找並分析所有的推薦筆記 (`Note` 物件)，特別檢查其 `name` 屬性。
3. 對於每個 `name` 物件，如果存在某個語言（`tw`, `cn`, `en`, `ja`）的值為空字串 `""`，請使用你的 AI 能力，根據現已填寫的語言（通常是 `tw` 繁體中文）將其準確翻譯為缺失的語言：
    - `tw`: 繁體中文 (Traditional Chinese)
    - `cn`: 簡體中文 (Simplified Chinese) 
    - `en`: 英文 (English)
    - `ja`: 日文 (Japanese)
4. 由於本筆記為 Final Fantasy XIV (FF14) 遊戲相關工具，對於遊戲專有名詞或裝備名稱，請務必翻譯為 FF14 遊戲內的對應名詞。
5. 將翻譯完成並更新後的內容，寫回 `src/data/recommended.json` 檔案中，請務必保持原本的 JSON 縮排與格式。
6. 處理完成後，請整理一份清單向使用者回報你翻譯了哪些筆記以及其結果。
