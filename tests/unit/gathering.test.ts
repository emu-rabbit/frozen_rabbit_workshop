import { describe, it, expect } from 'vitest';

/**
 * Basic tests for gathering time logic.
 * Note: These are derived from the logic used in gathering.ts
 */
describe('Gathering Time Logic', () => {
    it('should format simple spawn time range correctly', () => {
        // Mocking the logic found in gathering.ts components
        const formatRange = (h: number, dur: number) => {
            const start = String(h).padStart(2, '0') + ':00';
            const end = String((h + dur) % 24).padStart(2, '0') + ':00';
            return `${start}~${end}`;
        };

        expect(formatRange(2, 2)).toBe('02:00~04:00');
        expect(formatRange(22, 4)).toBe('22:00~02:00'); // Crosses midnight
    });

    it('should identify if an item is currently available based on ET', () => {
        const isAvailable = (etHour: number, startHour: number, duration: number) => {
            const endHour = (startHour + duration) % 24;
            if (startHour <= endHour) {
                return etHour >= startHour && etHour < endHour;
            } else {
                // Range crosses midnight (e.g., 22:00 to 02:00)
                return etHour >= startHour || etHour < endHour;
            }
        };

        expect(isAvailable(3, 2, 2)).toBe(true);
        expect(isAvailable(5, 2, 2)).toBe(false);
        expect(isAvailable(23, 22, 4)).toBe(true);
        expect(isAvailable(1, 22, 4)).toBe(true);
        expect(isAvailable(3, 22, 4)).toBe(false);
    });
});
