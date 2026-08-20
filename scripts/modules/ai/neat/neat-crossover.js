export const DISABLED_INHERIT_CHANCE = 0.75;

export function crossoverGenomes(fitter, other, rng) {
    const otherByInnovation = new Map(other.connections.map((connection) => [connection.innovation, connection]));
    const connections = fitter.connections.map((connection) => {
        const match = otherByInnovation.get(connection.innovation);
        if (!match) {
            return { ...connection };
        }
        const eitherDisabled = !connection.enabled || !match.enabled;
        return {
            ...connection,
            weight: rng() < 0.5 ? connection.weight : match.weight,
            enabled: eitherDisabled ? rng() >= DISABLED_INHERIT_CHANCE : true
        };
    });
    return { nodes: fitter.nodes.map((node) => ({ ...node })), connections };
}
