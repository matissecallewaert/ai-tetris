export function isLinearGenome(genome) {
    return Boolean(genome) && Array.isArray(genome.weights);
}

export function isNeatGenome(genome) {
    return Boolean(genome) && Array.isArray(genome.nodes) && Array.isArray(genome.connections);
}

export function isValidGenomeShape(genome) {
    return isLinearGenome(genome) || isNeatGenome(genome);
}
