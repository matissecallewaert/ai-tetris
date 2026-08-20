function connectionKey(inNode, outNode) {
    return `${inNode}->${outNode}`;
}

export function createInnovationTracker(startingNodeId, startingInnovation = 0) {
    let nextNodeId = startingNodeId;
    let nextInnovation = startingInnovation;
    const connectionInnovations = new Map();
    const nodeSplits = new Map();

    function innovationFor(inNode, outNode) {
        const key = connectionKey(inNode, outNode);
        if (!connectionInnovations.has(key)) {
            connectionInnovations.set(key, nextInnovation);
            nextInnovation += 1;
        }
        return connectionInnovations.get(key);
    }

    function nodeIdForSplit(inNode, outNode) {
        const key = connectionKey(inNode, outNode);
        if (!nodeSplits.has(key)) {
            nodeSplits.set(key, nextNodeId);
            nextNodeId += 1;
        }
        return nodeSplits.get(key);
    }

    return { innovationFor, nodeIdForSplit };
}
