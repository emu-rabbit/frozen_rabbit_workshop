import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterSearchableItems, getItemCategoryGroup, getOrderedEquipmentJobs, getSearchableItems, globalDictionaryCache, globalRecipesCache, normalizeIconUrl, searchItems } from '../../src/services/dictionary';

describe('Dictionary Search & Logic', () => {
    beforeEach(() => {
        globalDictionaryCache.value = [
            { id: 1, name: '白金塊', enName: 'Platinum Ingot', icon: 'icon1' },
            { id: 2, name: '青金塊', enName: 'Electrum Ingot', icon: 'icon2' },
            { id: 3, name: '鐵礦', enName: 'Iron Ore', icon: 'icon3' },
        ];
        globalRecipesCache.value = [];
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
        globalDictionaryCache.value = [
            { id: 1, name: 'Iron Sword', enName: 'Iron Sword', icon: 'icon1', craftable: true },
            { id: 2, name: 'Iron Token', enName: 'Iron Token', icon: 'icon2', craftable: false },
        ];

        const results = await searchItems('Iron');

        expect(results.map(item => item.id)).toEqual([1]);
    });

    it('treats recipe results as searchable even when Teamcraft search marks them non-craftable', async () => {
        globalDictionaryCache.value = [
            { id: 22527, name: 'Whale-class Bridge', enName: 'Whale-class Bridge', icon: 'icon1', craftable: false },
            { id: 22528, name: 'Whale-class Pressure Hull', enName: 'Whale-class Pressure Hull', icon: 'icon2', craftable: false },
        ];
        globalRecipesCache.value = [
            { id: 'fc539', result: 22527, yields: 1, ingredients: [], job: 0, lvl: 1 },
        ];

        const results = await searchItems('Whale');
        const searchable = await getSearchableItems();

        expect(results.map(item => item.id)).toEqual([22527]);
        expect(searchable.map(item => item.id)).toEqual([22527]);
    });

    it('filters the local searchable list by item level, equip level, job, and category group', async () => {
        globalDictionaryCache.value = [
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
        ];

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

    it('routes XIVAPI asset icon URLs through the v2 asset host', () => {
        const assetPath = '/api/asset?path=ui/icon/040000/040176_hr1.tex&format=png';

        expect(normalizeIconUrl(assetPath)).toBe('https://v2.xivapi.com/api/asset?path=ui/icon/040000/040176_hr1.tex&format=png');
        expect(normalizeIconUrl(`https://xivapi.com${assetPath}`)).toBe('https://v2.xivapi.com/api/asset?path=ui/icon/040000/040176_hr1.tex&format=png');
        expect(normalizeIconUrl('api/asset?path=ui/icon/040000/040176_hr1.tex&format=png')).toBe('https://v2.xivapi.com/api/asset?path=ui/icon/040000/040176_hr1.tex&format=png');
    });

    it('keeps non-asset icon paths on the legacy icon host', () => {
        expect(normalizeIconUrl('/i/020000/020751.png')).toBe('https://xivapi.com/i/020000/020751.png');
    });
});
