function buildIncomingMap(genome) {
    const incoming = new Map(genome.nodes.map((node) => [node.id, []]));
    for (const connection of genome.connections) {
        if (!connection.enabled) {
            continue;
        }
        incoming.get(connection.outNode)?.push(connection);
    }
    return incoming;
}

function topologicalOrder(genome, incoming) {
    const visited = new Set();
    const order = [];

    function visit(nodeId) {
        if (visited.has(nodeId)) {
            return;
        }
        visited.add(nodeId);
        for (const connection of incoming.get(nodeId) ?? []) {
            visit(connection.inNode);
        }
        order.push(nodeId);
    }

    for (const node of genome.nodes) {
        visit(node.id);
    }
    return order;
}

export function evaluateNetwork(genome, inputValues) {
    const inputNodeIds = genome.nodes
        .filter((node) => node.type === "input")
        .map((node) => node.id)
        .sort((a, b) => a - b);
    const outputNode = genome.nodes.find((node) => node.type === "output");
    const incoming = buildIncomingMap(genome);
    const order = topologicalOrder(genome, incoming);

    const values = new Map();
    inputNodeIds.forEach((nodeId, index) => values.set(nodeId, inputValues[index] ?? 0));

    for (const nodeId of order) {
        if (values.has(nodeId)) {
            continue;
        }
        const sum = (incoming.get(nodeId) ?? []).reduce(
            (total, connection) => total + (values.get(connection.inNode) ?? 0) * connection.weight,
            0
        );
        values.set(nodeId, Math.tanh(sum));
    }

    return outputNode ? values.get(outputNode.id) ?? 0 : 0;
}
