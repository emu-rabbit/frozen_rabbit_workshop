import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalDictionaryCache, searchItems } from '../../src/services/dictionary';

describe('Dictionary Search & Logic', () => {
    beforeEach(() => {
        globalDictionaryCache.value = [
            { id: 1, name: '白金塊', enName: 'Platinum Ingot', icon: 'icon1' },
            { id: 2, name: '青金塊', enName: 'Electrum Ingot', icon: 'icon2' },
            { id: 3, name: '鐵礦', enName: 'Iron Ore', icon: 'icon3' },
        ];
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
});
