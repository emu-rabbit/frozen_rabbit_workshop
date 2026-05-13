import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Pre-mocking dependencies before importing the module under test
vi.mock('../../src/composables/useNotes', () => ({
    useNotes: () => ({
        activeWorkbenchNote: ref(null)
    })
}));

vi.mock('../../src/services/dictionary', () => ({
    globalRecipesCache: ref([]),
    setDictionaryLanguage: vi.fn(),
    ensureDictionaryLoaded: vi.fn(),
    CRYSTAL_IDS: new Set()
}));

vi.mock('../../src/services/universalis', () => ({
    fetchItemPrices: vi.fn(),
    selectedDC: ref('陸行鳥')
}));

vi.mock('../../src/services/gathering', () => ({
    ensureGatheringDataLoaded: vi.fn(),
    getGatheringInfo: vi.fn()
}));

vi.mock('../../src/services/vendor', () => ({
    ensureVendorDataLoaded: vi.fn(),
    getBestVendor: vi.fn()
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        locale: ref('tw'),
        t: (key: string) => key
    })
}));

describe('Workbench Service Logic', () => {
    it('sorts craft todo items so crafted ingredients come before their consumers', async () => {
        const { sortCraftTodoItemsByDependency } = await import('../../src/composables/useWorkbench');
        const mythrilPlate = { id: 5079, name: '秘銀板' };
        const mythrilIngot = { id: 5056, name: '秘銀錠' };
        const mythrilRivet = { id: 5099, name: '秘銀鉚釘' };

        const sorted = sortCraftTodoItemsByDependency(
            [mythrilPlate, mythrilIngot, mythrilRivet],
            [
                { result: 5079, ingredients: [{ id: 5056, amount: 2 }] },
                { result: 5099, ingredients: [{ id: 5056, amount: 1 }] },
                { result: 5056, ingredients: [] }
            ] as any[]
        );

        expect(sorted.map(item => item.id)).toEqual([5056, 5079, 5099]);
    });

    it('keeps selected output items grouped at the bottom after their dependencies', async () => {
        const { sortCraftTodoItemsByDependency } = await import('../../src/composables/useWorkbench');
        const plate = { id: 5079, name: '秘銀板' };
        const ingot = { id: 5056, name: '秘銀錠' };
        const rivet = { id: 5099, name: '秘銀鉚釘' };
        const lumber = { id: 5381, name: '胡桃木材' };
        const chair = { id: 6500, name: '胡桃木椅' };

        const sorted = sortCraftTodoItemsByDependency(
            [plate, ingot, rivet, lumber, chair],
            [
                { result: 5079, ingredients: [{ id: 5056, amount: 2 }] },
                { result: 5099, ingredients: [{ id: 5056, amount: 1 }] },
                { result: 6500, ingredients: [{ id: 5381, amount: 3 }] },
                { result: 5056, ingredients: [] },
                { result: 5381, ingredients: [] }
            ] as any[],
            [5079, 5099, 6500]
        );

        expect(sorted.map(item => item.id)).toEqual([5056, 5381, 5079, 5099, 6500]);
    });

    it('should be importable and initialized', async () => {
        // Dynamic import to ensure mocks are in place
        const { useWorkbench } = await import('../../src/composables/useWorkbench');
        const { totalDemands, workbenchItems } = useWorkbench();
        
        expect(totalDemands).toBeDefined();
        expect(workbenchItems).toBeDefined();
    });
});
