import assert from "node:assert/strict";
import test from "node:test";
import { createSeededRng } from "../../scripts/modules/ai/seeded-rng.js";
import { createNeatStrategy } from "../../scripts/modules/ai/neat/neat.js";
import { evaluateNetwork } from "../../scripts/modules/ai/neat/neat-network.js";
import { INPUT_COUNT } from "../../scripts/modules/ai/neat/neat-constants.js";
import { isNeatGenome } from "../../scripts/modules/ai/genome-shape.js";

test("createPopulation returns the requested size, all valid minimal NEAT genomes", () => {
    const strategy = createNeatStrategy();
    const population = strategy.createPopulation(20, createSeededRng(1));
    assert.equal(population.length, 20);
    for (const genome of population) {
        assert.ok(isNeatGenome(genome));
        assert.equal(genome.connections.length, INPUT_COUNT);
    }
});

test("nextGeneration preserves population size across several generations", () => {
    const strategy = createNeatStrategy();
    const rng = createSeededRng(2);
    let population = strategy.createPopulation(24, rng);
    for (let gen = 0; gen < 5; gen += 1) {
        const evaluated = population.map((genome) => ({ genome, fitness: Math.random() * 0 + gen }));
        population = strategy.nextGeneration(evaluated, rng);
        assert.equal(population.length, 24);
    }
});

test("nextGeneration does not mutate the evaluatedPopulation it was given", () => {
    const strategy = createNeatStrategy();
    const rng = createSeededRng(3);
    const population = strategy.createPopulation(16, rng);
    const evaluated = population.map((genome, index) => ({ genome, fitness: index }));
    const before = JSON.parse(JSON.stringify(evaluated));
    strategy.nextGeneration(evaluated, rng);
    assert.deepEqual(evaluated, before);
});

test("getState reports an increasing generation count and a positive species count", () => {
    const strategy = createNeatStrategy();
    const rng = createSeededRng(4);
    let population = strategy.createPopulation(20, rng);
    assert.equal(strategy.getState().generation, 0);
    for (let gen = 0; gen < 3; gen += 1) {
        const evaluated = population.map((genome) => ({ genome, fitness: gen }));
        population = strategy.nextGeneration(evaluated, rng);
    }
    const state = strategy.getState();
    assert.equal(state.generation, 3);
    assert.ok(state.speciesCount > 0);
});

test("reproduction genuinely improves fitness on a target solvable by weight tuning alone", () => {
    const target = 0.5;
    const inputs = new Array(INPUT_COUNT).fill(1);
    function fitnessOf(genome) {
        const output = evaluateNetwork(genome, inputs);
        return -((output - target) ** 2);
    }

    const strategy = createNeatStrategy();
    const rng = createSeededRng(42);
    let population = strategy.createPopulation(60, rng);
    const initialBest = Math.max(...population.map(fitnessOf));

    let bestEver = -Infinity;
    for (let gen = 0; gen < 40; gen += 1) {
        const evaluated = population.map((genome) => ({ genome, fitness: fitnessOf(genome) }));
        bestEver = Math.max(bestEver, ...evaluated.map((entry) => entry.fitness));
        population = strategy.nextGeneration(evaluated, rng);
    }

    assert.ok(
        bestEver > initialBest,
        `expected NEAT reproduction to improve fitness beyond the initial population (initial ${initialBest}, best ${bestEver})`
    );
    assert.ok(bestEver > -0.01, `expected NEAT to nearly reach the target output, got fitness ${bestEver}`);
});
