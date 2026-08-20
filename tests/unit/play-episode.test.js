import assert from "node:assert/strict";
import test from "node:test";
import { FEATURE_ORDER } from "../../scripts/modules/ai/feature-schema.js";
import { GENE_COUNT } from "../../scripts/modules/ai/genome.js";
import { playEpisode } from "../../scripts/modules/ai/play-episode.js";

function weightsFor(overrides) {
    return FEATURE_ORDER.map((key) => overrides[key] ?? 0);
}

test("playEpisode terminates within maxMoves and reports a valid termination reason", () => {
    const genome = { weights: new Array(GENE_COUNT).fill(0) };
    const result = playEpisode(genome, { rng: () => 0.42, maxMoves: 30 });
    assert.ok(result.movesTaken <= 30);
    assert.ok(["death", "move-limit"].includes(result.terminationReason));
    assert.ok(result.score >= 0);
    assert.ok(result.linesCleared >= 0);
});

test("a height/hole-averse genome survives at least as long as a height/hole-seeking one", () => {
    const goodGenome = {
        weights: weightsFor({
            aggregateHeight: -1,
            maxHeight: -1,
            relativeHeight: -0.5,
            linesCleared: 1,
            holes: -1,
            blockades: -1,
            bumpiness: -0.5,
            rowTransitions: -1,
            columnTransitions: -1,
            landingHeight: -0.5,
            erodedCells: 1
        })
    };
    const badGenome = {
        weights: weightsFor({
            aggregateHeight: 1,
            maxHeight: 1,
            relativeHeight: 0.5,
            linesCleared: -1,
            holes: 1,
            blockades: 1,
            bumpiness: 0.5,
            rowTransitions: 1,
            columnTransitions: 1,
            landingHeight: 0.5,
            erodedCells: -1
        })
    };
    const good = playEpisode(goodGenome, { rng: () => 0.37, maxMoves: 200 });
    const bad = playEpisode(badGenome, { rng: () => 0.37, maxMoves: 200 });
    assert.ok(good.movesTaken >= bad.movesTaken);
});
