import assert from "node:assert/strict";
import test from "node:test";
import {
    compatibilityDistance,
    DISJOINT_COEFFICIENT,
    EXCESS_COEFFICIENT,
    SMALL_GENOME_THRESHOLD,
    WEIGHT_DIFF_COEFFICIENT
} from "../../scripts/modules/ai/neat/neat-speciation.js";

function genomeWithConnections(connections) {
    return { nodes: [], connections };
}

function connection(innovation, weight = 0, enabled = true) {
    return { innovation, inNode: 0, outNode: 1, weight, enabled };
}

test("identical genomes have zero compatibility distance", () => {
    const genome = genomeWithConnections([connection(0, 1), connection(1, -1)]);
    assert.equal(compatibilityDistance(genome, genome), 0);
});

test("distance from weight differences alone matches the weighted average difference", () => {
    const a = genomeWithConnections([connection(0, 1), connection(1, 3)]);
    const b = genomeWithConnections([connection(0, 2), connection(1, 5)]);
    const expected = WEIGHT_DIFF_COEFFICIENT * ((1 + 2) / 2);
    assert.ok(Math.abs(compatibilityDistance(a, b) - expected) < 1e-12);
});

test("disjoint genes on a small genome are counted at full weight (normalizer of 1)", () => {
    const a = genomeWithConnections([connection(0), connection(1)]);
    const b = genomeWithConnections([connection(0)]);
    assert.ok(a.connections.length < SMALL_GENOME_THRESHOLD);
    const expected = DISJOINT_COEFFICIENT * 1;
    assert.ok(Math.abs(compatibilityDistance(a, b) - expected) < 1e-12);
});

test("excess genes beyond the other genome's max innovation are counted separately from disjoint", () => {
    const a = genomeWithConnections([connection(0), connection(10)]);
    const b = genomeWithConnections([connection(0)]);
    const expected = EXCESS_COEFFICIENT * 1;
    assert.ok(Math.abs(compatibilityDistance(a, b) - expected) < 1e-12);
});

test("large genomes (at or above the small-genome threshold) normalize by genome size", () => {
    const bigConnections = Array.from({ length: SMALL_GENOME_THRESHOLD }, (_, i) => connection(i));
    const a = genomeWithConnections([...bigConnections, connection(1000)]);
    const b = genomeWithConnections(bigConnections);
    const expected = (EXCESS_COEFFICIENT * 1) / (SMALL_GENOME_THRESHOLD + 1);
    assert.ok(Math.abs(compatibilityDistance(a, b) - expected) < 1e-9);
});

test("compatibility distance is symmetric", () => {
    const a = genomeWithConnections([connection(0, 1), connection(2, -2)]);
    const b = genomeWithConnections([connection(0, 4), connection(5, 3)]);
    assert.ok(Math.abs(compatibilityDistance(a, b) - compatibilityDistance(b, a)) < 1e-12);
});
