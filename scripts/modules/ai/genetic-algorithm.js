import { cloneGenome, createGenome, crossoverGenomes, mutateGenome } from "./genome.js";
import { playEpisode } from "./play-episode.js";

export const DEFAULT_ELITE_COUNT = 2;
export const DEFAULT_TOURNAMENT_SIZE = 3;

export function createPopulation(size, rng = Math.random) {
    return Array.from({ length: size }, () => createGenome(rng));
}

export function evaluatePopulation(population, { rng = Math.random, maxMoves } = {}) {
    return population.map((genome) => {
        const result = playEpisode(genome, { rng, maxMoves });
        return { genome, ...result, fitness: result.score };
    });
}

function selectParent(sortedByFitnessDesc, rng, tournamentSize) {
    let winner = null;
    for (let round = 0; round < tournamentSize; round += 1) {
        const candidate = sortedByFitnessDesc[
            Math.floor(rng() * sortedByFitnessDesc.length)
        ];
        if (!winner || candidate.fitness > winner.fitness) {
            winner = candidate;
        }
    }
    return winner.genome;
}

export function nextGeneration(
    evaluatedPopulation,
    rng = Math.random,
    {
        eliteCount = DEFAULT_ELITE_COUNT,
        tournamentSize = DEFAULT_TOURNAMENT_SIZE,
        mutationRate,
        mutationStrength
    } = {}
) {
    const sorted = [...evaluatedPopulation].sort((a, b) => b.fitness - a.fitness);
    const elites = sorted.slice(0, eliteCount).map((entry) => cloneGenome(entry.genome));
    const children = [];
    while (elites.length + children.length < evaluatedPopulation.length) {
        const parentA = selectParent(sorted, rng, tournamentSize);
        const parentB = selectParent(sorted, rng, tournamentSize);
        const child = mutateGenome(
            crossoverGenomes(parentA, parentB, rng),
            rng,
            { mutationRate, mutationStrength }
        );
        children.push(child);
    }
    return [...elites, ...children];
}

export function createGeneticAlgorithmStrategy() {
    return { createPopulation, nextGeneration };
}
