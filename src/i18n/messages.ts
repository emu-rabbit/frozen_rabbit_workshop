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
      settings: '設定'
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
      description: '這些是站長整理出來實用的清單，你可以隨意瀏覽、搜尋並直接放上備料台，或按星星收藏。',
      searchPlaceholder: '支援多國語系關鍵字搜尋...',
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
      itemsDescription: '輸入關鍵字（如「舊日王國」）查詢完整物品並準備分析',
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
      description: '在這裡制定你的製作計畫與開銷總結吧！',
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
          yield: '單次產量'
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
          budget: '預算依據當前伺服器依照市場最低價格做模擬買入計算，且價格來源經過快取，實際真實的價格需要看當下真正的市場價格而定',
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
      targetPrice: '參考單價',
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
      }
    },
    faq: {
      title: '常見問題',
      description: '這裡整理了一些大家常遇到的疑問與工坊的運作機制',
      items: [
        {
          q: '我使用了網站估算金錢成本，為什麼在遊戲裡的市場板看不到這個價格呢？',
          a: '網站顯示的成本是透過拉取指定大區的市場快取資料，並針對你的目標數量進行「模擬購買」後計算出的預估值。這會因為你實際所在的伺服器、資料更新非即時、以及市場波動等因素導致價格偏差。另外也請多加留意「設定」區中的市場來源設定是否正確喔（預設為繁中服大區）。'
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
      faq: '常見問題',
      settings: '设定'
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
      description: '这些是站长整理出来实用的清单，你可以随意浏览、搜寻并直接放上备料台，或按星星收藏。',
      searchPlaceholder: '支援多国语系关键字搜寻...',
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
      itemsDescription: '输入关键字（如“旧日王国”）查询完整物品并准备分析',
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
      description: '在这里制定你的制作计画与开销总结吧！',
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
          yield: '单次产量'
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
      targetPrice: '参考单价',
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
      }
    },
    faq: {
      title: '常見問題',
      description: '這裡整理了一些大家常遇到的疑問與工坊的運作機制',
      items: [
        {
          q: '我使用了网站估算金钱成本，为什么在游戏里的市场板看不到这个价格呢？',
          a: '网站显示的成本是通过拉取指定大区的市场快取资料，并针对你的目标数量进行“模拟购买”后计算出的预估值。这会因为你实际所在的服务器、资料更新非即时、以及市场波动等因素导致价格偏差。另外也请多加留意“设定”区中的市场来源设定是否正确喔（预设为繁中服大区）。'
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
      settings: 'Settings'
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
      description: 'These are practical lists compiled by the rabbit. Browse, search, use them, or star them for later.',
      searchPlaceholder: 'Search notes (multi-language support)...',
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
      itemsDescription: 'Search and pick items you want to plan for.',
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
      description: 'Plan your crafting strategies and expenses right here!',
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
          yield: 'Yield'
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
      targetPrice: 'Ref. Price',
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
      }
    },
    faq: {
      title: 'FAQ',
      description: 'Frequently asked questions and how the workshop handles data.',
      items: [
        {
          q: 'Why are the market costs estimated here different from what I see in-game?',
          a: 'The costs displayed on the website are estimates calculated by simulating purchases using cached market data from your specified region. Because this data is not real-time, and due to server-specific pricing fluctuations and other market variables, actual prices may differ. Please ensure your "Region" and "Data Center" in Settings match your in-game location (default is Prosperous/TW server).'
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
      settings: '設定'
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
      description: 'うさぎがまとめた便利なリストだよ。検索して仕込み台に置いたり、お気に入りに追加してね。',
      searchPlaceholder: 'ノートを検索（多言語対応）...',
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
      itemsDescription: 'キーワードを入れてアイテムを探そう！',
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
      emptyTitle: 'ノートはまだ真っ白だよ',
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
      description: 'ここで制作の計画とコストをまとめよう！',
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
          yield: '製作数'
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
      targetPrice: '参考単価',
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
      }
    },
    faq: {
      title: 'よくある質問',
      description: '工坊の使い方や、よくある疑問についてまとめています。',
      items: [
        {
          q: 'サイトで表示される市場コストがゲーム内と違うのはなぜですか？',
          a: 'サイトのコストは、指定されたデータセンターのキャッシュデータを用いて「目標数分を購入した」と仮定して算出されたシミュレーション価格です。データはリアルタイムではなく、サーバーごとの物価変動やその他の要素により、実際のゲーム内価格とは異なる場合があります。また、「設定」でマーケットデータの取得先が正しいか（デフォルトは繁中鯖です）も確認してください。'
        }
      ]
    }
  }
}
