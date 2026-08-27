export default {
  gameData: {
    islandGranary: 'グラナリーオフィス',
    islandFarming: '開拓耕作',
    islandPasture: '開拓飼育',
    cancel: 'キャンセル',
    repairConfirm: '再取得して再読み込み',
    title: 'ゲームデータのキャッシュ',
    version: '使用中のデータバージョン',
    cacheDescription: '再ダウンロードを減らすため、この端末にデータを保存します。ページを開くたびに更新を確認します。',
    cacheUnavailable: '端末へのキャッシュ保存ができないため、オンラインデータを使用しています。メモやお気に入りには影響しません。',
    repair: 'ゲームデータのキャッシュを削除して再取得',
    repairWarning: 'ゲームデータのキャッシュのみを削除します。保存済みのメモ、お気に入り、設定は削除しません。ページを再読み込みすると、未保存の編集と素材の割り当てが失われます。続行しますか？',
    reloadWarning: '新しいゲームデータのダウンロードが完了し、利用できるようになりました。適用するタイミングを選べます。',
    updateReady: '新しいゲームデータの更新が見つかりました',
    apply: '今すぐ適用して再読み込み',
    later: '次回適用',
    retry: '再試行',
    loadingCatalog: 'アイテムデータを読み込み中…',
    error_catalog: 'アイテムデータを読み込めませんでした。再試行してください。',
    error_core: 'レシピまたは素材の入手先を読み込めませんでした。再試行するまで素材準備を利用できません。',
    error_update: '現在のデータは使用できますが、更新の確認またはダウンロードに失敗しました。'
  },
  app: {
    title: '冷凍ラビットの工房',
    subtitle: 'うさぎさん専用の制作ノート'
  },
  nav: {
    newNote: '新しいノートを書く',
    favorites: 'お気に入り<br />ノート',
    recommended: 'うさぎの<br />オススメノート',
    history: '過去のノート',
    faq: 'よくある質問',
    settings: '設定',
    sponsor: '電気代を支援する',
    github: 'ソースコード (GitHub)',
    editor: '制作作業台'
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
    emptyDescription: '「過去の記録」で星マークを押して追加してね！'
  },
  recommended: {
    title: 'うさぎのオススメ',
    description: 'うさぎがまとめた便利なリストです。スペース区切りで複数のキーワードを組み合わせて検索できます。もしノートに欲しい武器やアイテムが足りない場合は、「制作作業台」でノートを編集してみてください。',
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
    invalidSelection: 'この行は文字だけでアイテムが選択されていません。候補または絞り込みから選んでください。',
    save: 'よし、これを仕込み台へ！',
    addToFavorites: '同時にお気に入りに追加する',
    defaultTitle: '{name}のノート',
    filter: {
      open: 'アイテムを絞り込む',
      title: 'アイテムを絞り込む',
      description: '既存の検索対象リストにあるデータでアイテムを絞り込みます。',
      close: '閉じる',
      keyword: 'キーワード',
      ilvlMin: 'アイテムレベル下限',
      ilvlMax: 'アイテムレベル上限',
      equipLevelMin: '装備レベル下限',
      equipLevelMax: '装備レベル上限',
      job: 'ジョブ',
      allJobs: 'すべてのジョブ',
      category: 'アイテムタイプ',
      clear: '条件をクリア',
      resultCount: '{count} 件',
      ilvlShort: 'IL',
      equipLevelShort: 'Lv',
      emptyTitle: '条件に合うアイテムがありません',
      emptyDescription: 'いくつかの条件を緩めて試してください。',
      cancel: 'キャンセル',
      confirm: '選択したアイテムを使う',
      categories: {
        all: 'すべて',
        weapon: '武器',
        tool: '道具',
        armor: '防具',
        accessory: 'アクセサリ',
        medicine: '薬品',
        food: '食品',
        material: '素材',
        furniture: 'ハウジング',
        other: 'その他'
      },
      jobs: {
        GLA: '剣術士',
        PGL: '格闘士',
        MRD: '斧術士',
        LNC: '槍術士',
        ARC: '弓術士',
        CNJ: '幻術士',
        THM: '呪術士',
        ACN: '巴術士',
        ROG: '双剣士',
        PLD: 'ナイト',
        MNK: 'モンク',
        WAR: '戦士',
        DRG: '竜騎士',
        BRD: '吟遊詩人',
        WHM: '白魔道士',
        BLM: '黒魔道士',
        SMN: '召喚士',
        SCH: '学者',
        NIN: '忍者',
        MCH: '機工士',
        DRK: '暗黒騎士',
        AST: '占星術師',
        SAM: '侍',
        RDM: '赤魔道士',
        BLU: '青魔道士',
        GNB: 'ガンブレイカー',
        DNC: '踊り子',
        RPR: 'リーパー',
        SGE: '賢者',
        VPR: 'ヴァイパー',
        PCT: 'ピクトマンサー',
        CRP: '木工師',
        BSM: '鍛冶師',
        ARM: '甲冑師',
        GSM: '彫金師',
        LTW: '革細工師',
        LWR: '革細工師',
        WVR: '裁縫師',
        ALC: '錬金術師',
        CUL: '調理師',
        MIN: '採掘師',
        BTN: '園芸師',
        FSH: '漁師'
      }
    }
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
  editor: {
    title: 'ノート工作台',
    description: '既存のノートJSONを貼り付けて、編集や複数のノートの結合ができます。',
    importLabel: 'ノートJSONを貼り付けてください',
    importPlaceholder: 'このサイトからコピーしたノートJSON文字列を貼り付けてください...',
    loadButton: 'データを読み込んで編集を開始',
    mergeButton: '➕ 他のノートを結合 (JSON)',
    mergeDescription: '結合したいノートのJSONを貼り付けてください。同じアイテムの数量は自動的に加算されます。',
    mergeCancel: 'キャンセル',
    mergeConfirm: '結合を確認',
    invalidJson: 'JSON形式が正しくありません。内容を確認してください。',
    emptyState: 'ノートが読み込まれていません',
    defaultMergedName: '結合された無名のノート',
    backToImport: 'インポートに戻る'
  },
  workbench: {
    title: '仕込み台',
    description: '職人さん、今日はマーケットで買う？それとも自分で作る？採集しちゃう？ここで制作の計画とコストをまとめよう！',
    view: {
      analyzing: '市場価格とデータを取得中...',
      emptyTitle: '現在、計画はありません',
      emptyDescription: '「新しいノートを書く」から始めてね！',
      prepping: '準備中',
      retrying: '少し時間がかかっているようです。最新価格を取得しています...',
      retryHint: 'いつでもスキップできます。仕込み台はそのまま使用可能です！',
      cancelRetry: 'スキップして仕込みを始める',
      source: {
        buy: '購入',
        craft: '製作',
        gather: '採集',
        hunt: '討伐',
        other: '在庫+',
        cannotCraft: '製作不可',
        cannotGather: '採集不可',
        cannotGatherHunt: '採集/討伐不可'
      },
      status: {
        missing: 'あと {n} 個',
        excess: '{n} 個多い',
        mismatch: '数量の配分が目標と合っていないようです。各項目の数字を見直してみてくださいね。',
        nonePrice: '出品なし',
        priceSuffix: '/ 個',
        priceErrorTitle: '接続が不安定：市場価格の更新に失敗しました',
        priceErrorDesc: '現在、Universalisサーバーとの接続が不安定またはエラーが発生しています。引き続き仕込み台で分配することはできますが、最新の見積もりコストは一時的に表示されません。次回の操作時に再取得を試みます。'
      },
      details: {
        gatherTitle: '採集場所と詳細',
        huntTitle: 'モンスタードロップ元',
        huntNoPosition: 'Teamcraft に既知のドロップ元がありますが、フィールド座標がありません。',
        limited: 'ＥＴ限定',
        unknownZone: '未知の場所',
        spawnTime: '出現時間',
        duration: '{n} 時間持続',
        craftTitle: '製作レシピ',
        yield: '製作数',
        vendorTitle: 'NPC販売情報',
        vendorDesc: 'NPC販売: {price} Gil {location}',
        vendorPrice: '販売価格',
        vendorCount: '{n} 件',
        mbTitle: 'マーケットボード販売情報',
        mbMinPrice: '最低出品価格',
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
    export: 'エクスポート',
    exportSuffix: 'のToDoリスト',
    exportOfflineNote: 'このリストはエクスポートされたオフライン版です。ここで行った操作はウェブサイトには同期されません。',
    progress: '{n}/{total} 完了',
    section: {
      other: '在庫・その他',
      hunt: '討伐するもの',
      buy: '購入するもの',
      gather: '採集するもの',
      craft: '制作するもの'
    },
    targetQty: '目標',
    targetPrice: '参考単価',
    buySourceMarket: 'マケボ: {world}',
    buySourceVendor: 'NPC: {name} ({zone} X:{x} Y:{y})',
    huntSource: '{monster}: {zone} X:{x} Y:{y}',
    gatherLocation: '採集ポイント',
    emptySection: 'このセクションには項目がありません',
    copyAlarmMacro: 'アラームマクロをコピー',
    alarmMacroCopied: 'マクロをコピーしました！'
  },
  jobs: {
    islandGathering: '開拓採集',
    crp: '木工師', bsm: '鍛冶師', arm: '甲冑師', gsm: '彫金師',
    lwr: '革細工師', wvr: '裁縫師', alc: '錬金術師', cul: '調理師',
    min: '採掘師', btn: '園芸師', fsh: '漁師', gather: '採集',
    battle: '戦闘',
    companyCrafting: 'カンパニークラフト',
    islandConstruction: '開拓建築',
    islandWorkshop: '開拓工房',
    islandCrafting: '開拓製作'
  },
  settings: {
    title: '工房の設定',
    description: '工房の言葉を調整してね',
    appearanceTitle: '外観設定',
    appearanceDesc: 'アプリケーションの視覚的なスタイルをカスタマイズします',
    darkMode: 'ダークモード',
    darkModeDesc: '暗い場所での使用に適したダークテーマに切り替えます',
    language: '言語',
    languageDesc: 'ウェブサイトの表示言語です。翻訳がない場合は英語で表示されます。',
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
    marketDesc: 'マーケット価格を取得するリージョンとデータセンターを設定します。',
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
    },
    changelogTitle: '更新履歴',
    changelogDesc: '本サイトの最新機能やアップデート履歴を確認できます',
    changelogLink: 'アップデート履歴を見る'
  },
  faq: {
    title: 'よくある質問',
    description: '工房の使い方や、よくある疑問についてまとめています。',
    items: [
      {
        q: 'このサイトはどのような目的で使われますか？',
        a: 'このサイトは FFXIV のクラフター向けに設計されており、製作したいアイテムを一括で準備・管理するためのツールです。市場価格、統計データ、NPC販売情報などを統合的に参照することで、「購入」「製作」「採集」のどれにするかを決定し、最終的に生成される分かりやすい代行リストによって作業効率を大幅に向上させることができます。'
      },
      {
        q: 'ノートを書く時に欲しいアイテムが見つからないのはなぜですか？',
        a: '製作可能なアイテムのみが検索対象となります。また、本サイトの翻訳データは広大なコミュニティによって維持されているため、翻訳が不足している場合に検索できないことがあります。アイテム自体は存在するため、英語名での検索を試してみてください。また、本サイトのデータの多くは <a href="https://ffxivteamcraft.com" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">Teamcraft</a> から提供されています。コミュニティデータ向上のために彼らのプロジェクトへの貢献を検討してみてください。'
      },
      {
        q: 'ノートは編集したり、アイテムを追加・削除したりできますか？',
        a: 'ノート作業台はまさにそのための機能です。ノート上の JSON コピー ボタンを見つけ、作業台に貼り付けてインポートしてください。ここではアイテムの追加、削除、数量の変更、さらに別のノートの結合もできます。'
      },
      {
        q: 'サイトで表示される市場コストがゲーム内と違うのはなぜですか？',
        a: '見積もり価格はいくつかの要因に影響されます：1. 市場データはリアルタイムではなく数分〜数時間のキャッシュデータです。 2. システムは「設定」で選択された「コスト戦略」（積極的、標準、保守的）に基づき、Q1や中央値などの統計指標を使用して価格を算出しています。 3. 市場価格とNPC販売価格を自動的に比較し、より安価な方を採用しています。また、データセンターの設定が正しいかも確認してください。'
      },
      {
        q: 'マーケットコスト戦略とは何ですか？',
        a: 'マーケット価格はキャッシュされたデータを元にしているため、このサイトで見た価格と実際に購入する時点の価格には差が出ることがあります。安い出品がすでに売れており、より高い出品だけが残っている場合もあります。その差を補うため、本サイトでは「マーケットコスト戦略」として、積極的（最安値）、標準（第1四分位数）、保守的（中央値）の3種類を用意しています。表示価格を参考にする際に、防御的な価格バッファとして使えるようにするための設定です。'
      },
      {
        q: '完成品の市場価格が、サイトに表示されているコストよりかなり高いのはなぜですか？',
        a: '当サイトで提供しているのは「製作コストの推計」であり、そのアイテムを作るためにどれくらいの資源が必要かを知るための目安です。これは実際の市場販売価格とは異なります。市場価格は材料費だけでなく、市場の需給状況、職人の時間と労力、高難易度製作の準備、マテリア禁断のコスト、NQのリスク、材料の在庫維持コストなど、多くの要因によって決まります。逆に、供給が需要を大きく上回る場合は、市場価格が製作コストを下回ることもあります。当サイトの情報を市場を理解するための参考情報として活用し、価格を決定する唯一の要因とは考えないようにしてください。'
      },
      {
        q: '所要時間はどのように計算されていますか？',
        a: '現在の所要時間は非常に単純な概算に基づいています。通常の製作は1アイテム30秒、高難易度製作は1分、採集は1アイテムにつき5秒として計算しています。より良い計算方法のアイデアがあれば、ぜひ<a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>で提案してください！'
      },
      {
        q: 'なぜ一部のアイテム名が設定した言語ではなく英語で表示されるのですか？',
        a: 'アイテムの翻訳名はコミュニティによって提供・維持されています。新しいアイテムの場合、翻訳がまだ用意されていないことがあります。その場合、システムは英語をデフォルトとして表示し、動作を継続させます。'
      },
      {
        q: 'どうしてうさぎを冷凍するのですか？焼いて食べてもいいですか？',
        a: 'ダメです。'
      },
      {
        q: 'サイトの現在の状態について',
        a: 'このサイトは現在アルファテスト段階にあり、多くの機能が不安定な状態です。現在、皆様からのフィードバックを募集しています。バグ報告や改善の提案がありましたら、お気軽に <a href="https://github.com/emu-rabbit/frozen_rabbit_workshop/issues" target="_blank" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> までお寄せください！'
      }
    ],
    footer: '他に質問がありますか？GitHubでの報告、またはメールでお問い合わせください：{email}'
  },
  sponsorModal: {
    title: '冷凍ラビットを支援する',
    description: 'ご支援ありがとうございます！支払方法を選択してください。お問い合わせ：{email}',
    twProvider: '台灣地區 (ECPay)',
    twDesc: '台灣の方向けの決済方法です。',
    globalProvider: '全世界 (Ko-fi / PayPal)',
    globalDesc: '海外のプレイヤーに最適です。'
  },
  exportModal: {
    title: 'ToDoリストのエクスポート',
    description: '現在のToDoリストをオフラインHTMLファイルとしてエクスポートできます。このファイルはブラウザで開いて進捗を確認でき、項目の並べ替えもサポートしています。',
    includeMarket: 'マーケット価格と場所情報を含める',
    includeMarketDesc: '価格情報は時間経過により古くなる可能性があります。',
    confirm: 'HTMLをダウンロード'
  },
  welcomeModal: {
    title: '工房へようこそ',
    subtitle: 'はじめる前に、ご希望の言語を選択してください',
    description: 'これにより、工房全体のインターフェース言語が調整されます。この設定はいつでも「工房の設定」から変更できます。',
    confirm: 'この言語で開始する！'
  },
  marketSetupReminder: {
    title: 'マーケット取得元を確認しよう',
    description: 'マーケット価格は、選択したリージョンとデータセンターをもとに見積もられます。素材を準備する前に、遊んでいる環境に合った取得元かここで確認してください。',
    note: 'リージョンとデータセンターを選ぶと、工房はその取得元でマーケット価格を見積もります。',
    confirm: 'この取得元を使う',
    later: 'あとで確認する'
  },
  changelog: {
    title: 'アップデート履歴',
    description: 'ウェブサイトの更新履歴や新機能はこちらで確認できます。',
    version: 'バージョン {v}'
  }
}
