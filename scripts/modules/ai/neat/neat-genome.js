import { INPUT_COUNT, OUTPUT_NODE_ID } from "./neat-constants.js";

export const DEFAULT_WEIGHT_RANGE = 1;
export const WEIGHT_MUTATION_RATE = 0.8;
export const WEIGHT_RESET_RATE = 0.1;
export const WEIGHT_PERTURB_STRENGTH = 0.5;
export const WEIGHT_CLAMP = 3;
export const ADD_CONNECTION_RATE = 0.08;
export const ADD_NODE_RATE = 0.03;
export const TOGGLE_ENABLED_RATE = 0.02;

function randomWeight(rng) {
    return (rng() * 2 - 1) * DEFAULT_WEIGHT_RANGE;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function connectionKey(inNode, outNode) {
    return `${inNode}->${outNode}`;
}

export function createMinimalGenome(rng, tracker) {
    const nodes = [
        ...Array.from({ length: INPUT_COUNT }, (_, id) => ({ id, type: "input" })),
        { id: OUTPUT_NODE_ID, type: "output" }
    ];
    const connections = Array.from({ length: INPUT_COUNT }, (_, inputId) => ({
        innovation: tracker.innovationFor(inputId, OUTPUT_NODE_ID),
        inNode: inputId,
        outNode: OUTPUT_NODE_ID,
        weight: randomWeight(rng),
        enabled: true
    }));
    return { nodes, connections };
}

export function cloneGenome(genome) {
    return {
        nodes: genome.nodes.map((node) => ({ ...node })),
        connections: genome.connections.map((connection) => ({ ...connection }))
    };
}

function mutateWeights(genome, rng) {
    return {
        ...genome,
        connections: genome.connections.map((connection) => {
            if (rng() >= WEIGHT_MUTATION_RATE) {
                return connection;
            }
            const weight = rng() < WEIGHT_RESET_RATE
                ? randomWeight(rng)
                : clamp(connection.weight + ((rng() * 2 - 1) * WEIGHT_PERTURB_STRENGTH), -WEIGHT_CLAMP, WEIGHT_CLAMP);
            return { ...connection, weight };
        })
    };
}

function mutateToggleEnabled(genome, rng) {
    if (rng() >= TOGGLE_ENABLED_RATE || genome.connections.length === 0) {
        return genome;
    }
    const index = Math.floor(rng() * genome.connections.length);
    return {
        ...genome,
        connections: genome.connections.map(
            (connection, i) => (i === index ? { ...connection, enabled: !connection.enabled } : connection)
        )
    };
}

function wouldCreateCycle(connections, fromId, toId) {
    if (fromId === toId) {
        return true;
    }
    const stack = [toId];
    const visited = new Set();
    while (stack.length > 0) {
        const current = stack.pop();
        if (current === fromId) {
            return true;
        }
        if (visited.has(current)) {
            continue;
        }
        visited.add(current);
        for (const connection of connections) {
            if (connection.inNode === current) {
                stack.push(connection.outNode);
            }
        }
    }
    return false;
}

function findNewConnectionCandidate(genome, rng) {
    const existing = new Set(genome.connections.map((c) => connectionKey(c.inNode, c.outNode)));
    const sources = genome.nodes.filter((node) => node.type !== "output");
    const targets = genome.nodes.filter((node) => node.type !== "input");
    const candidates = [];
    for (const source of sources) {
        for (const target of targets) {
            if (source.id === target.id) {
                continue;
            }
            if (existing.has(connectionKey(source.id, target.id))) {
                continue;
            }
            if (wouldCreateCycle(genome.connections, source.id, target.id)) {
                continue;
            }
            candidates.push([source.id, target.id]);
        }
    }
    if (candidates.length === 0) {
        return null;
    }
    return candidates[Math.floor(rng() * candidates.length)];
}

function mutateAddConnection(genome, rng, tracker) {
    if (rng() >= ADD_CONNECTION_RATE) {
        return genome;
    }
    const candidate = findNewConnectionCandidate(genome, rng);
    if (!candidate) {
        return genome;
    }
    const [inNode, outNode] = candidate;
    const connection = {
        innovation: tracker.innovationFor(inNode, outNode),
        inNode,
        outNode,
        weight: randomWeight(rng),
        enabled: true
    };
    return { ...genome, connections: [...genome.connections, connection] };
}

function mutateAddNode(genome, rng, tracker) {
    if (rng() >= ADD_NODE_RATE) {
        return genome;
    }
    const enabledConnections = genome.connections.filter((connection) => connection.enabled);
    if (enabledConnections.length === 0) {
        return genome;
    }
    const target = enabledConnections[Math.floor(rng() * enabledConnections.length)];
    const newNodeId = tracker.nodeIdForSplit(target.inNode, target.outNode);
    const intoNew = {
        innovation: tracker.innovationFor(target.inNode, newNodeId),
        inNode: target.inNode,
        outNode: newNodeId,
        weight: 1,
        enabled: true
    };
    const outOfNew = {
        innovation: tracker.innovationFor(newNodeId, target.outNode),
        inNode: newNodeId,
        outNode: target.outNode,
        weight: target.weight,
        enabled: true
    };
    return {
        nodes: [...genome.nodes, { id: newNodeId, type: "hidden" }],
        connections: [
            ...genome.connections.map((connection) => (connection === target ? { ...connection, enabled: false } : connection)),
            intoNew,
            outOfNew
        ]
    };
}

export function mutateGenome(genome, rng, tracker) {
    let mutated = mutateWeights(genome, rng);
    mutated = mutateToggleEnabled(mutated, rng);
    mutated = mutateAddConnection(mutated, rng, tracker);
    mutated = mutateAddNode(mutated, rng, tracker);
    return mutated;
}
