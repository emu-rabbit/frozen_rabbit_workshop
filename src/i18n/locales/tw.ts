export default {
  app: {
    title: '冷凍兔肉的工坊',
    subtitle: '兔肉不私藏的好筆記本'
  },
  nav: {
    newNote: '寫張新筆記',
    favorites: '收藏的小筆記',
    recommended: '兔肉私心筆記',
    history: '翻開舊筆記',
    settings: '工坊設置',
    sponsor: '贊助冷凍庫電費',
    github: '開源原始碼 (GitHub)',
    editor: '筆記工作台',
    faq: '常見問題'
  },
  noteCard: {
    addFavorite: '加入我的收藏',
    removeFavorite: '取消收藏',
    delete: '刪除紀錄',
    exportNote: '匯出筆記 (JSON)'
  },
  favorites: {
    title: '收藏的小筆記',
    description: '在這裡管理你最常用的製作清單',
    emptyTitle: '還沒有收藏的筆記',
    emptyDescription: '在「翻開舊紀錄」中點擊星星來收藏吧！'
  },
  recommended: {
    title: '兔肉私心筆記',
    description: '這些是站長整理出來實用的清單。可以用空白鍵串聯檢索條件。',
    searchPlaceholder: '搜尋...',
    emptyTitle: '找不到相符的筆記',
    emptyDescription: '換個關鍵字試試看吧！'
  },
  newNote: {
    title: '寫張新筆記',
    description: '輸入筆記名稱與欲追蹤的物品以建立配方清單',
    labelTitle: '筆記名稱',
    placeholderTitle: '例如：640HQ 裝備儲備、生產用半成品...',
    copyJson: '匯出此筆記 (JSON)',
    itemsTitle: '放上備料台的物品',
    itemsDescription: '輸入關鍵字（如「白金」）查詢物品，亦支援英文搜尋',
    searchPlaceholder: '找尋物品...',
    searching: '兔兔在字典裡尋找中...',
    notFound: '找不到這個東西，換個關鍵字吧',
    initialSearch: '輸入物品名稱開始',
    addRow: '還需要準備其他東西？',
    rowHint: '* 必須確保上一列已經填入並選擇物品後，才能繼續新增。',
    save: '好，把這些放上備料台！',
    addToFavorites: '立刻將此筆記加入我的收藏',
    defaultTitle: '{name}的筆記'
  },
  history: {
    title: '翻開舊紀錄',
    description: '這裡記錄了你所有的歷史製作清單，方便隨時翻閱',
    autoDeleteWarning: '最多保留 20 筆歷史紀錄，超過時最舊的一筆將會被自動刪除。想要永久保留的筆記，請記得按下星號將它加入「收藏的小筆記」中喔！',
    emptyTitle: '筆記本目前是空白的喔',
    emptyDescription: '去「寫張新筆記」開始你的第一步吧！',
    syncing: '回憶讀取中...',
    itemsCount: '這張筆記裡面有',
    noItems: '這張筆記空無一物。',
    unknownItem: '未知的神祕物品',
    unknownDate: '神秘的時間點',
    openWorkbench: '放上備料台'
  },
  editor: {
    title: '筆記工作台',
    description: '在此你可以貼上既有的筆記 JSON 進行二次編輯或是合併多張筆記。',
    importLabel: '請在此貼上筆記 JSON',
    importPlaceholder: '貼上從本站複製的筆記 JSON 字串...',
    loadButton: '載入資料並開始編輯',
    mergeButton: '➕ 合併其他筆記 (JSON)',
    invalidJson: 'JSON 格式錯誤，請確認是否為本站匯出的格式。',
    emptyState: '目前沒有載入任何筆記',
    defaultMergedName: '合併的未命名筆記',
    backToImport: '返回重新匯入'
  },
  workbench: {
    title: '備料台',
    description: '能工巧匠大大今天要買要做還是要自己採呢？在這裡制定你的製作計畫與開銷總結吧！',
    view: {
      analyzing: '正在載入真實資料與市場價格...',
      emptyTitle: '目前沒有備料計畫',
      emptyDescription: '去「寫張新筆記」開始你的第一步吧！',
      prepping: '正在備料',
      source: {
        buy: '購買',
        craft: '製作',
        gather: '採集',
        other: '庫存 (其他)',
        cannotCraft: '不可製作',
        cannotGather: '不可採集'
      },
      status: {
        missing: '尚缺 {n} 個',
        excess: '多出 {n} 個',
        mismatch: '目前的數量分配與目標對不上喔，請檢查一下各個項目的數字是否正確！',
        nonePrice: '無上架',
        priceSuffix: '/ 個',
        priceErrorTitle: '連線不穩定：市集價格更新失敗',
        priceErrorDesc: '目前與 Universalis 伺服器的連線不夠穩定或發生錯誤。您仍然可以繼續使用工作台進行設定，只是暫時無法看見最新的預估花費。系統會在您下次操作時再次嘗試抓取。'
      },
      details: {
        gatherTitle: '採集地點與詳情',
        limited: '限時',
        unknownZone: '未知地點',
        spawnTime: '出現時間',
        duration: '持續 {n} 小時',
        craftTitle: '製作配方需求',
        yield: '單次產量',
        vendorTitle: 'NPC 販售資訊',
        vendorDesc: 'NPC 在售 單價 {price} Gil {location}',
        mbTitle: '市場版販售資訊',
        q1Price: '1/4 分位數',
        medianPrice: '中位數',
        noListings: '市場版上目前無上架物品'
      },
      summary: {
        budgetTitle: '物資籌備預算',
        time: '預計時間耗費',
        cannotEstimate: '無法預估',
        hours: '小時',
        mins: '分',
        secs: '秒'
      },
      button: {
        reset: '重設',
        generateList: '生成待辦清單'
      },
      tooltip: {
        budget: '預算依據當前伺服器依照市場最低價格做模擬買入計算，且價格來源經過快取，實際真實價格需要看當下真正的市場價格而定',
        time: '時間僅僅是大略的估算，實際的耗費時間將依照使用者的生產採集裝備數值而定，另外也會受到限時採集點的影響'
      }
    }
  },
  todo: {
    title: '待辦清單',
    backToWorkbench: '返回備料台',
    export: '匯出 / 下載清單',
    exportSuffix: '的待辦清單',
    exportOfflineNote: '此清單為匯出的離線版本。在這裡進行的操作（如勾選項目）將不會回傳同步至工坊網站中。',
    progress: '已完成 {n}/{total} 項',
    section: {
      other: '庫存 / 其他來源',
      buy: '待購買物品',
      gather: '待採集物品',
      craft: '待製作物品'
    },
    targetQty: '目標',
    targetPrice: '參考單價',
    buySourceMarket: '市場版：{world}',
    buySourceVendor: 'NPC：{name} ({zone} X:{x} Y:{y})',
    gatherLocation: '採集點',
    emptySection: '此區塊無項目'
  },
  jobs: {
    crp: '木工師', bsm: '鍛造師', arm: '甲冑師', gsm: '金工師',
    lwr: '皮革師', wvr: '裁縫師', alc: '鍊金術師', cul: '烹調師',
    min: '採掘師', btn: '園藝師', fsh: '漁師', gather: '採集'
  },
  settings: {
    title: '工坊設定',
    description: '調整工坊的各項偏好設定',
    language: '語言版本',
    languageDesc: '本網站的顯示語言，缺乏翻譯的情況下將顯示英文',
    debugMode: '除錯模式',
    debugModeDesc: '開啟後可於創建新筆記時複製站長推薦 JSON 格式',
    langOptions: {
      tw: '繁體中文 (Traditional Chinese)',
      cn: '簡體中文 (Simplified Chinese)',
      en: 'English',
      ja: '日本語 (Japanese)'
    },
    marketTitle: '市場資料設定',
    marketStrategyTitle: '市場版成本策略',
    marketStrategyDesc: '設定備料台預估成本時所採用的市場數據基準，系統會同時自動與 NPC 售價進行比對並顯示最低取得成本。',
    marketStrategyAggressive: '激進 (市場最低價)',
    marketStrategyBalanced: '平衡 (市場 1/4 位數)',
    marketStrategyConservative: '保守 (市場中位數)',
    marketRegion: '市場地區',
    marketDC: '資料中心',
    marketDesc: '設定你要從哪一個市場地區及資料中心獲取價格資料。',
    regions: {
      China: '中國',
      Japan: '日本',
      'North-America': '北美',
      Europe: '歐洲',
      Oceania: '大洋洲',
      'NA-Cloud-DC': '北美雲端',
      '中国': '中國服',
      '한국': '韓國服',
      '繁中服': '繁中服'
    },
    about: {
      title: '關於與致謝',
      description: '工坊背後的資料與技術支援',
      universalis: 'Universalis - 全球 FFXIV 市場資料快取',
      teamcraft: 'Teamcraft - 物品、配方與採集資料來源',
      xivapi: 'XIVAPI - 提供遊戲內圖示與物品 API 支援'
    }
  },
  faq: {
    title: '常見問題',
    description: '這裡整理了一些大家常遇到的疑問與工坊的運作機制',
    items: [
      {
        q: '這網站是做什麼用的？',
        a: '本網站設計給 FFXIV 的巧匠玩家，提供批次準備管理功能。您可以同時展開多個配方，透過系統整合的市場價格、統計數據與 NPC 資訊，決定每一件素材該「購買」、「製作」或是「採集」，最後生成的清楚明瞭的待辦清單將大幅提升您的作業效率。'
      },
      {
        q: '為什麼預估的市場價格看起來不準確？',
        a: '預估價格受多重因素影響：1. 市場資料並非即時同步，通常有數分鐘至數小時的延遲。 2. 系統會根據您在「設定」中選擇的「成本策略」（激進、平衡、保守）來過濾極端值（如使用 Q1 或中位數）。 3. 系統會自動比對市場與 NPC 售價並選取較低者，確保預估更貼近實際。此外，也請確認設定中的資料中心是否正確。'
      },
      {
        q: '製作所需時間是如何計算的？',
        a: '本網站目前的時間成本僅用非常簡單的粗估方法，製作一個物品30秒，高難製作耗費一分鐘，採集則是5秒一個物品，倘若你有很好的想法，歡迎前往<a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>提供想法'
      },
      {
        q: '為何有些物品顯示英文名字而不是我設定的繁體中文',
        a: '物品的翻譯名稱由廣大的社群維護及提供，有時候會缺少較新版本的物品的翻譯。本網站在遇到此類情況時，統一會改使用英文來顯示，確保網站可以正常運行'
      },
      {
        q: '為甚麼要把兔肉冷凍起來，可以烤來吃嗎？',
        a: '不可以'
      },
      {
        q: '關於網站現在的狀態',
        a: '網站現在在超先行測試運行中，很多東西還不是穩定狀態，但同時也在蒐集各方的意見，有Bug有任何意見歡迎前往 <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> 告訴我唷'
      }
    ],
    footer: '還有其他疑問嗎？歡迎透過 GitHub 回報或來信聯繫：{email}'
  },
  sponsorModal: {
    title: '支持冷凍兔肉的工坊',
    description: '感謝您的支持！由於支付平台（PayPal/Stripe）在台灣有區域轉帳限制，建議台灣玩家優先使用「台灣地區（綠界）」進行贊助，海外玩家則可使用「全球地區（Ko-fi）」。如有任何問題，請聯繫：{email}',
    twProvider: '台灣地區 (綠界科技)',
    twDesc: '支援超商代碼、ATM、國內信用卡，最適合台灣玩家支持。',
    globalProvider: '全球地區 (Ko-fi / PayPal)',
    globalDesc: '適合海外玩家，支援信用卡與 PayPal，且具備 Discord 自動身分組整合。'
  },
  exportModal: {
    title: '匯出 / 下載待辦清單',
    description: '您可以將目前的待辦清單匯出成一個單獨的離線 HTML 檔案。此檔案可以直接雙擊由瀏覽器開啟，也可以在不同裝置間傳遞。更棒的是，它仍然支援拖拉互換順序的功能！',
    includeMarket: '一併匯出市場價格與來源位置資訊',
    includeMarketDesc: '匯出的紀錄為定格的市場價格，若您很多天後才使用，價格可能會失準。',
    confirm: '確認下載 HTML'
  },
  welcomeModal: {
    title: '歡迎來到工坊',
    subtitle: '在你開始之前，請先選擇你偏好的語言',
    description: '這將會調整整個工坊的介面語言。你之後隨時可以在「工坊設定」中更改。',
    confirm: '就用這個語言開始吧！'
  }
}
