import assert from "node:assert/strict";
import test from "node:test";
import { FEATURE_ORDER } from "../../scripts/modules/ai/feature-schema.js";
import { createInnovationTracker } from "../../scripts/modules/ai/neat/innovation-tracker.js";
import { INPUT_COUNT, OUTPUT_NODE_ID } from "../../scripts/modules/ai/neat/neat-constants.js";
import { evaluateNetwork } from "../../scripts/modules/ai/neat/neat-network.js";
import { cloneGenome, createMinimalGenome, mutateGenome } from "../../scripts/modules/ai/neat/neat-genome.js";

test("INPUT_COUNT matches the feature schema", () => {
    assert.equal(INPUT_COUNT, FEATURE_ORDER.length);
});

test("createMinimalGenome fully connects every input directly to a single output", () => {
    const tracker = createInnovationTracker(OUTPUT_NODE_ID + 1);
    const genome = createMinimalGenome(() => 0.5, tracker);
    assert.equal(genome.nodes.length, INPUT_COUNT + 1);
    assert.equal(genome.nodes.filter((n) => n.type === "input").length, INPUT_COUNT);
    assert.equal(genome.nodes.filter((n) => n.type === "output").length, 1);
    assert.equal(genome.connections.length, INPUT_COUNT);
    assert.ok(genome.connections.every((c) => c.outNode === OUTPUT_NODE_ID && c.enabled));
    const innovations = genome.connections.map((c) => c.innovation);
    assert.deepEqual([...innovations].sort((a, b) => a - b), Array.from({ length: INPUT_COUNT }, (_, i) => i));
});

test("cloneGenome returns a deep, independent copy", () => {
    const tracker = createInnovationTracker(OUTPUT_NODE_ID + 1);
    const genome = createMinimalGenome(() => 0.3, tracker);
    const clone = cloneGenome(genome);
    assert.deepEqual(clone, genome);
    assert.notStrictEqual(clone.connections, genome.connections);
    clone.connections[0].weight = 999;
    clone.nodes[0].type = "mutated";
    assert.notEqual(genome.connections[0].weight, 999);
    assert.notEqual(genome.nodes[0].type, "mutated");
});

test("mutateGenome is a no-op when rng never clears any mutation threshold", () => {
    const tracker = createInnovationTracker(OUTPUT_NODE_ID + 1);
    const genome = createMinimalGenome(() => 0.3, tracker);
    const mutated = mutateGenome(genome, () => 1, tracker);
    assert.deepEqual(mutated, genome);
});

test("mutateGenome does not mutate its input genome", () => {
    const tracker = createInnovationTracker(OUTPUT_NODE_ID + 1);
    const genome = createMinimalGenome(() => 0.3, tracker);
    const before = JSON.parse(JSON.stringify(genome));
    mutateGenome(genome, () => 0, tracker);
    assert.deepEqual(genome, before);
});

test("mutateGenome with rng always at 0 grows a hidden node via add-node splitting", () => {
    const tracker = createInnovationTracker(OUTPUT_NODE_ID + 1);
    const genome = createMinimalGenome(() => 0.3, tracker);
    const mutated = mutateGenome(genome, () => 0, tracker);
    assert.equal(mutated.nodes.length, genome.nodes.length + 1);
    assert.equal(mutated.nodes.filter((n) => n.type === "hidden").length, 1);
    assert.equal(mutated.connections.length, genome.connections.length + 2);
    assert.equal(mutated.connections.filter((c) => c.enabled).length, genome.connections.length);
    assert.equal(mutated.connections.filter((c) => !c.enabled).length, 2);
});

test("mutateGenome never introduces a cycle, even under heavy repeated mutation", () => {
    const tracker = createInnovationTracker(OUTPUT_NODE_ID + 1);
    let genome = createMinimalGenome(() => 0.3, tracker);
    let seed = 1;
    const rng = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
    for (let i = 0; i < 200; i += 1) {
        genome = mutateGenome(genome, rng, tracker);
    }
    const inputs = new Array(INPUT_COUNT).fill(0.5);
    const output = evaluateNetwork(genome, inputs);
    assert.equal(typeof output, "number");
    assert.ok(Number.isFinite(output));
});

function scriptedRng(values) {
    let index = 0;
    return () => {
        const value = values[Math.min(index, values.length - 1)];
        index += 1;
        return value;
    };
}

test("add-connection mutation wires a genuinely new, previously-unconnected pair", () => {
    const tracker = createInnovationTracker(3);
    const genome = {
        nodes: [{ id: 0, type: "input" }, { id: 1, type: "input" }, { id: 2, type: "output" }],
        connections: [{ innovation: 0, inNode: 0, outNode: 2, weight: 1, enabled: true }]
    };
    // Sequence: skip weight mutation, skip toggle, fire add-connection (pick its only
    // candidate), then skip add-node.
    const rng = scriptedRng([0.9, 0.9, 0.01, 0, 0.9]);
    const mutated = mutateGenome(genome, rng, tracker);
    assert.equal(mutated.connections.length, genome.connections.length + 1);
    const added = mutated.connections[mutated.connections.length - 1];
    assert.equal(added.inNode, 1);
    assert.equal(added.outNode, 2);
    assert.ok(mutated.connections[0].enabled);
});
