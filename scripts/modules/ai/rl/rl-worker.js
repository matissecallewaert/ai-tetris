import { createSeededRng } from "../seeded-rng.js";
import { trainForRound } from "./td-learning.js";

self.onmessage = (event) => {
    const { jobId, genome, seed, maxMoves } = event.data;
    const rng = createSeededRng(seed);
    const result = trainForRound(genome, {}, { rng, maxMoves });
    self.postMessage({ jobId, ...result });
};
