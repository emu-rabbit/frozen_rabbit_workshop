import { beforeEach, describe, expect, it, vi } from 'vitest';

let currentLanguage = 'tw';

vi.mock('../../src/services/dictionary', () => ({
    ensurePlacesLoaded: vi.fn(),
    ensureMapsLoaded: vi.fn(),
    getPlaceName: vi.fn((id: number) => {
        if (id === 3711) return '嘆息海';
        if (id === 3704) return '星外天域';
        if (id === 32) return '東拉諾西亞';
        if (id === 3708) return '迷津';
        return `Zone #${id}`;
    }),
    getMapData: vi.fn((id: number) => {
        if (id === 698) return { placename_id: 3711, region_id: 3704 };
        if (id === 17) return { placename_id: 32, region_id: 20 };
        if (id === 695) return { placename_id: 3708, region_id: 3704 };
        return undefined;
    }),
    getCurrentLanguage: vi.fn(() => currentLanguage),
}));

const fulfill = (body: unknown) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
} as Response);

describe('monsterDrops service', () => {
    beforeEach(() => {
        vi.resetModules();
        currentLanguage = 'tw';
        vi.stubGlobal('fetch', vi.fn((url: string) => {
            if (url.endsWith('/drop-sources.json')) {
                return fulfill({
                    '36257': [10471],
                    '5310': [412, 411, 130],
                });
            }
            if (url.endsWith('/monsters.json')) {
                return fulfill({
                    '10471': {
                        baseid: 13376,
                        positions: [
                            { map: 698, zoneid: 3711, level: 84, fate: 0, x: 16.2, y: 25.9, z: 0.8 },
                            { map: 698, zoneid: 3711, level: 84, fate: 0, x: 13.3, y: 22.7, z: 0.8 },
                        ],
                    },
                    '412': {
                        baseid: 412,
                        positions: [],
                    },
                    '411': {
                        baseid: 411,
                        positions: [
                            { map: 17, zoneid: 32, level: 32, fate: 0, x: 23.1, y: 21.3, z: 0.8 },
                            { map: 17, zoneid: 32, level: 32, fate: 0, x: 24.5, y: 19.8, z: 0.8 },
                        ],
                    },
                    '130': {
                        baseid: 130,
                        positions: [
                            { map: 695, zoneid: 3708, level: 0, fate: 0, x: 21.5, y: 20.9, z: -7.2 },
                        ],
                    },
                });
            }
            if (url.endsWith('/mobs.json') && !url.includes('/tw/') && !url.includes('/zh/')) {
                return fulfill({
                    '10471': { en: 'mousse', ja: 'ムース' },
                    '412': { en: 'raptor' },
                    '411': { en: 'raptor poacher' },
                    '130': { en: 'forest raptor' },
                });
            }
            if (url.endsWith('/tw/tw-mobs.json')) {
                return fulfill({
                    '10471': { tw: '慕斯怪' },
                    '411': { tw: '盜龍' },
                    '130': { tw: '森疾龍' },
                });
            }
            if (url.endsWith('/zh/zh-mobs.json')) {
                return fulfill({
                    '10471': { zh: '慕斯怪' },
                    '411': { zh: '盗龙' },
                    '130': { zh: '森疾龙' },
                });
            }
            return fulfill({});
        }));
    });

    it('maps an item to localized monster, level, zone, and coordinates', async () => {
        const { ensureMonsterDropDataLoaded, getMonsterDropInfo, getMonsterDropPreferredLevel } = await import('../../src/services/monsterDrops');

        await ensureMonsterDropDataLoaded();
        const drops = getMonsterDropInfo(36257);

        expect(drops).toHaveLength(1);
        expect(drops?.[0]).toMatchObject({
            monsterId: 10471,
            monsterName: '慕斯怪',
            level: 84,
            regionName: '星外天域',
            parentZoneName: '嘆息海',
            zoneName: '嘆息海',
        });
        expect(drops?.[0].positions[0]).toMatchObject({
            x: 16.2,
            y: 25.9,
            level: 84,
        });
        expect(getMonsterDropPreferredLevel(drops)).toBe(84);
    });

    it('falls back to English names when the current locale has no monster translation', async () => {
        currentLanguage = 'en';
        const { ensureMonsterDropDataLoaded, getMonsterDropInfo } = await import('../../src/services/monsterDrops');

        await ensureMonsterDropDataLoaded();

        expect(getMonsterDropInfo(36257)?.[0].monsterName).toBe('mousse');
    });

    it('uses the lowest known-level source before unknown-level sources for preview data', async () => {
        const { ensureMonsterDropDataLoaded, getMonsterDropInfo, getMonsterDropPreferredLevel } = await import('../../src/services/monsterDrops');

        await ensureMonsterDropDataLoaded();
        const drops = getMonsterDropInfo(5310);

        expect(drops?.map(drop => drop.monsterId)).toEqual([411, 130, 412]);
        expect(drops?.[0]).toMatchObject({
            monsterId: 411,
            monsterName: '盜龍',
            level: 32,
            parentZoneName: '東拉諾西亞',
            zoneName: '東拉諾西亞',
        });
        expect(drops?.[0].positions[0]).toMatchObject({
            level: 32,
            x: 23.1,
            y: 21.3,
        });
        expect(drops?.[1]).toMatchObject({
            monsterId: 130,
            monsterName: '森疾龍',
            level: 0,
        });
        expect(getMonsterDropPreferredLevel(drops)).toBe(32);
    });
});
