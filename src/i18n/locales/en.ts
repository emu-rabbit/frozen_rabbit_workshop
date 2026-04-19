export default {
  app: {
    title: "Frozen Rabbit's Workshop",
    subtitle: 'A cozy crafting notebook'
  },
  nav: {
    newNote: 'Write a New Note',
    favorites: 'Favorite Notes',
    recommended: 'Rabbit\'s<br />Recommended',
    history: 'Open Past<br />Notes',
    settings: 'Settings',
    sponsor: 'Sponsor the Freezer bill',
    github: 'Source Code (GitHub)',
    editor: 'Note Workbench',
    faq: 'FAQ'
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
    addToFavorites: 'Add to favorites immediately',
    defaultTitle: '{name}\'s Note'
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
  editor: {
    title: 'Note Workbench',
    description: 'Paste existing note JSON here to edit or merge multiple notes.',
    importLabel: 'Paste Note JSON',
    importPlaceholder: 'Paste note JSON string copied from this site...',
    loadButton: 'Load Data & Start Editing',
    mergeButton: '➕ Merge Other Note (JSON)',
    invalidJson: 'Invalid JSON format. Please check the content.',
    emptyState: 'No note loaded yet',
    defaultMergedName: 'Merged Unnamed Note',
    backToImport: 'Back to Import'
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
        priceSuffix: '/ ea',
        priceErrorTitle: 'Connection Unstable: Market Price Update Failed',
        priceErrorDesc: 'The connection to the Universalis server is currently unstable or encountered an error. You can still use the workbench to set up your craft, but estimated costs will be temporarily unavailable. The system will try to fetch them again on your next action.'
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
    targetPrice: 'Reference Price',
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
    languageDesc: 'Display language for the website. English will be shown if translations are missing.',
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
    marketDesc: 'Select the region and data center you wish to fetch market price data from.',
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
        q: 'Why do some items show English names instead of my selected language?',
        a: 'Item translations are provided and maintained by the community. Sometimes translations for newly added items are missing. In such cases, the workshop defaults to English to ensure the application remains functional.'
      },
      {
        q: 'Why freeze the rabbit? Can I roast it instead?',
        a: 'No.'
      },
      {
        q: 'Current status of the website',
        a: 'The website is currently in an early alpha testing phase and many features are not yet stable. We are collecting feedback from all sources. If you encounter bugs or have suggestions, please let us know on <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>.'
      }
    ],
    footer: 'Have more questions? Feel free to report on GitHub or email: {email}'
  },
  sponsorModal: {
    title: 'Support Frozen Rabbit',
    description: 'Thank you for your support! Please choose your preferred region to ensure a smooth donation process. Contact: {email}',
    twProvider: 'Taiwan (ECPay)',
    twDesc: 'Best for supporters in Taiwan. Supports local cards and convenience stores.',
    globalProvider: 'Global (Ko-fi / PayPal)',
    globalDesc: 'Best for international supporters. Supports Discord integration.'
  },
  welcomeModal: {
    title: 'Welcome to the Workshop',
    subtitle: 'Please select your preferred language before we begin',
    description: 'This will adjust the entire workshop interface. You can change this anytime in "Workshop Settings".',
    confirm: 'Start with this language!'
  }
}
