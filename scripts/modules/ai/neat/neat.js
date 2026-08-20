import { createInnovationTracker } from "./innovation-tracker.js";
import { createMinimalGenome, cloneGenome, mutateGenome } from "./neat-genome.js";
import { crossoverGenomes } from "./neat-crossover.js";
import {
    compatibilityDistance,
    COMPATIBILITY_THRESHOLD,
    MIN_SPECIES_SIZE_FOR_ELITE,
    STAGNATION_LIMIT,
    SURVIVAL_THRESHOLD
} from "./neat-speciation.js";
import { OUTPUT_NODE_ID } from "./neat-constants.js";

export function createNeatStrategy() {
    const tracker = createInnovationTracker(OUTPUT_NODE_ID + 1);
    let species = [];
    let nextSpeciesId = 0;
    let generation = 0;

    function createPopulation(size, rng = Math.random) {
        species = [];
        return Array.from({ length: size }, () => createMinimalGenome(rng, tracker));
    }

    function assignSpecies(evaluatedPopulation) {
        const grouped = species.map((s) => ({ ...s, members: [] }));
        for (const entry of evaluatedPopulation) {
            let target = grouped.find(
                (s) => compatibilityDistance(entry.genome, s.representative) < COMPATIBILITY_THRESHOLD
            );
            if (!target) {
                nextSpeciesId += 1;
                target = {
                    id: nextSpeciesId,
                    representative: entry.genome,
                    members: [],
                    bestFitness: -Infinity,
                    generationsSinceImprovement: 0
                };
                grouped.push(target);
            }
            target.members.push(entry);
        }
        return grouped.filter((s) => s.members.length > 0);
    }

    function updateStagnation(grouped) {
        for (const s of grouped) {
            const speciesBest = Math.max(...s.members.map((m) => m.fitness));
            if (speciesBest > s.bestFitness) {
                s.bestFitness = speciesBest;
                s.generationsSinceImprovement = 0;
            } else {
                s.generationsSinceImprovement += 1;
            }
        }
    }

    function reproduceSpecies(s, allotted, rng) {
        const sortedMembers = [...s.members].sort((a, b) => b.fitness - a.fitness);
        const eligibleCount = Math.max(1, Math.ceil(sortedMembers.length * SURVIVAL_THRESHOLD));
        const eligibleParents = sortedMembers.slice(0, eligibleCount);
        const offspring = [];
        if (sortedMembers.length >= MIN_SPECIES_SIZE_FOR_ELITE && allotted > 0) {
            offspring.push(cloneGenome(sortedMembers[0].genome));
        }
        while (offspring.length < allotted) {
            const parentA = eligibleParents[Math.floor(rng() * eligibleParents.length)];
            const parentB = eligibleParents[Math.floor(rng() * eligibleParents.length)];
            let child;
            if (parentA === parentB) {
                child = cloneGenome(parentA.genome);
            } else {
                const [fitter, other] = parentA.fitness >= parentB.fitness
                    ? [parentA, parentB]
                    : [parentB, parentA];
                child = crossoverGenomes(fitter.genome, other.genome, rng);
            }
            offspring.push(mutateGenome(child, rng, tracker));
        }
        return offspring;
    }

    function nextGeneration(evaluatedPopulation, rng = Math.random) {
        const populationSize = evaluatedPopulation.length;
        const grouped = assignSpecies(evaluatedPopulation);
        updateStagnation(grouped);

        const overallBestFitness = Math.max(...evaluatedPopulation.map((entry) => entry.fitness));
        const survivors = grouped.filter(
            (s) => s.generationsSinceImprovement < STAGNATION_LIMIT || s.bestFitness >= overallBestFitness
        );
        const activeSpecies = survivors.length > 0 ? survivors : grouped;

        const adjustedTotals = activeSpecies.map(
            (s) => s.members.reduce((sum, m) => sum + m.fitness, 0) / s.members.length
        );
        const grandTotal = adjustedTotals.reduce((sum, value) => sum + value, 0) || 1;

        const offspring = [];
        activeSpecies.forEach((s, index) => {
            const isLast = index === activeSpecies.length - 1;
            const allotted = isLast
                ? Math.max(0, populationSize - offspring.length)
                : Math.max(0, Math.round((adjustedTotals[index] / grandTotal) * populationSize));
            offspring.push(...reproduceSpecies(s, allotted, rng));
        });
        while (offspring.length < populationSize) {
            offspring.push(createMinimalGenome(rng, tracker));
        }

        species = activeSpecies.map((s) => ({
            id: s.id,
            representative: s.members[Math.floor(rng() * s.members.length)].genome,
            members: [],
            bestFitness: s.bestFitness,
            generationsSinceImprovement: s.generationsSinceImprovement
        }));
        generation += 1;

        return offspring.slice(0, populationSize);
    }

    function getState() {
        return { generation, speciesCount: species.length };
    }

    return { createPopulation, nextGeneration, getState };
}
