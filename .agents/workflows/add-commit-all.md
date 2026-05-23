---
description: 將所有變更 add 並以 Pascal-case 規範 commit 至 git。描述部分建議使用繁體中文。
---

# Git 提交工作流

請 Agent 依照以下步驟執行：

1. **分析變更**：先用 `git status --short`、必要時用 `git diff --stat` 或 `git diff -- <path>` 巡檢已修改與新增檔案，確認沒有意外變更。
2. **生成訊息**：根據變更內容生成符合以下規範的 commit message：
   - Header 使用 Pascal-case，例如 `Feat:`, `Fix:`, `Docs:`, `Refactor:`, `Chore:`。
   - 描述應精準反映變更，避免 `update files` 這類模糊訊息。
   - 描述部分建議使用繁體中文。
3. **加入暫存區**：若使用者要求 `add and commit all`，自動將所有變更（包含 untracked 檔案）加入暫存區。
4. **提交前確認範圍**：執行 `git diff --cached --stat` 或 `git diff --cached --name-only` 確認 staged 範圍。
5. **執行提交**：執行 git commit。
6. **提交後驗證**：執行 `git status --short` 確認工作樹狀態，並回報 commit hash。

// turbo
```powershell
git add . ; git commit -m "{{COMMIT_MESSAGE}}"
```

## Commit 規範提醒
- Header 第一個字母需大寫。
- 若工作樹中有其他 Agent 或使用者的無關變更，且使用者沒有要求全量提交，請只 stage 自己負責的檔案。
- 若變更涉及重大架構調整，提交前先向使用者確認。
