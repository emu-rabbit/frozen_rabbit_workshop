export default {
  app: {
    title: '冷冻兔肉的工坊',
    subtitle: '兔肉不私藏的好笔记本'
  },
  nav: {
    newNote: '写张新笔记',
    favorites: '收藏的小笔记',
    recommended: '兔肉私心笔记',
    history: '翻开旧笔记',
    settings: '工坊设置',
    sponsor: '赞助冷冻库电费',
    github: '开源源代码 (GitHub)',
    editor: '笔记工作台',
    faq: '常见问题'
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
    addToFavorites: '立刻将此笔记加入我的收藏',
    defaultTitle: '{name}的笔记'
  },
  history: {
    title: '翻开旧记录',
    description: '这里记录了你所有的历史制作清单，方便随时翻阅',
    autoDeleteWarning: '最多保留 20 条历史记录，超过时最旧的一条将会被自动删除。想要永久保留的笔记，请记得按下星号将它加入“收藏的小笔记”中喔！',
    emptyTitle: '笔记本目前是空白的喔',
    emptyDescription: '去“写张新笔记”开始你的第一步吧！',
    syncing: '回忆读取中...',
    itemsCount: '这张笔记里面有',
    noItems: '这张笔记空无一物。',
    unknownItem: '未知的神秘物品',
    unknownDate: '神秘的时间点',
    openWorkbench: '放上备料台'
  },
  editor: {
    title: '笔记工作台',
    description: '在此你可以贴上既有的笔记 JSON 进行二次编辑或是合并多张笔记。',
    importLabel: '请在此贴上笔记 JSON',
    importPlaceholder: '贴上从本站复制的笔记 JSON 字符串...',
    loadButton: '载入数据并开始编辑',
    mergeButton: '➕ 合并其他笔记 (JSON)',
    invalidJson: 'JSON 格式错误，请确认是否为本站导出的格式。',
    emptyState: '目前没有载入任何笔记',
    defaultMergedName: '合并的未命名笔记',
    backToImport: '返回重新导入'
  },
  workbench: {
    title: '备料台',
    description: '能工巧匠大大今天要买要做还是要自己采呢？在这里制定你的制作计划与开销总结吧！',
    view: {
      analyzing: '正在载入真实数据与市场价格...',
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
        priceSuffix: '/ 个',
        priceErrorTitle: '连接不稳定：市场价格更新失败',
        priceErrorDesc: '目前与 Universalis 服务器的连接不够稳定或发生错误。您仍然可以继续使用工作台进行设置，只是暂时无法看到最新的预估花费。系统会在您下次操作时再次尝试获取。'
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
        mbTitle: '市场板信息',
        q1Price: '1/4 分位数',
        medianPrice: '中位数',
        noListings: '市场板上目前无上架物品'
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
    export: '导出 / 下载清单',
    exportSuffix: '的待办清单',
    exportOfflineNote: '此清单为导出的离线版本。在这里进行的操作（如勾选项目）将不会回传同步至工坊网站中。',
    progress: '已完成 {n}/{total} 项',
    section: {
      other: '库存 / 其他来源',
      buy: '待购买物品',
      gather: '待采集物品',
      craft: '待制作物品'
    },
    targetQty: '目标',
    targetPrice: '参考单价',
    buySourceMarket: '市场版：{world}',
    buySourceVendor: 'NPC：{name} ({zone} X:{x} Y:{y})',
    gatherLocation: '采集点',
    emptySection: '此区块无项目'
  },
  jobs: {
    crp: '木工匠', bsm: '锻铁匠', arm: '铸甲匠', gsm: '雕金匠',
    lwr: '制革匠', wvr: '裁缝匠', alc: '炼金术士', cul: '烹调师',
    min: '采矿工', btn: '园艺工', fsh: '捕鱼人', gather: '采集'
  },
  settings: {
    title: '工坊设定',
    description: '调整工坊的各项偏好设定',
    language: '语言版本',
    languageDesc: '本网站的显示语言，缺乏翻译的情况下将显示英文',
    debugMode: '调试模式',
    debugModeDesc: '开启后可於创建新笔记时复制站长推荐 JSON 格式',
    langOptions: {
      tw: '繁體中文 (Traditional Chinese)',
      cn: '简体中文 (Simplified Chinese)',
      en: 'English',
      ja: '日本語 (Japanese)'
    },
    marketTitle: '市场数据设置',
    marketStrategyTitle: '市场成本策略',
    marketStrategyDesc: '设置备料台预估成本时所采用的市场数据基准，系统会同时自动与 NPC 售价进行比对并显示最低取得成本。',
    marketStrategyAggressive: '激進 (市场最低价)',
    marketStrategyBalanced: '平衡 (市场 1/4 分位数)',
    marketStrategyConservative: '保守 (市场中位数)',
    marketRegion: '市场地区',
    marketDC: '数据中心',
    marketDesc: '设置你要从哪一个市场地区及数据中心获取价格数据。',
    regions: {
      China: '中国',
      Japan: '日本',
      'North-America': '北美',
      Europe: '欧洲',
      Oceania: '大洋洲',
      'NA-Cloud-DC': '北美云端',
      '中国': '中国服',
      '한국': '韩国服',
      '繁中服': '國際繁中'
    },
    about: {
      title: '关于与致谢',
      description: '工坊背后的数据与技术支持',
      universalis: 'Universalis - 全球 FFXIV 市场数据缓存',
      teamcraft: 'Teamcraft - 物品、配方与采集数据来源',
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
        q: '为何有些成品的市价高于网站标示的成本不少？',
        a: '本网站提供的是「制作成本的估算」，方便你了解一件商品大约需要投入多少资源，但这并不等于它真正的市场售价。市场价格除了材料的成本以外，还会受到许多因素影响，包含但不限于市场地供给与需求状态、巧匠花的时间与心力成本、制作高难的装备筹备、魔晶石禁断成本、还有NQ风险以及材料建仓成本等。倘若供给远大于需求也可能发生市价低于成本的情况发生。本网站希望可以帮助你更理解市场，请将本网站标示的成本视为参考资讯，而不是市价的唯一因素。'
      },
      {
        q: '制作所需时间是如何计算的？',
        a: '本网站目前的时间成本仅用非常简单的粗估方法，制作一个物品30秒，高难制作耗費一分钟，采集则是5秒一个物品，倘若你有很好的想法，欢迎前往<a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>提供想法'
      },
      {
        q: '为何有些物品显示英文名字而不是我设定的简体中文',
        a: '物品的翻译名称由广大社区维护及提供，有时候会缺少较新版本的物品的翻译。本網站在遇到此類情況時，統一會改使用英文來顯示，確保網站可以正常運行'
      },
      {
        q: '为什么要把兔肉冷冻起来，可以烤来吃吗？',
        a: '不可以'
      },
      {
        q: '关于网站现在的状态',
        a: '网站现在在超先行测试运行中，很多东西还不是稳定状态，但同时也在搜集各方的意见，有Bug有任何意见欢迎前往 <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> 告诉我唷'
      }
    ],
    footer: '还有其他疑问吗？欢迎通过 GitHub 回报或来信联系：{email}'
  },
  sponsorModal: {
    title: '支持冷冻兔肉的工坊',
    description: '感謝您的支持！由於部分支付平台在台灣存在區域限制，建議台灣玩家優先使用「台灣地區」，海外玩家建議使用「全球地區」。如有任何問題，請聯繫：{email}',
    twProvider: '台湾地区 (绿界科技)',
    twDesc: '支持超商、ATM 与本地信用卡。',
    globalProvider: '全球地区 (Ko-fi / PayPal)',
    globalDesc: '适合海外玩家，支援信用卡与 PayPal，且具备 Discord 自动身分组整合。'
  },
  exportModal: {
    title: '导出 / 下载待办清单',
    description: '您可以将目前的待办清单导出成一个单独的离线 HTML 档案。此档案可以直接双击由浏览器开启，也可以在不同装置间传递。更棒的是，它仍然支援拖拉互换顺序的功能！',
    includeMarket: '一并导出市场价格与来源位置资讯',
    includeMarketDesc: '导出的纪录为定格的市场价格，若您很多天后才使用，价格可能会失准。',
    confirm: '确认下载 HTML'
  },
  welcomeModal: {
    title: '欢迎来到工坊',
    subtitle: '在你开始之前，请先选择你偏好的语言',
    description: '这将会调整整个工坊的界面语言。你之后随时可以在「工坊设置」中更改。',
    confirm: '就用这个语言开始吧！'
  }
}
