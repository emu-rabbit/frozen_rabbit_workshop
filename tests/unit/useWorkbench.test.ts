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
    it('should be importable and initialized', async () => {
        // Dynamic import to ensure mocks are in place
        const { useWorkbench } = await import('../../src/composables/useWorkbench');
        const { totalDemands, workbenchItems } = useWorkbench();
        
        expect(totalDemands).toBeDefined();
        expect(workbenchItems).toBeDefined();
    });
});
