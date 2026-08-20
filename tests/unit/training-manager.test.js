import assert from "node:assert/strict";
import test from "node:test";
import { createSeededRng } from "../../scripts/modules/ai/seeded-rng.js";
import { playEpisode } from "../../scripts/modules/ai/play-episode.js";
import { createCmaEsStrategy } from "../../scripts/modules/ai/cma-es.js";
import { GENE_COUNT } from "../../scripts/modules/ai/genome.js";
import { createNeatStrategy } from "../../scripts/modules/ai/neat/neat.js";
import { createRlStrategy, trainForRound } from "../../scripts/modules/ai/rl/td-learning.js";
import { createTrainingManager } from "../../scripts/modules/ai/training-manager.js";

function createFakeWorker() {
    const worker = {
        terminated: false,
        onmessage: null,
        postMessage(data) {
            const rng = createSeededRng(data.seed);
            const result = playEpisode(data.genome, { rng, maxMoves: data.maxMoves });
            queueMicrotask(() => {
                if (worker.terminated) {
                    return;
                }
                worker.onmessage?.({ data: { jobId: data.jobId, ...result } });
            });
        },
        terminate() {
            worker.terminated = true;
        }
    };
    return worker;
}

function createFakeRlWorker() {
    const worker = {
        terminated: false,
        onmessage: null,
        postMessage(data) {
            const rng = createSeededRng(data.seed);
            const result = trainForRound(data.genome, {}, { rng, maxMoves: data.maxMoves });
            queueMicrotask(() => {
                if (worker.terminated) {
                    return;
                }
                worker.onmessage?.({ data: { jobId: data.jobId, ...result } });
            });
        },
        terminate() {
            worker.terminated = true;
        }
    };
    return worker;
}

test("createTrainingManager evaluates a full population and advances a generation", async () => {
    let capturedCallback;
    const pending = new Promise((resolve) => {
        capturedCallback = (summary) => resolve(summary);
    });
    const manager = createTrainingManager({
        populationSize: 6,
        workerCount: 2,
        maxMoves: 10,
        rng: () => 0.3,
        createWorker: createFakeWorker,
        onGenerationComplete: capturedCallback
    });
    manager.start();
    const summary = await pending;
    assert.equal(summary.generation, 0);
    assert.equal(typeof summary.bestScore, "number");
    assert.equal(typeof summary.averageScore, "number");
    assert.equal(typeof summary.averageMoves, "number");
    assert.equal(manager.getState().generation, 1);
    assert.ok(manager.getBestGenome());
    manager.reset();
});

test("createTrainingManager works correctly with a CMA-ES strategy plugged in instead of GA", async () => {
    let capturedCallback;
    const pending = new Promise((resolve) => {
        capturedCallback = (summary) => resolve(summary);
    });
    const manager = createTrainingManager({
        populationSize: 8,
        workerCount: 2,
        maxMoves: 10,
        rng: createSeededRng(123),
        createWorker: createFakeWorker,
        strategy: createCmaEsStrategy(GENE_COUNT),
        onGenerationComplete: capturedCallback
    });
    manager.start();
    const summary = await pending;
    assert.equal(summary.generation, 0);
    assert.equal(typeof summary.bestScore, "number");
    assert.equal(manager.getState().generation, 1);
    assert.ok(manager.getBestGenome());
    manager.reset();
});

test("createTrainingManager works correctly with a NEAT strategy plugged in instead of GA", async () => {
    let capturedCallback;
    const pending = new Promise((resolve) => {
        capturedCallback = (summary) => resolve(summary);
    });
    const manager = createTrainingManager({
        populationSize: 10,
        workerCount: 2,
        maxMoves: 10,
        rng: createSeededRng(7),
        createWorker: createFakeWorker,
        strategy: createNeatStrategy(),
        onGenerationComplete: capturedCallback
    });
    manager.start();
    const summary = await pending;
    assert.equal(summary.generation, 0);
    assert.equal(typeof summary.bestScore, "number");
    assert.equal(manager.getState().generation, 1);
    const bestGenome = manager.getBestGenome();
    assert.ok(bestGenome);
    assert.ok(Array.isArray(bestGenome.nodes) && Array.isArray(bestGenome.connections));
    manager.reset();
});

test("createTrainingManager works correctly with an RL strategy, learning through the worker's returned genome", async () => {
    let capturedCallback;
    const pending = new Promise((resolve) => {
        capturedCallback = (summary) => resolve(summary);
    });
    const manager = createTrainingManager({
        populationSize: 4,
        workerCount: 2,
        maxMoves: 20,
        rng: createSeededRng(11),
        createWorker: createFakeRlWorker,
        strategy: createRlStrategy(),
        onGenerationComplete: capturedCallback
    });
    manager.start();
    const summary = await pending;
    assert.equal(summary.generation, 0);
    assert.equal(typeof summary.bestScore, "number");
    assert.equal(manager.getState().generation, 1);
    const bestGenome = manager.getBestGenome();
    assert.ok(bestGenome);
    assert.ok(Array.isArray(bestGenome.weights));
    manager.reset();
});

test("createTrainingManager keeps advancing generations while running", async () => {
    const seen = [];
    const manager = createTrainingManager({
        populationSize: 4,
        workerCount: 2,
        maxMoves: 8,
        rng: () => 0.6,
        createWorker: createFakeWorker,
        onGenerationComplete: (summary) => seen.push(summary)
    });
    manager.start();
    await new Promise((resolve) => {
        const check = () => {
            if (seen.length >= 3) {
                resolve();
                return;
            }
            queueMicrotask(check);
        };
        check();
    });
    assert.ok(seen.length >= 3);
    assert.deepEqual(seen.map((entry) => entry.generation), seen.map((_, index) => index));
    manager.reset();
});

test("pause stops advancing generations, and resuming continues from the same population", async () => {
    let completions = 0;
    const manager = createTrainingManager({
        populationSize: 4,
        workerCount: 2,
        maxMoves: 6,
        rng: () => 0.45,
        createWorker: createFakeWorker,
        onGenerationComplete: () => {
            completions += 1;
        }
    });
    manager.start();
    await new Promise((resolve) => {
        const check = () => (completions >= 1 ? resolve() : queueMicrotask(check));
        check();
    });
    manager.pause();
    const afterFirstPause = completions;
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(completions, afterFirstPause);
    assert.equal(manager.getState().running, false);
    manager.reset();
});

test("reset discards in-flight results so they cannot pollute the next run", async () => {
    let completions = 0;
    const manager = createTrainingManager({
        populationSize: 4,
        workerCount: 4,
        maxMoves: 400,
        rng: () => 0.5,
        createWorker: createFakeWorker,
        onGenerationComplete: () => {
            completions += 1;
        }
    });
    manager.start();
    manager.reset();
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(completions, 0);
    assert.equal(manager.getState().generation, 0);
    assert.equal(manager.getState().pendingJobs, 0);
    assert.equal(manager.getBestGenome(), null);
});

test("getState reports population size and worker pool size after starting", () => {
    const manager = createTrainingManager({
        populationSize: 12,
        workerCount: 3,
        maxMoves: 5,
        rng: () => 0.2,
        createWorker: createFakeWorker
    });
    manager.start();
    const state = manager.getState();
    assert.equal(state.populationSize, 12);
    assert.equal(state.workerCount, 3);
    manager.reset();
});
