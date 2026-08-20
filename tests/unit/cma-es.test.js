import assert from "node:assert/strict";
import test from "node:test";
import { createSeededRng } from "../../scripts/modules/ai/seeded-rng.js";
import { createCmaEsStrategy, INITIAL_STEP_SIZE } from "../../scripts/modules/ai/cma-es.js";

function sphereFitness(weights, optimum) {
    return -weights.reduce((sum, value, index) => sum + ((value - optimum[index]) ** 2), 0);
}

test("createPopulation returns the requested size with the right dimension count", () => {
    const strategy = createCmaEsStrategy(5);
    const population = strategy.createPopulation(16, createSeededRng(1));
    assert.equal(population.length, 16);
    for (const genome of population) {
        assert.equal(genome.weights.length, 5);
    }
});

test("nextGeneration preserves population size", () => {
    const strategy = createCmaEsStrategy(4);
    const rng = createSeededRng(2);
    const population = strategy.createPopulation(10, rng);
    const evaluated = population.map((genome) => ({ genome, fitness: sphereFitness(genome.weights, [0, 0, 0, 0]) }));
    const next = strategy.nextGeneration(evaluated, rng);
    assert.equal(next.length, 10);
});

test("nextGeneration does not mutate the evaluatedPopulation it was given", () => {
    const strategy = createCmaEsStrategy(3);
    const rng = createSeededRng(3);
    const population = strategy.createPopulation(8, rng);
    const evaluated = population.map((genome) => ({ genome, fitness: sphereFitness(genome.weights, [0, 0, 0]) }));
    const before = JSON.parse(JSON.stringify(evaluated));
    strategy.nextGeneration(evaluated, rng);
    assert.deepEqual(evaluated, before);
});

test("sigma starts at the configured initial step size and adapts over generations", () => {
    const strategy = createCmaEsStrategy(4);
    assert.equal(strategy.getState().sigma, INITIAL_STEP_SIZE);
    const rng = createSeededRng(4);
    let population = strategy.createPopulation(16, rng);
    for (let gen = 0; gen < 10; gen += 1) {
        const evaluated = population.map((genome) => ({ genome, fitness: sphereFitness(genome.weights, [3, 3, 3, 3]) }));
        population = strategy.nextGeneration(evaluated, rng);
    }
    assert.equal(strategy.getState().generation, 10);
    assert.notEqual(strategy.getState().sigma, INITIAL_STEP_SIZE);
});

test("converges to the known optimum of a simple quadratic bowl (sphere function)", () => {
    const dimensions = 4;
    const optimum = [2, -1, 0.5, 3];
    const strategy = createCmaEsStrategy(dimensions);
    const rng = createSeededRng(42);
    let population = strategy.createPopulation(20, rng);
    let bestEver = -Infinity;
    for (let gen = 0; gen < 80; gen += 1) {
        const evaluated = population.map((genome) => ({ genome, fitness: sphereFitness(genome.weights, optimum) }));
        bestEver = Math.max(bestEver, ...evaluated.map((entry) => entry.fitness));
        population = strategy.nextGeneration(evaluated, rng);
    }
    assert.ok(
        bestEver > -0.01,
        `expected CMA-ES to nearly reach the sphere optimum (fitness 0), got ${bestEver}`
    );
});
