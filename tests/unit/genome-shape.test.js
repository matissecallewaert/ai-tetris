import assert from "node:assert/strict";
import test from "node:test";
import { isLinearGenome, isNeatGenome, isValidGenomeShape } from "../../scripts/modules/ai/genome-shape.js";

test("isLinearGenome is true only for genomes with a weights array", () => {
    assert.equal(isLinearGenome({ weights: [1, 2, 3] }), true);
    assert.equal(isLinearGenome({ weights: [] }), true);
    assert.equal(isLinearGenome({ nodes: [], connections: [] }), false);
    assert.equal(isLinearGenome(null), false);
    assert.equal(isLinearGenome(undefined), false);
    assert.equal(isLinearGenome({ weights: "nope" }), false);
});

test("isNeatGenome is true only for genomes with nodes and connections arrays", () => {
    assert.equal(isNeatGenome({ nodes: [], connections: [] }), true);
    assert.equal(isNeatGenome({ weights: [1, 2, 3] }), false);
    assert.equal(isNeatGenome({ nodes: [] }), false);
    assert.equal(isNeatGenome({ connections: [] }), false);
    assert.equal(isNeatGenome(null), false);
});

test("isValidGenomeShape accepts either shape and rejects garbage", () => {
    assert.equal(isValidGenomeShape({ weights: [1] }), true);
    assert.equal(isValidGenomeShape({ nodes: [], connections: [] }), true);
    assert.equal(isValidGenomeShape({}), false);
    assert.equal(isValidGenomeShape(null), false);
    assert.equal(isValidGenomeShape("genome"), false);
});
