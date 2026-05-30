import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    activeWorkbenchNote: { value: null as any },
    fetchItemPrices: vi.fn(),
    recipesCache: { value: [] as any[] },
    getGatheringInfo: vi.fn(),
    getMonsterDropInfo: vi.fn()
}));

// Pre-mocking dependencies before importing the module under test
vi.mock('../../src/composables/useNotes', () => ({
    useNotes: () => ({
        activeWorkbenchNote: mocks.activeWorkbenchNote
    })
}));

vi.mock('../../src/services/dictionary', () => ({
    globalRecipesCache: mocks.recipesCache,
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
    getGatheringInfo: mocks.getGatheringInfo
}));

vi.mock('../../src/services/monsterDrops', () => ({
    ensureMonsterDropDataLoaded: vi.fn(),
    getMonsterDropInfo: mocks.getMonsterDropInfo,
    getMonsterDropPreferredLevel: vi.fn((drops: any[] | null | undefined) => {
        if (!drops || drops.length === 0) return null;
        const levels = drops.map(drop => drop.level).filter((level: number) => level > 0);
        return levels.length > 0 ? Math.min(...levels) : null;
    })
}));

vi.mock('../../src/services/vendor', () => ({
    ensureVendorDataLoaded: vi.fn(),
    getVendors: vi.fn(() => [])
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
        mocks.recipesCache.value = [];
        mocks.fetchItemPrices.mockReset();
        mocks.fetchItemPrices.mockResolvedValue(new Map());
        mocks.getGatheringInfo.mockReset();
        mocks.getGatheringInfo.mockReturnValue(null);
        mocks.getMonsterDropInfo.mockReset();
        mocks.getMonsterDropInfo.mockReturnValue(null);
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

    it('uses one display label for all island sanctuary recipe jobs', async () => {
        const { canRecipeCraftHq, getCraftJobName } = await import('../../src/composables/useWorkbench');

        expect(getCraftJobName({ id: 'mji-8', job: -10 })).toBe('jobs.islandCrafting');
        expect(getCraftJobName({ id: 'mji-craftworks-9', job: -10 })).toBe('jobs.islandCrafting');
        expect(getCraftJobName({ id: 'mji-building-2.4', job: -10 })).toBe('jobs.islandCrafting');
        expect(getCraftJobName({ id: 'mji-landmark-10', job: -10 })).toBe('jobs.islandCrafting');
        expect(getCraftJobName({ id: 'fc539', job: 0 })).toBe('jobs.companyCrafting');
        expect(getCraftJobName({ id: 123, job: 8 })).toBe('jobs.crp');
        expect(canRecipeCraftHq({ job: -10 })).toBe(false);
        expect(canRecipeCraftHq({ job: 0 })).toBe(false);
        expect(canRecipeCraftHq({ job: 8 })).toBe(true);
    });

    it('should be importable and initialized', async () => {
        // Dynamic import to ensure mocks are in place
        const { useWorkbench } = await import('../../src/composables/useWorkbench');
        const { totalDemands, workbenchItems } = useWorkbench();

        expect(totalDemands).toBeDefined();
        expect(workbenchItems).toBeDefined();
    });

    it('ignores malformed note items without a valid item id', async () => {
        mocks.activeWorkbenchNote.value = {
            id: 'note-with-invalid-item',
            name: 'Invalid item note',
            items: [
                { id: 100, quantity: 2 },
                { quantity: 1 },
                { id: undefined, quantity: 1 },
                { id: 'not-a-number', quantity: 1 }
            ]
        };
        vi.resetModules();

        const { useWorkbench } = await import('../../src/composables/useWorkbench');

        const { initialize, workbenchItems, activeItemIds, generateTodoSections } = useWorkbench();
        await initialize(true);

        expect(mocks.fetchItemPrices).toHaveBeenCalledWith([100]);
        expect(Object.keys(workbenchItems.value)).toEqual(['100']);
        expect(activeItemIds.value).toEqual([100]);
        expect(generateTodoSections.value.flatMap(section => section.items.map(item => item.id))).toEqual([100]);
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

    it('toggles a craftable item between all-quality and HQ-only market prices', async () => {
        mocks.activeWorkbenchNote.value = {
            id: 'note-hq-toggle',
            name: 'HQ toggle',
            items: [{ id: 100, quantity: 10 }]
        };
        mocks.recipesCache.value = [
            { result: 100, job: 8, lvl: 90, stars: 0, yields: 1, ingredients: [] }
        ];
        mocks.fetchItemPrices.mockImplementation(async (_ids: number[], options?: { hqOnly?: boolean }) => new Map([
            [100, {
                itemId: 100,
                listings: options?.hqOnly
                    ? [
                        { pricePerUnit: 280, quantity: 10, hq: true, worldName: 'HQ World' },
                        { pricePerUnit: 360, quantity: 20, hq: true, worldName: 'HQ World' },
                        { pricePerUnit: 9999, quantity: 120, hq: true, worldName: 'Tail World' }
                    ]
                    : [
                        { pricePerUnit: 90, quantity: 10, hq: false, worldName: 'NQ World' },
                        { pricePerUnit: 180, quantity: 20, hq: true, worldName: 'HQ World' },
                        { pricePerUnit: 9999, quantity: 120, hq: false, worldName: 'Tail World' }
                    ],
                lastUploadTime: 1000
            }]
        ]));
        vi.resetModules();

        const { useWorkbench } = await import('../../src/composables/useWorkbench');

        const { initialize, workbenchItems, toggleItemHqMarketPrice } = useWorkbench();
        await initialize(true);

        expect(workbenchItems.value[100]).toMatchObject({
            marketPriceMode: 'all',
            marketPrice: 180,
            purchaseInfo: { type: 'market', worldName: 'NQ World' }
        });
        mocks.fetchItemPrices.mockClear();

        await toggleItemHqMarketPrice(100);

        expect(mocks.fetchItemPrices).toHaveBeenLastCalledWith([100], { hqOnly: true });
        expect(mocks.fetchItemPrices).toHaveBeenCalledTimes(1);
        expect(workbenchItems.value[100]).toMatchObject({
            marketPriceMode: 'hq',
            marketPrice: 360,
            purchaseInfo: { type: 'market', worldName: 'HQ World' }
        });

        await toggleItemHqMarketPrice(100);

        expect(mocks.fetchItemPrices).toHaveBeenCalledTimes(1);
        expect(workbenchItems.value[100]).toMatchObject({
            marketPriceMode: 'all',
            marketPrice: 180
        });
    });

    it('does not toggle HQ-only market prices for company or island recipes', async () => {
        mocks.activeWorkbenchNote.value = {
            id: 'note-special-no-hq',
            name: 'Special no HQ',
            items: [
                { id: 22527, quantity: 1 },
                { id: 37618, quantity: 1 }
            ]
        };
        mocks.recipesCache.value = [
            { id: 'fc539', result: 22527, job: 0, lvl: 1, stars: 0, yields: 1, ingredients: [] },
            { id: 'mji-craftworks-9', result: 37618, job: -10, lvl: 1, stars: 0, yields: 1, ingredients: [] }
        ];
        vi.resetModules();

        const { useWorkbench } = await import('../../src/composables/useWorkbench');

        const { initialize, workbenchItems, toggleItemHqMarketPrice } = useWorkbench();
        await initialize(true);
        mocks.fetchItemPrices.mockClear();

        await toggleItemHqMarketPrice(22527);
        await toggleItemHqMarketPrice(37618);

        expect(mocks.fetchItemPrices).not.toHaveBeenCalled();
        expect(workbenchItems.value[22527]).toMatchObject({
            canCraftHq: false,
            marketPriceMode: 'all',
            crafting: { canCraftHq: false }
        });
        expect(workbenchItems.value[37618]).toMatchObject({
            canCraftHq: false,
            marketPriceMode: 'all',
            crafting: { canCraftHq: false }
        });
    });

    it('routes root items with monster drops into the hunting todo section', async () => {
        mocks.activeWorkbenchNote.value = {
            id: 'note-hunt-source',
            name: 'Hunt source',
            items: [{ id: 36257, quantity: 3 }]
        };
        mocks.getMonsterDropInfo.mockReturnValue([
            {
                monsterId: 10471,
                monsterName: '慕斯怪',
                level: 84,
                regionName: '星外天域',
                parentZoneName: '嘆息海',
                zoneName: '嘆息海',
                positions: [{ level: 84, x: 16.2, y: 25.9, regionName: '星外天域', parentZoneName: '嘆息海', zoneName: '嘆息海' }]
            }
        ]);
        vi.resetModules();

        const { useWorkbench } = await import('../../src/composables/useWorkbench');

        const { initialize, workbenchItems, decisions, generateTodoSections } = useWorkbench();
        await initialize(true);

        expect(workbenchItems.value[36257]).toMatchObject({
            canGather: false,
            canHunt: true,
            monsterDropLevel: 84
        });
        expect(decisions['36257']).toMatchObject({ gather: 3 });
        expect(generateTodoSections.value).toHaveLength(1);
        expect(generateTodoSections.value[0]).toMatchObject({
            key: 'hunt',
            items: [{ sectionKey: 'hunt', id: 36257, quantity: 3 }]
        });
        expect(generateTodoSections.value[0].items[0].monsterDrops?.[0]).toMatchObject({
            monsterName: '慕斯怪',
            level: 84
        });
    });

    it('sorts hunt-only materials after gather-only materials and before crystals', async () => {
        mocks.activeWorkbenchNote.value = {
            id: 'note-source-sort',
            name: 'Source sort',
            items: [{ id: 9000, quantity: 1 }]
        };
        mocks.recipesCache.value = [
            {
                result: 9000,
                job: 8,
                lvl: 90,
                stars: 0,
                yields: 1,
                ingredients: [
                    { id: 36257, amount: 1 },
                    { id: 12, amount: 1 },
                    { id: 5106, amount: 1 }
                ]
            }
        ];
        mocks.getGatheringInfo.mockImplementation((id: number) => id === 5106 || id === 12
            ? { type: 2, jobName: 'jobs.btn', level: 15, stars: 0, isLimited: false, spawns: [], duration: 0 }
            : null
        );
        mocks.getMonsterDropInfo.mockImplementation((id: number) => {
            if (id === 36257) {
                return [{ monsterId: 10471, monsterName: '慕斯怪', level: 84, positions: [{ level: 84, x: 16.2, y: 25.9 }] }];
            }

            if (id === 12) {
                return [{ monsterId: 20012, monsterName: '晶簇怪', level: 66, positions: [{ level: 66, x: 12.3, y: 18.4 }] }];
            }

            return null;
        });
        vi.resetModules();

        const { useWorkbench } = await import('../../src/composables/useWorkbench');

        const { initialize, activeItemIds } = useWorkbench();
        await initialize(true);

        const sortedIds = activeItemIds.value;
        expect(sortedIds[0]).toBe(9000);
        expect(sortedIds.indexOf(5106)).toBeLessThan(sortedIds.indexOf(36257));
        expect(sortedIds.indexOf(36257)).toBeLessThan(sortedIds.indexOf(12));
    });
});
