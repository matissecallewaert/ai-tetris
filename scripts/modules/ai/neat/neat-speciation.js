export const EXCESS_COEFFICIENT = 1;
export const DISJOINT_COEFFICIENT = 1;
export const WEIGHT_DIFF_COEFFICIENT = 0.4;
export const COMPATIBILITY_THRESHOLD = 3;
export const STAGNATION_LIMIT = 15;
export const MIN_SPECIES_SIZE_FOR_ELITE = 5;
export const SMALL_GENOME_THRESHOLD = 20;
export const SURVIVAL_THRESHOLD = 0.5;

export function compatibilityDistance(genomeA, genomeB) {
    const byInnovationA = new Map(genomeA.connections.map((c) => [c.innovation, c]));
    const byInnovationB = new Map(genomeB.connections.map((c) => [c.innovation, c]));
    const maxInnovationA = Math.max(0, ...genomeA.connections.map((c) => c.innovation));
    const maxInnovationB = Math.max(0, ...genomeB.connections.map((c) => c.innovation));
    const lowerMaxInnovation = Math.min(maxInnovationA, maxInnovationB);

    let matching = 0;
    let disjoint = 0;
    let excess = 0;
    let weightDiffSum = 0;
    const allInnovations = new Set([...byInnovationA.keys(), ...byInnovationB.keys()]);
    for (const innovation of allInnovations) {
        const inA = byInnovationA.get(innovation);
        const inB = byInnovationB.get(innovation);
        if (inA && inB) {
            matching += 1;
            weightDiffSum += Math.abs(inA.weight - inB.weight);
        } else if (innovation > lowerMaxInnovation) {
            excess += 1;
        } else {
            disjoint += 1;
        }
    }

    const genomeSize = Math.max(genomeA.connections.length, genomeB.connections.length);
    const normalizer = genomeSize < SMALL_GENOME_THRESHOLD ? 1 : genomeSize;
    const averageWeightDiff = matching > 0 ? weightDiffSum / matching : 0;
    return (
        ((EXCESS_COEFFICIENT * excess) / normalizer)
        + ((DISJOINT_COEFFICIENT * disjoint) / normalizer)
        + (WEIGHT_DIFF_COEFFICIENT * averageWeightDiff)
    );
}
