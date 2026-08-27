import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    abortPriceFetch,
    clearPriceCache,
    fetchItemPrices,
    isFetchingPrices,
    isRetrying,
    setSelectedDC
} from '../../src/services/universalis';

describe('Universalis API Caching', () => {
    beforeEach(() => {
        clearPriceCache();
        setSelectedDC('陸行鳥');
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

    it.each([
        { ids: [1], hqOnly: false },
        { ids: [1, 2], hqOnly: false },
        { ids: [1, 2], hqOnly: true }
    ])('requests only parsed fields without truncating listings for $ids (HQ=$hqOnly)', async ({ ids, hqOnly }) => {
        const raw = {
            lastUploadTime: 123456, minPriceNQ: 100, minPriceHQ: 120,
            currentAveragePrice: 140, currentAveragePriceNQ: 130, currentAveragePriceHQ: 150,
            worldName: 'Test World', dcName: 'Test DC',
            listings: Array.from({ length: 120 }, (_, i) => ({
                pricePerUnit: 100 + i, quantity: i + 1, hq: true, worldName: 'Test World', worldID: 74
            }))
        };
        vi.mocked(fetch).mockImplementation(async input => {
            const query = new URL(String(input)).searchParams;
            const prefix = ids.length > 1 ? 'items.' : '';
            expect(query.get('fields')?.split(',').sort()).toEqual([
                'lastUploadTime', 'minPriceNQ', 'minPriceHQ',
                'currentAveragePrice', 'currentAveragePriceNQ', 'currentAveragePriceHQ', 'worldName', 'dcName',
                'listings.pricePerUnit', 'listings.quantity', 'listings.hq', 'listings.worldName', 'listings.worldID'
            ].map(field => prefix + field).sort());
            expect(query.get('entries')).toBe('0');
            expect(query.has('listings')).toBe(false);
            expect(query.get('hq')).toBe(hqOnly ? 'true' : null);
            return {
                ok: true,
                json: async () => ids.length === 1 ? raw : { items: Object.fromEntries(ids.map(id => [id, raw])) }
            } as Response;
        });

        const prices = await fetchItemPrices(ids, { hqOnly });
        expect(fetch).toHaveBeenCalledTimes(1);
        for (const id of ids) expect(prices.get(id)).toEqual({ itemId: id, ...raw });
    });

    it.each(['headers', 'body'])('waits ten seconds for stalled %s and then retries', async phase => {
        let signal!: AbortSignal;
        vi.mocked(fetch).mockImplementationOnce((_input, init) => {
            signal = init!.signal!;
            const pending = new Promise<any>((_resolve, reject) => {
                signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
            });
            return phase === 'headers' ? pending : Promise.resolve({ ok: true, json: () => pending } as Response);
        });
        const request = fetchItemPrices([1]);
        await vi.advanceTimersByTimeAsync(9999);
        expect(signal.aborted).toBe(false);
        expect(fetch).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(signal.aborted).toBe(true);
        expect(isRetrying.value).toBe(true);
        await vi.advanceTimersByTimeAsync(2000);
        expect((await request).has(1)).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(isFetchingPrices.value).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('shares mixed cached, inflight and new items across four concurrent callers', async () => {
        await fetchItemPrices([99]);
        const response = { ok: true, json: async () => ({ items: {} }) } as Response;
        let releaseRoot!: (value: Response) => void;
        vi.mocked(fetch).mockClear();
        vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { releaseRoot = resolve; }));
        const root = fetchItemPrices([100]);
        const callers = Array.from({ length: 4 }, () => fetchItemPrices([99, 100, 200, 201, 200]));
        releaseRoot(response);
        const results = await Promise.all([root, ...callers]);

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(vi.mocked(fetch).mock.calls.map(([url]) => new URL(String(url)).pathname.split('/').pop())).toEqual(['100', '200,201']);
        for (const result of results.slice(1)) expect([...result.keys()].sort((a, b) => a - b)).toEqual([99, 100, 200, 201]);
    });

    it('reserves later batches before the first batch completes', async () => {
        let release!: (value: Response) => void;
        vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
        const primary = fetchItemPrices(Array.from({ length: 101 }, (_, i) => i + 1));
        const waiter = fetchItemPrices([101]);
        const initialCalls = vi.mocked(fetch).mock.calls.length;
        release({ ok: true, json: async () => ({ items: {} }) } as Response);
        const [all, shared] = await Promise.all([primary, waiter]);

        expect(initialCalls).toBe(1);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(all.size).toBe(101);
        expect(shared.get(101)).toEqual(all.get(101));
    });

    it('settles reserved later batches on cancellation and allows a fresh request', async () => {
        vi.mocked(fetch).mockRejectedValue(new TypeError('offline'));
        const primary = fetchItemPrices(Array.from({ length: 101 }, (_, i) => i + 1));
        await vi.waitFor(() => expect(isRetrying.value).toBe(true));
        const waiter = fetchItemPrices([101]);
        const callsBeforeCancel = vi.mocked(fetch).mock.calls.length;
        abortPriceFetch();
        await expect(primary).resolves.toEqual(new Map());
        await expect(waiter).resolves.toEqual(new Map());
        await vi.runAllTimersAsync();

        expect(callsBeforeCancel).toBe(1);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(isFetchingPrices.value).toBe(false);
        expect(isRetrying.value).toBe(false);
        vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ listings: [] }) } as Response);
        expect((await fetchItemPrices([101])).has(101)).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('keeps loading active until all independent requests finish', async () => {
        const releases: Array<(value: Response) => void> = [];
        vi.mocked(fetch).mockImplementation(() => new Promise(resolve => releases.push(resolve)));
        const first = fetchItemPrices([1]);
        const second = fetchItemPrices([2]);
        const response = { ok: true, json: async () => ({ listings: [] }) } as Response;
        releases[0](response);
        await first;
        const loadingWhileSecondPending = isFetchingPrices.value;
        releases[1](response);
        await second;

        expect(loadingWhileSecondPending).toBe(true);
        expect(isFetchingPrices.value).toBe(false);
    });

    it('shares one retry sequence and preserves successful items when another shared request fails', async () => {
        vi.mocked(fetch).mockRejectedValue(new TypeError('offline'));
        const failing = fetchItemPrices([1]);
        await vi.waitFor(() => expect(isRetrying.value).toBe(true));
        vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ listings: [] }) } as Response);
        const successful = fetchItemPrices([2]);
        const callers = Array.from({ length: 4 }, () => fetchItemPrices([1, 2]));
        await successful;
        const retryingAfterSuccess = isRetrying.value;
        const loadingAfterSuccess = isFetchingPrices.value;
        await vi.runAllTimersAsync();
        const results = await Promise.all([failing, ...callers]);

        // Four attempts for item 1, one successful request for item 2.
        expect(fetch).toHaveBeenCalledTimes(5);
        expect(retryingAfterSuccess).toBe(true);
        expect(loadingAfterSuccess).toBe(true);
        expect(results[0].size).toBe(0);
        for (const result of results.slice(1)) expect([...result.keys()]).toEqual([2]);
        expect(isFetchingPrices.value).toBe(false);
        expect(isRetrying.value).toBe(false);
    });

    it('does not share inflight requests between HQ-only and all listings', async () => {
        let release!: (value: Response) => void;
        vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
        const all = fetchItemPrices([1]);
        const hq = fetchItemPrices([1], { hqOnly: true });
        const sharedHq = fetchItemPrices([1], { hqOnly: true });
        release({ ok: true, json: async () => ({ listings: [] }) } as Response);
        await Promise.all([all, hq, sharedHq]);

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(vi.mocked(fetch).mock.calls.map(([url]) => new URL(String(url)).searchParams.get('hq'))).toEqual([null, 'true']);
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
        const hqUrl = new URL(String(vi.mocked(fetch).mock.calls[1][0]));
        expect(hqUrl.pathname).toBe('/api/v2/%E9%99%B8%E8%A1%8C%E9%B3%A5/1');
        expect(hqUrl.searchParams.get('hq')).toBe('true');
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
