import assert from "node:assert/strict";
import test from "node:test";
import { crossoverGenomes } from "../../scripts/modules/ai/neat/neat-crossover.js";

function genome(nodes, connections) {
    return { nodes, connections };
}

test("matching gene: rng below 0.5 inherits the fitter parent's weight", () => {
    const fitter = genome([{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 5, enabled: true }]);
    const other = genome([{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 9, enabled: true }]);
    const child = crossoverGenomes(fitter, other, () => 0.1);
    assert.equal(child.connections[0].weight, 5);
});

test("matching gene: rng at or above 0.5 inherits the other parent's weight", () => {
    const fitter = genome([{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 5, enabled: true }]);
    const other = genome([{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 9, enabled: true }]);
    const child = crossoverGenomes(fitter, other, () => 0.9);
    assert.equal(child.connections[0].weight, 9);
});

test("disjoint and excess genes are always inherited from the fitter parent, never the other", () => {
    const fitter = genome(
        [{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [
            { innovation: 0, inNode: 0, outNode: 1, weight: 1, enabled: true },
            { innovation: 5, inNode: 0, outNode: 1, weight: 99, enabled: true }
        ]
    );
    const other = genome(
        [{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 2, enabled: true }]
    );
    const child = crossoverGenomes(fitter, other, () => 0.9);
    assert.equal(child.connections.length, 2);
    const excessGene = child.connections.find((c) => c.innovation === 5);
    assert.equal(excessGene.weight, 99);
});

test("a gene disabled in either parent has a 75% chance of staying disabled in the child", () => {
    const fitter = genome([{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 1, enabled: false }]);
    const other = genome([{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 2, enabled: true }]);

    const staysDisabled = crossoverGenomes(fitter, other, () => 0.1);
    assert.equal(staysDisabled.connections[0].enabled, false);

    const reEnabled = crossoverGenomes(fitter, other, () => 0.9);
    assert.equal(reEnabled.connections[0].enabled, true);
});

test("a gene enabled in both parents is always enabled in the child", () => {
    const fitter = genome([{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 1, enabled: true }]);
    const other = genome([{ id: 0, type: "input" }, { id: 1, type: "output" }],
        [{ innovation: 0, inNode: 0, outNode: 1, weight: 2, enabled: true }]);
    const child = crossoverGenomes(fitter, other, () => 0.99);
    assert.equal(child.connections[0].enabled, true);
});

test("child nodes come from the fitter parent as an independent copy", () => {
    const fitter = genome([{ id: 0, type: "input" }], []);
    const other = genome([{ id: 0, type: "input" }, { id: 99, type: "hidden" }], []);
    const child = crossoverGenomes(fitter, other, () => 0.5);
    assert.equal(child.nodes.length, 1);
    child.nodes[0].type = "changed";
    assert.equal(fitter.nodes[0].type, "input");
});
