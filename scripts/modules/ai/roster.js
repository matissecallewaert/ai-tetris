import { FEATURE_ORDER, SCHEMA_VERSION } from "./feature-schema.js";
import { isLinearGenome, isNeatGenome } from "./genome-shape.js";

export const MAX_ROSTER_ENTRIES = 50;

function isValidGenome(genome) {
    if (isLinearGenome(genome)) {
        return genome.weights.length === FEATURE_ORDER.length;
    }
    return isNeatGenome(genome);
}

function isValidEntry(entry) {
    return Boolean(
        entry
        && typeof entry.id === "string"
        && typeof entry.name === "string"
        && typeof entry.algorithm === "string"
        && typeof entry.score === "number"
        && isValidGenome(entry.genome)
    );
}

function cloneGenomeForRoster(genome) {
    if (isLinearGenome(genome)) {
        return { weights: [...genome.weights] };
    }
    return {
        nodes: genome.nodes.map((node) => ({ ...node })),
        connections: genome.connections.map((connection) => ({ ...connection }))
    };
}

export function createRosterEntry({ name, algorithm, score, genome, savedAt }) {
    return {
        id: `${savedAt}-${Math.random().toString(36).slice(2, 10)}`,
        name,
        algorithm,
        score,
        genome: cloneGenomeForRoster(genome),
        savedAt
    };
}

export function serializeRoster(entries) {
    return JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        featureOrder: FEATURE_ORDER,
        entries: entries.slice(-MAX_ROSTER_ENTRIES)
    });
}

export function deserializeRoster(json) {
    if (!json) {
        return [];
    }
    let parsed;
    try {
        parsed = JSON.parse(json);
    } catch {
        return [];
    }
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
        return [];
    }
    if (JSON.stringify(parsed.featureOrder) !== JSON.stringify(FEATURE_ORDER)) {
        return [];
    }
    if (!Array.isArray(parsed.entries)) {
        return [];
    }
    return parsed.entries.filter(isValidEntry);
}

export function saveRoster(storageKey, entries) {
    localStorage.setItem(storageKey, serializeRoster(entries));
}

export function loadRoster(storageKey) {
    return deserializeRoster(localStorage.getItem(storageKey));
}
