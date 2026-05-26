import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    abortPriceFetch,
    clearPriceCache,
    fetchItemPrices,
    isFetchingPrices,
    isRetrying
} from '../../src/services/universalis';

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
        abortPriceFetch();
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

    it('keeps HQ-only listings in a separate cache entry', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                listings: [
                    { pricePerUnit: 100, quantity: 1, hq: false, worldName: 'NQ World' },
                    { pricePerUnit: 240, quantity: 1, hq: true, worldName: 'HQ World' }
                ]
            })
        } as Response);

        const allPrices = await fetchItemPrices([1]);
        expect(allPrices.get(1)?.listings.map(listing => listing.hq)).toEqual([false, true]);
        expect(fetch).toHaveBeenCalledTimes(1);

        const hqPrices = await fetchItemPrices([1], { hqOnly: true });
        expect(vi.mocked(fetch).mock.calls[1][0]).toBe('https://universalis.app/api/v2/%E9%99%B8%E8%A1%8C%E9%B3%A5/1?hq=true');
        expect(hqPrices.get(1)?.listings).toEqual([
            expect.objectContaining({ pricePerUnit: 240, hq: true, worldName: 'HQ World' })
        ]);
        expect(fetch).toHaveBeenCalledTimes(2);

        await fetchItemPrices([1], { hqOnly: true });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('settles shared inflight waiters when a retry backoff is skipped', async () => {
        vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

        const primaryRequest = fetchItemPrices([99]);
        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(isRetrying.value).toBe(true);
        });

        const sharedInflightRequest = fetchItemPrices([99]);
        await Promise.resolve();

        abortPriceFetch();

        await expect(primaryRequest).resolves.toEqual(new Map());
        await expect(sharedInflightRequest).resolves.toEqual(new Map());
        expect(isFetchingPrices.value).toBe(false);
        expect(isRetrying.value).toBe(false);
    });
});
