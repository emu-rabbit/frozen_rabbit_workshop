import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dataDir = join(process.cwd(), 'src/data/recommended');
const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));

describe('Recommended Notes Data Integrity', () => {
    files.forEach(file => {
        it(`should have valid structure in ${file}`, () => {
            const raw = readFileSync(join(dataDir, file), 'utf-8');
            const data = JSON.parse(raw);

            expect(Array.isArray(data)).toBe(true);
            
            data.forEach((note: any, index: number) => {
                // Check ID
                expect(note.id).toBeDefined();
                expect(typeof note.id).toBe('string');

                // Check Name object
                expect(note.name).toBeDefined();
                expect(typeof note.name).toBe('object');
                expect(note.name.tw).toBeDefined();
                expect(note.name.cn).toBeDefined();
                expect(note.name.en).toBeDefined();
                expect(note.name.ja).toBeDefined();

                // Check Items
                expect(Array.isArray(note.items)).toBe(true);
                note.items.forEach((item: any, itemIndex: number) => {
                    expect(item.id).toBeDefined();
                    expect(typeof item.id).toBe('number');
                    expect(item.quantity).toBeDefined();
                    expect(typeof item.quantity).toBe('number');
                });
            });
        });
    });
});
