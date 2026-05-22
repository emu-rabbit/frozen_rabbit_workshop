import type { MarketListing } from '../services/universalis';

export interface MarketStats {
    minPrice: number | null; 
    q1Price: number | null; 
    medianPrice: number | null;
    worldName: string | null;
}

function weightedPercentile(
    listings: MarketListing[],
    sampleQuantity: number,
    percentile: number
): number | null {
    if (sampleQuantity <= 0) return null;

    const targetQuantity = Math.floor((sampleQuantity - 1) * percentile) + 1;
    let accumulated = 0;

    for (const listing of listings) {
        const quantity = Math.max(0, Math.floor(listing.quantity || 0));
        if (quantity <= 0) continue;

        accumulated += quantity;
        if (accumulated >= targetQuantity) {
            return listing.pricePerUnit;
        }
    }

    return null;
}

/**
 * Calculate market statistics for a set of price-sorted listings.
 * - minPrice: Lowest price found
 * - q1Price: Quantity-weighted 25th percentile inside the sampled low-price quantity band
 * - medianPrice: Quantity-weighted 50th percentile inside the sampled low-price quantity band
 */
export function calculateMarketStats(
    listings: MarketListing[],
    sampleQuantityLimit?: number
): MarketStats {
    if (!listings || listings.length === 0) {
        return { minPrice: null, q1Price: null, medianPrice: null, worldName: null };
    }

    // Note: Assuming listings are already sorted by price ASC from UniversalService
    const availableQuantity = listings.reduce((sum, listing) => {
        return sum + Math.max(0, Math.floor(listing.quantity || 0));
    }, 0);
    const requestedSampleQuantity = sampleQuantityLimit && sampleQuantityLimit > 0
        ? Math.floor(sampleQuantityLimit)
        : availableQuantity;
    const sampleQuantity = Math.min(availableQuantity, requestedSampleQuantity);

    return {
        minPrice: listings[0].pricePerUnit,
        worldName: listings[0].worldName || null,
        q1Price: weightedPercentile(listings, sampleQuantity, 0.25),
        medianPrice: weightedPercentile(listings, sampleQuantity, 0.5),
    };
}
