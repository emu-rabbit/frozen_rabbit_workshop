import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettings } from '../../src/composables/useSettings';
import { effectScope, nextTick } from 'vue';

describe('Settings Persistence', () => {
    beforeEach(() => {
        // Mock localStorage
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('persists language changes for a fresh settings instance', async () => {
        const scope = effectScope();
        try {
            const settings = scope.run(() => useSettings())!;
            settings.language.value = 'ja';
            await nextTick();
            expect(localStorage.getItem('frozen-rabbit-lang')).toBe('ja');
            expect(scope.run(() => useSettings())!.language.value).toBe('ja');
        } finally {
            scope.stop();
        }
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
