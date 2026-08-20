import assert from "node:assert/strict";
import test from "node:test";
import { GENE_COUNT } from "../../scripts/modules/ai/genome.js";
import { createReplay } from "../../scripts/modules/ai/replay.js";

function createFakeContext() {
    const calls = [];
    return {
        calls,
        fillStyle: undefined,
        fillRect(...args) {
            calls.push(["fillRect", ...args]);
        },
        clearRect(...args) {
            calls.push(["clearRect", ...args]);
        }
    };
}

test("createReplay steps through moves, rendering after each, and reports termination", async () => {
    const context = createFakeContext();
    const genome = { weights: new Array(GENE_COUNT).fill(0) };
    const stepEvents = [];
    const finish = await new Promise((resolve) => {
        const replay = createReplay({
            genome,
            context,
            rng: () => 0.42,
            maxMoves: 5,
            stepIntervalMs: 1,
            onStep: (event) => stepEvents.push(event),
            onFinish: resolve
        });
        replay.start();
    });
    assert.equal(finish.terminationReason, "move-limit");
    assert.equal(finish.movesTaken, 5);
    assert.equal(stepEvents.length, 5);
    assert.ok(context.calls.some((call) => call[0] === "clearRect"));
});

test("stop() halts further steps", async () => {
    const context = createFakeContext();
    const genome = { weights: new Array(GENE_COUNT).fill(0) };
    let stepCount = 0;
    const replay = createReplay({
        genome,
        context,
        rng: () => 0.42,
        maxMoves: 500,
        stepIntervalMs: 1,
        onStep: () => {
            stepCount += 1;
        }
    });
    replay.start();
    await new Promise((resolve) => setTimeout(resolve, 10));
    replay.stop();
    const countAfterStop = stepCount;
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(stepCount, countAfterStop);
});
