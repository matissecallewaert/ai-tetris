import assert from "node:assert/strict";
import test from "node:test";
import { FEATURE_ORDER, SCHEMA_VERSION } from "../../scripts/modules/ai/feature-schema.js";
import {
    MAX_HISTORY_ENTRIES,
    deserializeTrainingState,
    serializeTrainingState
} from "../../scripts/modules/ai/persistence.js";

function sampleState(historyLength) {
    return {
        bestGenome: { weights: [1, 2, 3, 4, 5, 6, 7] },
        bestScore: 1234,
        history: Array.from({ length: historyLength }, (_, index) => ({
            generation: index,
            bestScore: index * 10,
            averageScore: index * 5,
            averageMoves: index
        }))
    };
}

test("serialize then deserialize round-trips the training state", () => {
    const state = sampleState(3);
    const restored = deserializeTrainingState(serializeTrainingState(state));
    assert.deepEqual(restored.bestGenome, state.bestGenome);
    assert.equal(restored.bestScore, state.bestScore);
    assert.deepEqual(restored.history, state.history);
});

test("serialize caps history to MAX_HISTORY_ENTRIES", () => {
    const state = sampleState(MAX_HISTORY_ENTRIES + 50);
    const restored = deserializeTrainingState(serializeTrainingState(state));
    assert.equal(restored.history.length, MAX_HISTORY_ENTRIES);
    assert.equal(restored.history[restored.history.length - 1].generation, state.history.length - 1);
});

test("deserialize rejects malformed JSON", () => {
    assert.equal(deserializeTrainingState("not json"), null);
});

test("deserialize rejects a missing or empty payload", () => {
    assert.equal(deserializeTrainingState(""), null);
    assert.equal(deserializeTrainingState(null), null);
});

test("deserialize rejects a mismatched schema version", () => {
    const raw = JSON.stringify({
        schemaVersion: SCHEMA_VERSION + 1,
        featureOrder: FEATURE_ORDER,
        bestGenome: { weights: [1, 2, 3, 4, 5, 6, 7] },
        bestScore: 0,
        history: []
    });
    assert.equal(deserializeTrainingState(raw), null);
});

test("deserialize rejects a mismatched feature order", () => {
    const raw = JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        featureOrder: [...FEATURE_ORDER].reverse(),
        bestGenome: { weights: [1, 2, 3, 4, 5, 6, 7] },
        bestScore: 0,
        history: []
    });
    assert.equal(deserializeTrainingState(raw), null);
});

test("serialize then deserialize round-trips a NEAT (nodes + connections) genome", () => {
    const state = {
        bestGenome: {
            nodes: [{ id: 0, type: "input" }, { id: 1, type: "output" }],
            connections: [{ innovation: 0, inNode: 0, outNode: 1, weight: 1.2, enabled: true }]
        },
        bestScore: 500,
        history: []
    };
    const restored = deserializeTrainingState(serializeTrainingState(state));
    assert.deepEqual(restored.bestGenome, state.bestGenome);
});

test("deserialize rejects a payload without a valid bestGenome", () => {
    const raw = JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        featureOrder: FEATURE_ORDER,
        bestGenome: { weights: "not-an-array" },
        bestScore: 0,
        history: []
    });
    assert.equal(deserializeTrainingState(raw), null);
});
