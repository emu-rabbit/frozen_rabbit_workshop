import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalDictionaryCache, ensureDictionaryLoaded } from '../../src/services/dictionary';

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
});
