import { createGeneticAlgorithmStrategy } from "./genetic-algorithm.js";
import { DEFAULT_MAX_MOVES } from "./play-episode.js";

export const DEFAULT_POPULATION_SIZE = 50;
export const MAX_WORKER_COUNT = 4;
export { DEFAULT_MAX_MOVES };

function defaultWorkerCount() {
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : undefined;
    return Math.max(1, Math.min(MAX_WORKER_COUNT, (cores ?? MAX_WORKER_COUNT) - 1));
}

function defaultCreateWorker() {
    return new Worker(new URL("./ai-worker.js", import.meta.url), { type: "module" });
}

export function createTrainingManager({
    populationSize = DEFAULT_POPULATION_SIZE,
    workerCount = defaultWorkerCount(),
    maxMoves = DEFAULT_MAX_MOVES,
    rng = Math.random,
    createWorker = defaultCreateWorker,
    strategy = createGeneticAlgorithmStrategy(),
    onGenerationComplete = () => {}
} = {}) {
    let population = strategy.createPopulation(populationSize, rng);
    let generation = 0;
    let runId = 0;
    let running = false;
    let nextJobId = 0;
    let queue = [];
    let results = [];
    let workers = [];
    let bestEver = null;

    function pickSeed() {
        return Math.floor(rng() * 0xFFFFFFFF);
    }

    function attachWorker(slot) {
        slot.worker.onmessage = (event) => onWorkerMessage(slot, event.data);
        return slot;
    }

    function ensureWorkers() {
        while (workers.length < workerCount) {
            workers.push(attachWorker({ worker: createWorker(), busy: false, job: null }));
        }
    }

    function fillQueueFromPopulation(seed) {
        queue = population.map((genome) => ({ jobId: nextJobId += 1, runId, genome, seed }));
        results = [];
    }

    function pumpQueue() {
        for (const slot of workers) {
            if (!slot.busy && queue.length > 0) {
                const job = queue.shift();
                slot.busy = true;
                slot.job = job;
                slot.worker.postMessage({
                    jobId: job.jobId,
                    genome: job.genome,
                    seed: job.seed,
                    maxMoves
                });
            }
        }
    }

    function onWorkerMessage(slot, data) {
        const job = slot.job;
        slot.busy = false;
        slot.job = null;
        const isStale = !job || data.jobId !== job.jobId || job.runId !== runId;
        if (!isStale) {
            results.push({
                genome: data.genome ?? job.genome,
                score: data.score,
                movesTaken: data.movesTaken,
                linesCleared: data.linesCleared,
                terminationReason: data.terminationReason
            });
        }
        if (running) {
            pumpQueue();
            maybeAdvanceGeneration();
        }
    }

    function maybeAdvanceGeneration() {
        if (queue.length > 0 || results.length < population.length) {
            return;
        }
        const evaluated = results.map((entry) => ({ ...entry, fitness: entry.score }));
        const best = evaluated.reduce((top, entry) => (entry.fitness > top.fitness ? entry : top));
        if (!bestEver || best.fitness > bestEver.score) {
            bestEver = { genome: best.genome, score: best.fitness, generation };
        }
        onGenerationComplete({
            generation,
            bestScore: best.fitness,
            bestEverScore: bestEver.score,
            averageScore: evaluated.reduce((sum, entry) => sum + entry.score, 0) / evaluated.length,
            averageMoves: evaluated.reduce((sum, entry) => sum + entry.movesTaken, 0) / evaluated.length
        });
        generation += 1;
        population = strategy.nextGeneration(evaluated, rng);
        if (running) {
            fillQueueFromPopulation(pickSeed());
            pumpQueue();
        }
    }

    function start() {
        if (running) {
            return;
        }
        running = true;
        ensureWorkers();
        if (queue.length === 0 && results.length === 0) {
            fillQueueFromPopulation(pickSeed());
        }
        pumpQueue();
    }

    function pause() {
        running = false;
    }

    function reset() {
        running = false;
        runId += 1;
        generation = 0;
        bestEver = null;
        population = strategy.createPopulation(populationSize, rng);
        queue = [];
        results = [];
        for (const slot of workers) {
            slot.worker.terminate();
        }
        workers = [];
    }

    function getState() {
        return {
            generation,
            running,
            populationSize: population.length,
            workerCount: workers.length,
            pendingJobs: queue.length,
            completedResults: results.length
        };
    }

    function getBestGenome() {
        return bestEver?.genome ?? null;
    }

    return { start, pause, reset, getState, getBestGenome };
}
