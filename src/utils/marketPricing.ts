import type { MarketListing } from '../services/universalis';

/**
 * Calculate basic market statistics for a set of listings.
 * - minPrice: Lowest price found
 * - q1Price: 25th percentile
 * - medianPrice: 50th percentile (median)
 */
export function calculateMarketStats(listings: MarketListing[]): { 
    minPrice: number | null; 
    q1Price: number | null; 
    medianPrice: number | null;
    worldName: string | null;
} {
    if (!listings || listings.length === 0) {
        return { minPrice: null, q1Price: null, medianPrice: null, worldName: null };
    }

    const len = listings.length;
    // Note: Assuming listings are already sorted by price ASC from UniversalService
    return {
        minPrice: listings[0].pricePerUnit,
        worldName: listings[0].worldName || null,
        q1Price: listings[Math.floor((len - 1) * 0.25)].pricePerUnit,
        medianPrice: listings[Math.floor((len - 1) * 0.5)].pricePerUnit,
    };
}
