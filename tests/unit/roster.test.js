import assert from "node:assert/strict";
import test from "node:test";
import { FEATURE_ORDER, SCHEMA_VERSION } from "../../scripts/modules/ai/feature-schema.js";
import {
    createRosterEntry,
    deserializeRoster,
    serializeRoster,
    MAX_ROSTER_ENTRIES
} from "../../scripts/modules/ai/roster.js";

function sampleGenome() {
    return { weights: FEATURE_ORDER.map((_, index) => index / 10) };
}

function sampleNeatGenome() {
    return {
        nodes: [{ id: 0, type: "input" }, { id: 1, type: "output" }],
        connections: [{ innovation: 0, inNode: 0, outNode: 1, weight: 0.7, enabled: true }]
    };
}

test("createRosterEntry builds a self-contained entry with an independent weights copy", () => {
    const genome = sampleGenome();
    const entry = createRosterEntry({
        name: "My Champion",
        algorithm: "genetic-algorithm",
        score: 12345,
        genome,
        savedAt: 1000
    });
    assert.equal(entry.name, "My Champion");
    assert.equal(entry.algorithm, "genetic-algorithm");
    assert.equal(entry.score, 12345);
    assert.deepEqual(entry.genome.weights, genome.weights);
    assert.notStrictEqual(entry.genome.weights, genome.weights);
    assert.equal(typeof entry.id, "string");
    assert.ok(entry.id.length > 0);
});

test("createRosterEntry gives distinct ids to distinct entries", () => {
    const genome = sampleGenome();
    const a = createRosterEntry({ name: "A", algorithm: "ga", score: 1, genome, savedAt: 1000 });
    const b = createRosterEntry({ name: "B", algorithm: "ga", score: 1, genome, savedAt: 1000 });
    assert.notEqual(a.id, b.id);
});

test("serialize then deserialize round-trips a roster", () => {
    const genome = sampleGenome();
    const entries = [
        createRosterEntry({ name: "First", algorithm: "genetic-algorithm", score: 100, genome, savedAt: 1 }),
        createRosterEntry({ name: "Second", algorithm: "cma-es", score: 200, genome, savedAt: 2 })
    ];
    const restored = deserializeRoster(serializeRoster(entries));
    assert.deepEqual(restored, entries);
});

test("serialize caps the roster to MAX_ROSTER_ENTRIES, keeping the most recent", () => {
    const genome = sampleGenome();
    const entries = Array.from({ length: MAX_ROSTER_ENTRIES + 10 }, (_, index) => (
        createRosterEntry({ name: `Entry ${index}`, algorithm: "ga", score: index, genome, savedAt: index })
    ));
    const restored = deserializeRoster(serializeRoster(entries));
    assert.equal(restored.length, MAX_ROSTER_ENTRIES);
    assert.equal(restored[restored.length - 1].name, `Entry ${entries.length - 1}`);
});

test("deserialize returns an empty roster for malformed, missing, or schema-mismatched data", () => {
    assert.deepEqual(deserializeRoster(""), []);
    assert.deepEqual(deserializeRoster(null), []);
    assert.deepEqual(deserializeRoster("not json"), []);
    assert.deepEqual(
        deserializeRoster(JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, featureOrder: FEATURE_ORDER, entries: [] })),
        []
    );
    assert.deepEqual(
        deserializeRoster(JSON.stringify({ schemaVersion: SCHEMA_VERSION, featureOrder: [...FEATURE_ORDER].reverse(), entries: [] })),
        []
    );
});

test("createRosterEntry accepts a NEAT genome and clones it independently", () => {
    const genome = sampleNeatGenome();
    const entry = createRosterEntry({ name: "Neuron", algorithm: "neat", score: 42, genome, savedAt: 5 });
    assert.deepEqual(entry.genome, genome);
    assert.notStrictEqual(entry.genome.nodes, genome.nodes);
    assert.notStrictEqual(entry.genome.connections, genome.connections);
    entry.genome.connections[0].weight = 999;
    assert.notEqual(genome.connections[0].weight, 999);
});

test("a NEAT-genome roster entry round-trips through serialize/deserialize", () => {
    const genome = sampleNeatGenome();
    const entries = [createRosterEntry({ name: "Neuron", algorithm: "neat", score: 42, genome, savedAt: 5 })];
    const restored = deserializeRoster(serializeRoster(entries));
    assert.deepEqual(restored, entries);
});

test("deserialize rejects a NEAT-shaped genome missing its connections array", () => {
    const good = createRosterEntry({ name: "Neuron", algorithm: "neat", score: 1, genome: sampleNeatGenome(), savedAt: 1 });
    const raw = JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        featureOrder: FEATURE_ORDER,
        entries: [{ ...good, id: "bad", genome: { nodes: [] } }]
    });
    assert.deepEqual(deserializeRoster(raw), []);
});

test("deserialize filters out individually malformed entries rather than discarding the whole roster", () => {
    const genome = sampleGenome();
    const good = createRosterEntry({ name: "Good", algorithm: "ga", score: 5, genome, savedAt: 1 });
    const raw = JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        featureOrder: FEATURE_ORDER,
        entries: [good, { id: "bad", name: "Bad" }, null, { ...good, id: "another-bad", genome: { weights: "nope" } }]
    });
    const restored = deserializeRoster(raw);
    assert.deepEqual(restored, [good]);
});
