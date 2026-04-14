import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettings } from '../../src/composables/useSettings';

describe('Settings Persistence', () => {
    beforeEach(() => {
        // Mock localStorage
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should save language changes to reactive state', () => {
        const { language } = useSettings();
        language.value = 'ja';
        expect(language.value).toBe('ja');
    });

    it('should initialize with values from localStorage', () => {
        // Pre-fill localStorage with correct keys from useSettings.ts
        localStorage.setItem('frozen-rabbit-lang', 'en');
        localStorage.setItem('frozen-rabbit-market-dc', 'Aether');
        localStorage.setItem('frozen-rabbit-market-strategy', 'conservative');

        const { language, marketDC, marketCostStrategy } = useSettings();
        
        expect(language.value).toBe('en');
        expect(marketDC.value).toBe('Aether');
        expect(marketCostStrategy.value).toBe('conservative');
    });
});
