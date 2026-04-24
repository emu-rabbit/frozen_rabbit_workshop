export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-04-24',
    changes: [
      '新增待辦清單的一鍵複製鬧鐘巨集功能',
      '新增 FAQ 項目說明翻譯缺失時的對應方法',
      '在私心筆記頁提醒可以使用筆記工作台新增物品'
    ]
  },
  {
    version: '0.9.0',
    date: '2026-04-24',
    changes: [
      '新增版本更新紀錄頁面',
      '優化了系統效能與部分介面體驗',
      '修復了已知的一些小錯誤'
    ]
  },
  {
    version: '0.8.5',
    date: '2026-04-22',
    changes: [
      '新增 ECpay 贊助連結與優化深色模式體驗',
      '改善工作台與資料同步的穩定性'
    ]
  },
  {
    version: '0.8.0',
    date: '2026-04-20',
    changes: [
      '實裝 Todo List 清單匯出功能',
      '完善常見問題 (FAQ) 頁面',
      '優化 Universalis API 連線處理與錯誤提示'
    ]
  }
];
