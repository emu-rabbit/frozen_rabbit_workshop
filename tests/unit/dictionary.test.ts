import { catalogData } from '../../src/services/gameData';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDictionaryItem, setDictionaryLanguage, filterSearchableItems, getItemCategoryGroup, getOrderedEquipmentJobs, getSearchableItems, globalDictionaryCache, globalRecipesCache, searchItems } from '../../src/services/dictionary';

function setItems(items: any[]) {
  catalogData.value = { formatVersion: 2, jobNames: {}, categories: {}, items: items.map(({ name, enName, ...item }) => ({ kind: 'item', craftable: false, ...item, names: { tw: name, en: enName } })) };
}

describe('Dictionary Search & Logic', () => {
    beforeEach(() => {
        setItems([
            { id: 1, name: '白金塊', enName: 'Platinum Ingot', icon: 'icon1' },
            { id: 2, name: '青金塊', enName: 'Electrum Ingot', icon: 'icon2' },
            { id: 3, name: '鐵礦', enName: 'Iron Ore', icon: 'icon3' },
        ]);
    });

    it('should find items by partial name match', () => {
        const results = globalDictionaryCache.value?.filter(i => i.name.includes('金塊'));
        expect(results?.length).toBe(2);
        expect(results?.[0].id).toBe(1);
    });

    it('should find items by English name (cross-language search)', () => {
        const query = 'Iron'.toLowerCase();
        const results = globalDictionaryCache.value?.filter(i => 
            i.name.toLowerCase().includes(query) || 
            (i.enName && i.enName.toLowerCase().includes(query))
        );
        expect(results?.length).toBe(1);
        expect(results?.[0].id).toBe(3);
    });

    it('only returns craftable items from searchItems', async () => {
        setItems([
            { id: 1, name: 'Iron Sword', enName: 'Iron Sword', icon: 'icon1', craftable: true },
            { id: 2, name: 'Iron Token', enName: 'Iron Token', icon: 'icon2', craftable: false },
        ]);

        const results = await searchItems('Iron');

        expect(results.map(item => item.id)).toEqual([1]);
    });

    it('uses generator-projected craftability without loading recipes', async () => {
        setItems([
            { id: 22527, name: 'Whale-class Bridge', enName: 'Whale-class Bridge', icon: 'icon1', craftable: true },
            { id: 22528, name: 'Whale-class Pressure Hull', enName: 'Whale-class Pressure Hull', icon: 'icon2', craftable: false },
        ]);

        const results = await searchItems('Whale');
        const searchable = await getSearchableItems();

        expect(results.map(item => item.id)).toEqual([22527]);
        expect(searchable.map(item => item.id)).toEqual([22527]);
    });

    it('filters the local searchable list by item level, equip level, job, and category group', async () => {
        setItems([
            {
                id: 1,
                name: 'Sky Armor',
                enName: 'Sky Armor',
                icon: 'icon1',
                craftable: true,
                ilvl: 700,
                equipLevel: 100,
                equipJobs: ['PLD', 'WAR'],
                category: 35,
            },
            {
                id: 2,
                name: 'Sky Ingot',
                enName: 'Sky Ingot',
                icon: 'icon2',
                craftable: true,
                ilvl: 690,
                category: 48,
            },
            {
                id: 3,
                name: 'Sky Token',
                enName: 'Sky Token',
                icon: 'icon3',
                craftable: false,
                ilvl: 700,
                equipLevel: 100,
                equipJobs: ['PLD'],
                category: 35,
            },
        ]);

        const results = await filterSearchableItems({
            ilvlMin: 700,
            equipLevelMin: 100,
            job: 'PLD',
            categoryGroup: 'armor',
        });

        expect(results.map(item => item.id)).toEqual([1]);
    });

    it('maps detailed Teamcraft item categories into broad filter groups', () => {
        expect(getItemCategoryGroup({ id: 1, name: 'Sword', icon: '', category: 2 })).toBe('weapon');
        expect(getItemCategoryGroup({ id: 8, name: 'Carpenter Saw', icon: '', category: 12, equipJobs: ['CRP'] })).toBe('tool');
        expect(getItemCategoryGroup({ id: 2, name: 'Hammer', icon: '', category: 14 })).toBe('tool');
        expect(getItemCategoryGroup({ id: 3, name: 'Body', icon: '', category: 35 })).toBe('armor');
        expect(getItemCategoryGroup({ id: 4, name: 'Ring', icon: '', category: 43 })).toBe('accessory');
        expect(getItemCategoryGroup({ id: 5, name: 'Potion', icon: '', category: 44 })).toBe('medicine');
        expect(getItemCategoryGroup({ id: 9, name: 'Meal', icon: '', category: 46 })).toBe('food');
        expect(getItemCategoryGroup({ id: 6, name: 'Metal', icon: '', category: 48 })).toBe('material');
        expect(getItemCategoryGroup({ id: 10, name: 'Tabletop', icon: '', category: 78 })).toBe('furniture');
    });

    it('orders equipment job filters like the in-game character window and hides adventurer', () => {
        const jobs = getOrderedEquipmentJobs(['WVR', 'ADV', 'BST', 'GNB', 'PLD', 'CRP', 'CNJ', 'PCT', 'MIN', 'GLA']);

        expect(jobs).toEqual(['GLA', 'PLD', 'GNB', 'CNJ', 'PCT', 'CRP', 'WVR', 'MIN']);
    });

});

describe('catalog language and historical item fallback', () => {
  it('uses only the selected language then English, and preserves unknown IDs', () => {
    setItems([{ id: 99, name: '繁中', enName: 'English', icon: '' }]);
    catalogData.value!.items[0].names.cn = '简中';
    setDictionaryLanguage('ja'); expect(getDictionaryItem(99).name).toBe('English');
    delete catalogData.value!.items[0].names.en;
    // Replace the shallow-ref value after changing a test fixture.
    catalogData.value = { ...catalogData.value! };
    expect(getDictionaryItem(99).name).toBe('不明なアイテム');
    for (const [lang, name] of [['tw','未知的物品'],['cn','未知的物品'],['en','Unknown item'],['ja','不明なアイテム']]) {
      setDictionaryLanguage(lang); expect(getDictionaryItem(-999999)).toMatchObject({ id: -999999, name });
    }
    setDictionaryLanguage('tw');
  });
});
