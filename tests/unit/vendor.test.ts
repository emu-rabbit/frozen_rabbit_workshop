import { sourceFixture } from '../fixtures/gameData.mjs';
import { projectGameData } from '../../scripts/game-data/project.mjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/dictionary', () => ({
    localizeData: (names: any, fallback: string) => names?.tw || names?.en || fallback,
    getCurrentLanguage: vi.fn(() => 'tw'),
    getPlaceName: vi.fn((id: number) => {
        if (id === 53) return '格里達尼亞舊街';
        if (id === 63) return '庫爾札斯中央高地';
        if (id === 5219) return 'Sinus Ardorum';
        if (id === 999) return `Zone #${id}`;
        return `Zone #${id}`;
    }),
}));

const fulfill = (body: unknown) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
} as Response);

describe('vendor service', () => {
    beforeEach(async () => {
        vi.resetModules();
        const fixtureResponse = (url: string) => {
            if (url.endsWith('/shops.json')) {
                return fulfill([
                    {
                        id: 262719,
                        type: 'GilShop',
                        npcs: [1000217, 1001205, 1001970],
                        trades: [
                            {
                                currencies: [{ id: 1, amount: 7776 }],
                                items: [{ id: 1925, amount: 1 }],
                            },
                        ],
                    },
                    {
                        id: 262720,
                        type: 'GilShop',
                        npcs: [1000999],
                        trades: [
                            {
                                currencies: [{ id: 1, amount: 100 }],
                                items: [{ id: 99, amount: 1 }],
                            },
                        ],
                    },
                    {
                        id: 262721,
                        type: 'GilShop',
                        npcs: [1052589, 1052601, 1052641, 1052651, 1052700],
                        trades: [
                            {
                                currencies: [{ id: 1, amount: 40309 }],
                                items: [{ id: 27087, amount: 1 }],
                            },
                        ],
                    },
                ]);
            }

            if (url.endsWith('/npcs.json')) {
                return fulfill({
                    '1000217': {
                        en: 'Geraint',
                        position: { zoneid: 53, x: 14.65, y: 9.78 },
                    },
                    '1001205': {
                        en: 'Faezghim',
                        position: { zoneid: 29, x: 6.51, y: 11.99 },
                    },
                    '1001970': {
                        en: 'Jealous Juggernaut',
                        position: { zoneid: 41, x: 13.95, y: 11.05 },
                    },
                    '1000999': {
                        en: 'Fallback Merchant',
                        position: { zoneid: 999, x: 1, y: 2 },
                    },
                    '1052589': {
                        en: 'Godgyth',
                        position: { zoneid: 5219, x: 21.88, y: 21.86 },
                    },
                    '1052601': {
                        en: 'Godgyth',
                        position: { zoneid: 5219, x: 21.86, y: 21.86 },
                    },
                    '1052641': {
                        en: 'Godgyth',
                    },
                    '1052651': {
                        en: 'Godgyth',
                    },
                    '1052700': {
                        en: 'Different Merchant',
                    },
                });
            }

            if (url.endsWith('/tw/tw-npcs.json')) {
                return fulfill({
                    '1000217': { tw: '傑蘭特' },
                    '1001205': { tw: '費茲吉姆' },
                    '1001970': { tw: '捷勒斯·加格諾特' },
                    '1000999': { tw: '後備商人' },
                });
            }

            return fulfill({});
        };
        const sources = sourceFixture();
        const files = ["shops.json","npcs.json","tw/tw-npcs.json"];
        for (const file of files) sources[file] = await (await fixtureResponse('/' + file)).json();
        const ids = [1925,99,27087];
        sources['recipes.json'] = ids.map(id => ({ id, result: id, job: 8, lvl: 1, yields: 1, ingredients: [] }));
        sources['items.json'] = Object.fromEntries(ids.map(id => [id, { en: 'Item' }]));
        const { sourceData } = await import('../../src/services/gameData');
        sourceData.value = projectGameData(sources).bundles.sources;
    });

    it('uses NPC position.zoneid as the vendor display place', async () => {
        const { getBestVendor, getVendors } = await import('../../src/services/vendor');
        const vendor = getBestVendor(1925);

        expect(vendor).toMatchObject({
            price: 7776,
            npcId: 1000217,
            npcName: '傑蘭特',
            zoneId: 53,
            zoneName: '格里達尼亞舊街',
            coords: { x: 14.65, y: 9.78 },
        });

        expect(getVendors(1925).map(vendor => vendor.npcName)).toEqual([
            '傑蘭特',
            '費茲吉姆',
            '捷勒斯·加格諾特',
        ]);
    });

    it('does not reinterpret unknown NPC zone ids through maps data', async () => {
        const { getBestVendor } = await import('../../src/services/vendor');

        expect(getBestVendor(99)?.zoneName).toBe('Zone #999');
    });

    it('merges vendor rows that resolve to the same displayed information', async () => {
        const { getVendors } = await import('../../src/services/vendor');

        const vendors = getVendors(27087);

        expect(vendors).toEqual([
            expect.objectContaining({
                npcId: 1052589,
                npcName: 'Godgyth',
                price: 40309,
                zoneName: 'Sinus Ardorum',
                coords: { x: 21.88, y: 21.86 },
            }),
            expect.objectContaining({
                npcId: 1052641,
                npcName: 'Godgyth',
                price: 40309,
                zoneName: 'Unknown Zone',
                coords: undefined,
            }),
            expect.objectContaining({
                npcId: 1052700,
                npcName: 'Different Merchant',
                price: 40309,
                zoneName: 'Unknown Zone',
                coords: undefined,
            }),
        ]);
    });
});
