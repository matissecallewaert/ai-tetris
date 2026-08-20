import assert from "node:assert/strict";
import test from "node:test";
import { evaluateNetwork } from "../../scripts/modules/ai/neat/neat-network.js";

function directGenome(weights) {
    return {
        nodes: [{ id: 0, type: "input" }, { id: 1, type: "input" }, { id: 2, type: "output" }],
        connections: [
            { innovation: 0, inNode: 0, outNode: 2, weight: weights[0], enabled: true },
            { innovation: 1, inNode: 1, outNode: 2, weight: weights[1], enabled: true }
        ]
    };
}

test("evaluateNetwork with only direct input-to-output connections computes tanh of the weighted sum", () => {
    const genome = directGenome([2, -1]);
    const result = evaluateNetwork(genome, [1, 1]);
    assert.ok(Math.abs(result - Math.tanh(2 - 1)) < 1e-12);
});

test("evaluateNetwork ignores disabled connections", () => {
    const genome = {
        nodes: [{ id: 0, type: "input" }, { id: 1, type: "output" }],
        connections: [
            { innovation: 0, inNode: 0, outNode: 1, weight: 5, enabled: false },
            { innovation: 1, inNode: 0, outNode: 1, weight: 1, enabled: true }
        ]
    };
    const result = evaluateNetwork(genome, [2]);
    assert.ok(Math.abs(result - Math.tanh(2)) < 1e-12);
});

test("evaluateNetwork propagates correctly through a hidden node", () => {
    const genome = {
        nodes: [
            { id: 0, type: "input" },
            { id: 1, type: "input" },
            { id: 2, type: "output" },
            { id: 3, type: "hidden" }
        ],
        connections: [
            { innovation: 0, inNode: 0, outNode: 3, weight: 2, enabled: true },
            { innovation: 1, inNode: 1, outNode: 3, weight: -2, enabled: true },
            { innovation: 2, inNode: 3, outNode: 2, weight: 1, enabled: true },
            { innovation: 3, inNode: 0, outNode: 2, weight: 0.5, enabled: true }
        ]
    };
    const result = evaluateNetwork(genome, [1, 0]);
    const expectedHidden = Math.tanh((2 * 1) + (-2 * 0));
    const expected = Math.tanh((1 * expectedHidden) + (0.5 * 1));
    assert.ok(Math.abs(result - expected) < 1e-12);
});

test("evaluateNetwork gives the same result regardless of node array order", () => {
    const genome = {
        nodes: [
            { id: 0, type: "input" },
            { id: 1, type: "input" },
            { id: 2, type: "output" },
            { id: 3, type: "hidden" }
        ],
        connections: [
            { innovation: 0, inNode: 0, outNode: 3, weight: 1.5, enabled: true },
            { innovation: 1, inNode: 1, outNode: 3, weight: -0.5, enabled: true },
            { innovation: 2, inNode: 3, outNode: 2, weight: 2, enabled: true }
        ]
    };
    const reordered = { nodes: [...genome.nodes].reverse(), connections: genome.connections };
    const a = evaluateNetwork(genome, [0.4, 0.7]);
    const b = evaluateNetwork(reordered, [0.4, 0.7]);
    assert.equal(a, b);
});

test("evaluateNetwork returns 0 when there is no output node", () => {
    const genome = { nodes: [{ id: 0, type: "input" }], connections: [] };
    assert.equal(evaluateNetwork(genome, [1]), 0);
});
