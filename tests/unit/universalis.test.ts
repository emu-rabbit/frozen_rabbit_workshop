import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchItemPrices, clearPriceCache } from '../../src/services/universalis';

describe('Universalis API Caching', () => {
    beforeEach(() => {
        clearPriceCache();
        vi.useFakeTimers();
        
        // Mock fetch
        vi.stubGlobal('fetch', vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ items: {} })
            })
        ));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should cache results and not refetch within the TTL (5 mins)', async () => {
        await fetchItemPrices([1, 2]);
        expect(fetch).toHaveBeenCalledTimes(1);

        // Fetch again immediately
        await fetchItemPrices([1, 2]);
        expect(fetch).toHaveBeenCalledTimes(1); // Should use cache

        // Fast forward 4 minutes
        vi.advanceTimersByTime(4 * 60 * 1000);
        await fetchItemPrices([1, 2]);
        expect(fetch).toHaveBeenCalledTimes(1); // Still using cache
    });

    it('should refetch after the TTL (5 mins) has expired', async () => {
        await fetchItemPrices([1]);
        expect(fetch).toHaveBeenCalledTimes(1);

        // Fast forward 6 minutes
        vi.advanceTimersByTime(6 * 60 * 1000);
        await fetchItemPrices([1]);
        expect(fetch).toHaveBeenCalledTimes(2); // Should trigger a new fetch
    });
});
