# 工坊網域搬移

正式站：`https://workshop.frozenrabbit.com/`。測試站：`https://workshop.frozenrabbit.com/staging/`。

## 分支內設定

- Vite 預設 base 為 `/`；測試站使用 `VITE_BASE_PATH=/staging/`。
- canonical、hreflang、OG、Twitter、JSON-LD、robots、sitemap 及匯出待辦的圖示使用新正式網址。
- 測試站 HTML 使用 `noindex, follow`、canonical 指向正式站，不發佈 sitemap。
- 繼續使用 `#settings` 等 hash 導覽，不更改 storage key 或備份格式。
- 「拾穗人的委託」必須保留在 `https://emu-rabbit.github.io/gleaner/`，才能讀到舊站資料。
- 搬家提醒優先顯示，可永久關閉；設定頁也能匯入。成功匯入後略過語言與市場設定，追蹤同意獨立處理。
- 匯入先驗證整份檔案、預覽衝突，再按選擇合併；歷史依建立時間保留最新 20 筆，收藏不裁切。寫入失敗會嘗試回復原值。

## 本機驗證

Playwright 使用 production build 的 preview server，不自動建置，也不重用其他已啟動的伺服器。測試根路徑與 staging 必須分別建置後執行。

```powershell
npm run test:unit
$env:VITE_BASE_PATH = '/'
npm run build
node scripts/verify-deployment.mjs
npm run test:e2e -- --workers 3
$env:VITE_BASE_PATH = '/staging/'
npm run build
node scripts/verify-deployment.mjs
npm run test:e2e -- --workers 3
Remove-Item Env:VITE_BASE_PATH
```

CI 執行相同的兩種 base 驗證；部署前另外驗證實際要組合的正式／staging 分支產物。驗證包含本地資源路徑、SEO、測試站索引規則與遊戲資料包 SHA-256。

## 發佈與站外切換

2026-09-07 唯讀確認：工坊 Pages 使用 Actions 發佈，Custom domain 為空；`workshop.frozenrabbit.com` DNS 名稱不存在。

**push feature branch 不會部署。** 既有部署觸發分支為 main/master、staging；一次部署會組合遠端正式分支與 staging。這次設定必須進入兩個來源分支後再切換網域，否則產物驗證會阻止混合新舊 base 上線。此 feature branch 不修改其他分支，也不提前改動線上 Pages/DNS。

切換順序：

1. 準備讓 main 與 staging 都包含本次變更，確認 GitHub 帳號已驗證 `frozenrabbit.com` 的網域所有權。
2. 在協調好的切換時段，將 repository Settings → Pages → Custom domain 設為 `workshop.frozenrabbit.com`。
3. 在 DNS 新增 CNAME：`workshop` → `emu-rabbit.github.io`，不帶 repository 路徑。
4. 發佈包含本次變更的 main 與 staging；等待 Actions 部署、DNS 與 HTTPS 憑證完成，確認 Enforce HTTPS。
5. 驗證新站與 `/staging/` 的資源、搜尋、備料、匯出、匯入及重新整理；確認舊網址的 query/hash 轉址結果。
6. 確認「拾穗人的委託」最後仍停留在舊 origin，在原瀏覽器下載備份，再於新站匯入；另驗證實體手機下載與選檔。
7. 更新站外入口、Search Console 的 sitemap 與 analytics 網站設定，確認新網域實際流量。

Actions 發佈不需要 `public/CNAME`；自訂網域由 Pages 設定管理，不能只增加檔案就宣稱完成。依據：[GitHub Pages 自訂網域設定](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。

正式站與 staging 共用 origin，也共用使用者 storage key；請用獨立瀏覽器設定檔驗收，避免測試改到正式資料。遊戲快取依 base 隔離。

## 回復

必要時同步回復 Pages 自訂網域、DNS、舊 base 與 SEO，再部署原版本。只回復其中一項會造成網址與資源不匹配。保留搬家備份；新網域新增的資料不會自動回到舊 origin。
