import assert from "node:assert/strict";
import test from "node:test";
import { FEATURE_ORDER } from "../../scripts/modules/ai/feature-schema.js";
import { scoreFeatures } from "../../scripts/modules/ai/board-evaluator.js";
import { evaluateNetwork } from "../../scripts/modules/ai/neat/neat-network.js";
import { scoreGenome } from "../../scripts/modules/ai/genome-scoring.js";

function sampleFeatures(overrides = {}) {
    return FEATURE_ORDER.reduce((acc, key) => ({ ...acc, [key]: overrides[key] ?? 0 }), {});
}

test("scoreGenome dispatches to scoreFeatures for a linear (weights-array) genome", () => {
    const features = sampleFeatures({ holes: 3, aggregateHeight: -2 });
    const genome = { weights: FEATURE_ORDER.map((key) => (key === "holes" ? -1 : key === "aggregateHeight" ? 0.5 : 0)) };
    assert.equal(scoreGenome(features, genome), scoreFeatures(features, genome.weights));
});

test("scoreGenome dispatches to the network evaluator for a NEAT genome", () => {
    const features = sampleFeatures({ [FEATURE_ORDER[0]]: 2 });
    const nodes = [
        ...FEATURE_ORDER.map((_, id) => ({ id, type: "input" })),
        { id: FEATURE_ORDER.length, type: "output" }
    ];
    const connections = [{ innovation: 0, inNode: 0, outNode: FEATURE_ORDER.length, weight: 3, enabled: true }];
    const genome = { nodes, connections };
    const inputs = FEATURE_ORDER.map((key) => features[key]);
    assert.equal(scoreGenome(features, genome), evaluateNetwork(genome, inputs));
    assert.ok(Math.abs(scoreGenome(features, genome) - Math.tanh(6)) < 1e-12);
});
