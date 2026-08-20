import { FEATURE_ORDER } from "./feature-schema.js";

export const GENE_COUNT = FEATURE_ORDER.length;
export const DEFAULT_WEIGHT_RANGE = 1;
export const DEFAULT_MUTATION_RATE = 1 / GENE_COUNT;
export const DEFAULT_MUTATION_STRENGTH = 0.4;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function createGenome(rng = Math.random, weightRange = DEFAULT_WEIGHT_RANGE) {
    const weights = Array.from(
        { length: GENE_COUNT },
        () => (rng() * 2 - 1) * weightRange
    );
    return { weights };
}

export function cloneGenome(genome) {
    return { weights: [...genome.weights] };
}

export function mutateGenome(
    genome,
    rng = Math.random,
    { mutationRate = DEFAULT_MUTATION_RATE, mutationStrength = DEFAULT_MUTATION_STRENGTH } = {}
) {
    const weights = genome.weights.map((weight) => (
        rng() < mutationRate
            ? clamp(weight + (rng() * 2 - 1) * mutationStrength, -1, 1)
            : weight
    ));
    return { weights };
}

export function crossoverGenomes(parentA, parentB, rng = Math.random) {
    const weights = parentA.weights.map((weight, index) => (
        rng() < 0.5 ? weight : parentB.weights[index]
    ));
    return { weights };
}
