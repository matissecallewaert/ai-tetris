import assert from "node:assert/strict";
import test from "node:test";
import { createSeededRng } from "../../scripts/modules/ai/seeded-rng.js";
import { GENE_COUNT } from "../../scripts/modules/ai/genome.js";
import {
    accumulateTrace,
    applyTracedUpdate,
    createRlStrategy,
    playEpisodeWithLearning,
    trainForRound
} from "../../scripts/modules/ai/rl/td-learning.js";

function smallGenome(rng = createSeededRng(1)) {
    return { weights: Array.from({ length: GENE_COUNT }, () => (rng() * 2 - 1) * 0.05) };
}

test("playEpisodeWithLearning terminates within maxMoves and reports a valid termination reason", () => {
    const result = playEpisodeWithLearning(smallGenome(), {}, { rng: createSeededRng(1), maxMoves: 50 });
    assert.ok(result.movesTaken <= 50);
    assert.ok(["death", "move-limit"].includes(result.terminationReason));
    assert.ok(result.score >= 0);
    assert.ok(result.linesCleared >= 0);
});

test("playEpisodeWithLearning returns a genome with the same number of weights it was given", () => {
    const result = playEpisodeWithLearning(smallGenome(), {}, { rng: createSeededRng(2), maxMoves: 50 });
    assert.equal(result.genome.weights.length, GENE_COUNT);
});

test("playEpisodeWithLearning does not mutate the input genome", () => {
    const genome = smallGenome();
    const before = [...genome.weights];
    playEpisodeWithLearning(genome, {}, { rng: createSeededRng(3), maxMoves: 50 });
    assert.deepEqual(genome.weights, before);
});

test("playEpisodeWithLearning never produces non-finite weights across many episodes (numerical stability)", () => {
    let genome = smallGenome(createSeededRng(4));
    const rng = createSeededRng(5);
    for (let i = 0; i < 30; i += 1) {
        const result = playEpisodeWithLearning(genome, {}, { rng, maxMoves: 100 });
        genome = result.genome;
        assert.ok(genome.weights.every(Number.isFinite), `weights became non-finite at episode ${i}: ${genome.weights}`);
    }
});

test("playEpisodeWithLearning with explorationRate 1 still returns a well-formed result (pure random play)", () => {
    const result = playEpisodeWithLearning(smallGenome(), { explorationRate: 1 }, { rng: createSeededRng(6), maxMoves: 30 });
    assert.ok(result.movesTaken <= 30);
    assert.ok(result.genome.weights.every(Number.isFinite));
});

test("trainForRound plays episodesPerRound episodes back-to-back, carrying weights forward continuously", () => {
    const genome = smallGenome();
    const rng = createSeededRng(7);
    const single = playEpisodeWithLearning(genome, {}, { rng: createSeededRng(7), maxMoves: 50 });
    const batch = trainForRound(genome, {}, { rng, maxMoves: 50, episodesPerRound: 3 });
    assert.notDeepEqual(batch.genome.weights, single.genome.weights);
});

test("trainForRound reports the average score and moves across the whole batch, not just the last episode", () => {
    const result = trainForRound(smallGenome(), {}, { rng: createSeededRng(8), maxMoves: 50, episodesPerRound: 5 });
    assert.equal(typeof result.score, "number");
    assert.equal(typeof result.movesTaken, "number");
    assert.ok(result.score >= 0);
    assert.ok(result.movesTaken >= 0);
});

test("createRlStrategy.createPopulation returns the requested size with GENE_COUNT-length small weights", () => {
    const strategy = createRlStrategy();
    const population = strategy.createPopulation(10, createSeededRng(9));
    assert.equal(population.length, 10);
    for (const genome of population) {
        assert.equal(genome.weights.length, GENE_COUNT);
        for (const weight of genome.weights) {
            assert.ok(Math.abs(weight) <= 0.05, `expected a small initial weight, got ${weight}`);
        }
    }
});

test("createRlStrategy.nextGeneration returns the plain average of the population's weights", () => {
    const strategy = createRlStrategy();
    const evaluatedPopulation = [
        { genome: { weights: [1, 2, 3] }, fitness: 10 },
        { genome: { weights: [3, 4, 5] }, fitness: 20 }
    ];
    const next = strategy.nextGeneration(evaluatedPopulation);
    assert.equal(next.length, 2);
    for (const genome of next) {
        assert.deepEqual(genome.weights, [2, 3, 4]);
    }
});

test("createRlStrategy.nextGeneration does not mutate the evaluatedPopulation it was given", () => {
    const strategy = createRlStrategy();
    const evaluatedPopulation = [
        { genome: { weights: [1, 2, 3] }, fitness: 10 },
        { genome: { weights: [3, 4, 5] }, fitness: 20 }
    ];
    const before = JSON.parse(JSON.stringify(evaluatedPopulation));
    strategy.nextGeneration(evaluatedPopulation);
    assert.deepEqual(evaluatedPopulation, before);
});

test("createRlStrategy.nextGeneration gives every returned genome an independent weights array", () => {
    const strategy = createRlStrategy();
    const evaluatedPopulation = [
        { genome: { weights: [1, 2] }, fitness: 1 },
        { genome: { weights: [3, 4] }, fitness: 1 }
    ];
    const next = strategy.nextGeneration(evaluatedPopulation);
    next[0].weights[0] = 999;
    assert.notEqual(next[1].weights[0], 999);
});

test("accumulateTrace with traceDecay 0 collapses to the plain feature vector (exactly TD(0))", () => {
    const trace = [5, 5, 5];
    const features = [1, 2, 3];
    assert.deepEqual(accumulateTrace(trace, features, 0.98, 0), features);
});

test("accumulateTrace decays the old trace by discountFactor * traceDecay and adds the new state", () => {
    const trace = [1, 0];
    const features = [0, 1];
    const result = accumulateTrace(trace, features, 0.5, 0.5);
    assert.ok(Math.abs(result[0] - 0.25) < 1e-12);
    assert.ok(Math.abs(result[1] - 1) < 1e-12);
});

test("accumulateTrace keeps crediting older states, decreasingly, as moves go by", () => {
    const features = [1, 0];
    let trace = [0, 0];
    trace = accumulateTrace(trace, features, 0.98, 0.9);
    const afterOne = trace[0];
    trace = accumulateTrace(trace, [0, 1], 0.98, 0.9);
    const afterTwo = trace[0];
    assert.ok(afterTwo > 0, "an older state must still carry some credit");
    assert.ok(afterTwo < afterOne, "but strictly less than it did one move ago");
});

test("accumulateTrace does not mutate the trace it was given", () => {
    const trace = [1, 2];
    const before = [...trace];
    accumulateTrace(trace, [1, 1], 0.98, 0.9);
    assert.deepEqual(trace, before);
});

test("applyTracedUpdate moves every traced weight in proportion to its eligibility", () => {
    const weights = [0, 0, 0];
    const trace = [1, 0.5, 0];
    const updated = applyTracedUpdate(weights, trace, 2, 0.1);
    assert.ok(Math.abs(updated[0] - 0.2) < 1e-12);
    assert.ok(Math.abs(updated[1] - 0.1) < 1e-12);
    assert.equal(updated[2], 0);
});

test("applyTracedUpdate does not mutate the weights it was given", () => {
    const weights = [1, 2];
    const before = [...weights];
    applyTracedUpdate(weights, [1, 1], 1, 0.5);
    assert.deepEqual(weights, before);
});

test("playEpisodeWithLearning stays numerically stable with traces enabled", () => {
    let genome = smallGenome(createSeededRng(21));
    const rng = createSeededRng(22);
    for (let i = 0; i < 30; i += 1) {
        genome = playEpisodeWithLearning(genome, { traceDecay: 0.9 }, { rng, maxMoves: 100 }).genome;
        assert.ok(genome.weights.every(Number.isFinite), `weights diverged at episode ${i}`);
    }
});

test("traces change the learned weights relative to TD(0) on an identical seeded run", () => {
    const genome = smallGenome(createSeededRng(31));
    const td0 = playEpisodeWithLearning(genome, { traceDecay: 0 }, { rng: createSeededRng(32), maxMoves: 120 });
    const tdLambda = playEpisodeWithLearning(genome, { traceDecay: 0.9 }, { rng: createSeededRng(32), maxMoves: 120 });
    assert.notDeepEqual(tdLambda.genome.weights, td0.genome.weights);
});
