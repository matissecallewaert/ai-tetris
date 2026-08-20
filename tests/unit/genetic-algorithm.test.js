import assert from "node:assert/strict";
import test from "node:test";
import { GENE_COUNT } from "../../scripts/modules/ai/genome.js";
import {
    createPopulation,
    evaluatePopulation,
    nextGeneration
} from "../../scripts/modules/ai/genetic-algorithm.js";

test("createPopulation makes genomes of the right size and gene count", () => {
    const population = createPopulation(10, () => 0.5);
    assert.equal(population.length, 10);
    for (const genome of population) {
        assert.equal(genome.weights.length, GENE_COUNT);
    }
});

test("evaluatePopulation attaches fitness/score/movesTaken/linesCleared to every genome", () => {
    const population = createPopulation(3, () => 0.3);
    const evaluated = evaluatePopulation(population, { rng: () => 0.3, maxMoves: 5 });
    assert.equal(evaluated.length, 3);
    for (const entry of evaluated) {
        assert.ok(entry.genome);
        assert.equal(typeof entry.score, "number");
        assert.equal(typeof entry.fitness, "number");
        assert.ok(entry.movesTaken <= 5);
        assert.ok(["death", "move-limit"].includes(entry.terminationReason));
    }
});

test("nextGeneration preserves population size and carries the fittest genomes forward unchanged", () => {
    const evaluatedPopulation = [
        { genome: { weights: [1, 1, 1, 1, 1, 1, 1] }, fitness: 100 },
        { genome: { weights: [2, 2, 2, 2, 2, 2, 2] }, fitness: 50 },
        { genome: { weights: [3, 3, 3, 3, 3, 3, 3] }, fitness: 10 },
        { genome: { weights: [4, 4, 4, 4, 4, 4, 4] }, fitness: 1 }
    ];
    const next = nextGeneration(evaluatedPopulation, () => 0.1, { eliteCount: 1, tournamentSize: 2 });
    assert.equal(next.length, evaluatedPopulation.length);
    assert.deepEqual(next[0], { weights: [1, 1, 1, 1, 1, 1, 1] });
    assert.notStrictEqual(next[0], evaluatedPopulation[0].genome);
});

test("nextGeneration does not mutate the evaluatedPopulation it was given", () => {
    const evaluatedPopulation = [
        { genome: { weights: new Array(GENE_COUNT).fill(1) }, fitness: 5 },
        { genome: { weights: new Array(GENE_COUNT).fill(-1) }, fitness: 1 }
    ];
    const before = JSON.parse(JSON.stringify(evaluatedPopulation));
    nextGeneration(evaluatedPopulation, () => 0.5, { eliteCount: 1, tournamentSize: 2 });
    assert.deepEqual(evaluatedPopulation, before);
});
