import type { LocalizedString } from '../types/note';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: (string | LocalizedString)[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '1.0.2',
    date: '2026-04-29',
    changes: [
      {
        tw: '在備料台頁面新增複製素材名稱按鈕',
        cn: '在备料台页面新增复制素材名称按钮',
        en: 'Added a button to copy material names in the materials workbench',
        ja: '製作作業台ページに素材名をコピーするボタンを追加しました'
      },
      {
        tw: '新增品級 690 以上的巧匠大地工具系列推薦筆記',
        cn: '新增品级 690 以上的巧匠大地工具系列推荐笔记',
        en: 'Added recommended notes for Crafting and Gathering Tools iLv 690 and above',
        ja: '道具（クラフター・ギャザラー）の iLv 690 以上のオススメ筆記を追加しました'
      },
      {
        tw: '優化多國語系載入邏輯',
        cn: '优化多国语系载入逻辑',
        en: 'Optimized multi-language loading logic',
        ja: '多言語読み込みロジックを最適化しました'
      },
      {
        tw: '優化網站 SEO',
        cn: '优化网站 SEO',
        en: 'Optimized website SEO',
        ja: 'ウェブサイトの SEO を最適化しました'
      },
      {
        tw: 'Teamcraft 資料全面採用最新的 staging 分支資料',
        cn: 'Teamcraft 资料全面采用最新的 staging 分支资料',
        en: 'Switched Teamcraft data source to the latest staging branch',
        ja: 'Teamcraft のデータソースを最新の staging ブランチに変更しました'
      }
    ]
  },
  {
    version: '1.0.1',
    date: '2026-04-24',
    changes: [
      {
        tw: '現在待辦清單中已被使用者標記為完成的素材不會出現在複製的巨集指令中了',
        cn: '现在待办清单中已被用户标记为完成的素材不会出现在复制的宏指令中了',
        en: 'Items marked as completed in the Todo list are now excluded from the copied alarm macro',
        ja: 'やることリストで完了としてマークされたアイテムは、コピーされたアラームマクロから除外されるようになりました'
      },
      {
        tw: '確保了匯出的待辦清單 HTML 中也具備相同的複製鬧鐘巨集功能',
        cn: '确保了导出的待办清单 HTML 中也具备相同的复制闹钟宏功能',
        en: 'Added the same one-click copy alarm macro feature to the exported Todo list HTML',
        ja: '書き出されたやることリストのHTMLにも同様のアラームマクロコピー機能を追加しました'
      }
    ]
  },
  {
    version: '1.0.0',
    date: '2026-04-24',
    changes: [
      {
        tw: '實裝全新的「深色模式 (Midnight Mode)」支援',
        cn: '实装全新的“深色模式 (Midnight Mode)”支持',
        en: 'Implemented full support for "Dark Mode (Midnight Mode)"',
        ja: '新しい「ダークモード (Midnight Mode)」のサポートを実装しました'
      },
      {
        tw: '新增版本更新紀錄頁面',
        cn: '新增版本更新记录页面',
        en: 'Added version changelog page',
        ja: 'アップデート履歴ページを追加しました'
      },
      {
        tw: '新增待辦清單的一鍵複製鬧鐘巨集功能',
        cn: '新增待办清单的一键复制闹钟宏功能',
        en: 'Added one-click copy alarm macro feature to Todo list',
        ja: 'やることリストにアラームマクロの一括コピー機能を追加しました'
      },
      {
        tw: '新增 FAQ 項目說明翻譯缺失時的對應方法',
        cn: '新增 FAQ 项目说明翻译缺失时的对应方法',
        en: 'Added FAQ item explaining how to handle missing translations',
        ja: '翻訳が不足している場合の対処方法についてのFAQを追加しました'
      },
      {
        tw: '在私心筆記頁提醒可以使用筆記工作台新增物品',
        cn: '在兔肉私心笔记页提醒可以使用笔记工作台新增物品',
        en: 'Added reminder in Recommended Notes about using Note Workbench to add items',
        ja: '「うさぎのオススメ」ページに「制作作業台」でアイテムを追加できる案内を追加しました'
      }
    ]
  },
  {
    version: '0.9.0',
    date: '2026-04-22',
    changes: [
      {
        tw: '優化了系統效能與部分介面體驗',
        cn: '优化了系统性能与部分界面体验',
        en: 'Optimized system performance and UI experience',
        ja: 'システムのパフォーマンスとUIエクスペリエンスを最適化しました'
      },
      {
        tw: '修復了已知的一些小錯誤',
        cn: '修复了已知的一些小错误',
        en: 'Fixed minor bugs',
        ja: '既知の不具合を修正しました'
      }
    ]
  },
  {
    version: '0.8.5',
    date: '2026-04-22',
    changes: [
      {
        tw: '實裝待辦清單匯出功能',
        cn: '实装待办清单导出功能',
        en: 'Implemented Todo list export feature',
        ja: 'やることリストの書き出し機能を実装しました'
      },
      {
        tw: '新增 ECpay 贊助連結與贊助功能',
        cn: '新增 ECpay 赞助链接与赞助功能',
        en: 'Added ECpay sponsorship link and donation feature',
        ja: 'ECpay の支援リンクと支援機能を追加しました'
      },
      {
        tw: '改善工作台與資料同步的穩定性',
        cn: '改善工作台与数据同步的稳定性',
        en: 'Improved workbench and data sync stability',
        ja: '作業台とデータ同期の安定性を向上させました'
      }
    ]
  },
  {
    version: '0.8.0',
    date: '2026-04-20',
    changes: [
      {
        tw: '完善常見問題 (FAQ) 頁面',
        cn: '完善常见问题 (FAQ) 页面',
        en: 'Improved FAQ page',
        ja: 'よくある質問 (FAQ) ページを改善しました'
      },
      {
        tw: '優化 Universalis API 連線處理與錯誤提示',
        cn: '优化 Universalis API 连线处理与错误提示',
        en: 'Optimized Universalis API connection handling and error messages',
        ja: 'Universalis API の接続處理とエラーメッセージを最適化しました'
      }
    ]
  }
];
