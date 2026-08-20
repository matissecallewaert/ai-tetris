import { createSeededRng } from "./seeded-rng.js";
import { playEpisode } from "./play-episode.js";

self.onmessage = (event) => {
    const { jobId, genome, seed, maxMoves } = event.data;
    const rng = createSeededRng(seed);
    const result = playEpisode(genome, { rng, maxMoves });
    self.postMessage({ jobId, ...result });
};
