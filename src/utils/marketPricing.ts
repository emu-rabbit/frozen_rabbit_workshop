import type { MarketListing } from '../services/universalis';

/**
 * Filter listings using the Interquartile Range (IQR) method to remove outliers.
 */
export function filterListingsByIQR(listings: MarketListing[]): MarketListing[] {
  if (listings.length === 0) return [];
  if (listings.length < 4) return listings; // Not enough data to reliably calculate IQR

  const prices = listings.map(l => l.pricePerUnit).sort((a, b) => a - b);
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q3 = prices[Math.floor(prices.length * 0.75)];
  const iqr = q3 - q1;
  const upperBound = q3 + 1.5 * iqr;
  // Lower bound is usually not an issue for high-end outliers but we can keep it for completeness
  const lowerBound = Math.max(0, q1 - 1.5 * iqr);

  return listings.filter(l => l.pricePerUnit >= lowerBound && l.pricePerUnit <= upperBound);
}

/**
 * Calculate the simulated purchase price weighted by the required quantity.
 * @param listings Sorted market listings (by price ascending)
 * @param demandAmount Quantity needed
 * @param fallbackPrice Price to use if no listings are available
 */
export function calculateSimulatedPrice(
  listings: MarketListing[],
  demandAmount: number,
  fallbackPrice: number | null
): number | null {
  if (listings.length === 0) return fallbackPrice;

  // We always filter outliers first to ensure the simulation isn't skewed by 1,000,000 gil listings
  const filteredListings = filterListingsByIQR(listings);

  if (filteredListings.length === 0) {
    return fallbackPrice;
  }

  // If demand is not specified or 0, return the lowest filtered price as a baseline
  const effectiveDemand = demandAmount > 0 ? demandAmount : 1;

  let remaining = effectiveDemand;
  let totalCost = 0;

  for (const listing of filteredListings) {
    const buyQty = Math.min(listing.quantity, remaining);
    totalCost += buyQty * listing.pricePerUnit;
    remaining -= buyQty;
    if (remaining <= 0) break;
  }

  // If there's still demand but no listings left, use the average of the filtered set for the remainder
  // (Alternatively, use the last known price which is more conservative)
  if (remaining > 0) {
    const lastPrice = filteredListings[filteredListings.length - 1].pricePerUnit;
    totalCost += remaining * lastPrice;
  }

  return totalCost / effectiveDemand;
}
