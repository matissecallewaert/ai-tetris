import assert from "node:assert/strict";
import test from "node:test";
import { FEATURE_ORDER } from "../../scripts/modules/ai/feature-schema.js";
import {
    GENE_COUNT,
    cloneGenome,
    createGenome,
    crossoverGenomes,
    mutateGenome
} from "../../scripts/modules/ai/genome.js";

test("GENE_COUNT matches the feature schema", () => {
    assert.equal(GENE_COUNT, FEATURE_ORDER.length);
});

test("createGenome produces GENE_COUNT signed weights within the requested range", () => {
    const genome = createGenome(() => 0.9, 2);
    assert.equal(genome.weights.length, GENE_COUNT);
    for (const weight of genome.weights) {
        assert.ok(weight >= -2 && weight <= 2);
    }
});

test("cloneGenome returns an independent copy", () => {
    const genome = createGenome(() => 0.5);
    const clone = cloneGenome(genome);
    assert.deepEqual(clone, genome);
    assert.notStrictEqual(clone.weights, genome.weights);
    clone.weights[0] = 999;
    assert.notEqual(genome.weights[0], 999);
});

test("mutateGenome respects mutationRate 0 (never changes) and 1 (always changes)", () => {
    const genome = createGenome(() => 0.5);
    const unchanged = mutateGenome(genome, () => 0.5, { mutationRate: 0 });
    assert.deepEqual(unchanged.weights, genome.weights);
    assert.notStrictEqual(unchanged, genome);
    const changed = mutateGenome(genome, () => 0.9, { mutationRate: 1, mutationStrength: 1 });
    for (let index = 0; index < GENE_COUNT; index += 1) {
        assert.notEqual(changed.weights[index], genome.weights[index]);
    }
});

test("mutateGenome clamps weights to [-1, 1]", () => {
    const genome = { weights: new Array(GENE_COUNT).fill(0.9) };
    const mutated = mutateGenome(genome, () => 0.99, { mutationRate: 1, mutationStrength: 5 });
    for (const weight of mutated.weights) {
        assert.ok(weight <= 1 && weight >= -1);
    }
});

test("mutateGenome does not mutate its input genome", () => {
    const genome = createGenome(() => 0.5);
    const before = [...genome.weights];
    mutateGenome(genome, () => 0.9, { mutationRate: 1 });
    assert.deepEqual(genome.weights, before);
});

test("crossoverGenomes only ever picks genes from one parent or the other", () => {
    const parentA = { weights: new Array(GENE_COUNT).fill(-1) };
    const parentB = { weights: new Array(GENE_COUNT).fill(1) };
    const child = crossoverGenomes(parentA, parentB, () => 0.5);
    for (const weight of child.weights) {
        assert.ok(weight === -1 || weight === 1);
    }
    assert.deepEqual(parentA.weights, new Array(GENE_COUNT).fill(-1));
    assert.deepEqual(parentB.weights, new Array(GENE_COUNT).fill(1));
});

test("crossoverGenomes with rng always below 0.5 yields parentA exactly", () => {
    const parentA = { weights: [1, 2, 3, 4, 5, 6, 7] };
    const parentB = { weights: [7, 6, 5, 4, 3, 2, 1] };
    const child = crossoverGenomes(parentA, parentB, () => 0.1);
    assert.deepEqual(child.weights, parentA.weights);
});
