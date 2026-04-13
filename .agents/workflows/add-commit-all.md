---
description: 將所有變更 add 並以 Pascal-case 規範 commit 至 git，並減少確認流程
---

# 執行步驟

請 Agent 依照以下步驟執行：

1. 自動將所有變更（包含 Untracked 檔案）加入暫存區。
2. 以 Pascal-case 格式的 Header（如 `Feat:`, `Fix:`, `Docs:`）撰寫 Commit Message 並提交。

// turbo
```powershell
git add . ; git commit -m "{{COMMIT_MESSAGE}}"
```

## Commit 規範提醒
- Header 第一個字母需大寫 (Pascal-case)。
- 內容應簡潔明瞭。
