import type { LocalizedString } from '../types/note';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: (string | LocalizedString)[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-05-28',
    changes: [
      {
        tw: '支援可狩獵取得的素材標示地區和怪物名稱',
        cn: '支持可狩猎取得的素材显示地区和怪物名称',
        en: 'Added region and monster name details for materials obtainable from monster drops',
        ja: 'モンスターから入手できる素材に地域とモンスター名を表示するようにしました'
      },
      {
        tw: '調整待辦清單的手機版版面',
        cn: '调整待办清单的手机版版面',
        en: 'Adjusted the Todo list layout on mobile',
        ja: 'Todo リストのモバイル表示を調整しました'
      }
    ]
  },
  {
    version: '1.1.2',
    date: '2026-05-26',
    changes: [
      {
        tw: '撰寫筆記時，未選中有效物品的列現在會有更醒目的提示',
        cn: '撰写笔记时，未选中有效物品的列现在会有更醒目的提示',
        en: 'Added a clearer highlight when a note row does not have a valid item selected',
        ja: 'ノート作成時、有効なアイテムが選択されていない行をより分かりやすく表示するようにしました'
      },
      {
        tw: '初次使用時會提醒先設定市場來源伺服器，讓價格估算更貼近實際需求',
        cn: '初次使用时会提醒先设置市场来源服务器，让价格估算更贴近实际需求',
        en: 'Added a first-time reminder to set a market source world so price estimates better match the user\'s needs',
        ja: '初回利用時に市場価格の取得元ワールド設定を案内し、価格見積もりが利用者の状況に近づくようにしました'
      },
      {
        tw: '優化多國語系、手機版面與 SEO 的細節',
        cn: '优化多国语系、手机版面与 SEO 的细节',
        en: 'Improved localization, mobile layout, and SEO details',
        ja: '多言語対応、モバイル表示、SEO の細部を改善しました'
      }
    ]
  },
  {
    version: '1.1.1',
    date: '2026-05-23',
    changes: [
      {
        tw: '修正公會合建與開拓製作配方無法被搜尋的問題',
        cn: '修正部队合建与开拓制作配方无法被搜索的问题',
        en: 'Fixed an issue where Company Crafting and Sanctuary Crafting recipes could not be searched',
        ja: 'カンパニークラフトと開拓製作のレシピを検索できない問題を修正しました'
      },
      {
        tw: '備料台現在可以正確辨認公會合建與開拓製作的類別標示',
        cn: '备料台现在可以正确识别部队合建与开拓制作的类别标示',
        en: 'The material prep workbench now correctly identifies Company Crafting and Sanctuary Crafting category labels',
        ja: '素材準備台でカンパニークラフトと開拓製作のカテゴリ表示を正しく判別できるようにしました'
      },
      {
        tw: '公會合建與開拓製作的成品不再被歸類為可搜尋 HQ 價格',
        cn: '部队合建与开拓制作的成品不再被归类为可搜索 HQ 价格',
        en: 'Company Crafting and Sanctuary Crafting products are no longer treated as items that can query HQ prices',
        ja: 'カンパニークラフトと開拓製作の完成品を HQ 価格検索の対象として扱わないようにしました'
      }
    ]
  },
  {
    version: '1.1.0',
    date: '2026-05-21',
    changes: [
      {
        tw: '新增用篩選的方式為筆記加入新物品',
        cn: '新增用筛选的方式为笔记加入新物品',
        en: 'Added a filter-based way to add new items to notes',
        ja: 'フィルターを使ってノートに新しいアイテムを追加できるようにしました'
      },
      {
        tw: '新增以 HQ 查詢市場價格的切換按鈕',
        cn: '新增以 HQ 查询市场价格的切换按钮',
        en: 'Added a toggle for querying market prices as HQ items',
        ja: 'HQ アイテムとして市場価格を取得する切り替えボタンを追加しました'
      },
      {
        tw: '修正手機版上一些爆版的畫面元素',
        cn: '修正手机版上一些溢出版面的画面元素',
        en: 'Fixed several mobile layout elements that could overflow the screen',
        ja: 'モバイル表示で一部の画面要素がはみ出す問題を修正しました'
      },
      {
        tw: '新增備料台資料預熱機制',
        cn: '新增备料台资料预热机制',
        en: 'Added data prewarming for the material prep workbench',
        ja: '素材準備台のデータを事前に読み込む仕組みを追加しました'
      },
      {
        tw: '在常見問題中說明市場成本策略的功用',
        cn: '在常见问题中说明市场成本策略的功用',
        en: 'Explained what market cost strategies are for in the FAQ',
        ja: 'FAQ で市場コスト戦略の役割を説明しました'
      }
    ]
  },
  {
    version: '1.0.5',
    date: '2026-05-14',
    changes: [
      {
        tw: 'README 新增英文入口與專案說明，讓第一次造訪的使用者更快理解工具用途',
        cn: 'README 新增英文入口与项目说明，让第一次访问的用户更快理解工具用途',
        en: 'Added an English README introduction so first-time visitors can understand the tool more quickly',
        ja: 'README に英語の導入説明を追加し、初めて訪れるユーザーにもツールの目的が伝わりやすくなりました'
      },
      {
        tw: '調整備料台與待辦清單的製作排序，讓前置材料更穩定地排在成品之前，同時保留手動排序',
        cn: '调整备料台与待办清单的制作排序，让前置材料更稳定地排在成品之前，同时保留手动排序',
        en: 'Improved workbench and Todo craft ordering so prerequisite materials stay before finished items while preserving manual ordering',
        ja: '仕込み台とTodoリストの製作順を調整し、前提素材が完成品より前に安定して並ぶようにしつつ、手動並び替えも維持しました'
      },
      {
        tw: '修正 Universalis 查價重試時按下跳過後，備料台可能停在空白或不再重新查價的問題',
        cn: '修正 Universalis 查价重试时按下跳过后，备料台可能停在空白或不再重新查价的问题',
        en: 'Fixed an issue where skipping a Universalis price retry could leave the workbench blank or stop future price retries',
        ja: 'Universalis の価格取得リトライ中にスキップした後、仕込み台が空白のままになったり再取得されなくなる問題を修正しました'
      }
    ]
  },
  {
    version: '1.0.4',
    date: '2026-05-12',
    changes: [
      {
        tw: '新增常見問題項目，說明如何透過筆記工作臺編輯筆記、增減物品、修改數量與合併筆記',
        cn: '新增常见问题项目，说明如何通过笔记工作台编辑笔记、增减物品、修改数量与合并笔记',
        en: 'Added an FAQ item explaining how to edit notes, add or remove items, change quantities, and merge notes through the Note Workbench',
        ja: 'ノート作業台でノートの編集、アイテムの追加・削除、数量変更、ノート結合を行う方法を説明するFAQ項目を追加しました'
      }
    ]
  },
  {
    version: '1.0.3',
    date: '2026-05-08',
    changes: [
      {
        tw: '新增 GA4 支援，協助理解使用者狀況',
        cn: '新增 GA4 支持，协助理解使用者状况',
        en: 'Added GA4 support to help understand user behavior',
        ja: 'GA4 のサポートを追加し、ユーザーの利用状況の把握を改善しました'
      }
    ]
  },
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
