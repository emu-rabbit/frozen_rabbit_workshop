import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/dictionary', () => ({
    ensurePlacesLoaded: vi.fn(() => Promise.resolve()),
    getCurrentLanguage: vi.fn(() => 'tw'),
    getPlaceName: vi.fn((id: number) => {
        if (id === 53) return '格里達尼亞舊街';
        if (id === 63) return '庫爾札斯中央高地';
        if (id === 999) return `Zone #${id}`;
        return `Zone #${id}`;
    }),
}));

const fulfill = (body: unknown) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
} as Response);

describe('vendor service', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubGlobal('fetch', vi.fn((url: string) => {
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
        }));
    });

    it('uses NPC position.zoneid as the vendor display place', async () => {
        const { ensureVendorDataLoaded, getBestVendor, getVendors } = await import('../../src/services/vendor');

        await ensureVendorDataLoaded();
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
        const { ensureVendorDataLoaded, getBestVendor } = await import('../../src/services/vendor');

        await ensureVendorDataLoaded();

        expect(getBestVendor(99)?.zoneName).toBe('Zone #999');
    });
});
