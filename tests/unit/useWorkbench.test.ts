import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    activeWorkbenchNote: { value: null as any },
    fetchItemPrices: vi.fn()
}));

// Pre-mocking dependencies before importing the module under test
vi.mock('../../src/composables/useNotes', () => ({
    useNotes: () => ({
        activeWorkbenchNote: mocks.activeWorkbenchNote
    })
}));

vi.mock('../../src/services/dictionary', () => ({
    globalRecipesCache: ref([]),
    setDictionaryLanguage: vi.fn(),
    ensureDictionaryLoaded: vi.fn(),
    getDictionaryItem: vi.fn((id: number) => ({
        name: `Item ${id}`,
        icon: `/icons/${id}.png`
    })),
    getRawItemData: vi.fn((id: number) => ({
        name: `Item ${id}`,
        icon: `/icons/${id}.png`
    })),
    CRYSTAL_IDS: new Set()
}));

vi.mock('../../src/services/universalis', () => ({
    fetchItemPrices: mocks.fetchItemPrices,
    selectedDC: ref('Mana')
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
    beforeEach(() => {
        mocks.activeWorkbenchNote.value = null;
        mocks.fetchItemPrices.mockReset();
        mocks.fetchItemPrices.mockResolvedValue(new Map());
    });

    it('preserves the old reversed BFS preference while moving dependencies before consumers', async () => {
        const { sortCraftTodoItemsByDependency } = await import('../../src/composables/useWorkbench');
        const mythrilRivet = { id: 5099, name: 'Mythril Rivets' };
        const mythrilIngot = { id: 5056, name: 'Mythril Ingot' };
        const mythrilPlate = { id: 5079, name: 'Mythril Plate' };

        const sorted = sortCraftTodoItemsByDependency(
            [mythrilRivet, mythrilIngot, mythrilPlate],
            [
                { result: 5079, ingredients: [{ id: 5056, amount: 2 }] },
                { result: 5099, ingredients: [{ id: 5056, amount: 1 }] },
                { result: 5056, ingredients: [] }
            ] as any[]
        );

        expect(sorted.map(item => item.id)).toEqual([5056, 5079, 5099]);
    });

    it('keeps selected output items grouped at the bottom through the reversed BFS preference', async () => {
        const { sortCraftTodoItemsByDependency } = await import('../../src/composables/useWorkbench');
        const plate = { id: 5079, name: 'Mythril Plate' };
        const rivet = { id: 5099, name: 'Mythril Rivets' };
        const chair = { id: 6500, name: 'Walnut Chair' };
        const ingot = { id: 5056, name: 'Mythril Ingot' };
        const lumber = { id: 5381, name: 'Walnut Lumber' };

        const sorted = sortCraftTodoItemsByDependency(
            [plate, rivet, chair, ingot, lumber],
            [
                { result: 5079, ingredients: [{ id: 5056, amount: 2 }] },
                { result: 5099, ingredients: [{ id: 5056, amount: 1 }] },
                { result: 6500, ingredients: [{ id: 5381, amount: 3 }] },
                { result: 5056, ingredients: [] },
                { result: 5381, ingredients: [] }
            ] as any[]
        );

        expect(sorted.map(item => item.id)).toEqual([5381, 5056, 6500, 5099, 5079]);
    });

    it('does not keep the BFS preference when selected outputs depend on each other', async () => {
        const { sortCraftTodoItemsByDependency } = await import('../../src/composables/useWorkbench');
        const ingot = { id: 5056, name: 'Mythril Ingot' };
        const plate = { id: 5079, name: 'Mythril Plate' };
        const rivet = { id: 5099, name: 'Mythril Rivets' };

        const sorted = sortCraftTodoItemsByDependency(
            [ingot, plate, rivet],
            [
                { result: 5079, ingredients: [{ id: 5056, amount: 2 }] },
                { result: 5099, ingredients: [{ id: 5056, amount: 1 }] },
                { result: 5056, ingredients: [] }
            ] as any[]
        );

        expect(sorted.map(item => item.id)).toEqual([5056, 5099, 5079]);
    });

    it('should be importable and initialized', async () => {
        // Dynamic import to ensure mocks are in place
        const { useWorkbench } = await import('../../src/composables/useWorkbench');
        const { totalDemands, workbenchItems } = useWorkbench();

        expect(totalDemands).toBeDefined();
        expect(workbenchItems).toBeDefined();
    });

    it('does not mark prices as fetched when Universalis returns no result after cancellation', async () => {
        mocks.activeWorkbenchNote.value = {
            id: 'note-cancelled-prices',
            name: 'Cancelled prices',
            items: [{ id: 100, quantity: 2 }]
        };
        vi.resetModules();

        const { useWorkbench } = await import('../../src/composables/useWorkbench');

        const { initialize, workbenchItems } = useWorkbench();
        await initialize(true);

        expect(mocks.fetchItemPrices).toHaveBeenCalledWith([100]);
        expect(workbenchItems.value[100]).toMatchObject({
            priceFetched: false,
            marketPrice: null,
            listings: []
        });
    });
});
