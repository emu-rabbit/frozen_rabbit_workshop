/**
 * E2E 測試用 Mock 字典資料
 *
 * 透過 page.route() 攔截字典服務的外部 HTTP 請求，
 * 回傳此處定義的小型 mock 資料集，讓測試不依賴網路且即時響應。
 *
 * 物品 ID 對照（FFXIV 真實 ID）：
 *   5057 = 鐵錠 (Iron Ingot)  — 可製作，配方需要鐵礦 x4
 *   5106 = 鐵礦 (Iron Ore)    — 可採集
 *   5107 = 銅礦 (Copper Ore)  — 可採集
 *   12   = 風之碎晶 (Wind Shard) — 水晶類，配方用
 */

/** tw-items.json 格式：{ [id: string]: string } */
export const mockTwItems: Record<string, string> = {
  "5057": "鐵錠",
  "5106": "鐵礦",
  "5107": "銅礦",
  "12":   "風之碎晶",
};

/** items.json 格式：{ [id: string]: string } (英文) */
export const mockEnItems: Record<string, string> = {
  "5057": "Iron Ingot",
  "5106": "Iron Ore",
  "5107": "Copper Ore",
  "12":   "Wind Shard",
};

/** item-icons.json 格式：{ [id: string]: "/i/..." } */
export const mockItemIcons: Record<string, string> = {
  "5057": "/i/020000/020751.png",
  "5106": "/i/020000/020706.png",
  "5107": "/i/020000/020703.png",
  "12":   "/i/020000/020011.png",
};

/**
 * recipes.json 格式（簡化版）
 * job: 9 = 鑄甲匠 (Blacksmith)
 * ingredients: [{ id, amount }]
 */
export const mockRecipes = [
  {
    id: 1001,        // recipe ID（任意）
    result: 5057,    // 鐵錠
    yields: 1,
    job: 9,          // Blacksmith
    lvl: 15,
    stars: 0,
    ingredients: [
      { id: 5106, amount: 4 }, // 鐵礦 x4
      { id: 12, amount: 1 },   // 風之碎晶 x1
    ]
  }
];

/** places.json 格式（地名，供採集區顯示用） */
export const mockPlaces: Record<string, { en: string; tw?: string }> = {
  "134": { en: "Central Shroud", tw: "黑衣森林中央林區" },
};

/** maps.json（地圖元資料，提供區域階層） */
export const mockMaps: Record<string, { placename_id: number; region_id: number }> = {
  "16": { placename_id: 134, region_id: 22 },
};
