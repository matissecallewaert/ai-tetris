import { FEATURE_ORDER } from "./feature-schema.js";
import { scoreFeatures } from "./board-evaluator.js";
import { evaluateNetwork } from "./neat/neat-network.js";
import { isNeatGenome } from "./genome-shape.js";

export function scoreGenome(features, genome) {
    if (isNeatGenome(genome)) {
        return evaluateNetwork(genome, FEATURE_ORDER.map((key) => features[key]));
    }
    return scoreFeatures(features, genome.weights);
}
