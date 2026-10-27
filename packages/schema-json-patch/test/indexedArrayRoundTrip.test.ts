import { describe, expect, it } from 'vitest';
import { applyPatches, findArrayIndex, findInsertionIndex } from '../src/applyPatches';
import { generatePatches } from '../src/patchGenerator';
import type { Schema, ArraySchema } from '../src/types/schema';

const items: ArraySchema = {
    $type: 'array',
    $item: {
        $type: 'object',
        $atomic: true,
        $fields: { text: { $type: 'string' } },
    },
};

describe('indexed array patch round trips', () => {
    for (const nested of [false, true]) {
        for (const initialCount of [0, 1, 3]) {
            it(`preserves every appended item (${nested ? 'nested' : 'root'}, ${initialCount} existing)`, () => {
                const schema: Schema = nested
                    ? { $type: 'object', $split: true, $fields: { examples: items } }
                    : items;
                const targetItems = Array.from({ length: 5 }, (_, index) => ({
                    text: `Example ${index}`,
                }));
                const sourceItems = targetItems.slice(0, initialCount);
                const source = JSON.stringify(nested ? { examples: sourceItems } : sourceItems);
                const target = JSON.stringify(nested ? { examples: targetItems } : targetItems);
                const patches = generatePatches(schema, source, target);

                expect(patches).toHaveLength(5 - initialCount);
                expect(JSON.parse(applyPatches(source, patches, schema))).toEqual(
                    JSON.parse(target)
                );
            });
        }
    }

    it('distinguishes an existing item from an insertion at the end', () => {
        const array = [{ text: 'First' }];
        expect(findArrayIndex(array, '0', items)).toBe(0);
        expect(findArrayIndex(array, '1', items)).toBe(-1);
        expect(findArrayIndex(array, '-1', items)).toBe(-1);
        expect(findInsertionIndex(array, '1', items)).toBe(1);
    });
});
