import { describe, expect, it, vi } from 'vitest';

const fulfill = (body: unknown) => Promise.resolve({
  ok: true,
  json: () => Promise.resolve(body),
} as Response);

describe('dictionary place names', () => {
  it('falls back to the global English place name when Traditional Chinese is missing', async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.endsWith('/tw/tw-places.json')) {
        return fulfill({});
      }

      if (url.endsWith('/places.json')) {
        return fulfill({
          '5219': {
            en: 'Sinus Ardorum',
            ja: '焦がれの入江',
          },
        });
      }

      return fulfill({});
    }));

    const { ensurePlacesLoaded, getPlaceName, setDictionaryLanguage } = await import('../../src/services/dictionary');

    setDictionaryLanguage('tw');
    await ensurePlacesLoaded();

    expect(getPlaceName(5219)).toBe('Sinus Ardorum');

    vi.unstubAllGlobals();
  });
});
