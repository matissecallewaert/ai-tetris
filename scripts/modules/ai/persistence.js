import { FEATURE_ORDER, SCHEMA_VERSION } from "./feature-schema.js";
import { isValidGenomeShape } from "./genome-shape.js";

export const MAX_HISTORY_ENTRIES = 200;

export function serializeTrainingState({ bestGenome, bestScore, history }) {
    return JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        featureOrder: FEATURE_ORDER,
        bestGenome,
        bestScore,
        history: history.slice(-MAX_HISTORY_ENTRIES)
    });
}

export function deserializeTrainingState(json) {
    if (!json) {
        return null;
    }
    let parsed;
    try {
        parsed = JSON.parse(json);
    } catch {
        return null;
    }
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
        return null;
    }
    if (JSON.stringify(parsed.featureOrder) !== JSON.stringify(FEATURE_ORDER)) {
        return null;
    }
    if (!isValidGenomeShape(parsed.bestGenome)) {
        return null;
    }
    return {
        bestGenome: parsed.bestGenome,
        bestScore: typeof parsed.bestScore === "number" ? parsed.bestScore : 0,
        history: Array.isArray(parsed.history) ? parsed.history : []
    };
}

export function saveTrainingState(storageKey, state) {
    localStorage.setItem(storageKey, serializeTrainingState(state));
}

export function loadTrainingState(storageKey) {
    return deserializeTrainingState(localStorage.getItem(storageKey));
}
