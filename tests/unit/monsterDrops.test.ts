import { beforeEach, describe, expect, it, vi } from 'vitest';

let currentLanguage = 'tw';

vi.mock('../../src/services/dictionary', () => ({
    ensurePlacesLoaded: vi.fn(),
    ensureMapsLoaded: vi.fn(),
    getPlaceName: vi.fn((id: number) => {
        if (id === 3711) return '嘆息海';
        if (id === 3704) return '星外天域';
        return `Zone #${id}`;
    }),
    getMapData: vi.fn((id: number) => {
        if (id === 698) return { placename_id: 3711, region_id: 3704 };
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
                return fulfill({ '36257': [10471] });
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
                });
            }
            if (url.endsWith('/mobs.json') && !url.includes('/tw/') && !url.includes('/zh/')) {
                return fulfill({ '10471': { en: 'mousse', ja: 'ムース' } });
            }
            if (url.endsWith('/tw/tw-mobs.json')) {
                return fulfill({ '10471': { tw: '慕斯怪' } });
            }
            if (url.endsWith('/zh/zh-mobs.json')) {
                return fulfill({ '10471': { zh: '慕斯怪' } });
            }
            return fulfill({});
        }));
    });

    it('maps an item to localized monster, level, zone, and coordinates', async () => {
        const { ensureMonsterDropDataLoaded, getMonsterDropInfo, getMonsterDropMaxLevel } = await import('../../src/services/monsterDrops');

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
        expect(getMonsterDropMaxLevel(drops)).toBe(84);
    });

    it('falls back to English names when the current locale has no monster translation', async () => {
        currentLanguage = 'en';
        const { ensureMonsterDropDataLoaded, getMonsterDropInfo } = await import('../../src/services/monsterDrops');

        await ensureMonsterDropDataLoaded();

        expect(getMonsterDropInfo(36257)?.[0].monsterName).toBe('mousse');
    });
});
