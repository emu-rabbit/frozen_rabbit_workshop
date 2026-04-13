export const messages = {
  tw: {
    app: {
      title: '冷凍兔肉的工坊',
      subtitle: '兔肉不私藏的好筆記本'
    },
    nav: {
      newNote: '寫張新筆記',
      favorites: '收藏的小筆記',
      recommended: '兔肉私心筆記',
      history: '翻開舊紀錄',
      faq: '常見問題',
      settings: '設定',
      github: 'GitHub 專案',
      sponsor: '贊助冷凍庫電費'
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
      addToFavorites: '立刻將此筆記加入我的收藏'
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
    workbench: {
      title: '備料台',
      description: '巧匠大大今天要買要做還是要自己採呢？在這裡制定你的製作計畫與開銷總結吧！',
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
          priceSuffix: '/ 個'
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
          generateList: '生成代辦清單'
        },
        tooltip: {
          budget: '預算依據當前伺服器依照市場最低價格做模擬買入計算，且價格來源經過快取，實際真實價格需要看當下真正的市場價格而定',
          time: '時間僅僅是大略的估算，實際的耗費時間將依照使用者的生產採集裝備數值而定，另外也會受到限時採集點的影響'
        }
      }
    },
    todo: {
      title: '代辦清單',
      backToWorkbench: '返回備料台',
      progress: '已完成 {n}/{total} 項',
      section: {
        other: '庫存 / 其他來源',
        buy: '待購買物品',
        gather: '待採集物品',
        craft: '待製作物品'
      },
      targetQty: '目標',
      targetPrice: '最低售價',
      buySourceMarket: '市場版：{world}',
      buySourceVendor: 'NPC：{name} ({zone} X:{x} Y:{y})',
      gatherLocation: '採集點',
      emptySection: '此區塊無項目'
    },
    jobs: {
      crp: '木工師', bsm: '鍛鐵師', arm: '鑄甲師', gsm: '雕金師',
      lwr: '製革師', wvr: '裁縫師', alc: '鍊金術士', cul: '烹調師',
      min: '採礦工', btn: '園藝工', fsh: '釣魚人', gather: '採集'
    },
    settings: {
      title: '工坊設定',
      description: '調整工坊的各項偏好設定',
      language: '語言版本',
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
      marketDesc: '設定你要從哪一個資料中心獲取市場價格資料。',
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
          q: '為甚麼要把兔肉冷凍起來，可以烤來吃嗎？',
          a: '不可以'
        },
        {
          q: '關於網站現在的狀態',
          a: '網站現在在超先行測試運行中，很多東西還不是穩定狀態，但同時也在蒐集各方的意見，有Bug有任何意見歡迎前往 <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> 告訴我唷'
        }
      ]
    }
  },
  cn: {
    app: {
      title: '冷冻兔肉的工坊',
      subtitle: '兔肉不私藏的好笔记本'
    },
    nav: {
      newNote: '写张新笔记',
      favorites: '收藏的小笔记',
      recommended: '兔肉私心笔记',
      history: '翻开舊紀錄',
      faq: '常见问题',
      settings: '设定',
      github: 'GitHub 项目',
      sponsor: '赞助冷冻库电费'
    },
    noteCard: {
      addFavorite: '加入我的收藏',
      removeFavorite: '取消收藏',
      delete: '删除纪录',
      exportNote: '导出笔记 (JSON)'
    },
    favorites: {
      title: '收藏的小笔记',
      description: '在这里管理你最常用的制作清单',
      emptyTitle: '还没有收藏的笔记',
      emptyDescription: '在“翻开旧纪录”中点击星星來收藏吧！'
    },
    recommended: {
      title: '兔肉私心笔记',
      description: '这些是站长整理出来实用的清单。可以用空格键串联检索条件。',
      searchPlaceholder: '搜索...',
      emptyTitle: '找不到相符的笔记',
      emptyDescription: '换个关键字试试看吧！'
    },
    newNote: {
      title: '写张新笔记',
      description: '输入笔记名称与欲追踪的物品以建立配方清单',
      labelTitle: '笔记名称',
      placeholderTitle: '例如：640HQ 装备储备、生产用半成品...',
      copyJson: '导出此笔记 (JSON)',
      itemsTitle: '放上备料台的物品',
      itemsDescription: '输入关键字（如“白金”）查询物品，亦支援英文搜索',
      searchPlaceholder: '寻觅物品...',
      searching: '兔兔在字典里寻找中...',
      notFound: '找不到这个东西，换个关键字吧',
      initialSearch: '输入物品名称开始',
      addRow: '还需要准备其他东西？',
      rowHint: '* 必须确保上一列已经填入并选择物品后，才能继续新增。',
      save: '好，把这些放上备料台！',
      addToFavorites: '立刻将此笔记加入我的收藏'
    },
    history: {
      title: '翻开旧纪录',
      description: '这里记录了你所有的历史制作清单，方便随时翻閱',
      autoDeleteWarning: '最多保留 20 筆歷史紀錄，超過時最舊的一筆將會被自動刪除。想要永久保留的筆記，請記得按下星號將它加入「收藏的小筆記」中喔！',
      emptyTitle: '笔记本目前是空白的喔',
      emptyDescription: '去“写张新笔记”开始你的第一步吧！',
      syncing: '回忆读取中...',
      itemsCount: '这张笔记里面有',
      noItems: '这张笔记空无一物。',
      unknownItem: '未知的神秘物品',
      unknownDate: '神秘的时间点',
      openWorkbench: '放上备料台'
    },
    workbench: {
      title: '备料台',
      description: '巧匠大大今天要买要做还是要自己采呢？在这里制定你的制作计画与开销总结吧！',
      view: {
        analyzing: '正在载入真实资料与市场价格...',
        emptyTitle: '目前没有备料计划',
        emptyDescription: '去「写张新笔记」開始你的第一步吧！',
        prepping: '正在备料',
        source: {
          buy: '购买',
          craft: '制作',
          gather: '采集',
          other: '库存 (其他)',
          cannotCraft: '不可制作',
          cannotGather: '不可采集'
        },
        status: {
          missing: '尚缺 {n} 个',
          excess: '多出 {n} 个',
          mismatch: '目前的数量分配与目标对不上哦，请检查一下各个项目的数字是否正确！',
          nonePrice: '无上架',
          priceSuffix: '/ 个'
        },
        details: {
          gatherTitle: '采集地点与详情',
          limited: '限时',
          unknownZone: '未知地点',
          spawnTime: '出现时间',
          duration: '持续 {n} 小时',
          craftTitle: '制作配方需求',
          yield: '单次产量',
          vendorTitle: 'NPC 贩售信息',
          vendorDesc: 'NPC 在售 单价 {price} Gil {location}',
          mbTitle: '市场版贩售信息',
          q1Price: '1/4 分位数',
          medianPrice: '中位数',
          noListings: '市场版上目前无上架物品'
        },
        summary: {
          budgetTitle: '物资筹备预算',
          time: '预计时间耗费',
          cannotEstimate: '无法预估',
          hours: '小时',
          mins: '分',
          secs: '秒'
        },
        button: {
          reset: '重设',
          generateList: '生成待办清单'
        },
        tooltip: {
          budget: '预算依据当前服务器依照市场最低价格做模拟买入计算，且价格来源经过快取，实际真实的价格需要看当下真正的市场价格而定',
          time: '时间仅仅是大略的估算，實際的耗費時間將依照使用者的生產採集裝備數值而定，另外也會受到限時採集點的影响'
        }
      }
    },
    todo: {
      title: '待办清单',
      backToWorkbench: '返回备料台',
      progress: '已完成 {n}/{total} 项',
      section: {
        other: '库存 / 其他来源',
        buy: '待购买物品',
        gather: '待采集物品',
        craft: '待制作物品'
      },
      targetQty: '目标',
      targetPrice: '最低售价',
      buySourceMarket: '市场版：{world}',
      buySourceVendor: 'NPC：{name} ({zone} X:{x} Y:{y})',
      gatherLocation: '采集点',
      emptySection: '此区块无项目'
    },
    jobs: {
      crp: '木工师', bsm: '锻铁师', arm: '铸甲师', gsm: '雕金师',
      lwr: '制革师', wvr: '裁缝师', alc: '炼金术士', cul: '烹调师',
      min: '采矿工', btn: '园艺工', fsh: '钓鱼人', gather: '采集'
    },
    settings: {
      title: '工坊设定',
      description: '调整工坊的各项偏好设定',
      language: '语言版本',
      debugMode: '调试模式',
      debugModeDesc: '开启后可於创建新笔记时复制站长推荐 JSON 格式',
      langOptions: {
        tw: '繁體中文 (Traditional Chinese)',
        cn: '简体中文 (Simplified Chinese)',
        en: 'English',
        ja: '日本語 (Japanese)'
      },
      marketTitle: '市场资料设定',
      marketStrategyTitle: '市场版成本策略',
      marketStrategyDesc: '设定备料台预估成本时所采用的市场数据基准，系统会同时自动与 NPC 售价进行比对并显示最低取得成本。',
      marketStrategyAggressive: '激进 (市场最低价)',
      marketStrategyBalanced: '平衡 (市场 1/4 位数)',
      marketStrategyConservative: '保守 (市场中位数)',
      marketRegion: '市场地区',
      marketDC: '资料中心',
      marketDesc: '设定你要从哪一个数据中心获取市场价格数据。',
      regions: {
        China: '中国',
        Japan: '日本',
        'North-America': '北美',
        Europe: '欧洲',
        Oceania: '大洋洲',
        'NA-Cloud-DC': '北美云端',
        '中国': '中国服',
        '한국': '韩国服',
        '繁中服': '繁中服'
      },
      about: {
        title: '关于与致谢',
        description: '工坊背后的资料与技术支持',
        universalis: 'Universalis - 全球 FFXIV 市场资料缓存',
        teamcraft: 'Teamcraft - 物品、配方与采集资料来源',
        xivapi: 'XIVAPI - 提供游戏内图标与物品 API 支持'
      }
    },
    faq: {
      title: '常见问题',
      description: '这里整理了一些大家常遇到的疑问与工坊的运作机制',
      items: [
        {
          q: '这网站是做什么用的？',
          a: '本网站设计给 FFXIV 的巧匠玩家，提供批次准备管理功能。您可以同时展开多个配方，通过系统整合的市场价格、统计数据与 NPC 信息，决定每一件素材该「购买」、「制作」或是「采集」，最后生成的清楚明了的待办清单将大幅提升您的作业效率。'
        },
        {
          q: '为什么预估的市场价格看起来不准确？',
          a: '预估价格受多重因素影响：1. 市场数据并非实时同步，通常有数分钟至数小时的延迟。 2. 系统会根据您在「设置」中选择的「成本策略」（激进、平衡、保守）来过滤极端值（如使用 Q1 或中位数）。 3. 系统会自动比对市场与 NPC 售价并选取较低者，确保预估更贴近实际。此外，也请确认设置中的数据中心是否正确。'
        },
        {
          q: '制作所需时间是如何计算的？',
          a: '本网站目前的时间成本仅用非常简单的粗估方法，制作一个物品30秒，高难制作耗费一分钟，采集则是5秒一个物品，倘若你有很好的想法，欢迎前往<a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>提供想法'
        },
        {
          q: '为什么要把兔肉冷冻起来，可以烤来吃吗？',
          a: '不可以'
        },
        {
          q: '关于网站现在的状态',
          a: '网站现在在超先行测试运行中，很多东西还不是稳定状态，但同時也在搜集各方的意见，有Bug有任何意见欢迎前往 <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> 告诉我唷'
        }
      ]
    }
  },
  en: {
    app: {
      title: "Frozen Rabbit's Workshop",
      subtitle: 'A cozy crafting notebook'
    },
    nav: {
      newNote: 'Write a New Note',
      favorites: 'Favorite Notes',
      recommended: 'Rabbit\'s Picks',
      history: 'Historical Records',
      faq: 'FAQ',
      settings: 'Settings',
      github: 'GitHub Project',
      sponsor: 'Fuel for the freezer'
    },
    noteCard: {
      addFavorite: 'Add to Favorites',
      removeFavorite: 'Remove from Favorites',
      delete: 'Delete Record',
      exportNote: 'Export JSON'
    },
    favorites: {
      title: 'Favorite Notes',
      description: 'Manage your most frequently used crafting lists here.',
      emptyTitle: 'No favorites yet',
      emptyDescription: 'Click the star in "Historical Records" to add some!'
    },
    recommended: {
      title: 'Rabbit\'s Picks',
      description: 'Practical lists compiled by the rabbit. Use spaces to link search criteria.',
      searchPlaceholder: 'Search...',
      emptyTitle: 'No Matching Notes Found',
      emptyDescription: 'Try a different keyword!'
    },
    newNote: {
      title: 'Jot a New Note',
      description: 'Enter a name and pick items to throw onto your prep table',
      labelTitle: 'Note Name',
      placeholderTitle: 'e.g., 640HQ gear prep, intermediate materials...',
      copyJson: 'Copy as Recommended Format',
      itemsTitle: 'Items on Prep Table',
      itemsDescription: 'Search and pick items you want to plan for (e.g., "Platinum").',
      searchPlaceholder: 'Hunting for...',
      searching: 'Bunnies checking the dictionary...',
      notFound: 'Cannot find this. Try another word!',
      initialSearch: 'Type to begin',
      addRow: 'Need anything else?',
      rowHint: '* Fill out the previous row before adding another.',
      save: 'Toss these on the Workbench!',
      addToFavorites: 'Add to favorites immediately'
    },
    history: {
      title: 'Dusty Records',
      description: 'Your previous crafting lists are recorded here for easy access.',
      autoDeleteWarning: 'A maximum of 20 historical records are kept. Be sure to star the notes you wish to permanently save in your favorites!',
      emptyTitle: 'Notebook is empty',
      emptyDescription: 'Go to Jot New Note and plan your first craft!',
      syncing: 'Recalling memories...',
      itemsCount: 'Items inside',
      noItems: 'Nothing inside this note.',
      unknownItem: 'Mystery Item',
      unknownDate: 'Mystery Date',
      openWorkbench: 'To Workbench'
    },
    workbench: {
      title: 'The Workbench',
      description: 'Hey master crafter, are we buying, making, or gathering today? Plan your crafting strategies and expenses right here!',
      view: {
        analyzing: 'Fetching live data and market prices...',
        emptyTitle: 'No active planning',
        emptyDescription: 'Go to "Write a New Note" to start your journey!',
        prepping: 'In Prep',
        source: {
          buy: 'Market',
          craft: 'Craft',
          gather: 'Gather',
          other: 'Stock+',
          cannotCraft: 'No Recipe',
          cannotGather: 'No Node'
        },
        status: {
          missing: '{n} more needed',
          excess: '{n} in excess',
          mismatch: "The numbers don't seem to add up! Please double-check your quantity allocation.",
          nonePrice: 'No Listing',
          priceSuffix: '/ ea'
        },
        details: {
          gatherTitle: 'Gathering Details',
          limited: 'Timed',
          unknownZone: 'Unknown Zone',
          spawnTime: 'Spawns',
          duration: 'Lasts {n}h',
          craftTitle: 'Crafting Recipe',
          yield: 'Yield',
          vendorTitle: 'NPC Vendor Info',
          vendorDesc: 'Sold by NPC: {price} Gil in {location}',
          mbTitle: 'Market Board Listings',
          q1Price: '1/4 Percentile',
          medianPrice: 'Median Price',
          noListings: 'No active listings found on Market Board'
        },
        summary: {
          budgetTitle: 'Materials Budget',
          time: 'Estimated Time',
          cannotEstimate: 'Undetermined',
          hours: 'hr',
          mins: 'min',
          secs: 'sec'
        },
        button: {
          reset: 'Reset',
          generateList: 'Generate Todo List'
        },
        tooltip: {
          budget: 'Budget is calculated as a simulated purchase based on the lowest current market prices. Prices are cached and may differ from live values.',
          time: 'Time is a rough estimation based on common crafting/gathering flow. Actual speed depends on your stats and timed node availability.'
        }
      }
    },
    todo: {
      title: 'Todo List',
      backToWorkbench: 'Back to Workbench',
      progress: '{n}/{total} Completed',
      section: {
        other: 'Stock & Other Sources',
        buy: 'Items to Purchase',
        gather: 'Items to Gather',
        craft: 'Items to Craft'
      },
      targetQty: 'Target',
      targetPrice: 'Lowest Price',
      buySourceMarket: 'Market: {world}',
      buySourceVendor: 'NPC: {name} ({zone} X:{x} Y:{y})',
      gatherLocation: 'Node',
      emptySection: 'No items in this section'
    },
    jobs: {
      crp: 'Carpenter', bsm: 'Blacksmith', arm: 'Armorer', gsm: 'Goldsmith',
      lwr: 'Leatherworker', wvr: 'Weaver', alc: 'Alchemist', cul: 'Culinarian',
      min: 'Miner', btn: 'Botanist', fsh: 'Fisher', gather: 'Gathering'
    },
    settings: {
      title: 'Workshop Settings',
      description: 'Adjust the workshop language to your liking',
      language: 'Language',
      debugMode: 'Debug Mode',
      debugModeDesc: 'Enable to copy recommended JSON format when creating new notes',
      langOptions: {
        tw: '繁體中文 (Traditional Chinese)',
        cn: '简体中文 (Simplified Chinese)',
        en: 'English',
        ja: '日本語 (Japanese)'
      },
      marketTitle: 'Market Data Source',
      marketRegion: 'Region',
      marketDC: 'Data Center',
      marketDesc: 'Select the data center you wish to fetch market price data from.',
      regions: {
        China: 'China',
        Japan: 'Japan',
        'North-America': 'North America',
        Europe: 'Europe',
        Oceania: 'Oceania',
        'NA-Cloud-DC': 'NA Cloud',
        '中国': 'China Server',
        '한국': 'KT (Korea)',
        '繁中服': 'TW Server'
      },
      marketStrategyTitle: 'Market Cost Strategy',
      marketStrategyDesc: 'Select the market data benchmark used for cost estimation. We also automatically compare this with NPC prices to show the lowest possible cost.',
      marketStrategyAggressive: 'Aggressive (Min Price)',
      marketStrategyBalanced: 'Balanced (Q1 Price)',
      marketStrategyConservative: 'Conservative (Median Price)',
      about: {
        title: 'About & Credits',
        description: 'Data sources and technical support behind the workshop',
        universalis: 'Universalis - Global FFXIV market data cache',
        teamcraft: 'Teamcraft - Source for item, recipe, and gathering data',
        xivapi: 'XIVAPI - FFXIV icon and item API support'
      }
    },
    faq: {
      title: 'FAQ',
      description: 'Frequently asked questions and how the workshop handles data.',
      items: [
        {
          q: 'What is this website for?',
          a: 'This website is designed for FFXIV crafters to manage batch preparations for items. By providing integrated market prices, statistics, and NPC information, it helps you decide whether to buy, craft, or gather materials. Finally, it generates a comprehensive Todo list to streamline your workflow.'
        },
        {
          q: 'Why do the estimated market costs seem inaccurate?',
          a: 'Estimated costs are influenced by several factors: 1. Market data is cached and not real-time (minutes to hours old). 2. The system filters prices based on your selected "Cost Strategy" (Aggressive, Balanced, Conservative) using statistical markers like Q1 or Median. 3. It automatically compares market prices against NPC vendor prices to show the lowest acquisition cost. Please also ensure your Data Center settings are correct.'
        },
        {
          q: 'How is the estimated time calculated?',
          a: 'Currently, the estimated time uses a very simplified calculation: 30 seconds for regular crafting, 1 minute for high-difficulty crafting, and 5 seconds per item for gathering. If you have better ideas for calculation, feel free to open a <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>!'
        },
        {
          q: 'Why freeze the rabbit? Can I roast it instead?',
          a: 'No.'
        },
        {
          q: 'Current status of the website',
          a: 'The website is currently in an early alpha testing phase and many features are not yet stable. We are collecting feedback from all sources. If you encounter bugs or have suggestions, please let us know on <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>.'
        }
      ]
    }
  },
  ja: {
    app: {
      title: '冷凍ラビットの工房',
      subtitle: 'うさぎさん専用の制作ノート'
    },
    nav: {
      newNote: '新しいノートを書く',
      favorites: 'お気に入り<br />ノート',
      recommended: 'うさぎの<br />オススメ',
      history: '過去の記録<br />をめくる',
      faq: 'よくある<br />質問',
      settings: '設定',
      github: 'GitHub プロジェクト',
      sponsor: '冷凍庫の電気代を支援'
    },
    noteCard: {
      addFavorite: 'お気に入りに追加',
      removeFavorite: 'お気に入りから削除',
      delete: '記録を削除',
      exportNote: 'JSON 形式で出力'
    },
    favorites: {
      title: 'お気に入りノート',
      description: 'よく使う制作リストをここで管理しよう。',
      emptyTitle: 'お気に入りはまだないよ',
      emptyDescription: '「過去の紀錄」で星マークを押して追加してね！'
    },
    recommended: {
      title: 'うさぎのオススメ',
      description: 'うさぎがまとめた便利なリストです。スペース区切りで条件を串聯（同時指定）できます。',
      searchPlaceholder: '検索...',
      emptyTitle: '見つからないみたい',
      emptyDescription: '別のキーワードを試してね！'
    },
    newNote: {
      title: '新しくノートを書く',
      description: 'ノートの名前を決めて、仕込み台に置きたいアイテムを選んでね！',
      labelTitle: 'ノートの名前',
      placeholderTitle: '例：レイド用装備、素材まとめ...',
      copyJson: '推奨形式としてコピー',
      itemsTitle: '仕込み台に置くアイテム',
      itemsDescription: 'キーワードを入れてアイテムを探そう！（例：「白金」）',
      searchPlaceholder: 'アイテムを探す...',
      searching: 'うさぎが辞書を引いています...',
      notFound: '見つからないみたい...別の言葉を試してね',
      initialSearch: '名前を入れてね',
      addRow: '他に欲しいものはある？',
      rowHint: '* 追加する前に今選んでいるアイテムを決めてね！',
      save: 'よし、これを仕込み台へ！',
      addToFavorites: '同時にお気に入りに追加する'
    },
    history: {
      title: '過去の記録をめくる',
      description: '過去の製作リストがここに記録されるよ。いつでも見返せるね。',
      autoDeleteWarning: '履歴は最大20件まで保存され、自動的に古いものから消えていくよ。大切にしたいノートは星マークを押して「お気に入り」に保存してね！',
      emptyTitle: 'ノートは還まだ真っ白だよ',
      emptyDescription: '「新しいノートを書く」から始めてみてね！',
      syncing: '思い出を探しています...',
      itemsCount: '入っているアイテム',
      noItems: '何も入ってないよ。',
      unknownItem: '謎のアイテム',
      unknownDate: '謎の時間',
      openWorkbench: '仕込み台へ'
    },
    workbench: {
      title: '仕込み台',
      description: '職人さん、今日はマーケットで買う？それとも自分で作る？採集しちゃう？ここで制作の計画とコストをまとめよう！',
      view: {
        analyzing: '市場価格とデータを取得中...',
        emptyTitle: '現在、計画はありません',
        emptyDescription: '「新しいノートを書く」から始めてね！',
        prepping: '準備中',
        source: {
          buy: '購入',
          craft: '製作',
          gather: '採集',
          other: '在庫+',
          cannotCraft: '製作不可',
          cannotGather: '採集不可'
        },
        status: {
          missing: 'あと {n} 個',
          excess: '{n} 個多い',
          mismatch: '数量の配分が目標と合っていないようです。各項目の数字を見直してみてくださいね。',
          nonePrice: '出品なし',
          priceSuffix: '/ 個'
        },
        details: {
          gatherTitle: '採集場所と詳細',
          limited: 'ＥＴ限定',
          unknownZone: '未知の場所',
          spawnTime: '出現時間',
          duration: '{n} 時間持続',
          craftTitle: '製作レシピ',
          yield: '製作数',
          vendorTitle: 'NPC販売情報',
          vendorDesc: 'NPC販売: {price} Gil {location}',
          mbTitle: 'マーケットボード販売情報',
          q1Price: '第1四分位数',
          medianPrice: '中央値',
          noListings: '現在、マーケットボードに出品はありません'
        },
        summary: {
          budgetTitle: '素材準備費用',
          time: '予想所要時間',
          cannotEstimate: '判定不能',
          hours: '時間',
          mins: '分',
          secs: '秒'
        },
        button: {
          reset: 'リセット',
          generateList: 'やることリストを作成'
        },
        tooltip: {
          budget: '予算は現在のマーケットの最安値に基づいた模擬購入によって計算されています。価格はキャッシュされているため、実際の相場とは異なる場合があります。',
          time: '所要時間は一般的な製作・採集フローに基づく概算です。装備や限定ノードの状況により変動します。'
        }
      }
    },
    todo: {
      title: 'やることリスト',
      backToWorkbench: '仕込み台に戻る',
      progress: '{n}/{total} 完了',
      section: {
        other: '在庫・その他',
        buy: '購入するもの',
        gather: '採集するもの',
        craft: '制作するもの'
      },
      targetQty: '目標',
      targetPrice: '最低販売価格',
      buySourceMarket: 'マケボ: {world}',
      buySourceVendor: 'NPC: {name} ({zone} X:{x} Y:{y})',
      gatherLocation: '採集ポイント',
      emptySection: 'このセクションには項目がありません'
    },
    jobs: {
      crp: '木工師', bsm: '鍛冶師', arm: '甲冑師', gsm: '彫金師',
      lwr: '革細工師', wvr: '裁縫師', alc: '錬金術士', cul: '調理師',
      min: '採掘師', btn: '園芸師', fsh: '漁師', gather: '採集'
    },
    settings: {
      title: '工房の設定',
      description: '工房の言葉を調整してね',
      language: '言語',
      debugMode: 'デバッグモード',
      debugModeDesc: 'オンにすると新しくノートを書く時に推奨 JSON 形式をコピーできます',
      langOptions: {
        tw: '繁體中文 (Traditional Chinese)',
        cn: '简体中文 (Simplified Chinese)',
        en: 'English',
        ja: '日本語 (Japanese)'
      },
      marketTitle: 'マーケットデータ設定',
      marketRegion: 'リージョン',
      marketDC: 'データセンター',
      marketDesc: 'マーケット価格を取得するデータセンターを設定します。',
      regions: {
        China: '中国',
        Japan: '日本',
        'North-America': '北米',
        Europe: '欧州',
        Oceania: 'オセアニア',
        'NA-Cloud-DC': '北米クラウド',
        '中国': '中国鯖',
        '한국': '韓国鯖',
        '繁中服': '繁中鯖'
      },
      marketStrategyTitle: 'マーケットコスト戦略',
      marketStrategyDesc: 'コスト見積もりに使用する市場データの基準を選択します。NPCの販売価格とも自動的に比較し、最も安い取得コストを表示します。',
      marketStrategyAggressive: '積極的 (最安値)',
      marketStrategyBalanced: '標準 (第1四分位数)',
      marketStrategyConservative: '保守的 (中央値)',
      about: {
        title: 'このサイトについて',
        description: '工房を支えるデータソースと技術支援',
        universalis: 'Universalis - FFXIV 全世界のマーケットデータ',
        teamcraft: 'Teamcraft - アイテム、レシピ、採集データのソース',
        xivapi: 'XIVAPI - アイコンとアイテムの API サポート'
      }
    },
    faq: {
      title: 'よくある質問',
      description: '工坊の使い方や、よくある疑問についてまとめています。',
      items: [
        {
          q: 'このサイトはどのような目的で使われますか？',
          a: 'このサイトは FFXIV のクラフター向けに設計されており、製作したいアイテムを一括で準備・管理するためのツールです。市場価格、統計データ、NPC販売情報などを統合的に参照することで、「購入」「製作」「採集」のどれにするかを決定し、最終的に生成される分かりやすい代行リストによって作業効率を大幅に向上させることができます。'
        },
        {
          q: 'サイトで表示される市場コストがゲーム内と違うのはなぜですか？',
          a: '見積もり価格はいくつかの要因に影響されます：1. 市場データはリアルタイムではなく数分〜数時間のキャッシュデータです。 2. システムは「設定」で選択された「コスト戦略」（積極的、標準、保守的）に基づき、Q1や中央値などの統計指標を使用して価格を算出しています。 3. 市場価格とNPC販売価格を自動的に比較し、より安価な方を採用しています。また、データセンターの設定が正しいかも確認してください。'
        },
        {
          q: '所要時間はどのように計算されていますか？',
          a: '現在の所要時間は非常に単純な概算に基づいています。通常の製作は1アイテム30秒、高難易度製作は1分、採集は1アイテムにつき5秒として計算しています。より良い計算方法のアイデアがあれば、ぜひ<a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>で提案してください！'
        },
        {
          q: 'どうしてうさぎを冷凍するのですか？焼いて食べてもいいですか？',
          a: 'ダメです。'
        },
        {
          q: 'サイトの現在の状態について',
          a: 'このサイトは現在アルファテスト段階にあり、多くの機能が不安定な状態です。現在、皆様からのフィードバックを募集しています。バグ報告や改善の提案がありましたら、お気軽に <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> までお寄せください！'
        }
      ]
    }
  }
}
