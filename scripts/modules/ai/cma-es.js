import { GENE_COUNT } from "./genome.js";

export const INITIAL_STEP_SIZE = 0.3;
const MIN_STEP_SIZE = 1e-10;

function sampleGaussian(rng) {
    let u1 = rng();
    while (u1 <= Number.EPSILON) {
        u1 = rng();
    }
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function zeros(length) {
    return new Array(length).fill(0);
}

function vectorNorm(values) {
    return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

export function createCmaEsStrategy(dimensions = GENE_COUNT) {
    let mean = zeros(dimensions);
    let sigma = INITIAL_STEP_SIZE;
    let stdDevs = new Array(dimensions).fill(1);
    let pathSigma = zeros(dimensions);
    let pathCovariance = zeros(dimensions);
    let generation = 0;
    let params = null;

    function deriveParams(populationSize) {
        const n = dimensions;
        const lambda = populationSize;
        const mu = Math.max(1, Math.floor(lambda / 2));
        const rawWeights = Array.from({ length: mu }, (_, i) => Math.log(mu + 0.5) - Math.log(i + 1));
        const weightSum = rawWeights.reduce((sum, weight) => sum + weight, 0);
        const weights = rawWeights.map((weight) => weight / weightSum);
        const muEff = 1 / weights.reduce((sum, weight) => sum + weight * weight, 0);
        const cSigma = (muEff + 2) / (n + muEff + 5);
        const dSigma = 1 + (2 * Math.max(0, Math.sqrt((muEff - 1) / (n + 1)) - 1)) + cSigma;
        const cc = (4 + muEff / n) / (n + 4 + (2 * muEff) / n);
        const c1 = 2 / (((n + 1.3) ** 2) + muEff);
        const cMu = Math.min(1 - c1, (2 * (muEff - 2 + 1 / muEff)) / (((n + 2) ** 2) + muEff));
        const chiN = Math.sqrt(n) * (1 - (1 / (4 * n)) + (1 / (21 * n * n)));
        return { lambda, mu, weights, muEff, cSigma, dSigma, cc, c1, cMu, chiN };
    }

    function ensureParams(populationSize) {
        if (!params || params.lambda !== populationSize) {
            params = deriveParams(populationSize);
        }
        return params;
    }

    function sampleWeights(rng) {
        return Array.from(
            { length: dimensions },
            (_, index) => mean[index] + (sigma * stdDevs[index] * sampleGaussian(rng))
        );
    }

    function samplePopulation(size, rng) {
        return Array.from({ length: size }, () => ({ weights: sampleWeights(rng) }));
    }

    function createPopulation(size, rng = Math.random) {
        ensureParams(size);
        return samplePopulation(size, rng);
    }

    function nextGeneration(evaluatedPopulation, rng = Math.random) {
        const { lambda, mu, weights, muEff, cSigma, dSigma, cc, c1, cMu, chiN } = ensureParams(
            evaluatedPopulation.length
        );
        const oldMean = mean;
        const oldSigma = sigma;
        const sorted = [...evaluatedPopulation].sort((a, b) => b.fitness - a.fitness).slice(0, mu);
        const selectedDisplacements = sorted.map(
            (entry) => entry.genome.weights.map((value, index) => (value - oldMean[index]) / oldSigma)
        );

        const weightedDisplacement = zeros(dimensions);
        for (let i = 0; i < mu; i += 1) {
            for (let j = 0; j < dimensions; j += 1) {
                weightedDisplacement[j] += weights[i] * selectedDisplacements[i][j];
            }
        }

        mean = oldMean.map((value, j) => value + (oldSigma * weightedDisplacement[j]));

        pathSigma = pathSigma.map((value, j) => (
            ((1 - cSigma) * value)
            + (Math.sqrt(cSigma * (2 - cSigma) * muEff) * (weightedDisplacement[j] / stdDevs[j]))
        ));
        const pathSigmaNorm = vectorNorm(pathSigma);

        sigma = Math.max(
            oldSigma * Math.exp((cSigma / dSigma) * ((pathSigmaNorm / chiN) - 1)),
            MIN_STEP_SIZE
        );

        const heavisideThreshold = (1.4 + (2 / (dimensions + 1))) * chiN;
        const normalizedPathSigmaNorm = pathSigmaNorm
            / Math.sqrt(1 - ((1 - cSigma) ** (2 * (generation + 1))));
        const heaviside = normalizedPathSigmaNorm < heavisideThreshold ? 1 : 0;

        pathCovariance = pathCovariance.map((value, j) => (
            ((1 - cc) * value) + (heaviside * Math.sqrt(cc * (2 - cc) * muEff) * weightedDisplacement[j])
        ));

        stdDevs = stdDevs.map((stdDev, j) => {
            const variance = stdDev * stdDev;
            const rankOne = c1 * ((pathCovariance[j] ** 2) + ((1 - heaviside) * cc * (2 - cc) * variance));
            let rankMu = 0;
            for (let i = 0; i < mu; i += 1) {
                rankMu += weights[i] * selectedDisplacements[i][j] * selectedDisplacements[i][j];
            }
            const newVariance = ((1 - c1 - cMu) * variance) + rankOne + (cMu * rankMu);
            return Math.sqrt(Math.max(newVariance, MIN_STEP_SIZE));
        });

        generation += 1;
        return samplePopulation(lambda, rng);
    }

    function getState() {
        return { generation, sigma, mean: [...mean], stdDevs: [...stdDevs] };
    }

    return { createPopulation, nextGeneration, getState };
}
