import { DEFAULT_MAX_MOVES } from "./play-episode.js";

export const DEFAULT_GAMES_PER_ENTRANT = 3;
export const DEFAULT_WORKER_COUNT = 4;

function defaultCreateWorker() {
    return new Worker(new URL("./ai-worker.js", import.meta.url), { type: "module" });
}

export function runContest({
    entrants,
    gamesPerEntrant = DEFAULT_GAMES_PER_ENTRANT,
    maxMoves = DEFAULT_MAX_MOVES,
    workerCount = DEFAULT_WORKER_COUNT,
    rng = Math.random,
    createWorker = defaultCreateWorker,
    onProgress = () => {}
}) {
    return new Promise((resolve) => {
        if (entrants.length === 0) {
            resolve([]);
            return;
        }

        const seeds = Array.from({ length: gamesPerEntrant }, () => Math.floor(rng() * 0xFFFFFFFF));
        const queue = [];
        let nextJobId = 0;
        for (const entrant of entrants) {
            for (let gameIndex = 0; gameIndex < gamesPerEntrant; gameIndex += 1) {
                queue.push({
                    jobId: nextJobId += 1,
                    entrantId: entrant.id,
                    genome: entrant.genome,
                    seed: seeds[gameIndex]
                });
            }
        }

        const totalJobs = queue.length;
        let completedJobs = 0;
        const scoresByEntrant = new Map(entrants.map((entrant) => [entrant.id, []]));
        const workers = Array.from({ length: Math.max(1, Math.min(workerCount, totalJobs)) }, createWorker);

        function finish() {
            for (const worker of workers) {
                worker.terminate();
            }
            const results = entrants
                .map((entrant) => {
                    const scores = scoresByEntrant.get(entrant.id);
                    return {
                        id: entrant.id,
                        name: entrant.name,
                        algorithm: entrant.algorithm,
                        scores,
                        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
                        bestScore: Math.max(...scores)
                    };
                })
                .sort((a, b) => b.averageScore - a.averageScore);
            resolve(results);
        }

        function pump(worker) {
            const job = queue.shift();
            if (!job) {
                return;
            }
            worker.onmessage = (event) => {
                scoresByEntrant.get(job.entrantId).push(event.data.score);
                completedJobs += 1;
                onProgress({ completed: completedJobs, total: totalJobs });
                if (completedJobs >= totalJobs) {
                    finish();
                    return;
                }
                pump(worker);
            };
            worker.postMessage({ jobId: job.jobId, genome: job.genome, seed: job.seed, maxMoves });
        }

        for (const worker of workers) {
            pump(worker);
        }
    });
}
