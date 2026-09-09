# 測試範圍

- `npm run test:unit`：正式函式、資料完整性與元件互動。不得在測試裡複製一份業務邏輯再測自己。
- `npm run build` 後執行 `npm run test:e2e`：在 Chromium、WebKit 與 Mobile Chrome 驗證主要流程、瀏覽器快取、匯入／匯出、失敗恢復與版面邊界。
- `npm run test:e2e:smoke`：只在 Chromium 執行標記 `@deployment` 的部署驗收。CI 先以 `VITE_BASE_PATH=/staging/` 建置並驗證產物，再執行此命令；不重跑所有業務案例。

部署驗收保留側欄導航、真實資料包載入與快取重用、收藏後重載並進入備料台、匯入後重載，以及待辦 HTML 下載。新增標記應有部署路徑相關的理由。

彈窗套用與延後生效保留 E2E；Escape、關閉鈕、遮罩及忙碌狀態由真實元件測試驗證，避免每種關閉方式都重新下載並切換資料版本。

例行測試不產生無比對基準的成功截圖。保留明暗主題、四語、版面與可操作性的斷言；Playwright 仍於失敗時截圖，CI 首次重試時記錄 trace 與影片。人工視覺檢查另行進行，不以測試通過取代。

CI 使用一個 worker，正式路徑與 staging 的 HTML 報告分別保存在 `playwright-report/production` 和 `playwright-report/staging`，成功也上傳，方便追查耗時。終端顯示各案例結果與時間。

本機若 4173 已被使用，可設定 `PLAYWRIGHT_PORT` 指定其他連接埠。測試自行啟動 preview，不重用不明的既有伺服器。建置與 E2E 的 `VITE_BASE_PATH` 必須一致。
