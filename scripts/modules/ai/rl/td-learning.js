import { COLS, ROWS, scoreForLineClear } from "../../constants.js";
import { createSevenBagRandomizer } from "../../tetris.js";
import { GENE_COUNT } from "../genome.js";
import { FEATURE_ORDER } from "../feature-schema.js";
import { canSpawn, enumerateMoves } from "../move-search.js";
import { DEFAULT_MAX_MOVES } from "../play-episode.js";

export const DEFAULT_LEARNING_RATE = 0.01;
export const DEFAULT_DISCOUNT_FACTOR = 0.98;
export const DEFAULT_EXPLORATION_RATE = 0.1;

// Unlike GA/CMA-ES/NEAT's wide random init (they select FOR diversity across a population),
// TD learning fits one value function by gradient bootstrapping: starting from large random
// weights produces wildly wrong early value estimates that compound into runaway updates,
// while starting from exact zero leaves every placement tied (no preference to refine at
// all). A small random nudge breaks ties without destabilizing the first few updates.
const INITIAL_WEIGHT_SCALE = 0.05;

const MAX_ERODED_CELLS = 16;

// Per-feature scale used only for the internal TD update. Raw board features span wildly
// different ranges (heights up to ROWS*COLS, lines cleared up to 4), and linear TD with
// unnormalized features is a well-known instability: bigger weights produce bigger value
// estimates, which produce bigger TD errors, which produce even bigger weights. Training
// happens in this normalized space; the genome returned to the rest of the app is always
// converted back to raw-feature weights, so scoreFeatures/scoreGenome elsewhere never change.
const FEATURE_SCALE = {
    aggregateHeight: COLS * ROWS,
    maxHeight: ROWS,
    relativeHeight: ROWS,
    linesCleared: 4,
    holes: COLS * ROWS,
    blockades: COLS * ROWS,
    bumpiness: (COLS - 1) * ROWS,
    rowTransitions: ROWS * (COLS + 1),
    columnTransitions: COLS * (ROWS + 1),
    landingHeight: ROWS,
    erodedCells: MAX_ERODED_CELLS
};
const FEATURE_SCALE_VECTOR = FEATURE_ORDER.map((key) => FEATURE_SCALE[key]);

function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function normalizedFeatureVector(features) {
    return FEATURE_ORDER.map((key, index) => features[key] / FEATURE_SCALE_VECTOR[index]);
}

function toNormalizedWeights(rawWeights) {
    return rawWeights.map((weight, index) => weight * FEATURE_SCALE_VECTOR[index]);
}

function toRawWeights(normalizedWeights) {
    return normalizedWeights.map((weight, index) => weight / FEATURE_SCALE_VECTOR[index]);
}

function dotProduct(vectorA, vectorB) {
    return vectorA.reduce((sum, value, index) => sum + (value * vectorB[index]), 0);
}

function pickMove(candidates, normalizedWeights, rng, explorationRate) {
    if (rng() < explorationRate) {
        return candidates[Math.floor(rng() * candidates.length)];
    }
    let best = candidates[0];
    let bestValue = dotProduct(normalizedFeatureVector(best.features), normalizedWeights);
    for (let i = 1; i < candidates.length; i += 1) {
        const value = dotProduct(normalizedFeatureVector(candidates[i].features), normalizedWeights);
        if (value > bestValue) {
            best = candidates[i];
            bestValue = value;
        }
    }
    return best;
}

function applyTdUpdate(normalizedWeights, previousNormalizedFeatures, tdError, learningRate) {
    return normalizedWeights.map(
        (weight, index) => weight + (learningRate * tdError * previousNormalizedFeatures[index])
    );
}

// Reward is +1 per move survived plus a lines-cleared bonus, not raw game score (see
// FEATURE_SCALE comment). Being always-positive matters: it keeps the fitted value function
// non-negative everywhere, so "terminal value = 0" is a real penalty relative to a healthy
// state. A lines-cleared-only reward (often exactly 0) let states already predicted as very
// bad - via the negative weights that make "avoid holes" rankings work - get pulled back
// toward 0 at death, rewarding whatever was on the board right before dying.
function learningRewardFor(linesCleared) {
    return 1 + linesCleared;
}

function updateTowardTransition(normalizedWeights, previousFeatures, nextValue, reward, discountFactor, learningRate) {
    const previousVector = normalizedFeatureVector(previousFeatures);
    const previousValue = dotProduct(previousVector, normalizedWeights);
    const tdError = reward + (discountFactor * nextValue) - previousValue;
    return applyTdUpdate(normalizedWeights, previousVector, tdError, learningRate);
}

function chooseNextMove(grid, pieceKey, normalizedWeights, rng, explorationRate) {
    if (!canSpawn(grid, pieceKey)) {
        return null;
    }
    const candidates = enumerateMoves(grid, pieceKey);
    return candidates.length === 0 ? null : pickMove(candidates, normalizedWeights, rng, explorationRate);
}

function applyTerminalPenalty(normalizedWeights, previousFeatures, isDeath, discountFactor, learningRate) {
    if (!previousFeatures || !isDeath) {
        return normalizedWeights;
    }
    return updateTowardTransition(normalizedWeights, previousFeatures, 0, 0, discountFactor, learningRate);
}

export function playEpisodeWithLearning(
    genome,
    { learningRate = DEFAULT_LEARNING_RATE, discountFactor = DEFAULT_DISCOUNT_FACTOR, explorationRate = DEFAULT_EXPLORATION_RATE } = {},
    { rng = Math.random, maxMoves = DEFAULT_MAX_MOVES } = {}
) {
    const bag = createSevenBagRandomizer(rng);
    let grid = emptyGrid();
    let normalizedWeights = toNormalizedWeights(genome.weights);
    let score = 0;
    let linesCleared = 0;
    let movesTaken = 0;
    let terminationReason = "move-limit";
    let previousFeatures = null;

    while (movesTaken < maxMoves) {
        const pieceKey = bag.next();
        const chosen = chooseNextMove(grid, pieceKey, normalizedWeights, rng, explorationRate);
        if (!chosen) {
            terminationReason = "death";
            break;
        }

        if (previousFeatures) {
            const nextValue = dotProduct(normalizedFeatureVector(chosen.features), normalizedWeights);
            normalizedWeights = updateTowardTransition(
                normalizedWeights, previousFeatures, nextValue, learningRewardFor(chosen.linesCleared), discountFactor, learningRate
            );
        }

        previousFeatures = chosen.features;
        grid = chosen.resultingGrid;
        linesCleared += chosen.linesCleared;
        score += scoreForLineClear(chosen.linesCleared);
        movesTaken += 1;
    }

    normalizedWeights = applyTerminalPenalty(
        normalizedWeights, previousFeatures, terminationReason === "death", discountFactor, learningRate
    );

    return { score, movesTaken, linesCleared, terminationReason, genome: { weights: toRawWeights(normalizedWeights) } };
}

export const DEFAULT_EPISODES_PER_ROUND = 20;

// A single episode's TD nudge is small and noisy. Averaging many workers that each ran
// only one episode washes the learning signal out almost entirely (confirmed empirically -
// see the RL validation notes). Each worker instead plays a batch of episodes back-to-back,
// carrying its weights forward continuously across the whole batch, and only the batch's
// final weights (plus its average score/moves) get reported and merged across workers.
export function trainForRound(
    genome,
    rlConfig = {},
    { rng = Math.random, maxMoves = DEFAULT_MAX_MOVES, episodesPerRound = DEFAULT_EPISODES_PER_ROUND } = {}
) {
    let currentGenome = genome;
    let totalScore = 0;
    let totalMoves = 0;
    let totalLinesCleared = 0;
    let terminationReason = "move-limit";
    for (let i = 0; i < episodesPerRound; i += 1) {
        const result = playEpisodeWithLearning(currentGenome, rlConfig, { rng, maxMoves });
        currentGenome = result.genome;
        totalScore += result.score;
        totalMoves += result.movesTaken;
        totalLinesCleared += result.linesCleared;
        terminationReason = result.terminationReason;
    }
    return {
        genome: currentGenome,
        score: totalScore / episodesPerRound,
        movesTaken: totalMoves / episodesPerRound,
        linesCleared: totalLinesCleared / episodesPerRound,
        terminationReason
    };
}

function averageWeights(genomes) {
    const dimension = genomes[0].weights.length;
    const sums = new Array(dimension).fill(0);
    for (const genome of genomes) {
        genome.weights.forEach((weight, index) => {
            sums[index] += weight;
        });
    }
    return sums.map((sum) => sum / genomes.length);
}

export function createRlStrategy() {
    function createPopulation(size, rng = Math.random) {
        return Array.from({ length: size }, () => ({
            weights: Array.from({ length: GENE_COUNT }, () => (rng() * 2 - 1) * INITIAL_WEIGHT_SCALE)
        }));
    }

    function nextGeneration(evaluatedPopulation) {
        const averaged = averageWeights(evaluatedPopulation.map((entry) => entry.genome));
        return evaluatedPopulation.map(() => ({ weights: [...averaged] }));
    }

    return { createPopulation, nextGeneration };
}
