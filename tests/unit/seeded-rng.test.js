import assert from "node:assert/strict";
import test from "node:test";
import { createSeededRng } from "../../scripts/modules/ai/seeded-rng.js";

test("the same seed always produces the same sequence", () => {
    const first = createSeededRng(42);
    const second = createSeededRng(42);
    const firstValues = Array.from({ length: 10 }, () => first());
    const secondValues = Array.from({ length: 10 }, () => second());
    assert.deepEqual(firstValues, secondValues);
});

test("different seeds produce different sequences", () => {
    const first = createSeededRng(1);
    const second = createSeededRng(2);
    const firstValues = Array.from({ length: 10 }, () => first());
    const secondValues = Array.from({ length: 10 }, () => second());
    assert.notDeepEqual(firstValues, secondValues);
});

test("output values always land in [0, 1)", () => {
    const rng = createSeededRng(7);
    for (let index = 0; index < 5000; index += 1) {
        const value = rng();
        assert.ok(value >= 0 && value < 1);
    }
});
