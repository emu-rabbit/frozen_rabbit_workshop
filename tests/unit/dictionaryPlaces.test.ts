import { describe, expect, it } from 'vitest';
import { sourceData } from '../../src/services/gameData';
import { getPlaceName, setDictionaryLanguage } from '../../src/services/dictionary';
describe('dictionary place names', () => {
  it('uses current language then English, with no cross-language fallback', () => {
    sourceData.value = { places: { 5219: { en: 'Sinus Ardorum', ja: '焦がれの入江' }, 1: { ja: '日本語のみ' } } } as any;
    setDictionaryLanguage('tw'); expect(getPlaceName(5219)).toBe('Sinus Ardorum'); expect(getPlaceName(1)).toBe('Zone #1');
    setDictionaryLanguage('ja'); expect(getPlaceName(5219)).toBe('焦がれの入江');
  });
});
