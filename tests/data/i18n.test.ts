import { describe, it, expect } from 'vitest';
import tw from '../../src/i18n/locales/tw';
import cn from '../../src/i18n/locales/cn';
import en from '../../src/i18n/locales/en';
import ja from '../../src/i18n/locales/ja';

/**
 * Recursively gets all keys of an object as dot-separated strings
 */
function getAllKeys(obj: any, prefix = ''): string[] {
    return Object.keys(obj).reduce((res: string[], el) => {
        if (Array.isArray(obj[el])) {
            res.push(prefix + el);
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
            res.push(...getAllKeys(obj[el], prefix + el + '.'));
        } else {
            res.push(prefix + el);
        }
        return res;
    }, []);
}

describe('I18n Locale Consistency', () => {
    const twKeys = getAllKeys(tw);

    const locales = [
        { name: 'cn', content: cn },
        { name: 'en', content: en },
        { name: 'ja', content: ja }
    ];

    locales.forEach(locale => {
        it(`should have all keys from tw in ${locale.name}`, () => {
            const currentKeys = getAllKeys(locale.content);
            const missingKeys = twKeys.filter(k => !currentKeys.includes(k));
            
            if (missingKeys.length > 0) {
                console.warn(`Locale ${locale.name} is missing keys:`, missingKeys);
            }
            
            expect(missingKeys).toEqual([]);
        });

        it(`should not have extra keys in ${locale.name} (optional check)`, () => {
            const currentKeys = getAllKeys(locale.content);
            const extraKeys = currentKeys.filter(k => !twKeys.includes(k));
            expect(extraKeys).toEqual([]);
        });
    });
});
