import assert from "node:assert/strict";
import test from "node:test";
import { createSeededRng } from "../../scripts/modules/ai/seeded-rng.js";
import { playEpisode } from "../../scripts/modules/ai/play-episode.js";
import { runContest } from "../../scripts/modules/ai/contest-runner.js";

function createFakeWorker() {
    const worker = {
        onmessage: null,
        postMessage(data) {
            const rng = createSeededRng(data.seed);
            const result = playEpisode(data.genome, { rng, maxMoves: data.maxMoves });
            queueMicrotask(() => worker.onmessage?.({ data: { jobId: data.jobId, ...result } }));
        },
        terminate() {}
    };
    return worker;
}

test("runContest resolves immediately with an empty array when there are no entrants", async () => {
    const results = await runContest({ entrants: [], createWorker: createFakeWorker });
    assert.deepEqual(results, []);
});

test("runContest plays every entrant the configured number of games and ranks by average score", async () => {
    const entrants = [
        { id: "a", name: "Alpha", algorithm: "genetic-algorithm", genome: { weights: new Array(11).fill(0) } },
        { id: "b", name: "Beta", algorithm: "cma-es", genome: { weights: new Array(11).fill(0.1) } }
    ];
    const results = await runContest({
        entrants,
        gamesPerEntrant: 2,
        maxMoves: 15,
        workerCount: 2,
        rng: () => 0.42,
        createWorker: createFakeWorker
    });
    assert.equal(results.length, 2);
    for (const result of results) {
        assert.equal(result.scores.length, 2);
        assert.equal(typeof result.averageScore, "number");
        assert.equal(result.bestScore, Math.max(...result.scores));
    }
    assert.ok(results[0].averageScore >= results[1].averageScore, "results should be sorted best-first");
});

test("runContest gives every entrant the identical piece sequence per game index (fair comparison)", async () => {
    const sharedGenome = { weights: new Array(11).fill(0) };
    const entrants = [
        { id: "x", name: "X", algorithm: "genetic-algorithm", genome: sharedGenome },
        { id: "y", name: "Y", algorithm: "genetic-algorithm", genome: sharedGenome }
    ];
    const results = await runContest({
        entrants,
        gamesPerEntrant: 3,
        maxMoves: 20,
        workerCount: 4,
        rng: createSeededRng(9),
        createWorker: createFakeWorker
    });
    const [first, second] = results;
    assert.deepEqual(first.scores.sort(), second.scores.sort());
});

test("runContest reports progress as jobs complete", async () => {
    const entrants = [
        { id: "a", name: "A", algorithm: "ga", genome: { weights: new Array(11).fill(0) } }
    ];
    const progressUpdates = [];
    await runContest({
        entrants,
        gamesPerEntrant: 3,
        maxMoves: 10,
        workerCount: 2,
        rng: () => 0.5,
        createWorker: createFakeWorker,
        onProgress: (update) => progressUpdates.push(update)
    });
    assert.equal(progressUpdates.length, 3);
    assert.deepEqual(progressUpdates[progressUpdates.length - 1], { completed: 3, total: 3 });
});
