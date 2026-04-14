import { describe, it, expect } from 'vitest';
import { calculateMarketStats } from '../../src/utils/marketPricing';
import type { MarketListing } from '../../src/services/universalis';

const mockListings: MarketListing[] = [
  { pricePerUnit: 100, quantity: 1, hq: false, worldName: 'Test' },
  { pricePerUnit: 200, quantity: 1, hq: false, worldName: 'Test' },
  { pricePerUnit: 300, quantity: 1, hq: false, worldName: 'Test' },
  { pricePerUnit: 400, quantity: 1, hq: false, worldName: 'Test' },
  { pricePerUnit: 500, quantity: 1, hq: false, worldName: 'Test' },
];

describe('Market Pricing Utility', () => {
    describe('calculateMarketStats', () => {
        it('should return the minimum price for aggressive strategy', () => {
            const stats = calculateMarketStats(mockListings);
            expect(stats.minPrice).toBe(100);
        });

        it('should return the median (conservative) price correctly', () => {
            const stats = calculateMarketStats(mockListings);
            expect(stats.medianPrice).toBe(300);
        });

        it('should return the Q1 (balanced) price correctly', () => {
            const stats = calculateMarketStats(mockListings);
            expect(stats.q1Price).toBe(200);
        });

        it('should handle empty listings gracefully', () => {
            const stats = calculateMarketStats([]);
            expect(stats.minPrice).toBeNull();
            expect(stats.medianPrice).toBeNull();
            expect(stats.q1Price).toBeNull();
        });

        it('should handle single listing correctly', () => {
            const stats = calculateMarketStats([{ pricePerUnit: 777, quantity: 1, hq: false, worldName: 'Test' }]);
            expect(stats.minPrice).toBe(777);
            expect(stats.medianPrice).toBe(777);
            expect(stats.q1Price).toBe(777);
        });
    });
});
